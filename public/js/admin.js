(function () {
  'use strict';

  /* ---------------- FETCH HELPER ---------------- */
  async function api(path, options = {}) {
    const res = await fetch('/api' + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  /* ---------------- TOASTS ---------------- */
  const toastStack = document.getElementById('toastStack');
  function toast(message, isError = false) {
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' is-error' : '');
    el.textContent = message;
    toastStack.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  /* ---------------- AUTH GUARD ---------------- */
  api('/auth/me').catch(() => {
    window.location.href = 'login.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '../index.html';
    }
  });

  /* ---------------- MOBILE SIDEBAR ---------------- */
  const sidebar = document.getElementById('adminSidebar');
  const scrim = document.getElementById('sidebarScrim');
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.add('is-open');
    scrim.classList.add('is-open');
  });
  scrim.addEventListener('click', () => {
    sidebar.classList.remove('is-open');
    scrim.classList.remove('is-open');
  });

  /* ---------------- NAV ROUTING ---------------- */
  const sections = document.querySelectorAll('.dash-section');
  const navLinks = document.querySelectorAll('#adminNav a');

  const loaders = {
    overview: loadOverview,
    bookings: () => loadBookings(''),
    inquiries: () => loadInquiries(''),
    services: loadServices,
    portfolio: () => loadPortfolioAdmin('all'),
    testimonials: loadTestimonials,
    newsletter: loadNewsletter,
    availability: loadAvailabilitySection,
    settings: loadSettings,
  };

  function showSection(name) {
    sections.forEach((s) => { s.hidden = s.id !== `section-${name}`; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.section === name));
    sidebar.classList.remove('is-open');
    scrim.classList.remove('is-open');
    if (loaders[name]) loaders[name]();
  }

  function currentSection() {
    const hash = window.location.hash.replace('#', '');
    const valid = Array.from(sections).some((s) => s.id === `section-${hash}`);
    return valid ? hash : 'overview';
  }

  window.addEventListener('hashchange', () => showSection(currentSection()));
  showSection(currentSection());

  /* ---------------- PROFILE (for WhatsApp message template, currency, theme accent) ---------------- */
  let artistName = 'Amit';
  api('/profile').then((p) => {
    if (!p) return;
    if (p.name) artistName = p.name.split(' ')[0];
    // Dashboard chrome uses the same owner-chosen pop color as the public
    // site, applied only when the dashboard itself is in light theme.
    document.documentElement.dataset.accent = p.accentColor || 'violet';
  }).catch(() => {});

  const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  function currencySymbol(code) {
    return CURRENCY_SYMBOLS[code] || (code ? code + ' ' : '₹');
  }

  /* ---------------- THEME TOGGLE ---------------- */
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (err) { /* private mode etc — non-fatal */ }
  });

  function waLink(phone, message) {
    const digits = String(phone || '').replace(/[^\d]/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  /* ---------------- SERVICES CACHE (for converting inquiries -> bookings) ---------------- */
  let servicesById = {};
  api('/services').then((list) => {
    list.forEach((s) => { servicesById[s._id] = s; });
  }).catch(() => {});

  /* ---------------- TIME HELPERS ---------------- */
  function parseTimeLabel(label) {
    // '10:00 AM' -> { h: 10, m: 0 } in 24h
    const m = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(label.trim());
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const period = m[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return { h, m: min };
  }
  function formatTimeLabel(h, m) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  }
  function addMinutesToLabel(label, minutes) {
    const t = parseTimeLabel(label);
    if (!t) return label;
    let total = t.h * 60 + t.m + minutes;
    total = ((total % 1440) + 1440) % 1440;
    return formatTimeLabel(Math.floor(total / 60), total % 60);
  }
  function formatDatePretty(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  /* ---------------- IMAGE FIELD (upload OR paste a URL) ----------------
     Reused by Portfolio, Testimonials, and Settings so every image field
     in the dashboard lets the owner either upload a file or just paste a
     link (e.g. a picsum URL) — not one or the other. */
  function imageFieldHTML(id, currentUrl, label) {
    const safeUrl = currentUrl || '';
    return `
      <div class="form-group image-field">
        <label>${label}</label>
        <img class="image-field-preview" id="${id}_preview" src="${safeUrl}" alt="" style="${safeUrl ? '' : 'display:none;'}">
        <div class="image-field-row">
          <input type="url" id="${id}_url" placeholder="Paste an image URL" value="${safeUrl}">
          <label class="image-field-upload-btn" for="${id}_file">Upload</label>
          <input type="file" id="${id}_file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
        </div>
        <p class="field-hint">Paste a link, or upload a file — uploading a file overrides the URL.</p>
      </div>`;
  }
  function wireImageField(id) {
    const fileInput = document.getElementById(`${id}_file`);
    const urlInput = document.getElementById(`${id}_url`);
    const preview = document.getElementById(`${id}_preview`);
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
    });
    urlInput.addEventListener('input', () => {
      if (fileInput.files[0]) return; // an already-chosen file takes visual priority
      preview.src = urlInput.value;
      preview.style.display = urlInput.value ? 'block' : 'none';
    });
  }
  async function resolveImageField(id, existingUrl) {
    const fileInput = document.getElementById(`${id}_file`);
    const urlInput = document.getElementById(`${id}_url`);
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Image upload failed.');
      return data.url;
    }
    const url = urlInput.value.trim();
    return url || existingUrl || '';
  }

  /* ================================================================
     OVERVIEW
  ================================================================ */
  async function loadOverview() {
    try {
      const data = await api('/dashboard/overview');

      document.getElementById('overviewStats').innerHTML = `
        <div class="stat-card"><div class="num">${data.todaysBookings}</div><div class="label">Today's Bookings</div></div>
        <div class="stat-card"><div class="num">${data.upcomingBookings}</div><div class="label">Upcoming Bookings</div></div>
        <div class="stat-card"><div class="num">${data.newInquiries}</div><div class="label">New Inquiries</div></div>
        <div class="stat-card"><div class="num">${data.pendingConfirmations}</div><div class="label">Pending Confirmations</div></div>
      `;

      const tbody = document.querySelector('#upcomingTable tbody');
      if (!data.upcomingList.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No upcoming appointments yet.</div></td></tr>';
      } else {
        tbody.innerHTML = data.upcomingList.map((b) => `
          <tr class="is-clickable" data-id="${b._id}" data-kind="booking">
            <td data-label="Customer">${b.customerName}</td>
            <td data-label="Service">${b.serviceNameSnapshot}</td>
            <td data-label="Date">${formatDatePretty(b.bookingDate)}</td>
            <td data-label="Time">${b.startTime}</td>
            <td data-label="Status"><span class="badge badge-${b.status}">${b.status}</span></td>
          </tr>
        `).join('');
        attachRowClicks(tbody);
      }

      // sidebar badges
      setBadge('countInquiries', data.newInquiries);
      setBadge('countBookings', data.pendingConfirmations);
    } catch (err) {
      toast(err.message, true);
    }
  }

  function setBadge(id, count) {
    const el = document.getElementById(id);
    el.textContent = count;
    el.hidden = !count;
  }

  function attachRowClicks(container) {
    container.querySelectorAll('tr[data-id]').forEach((row) => {
      row.addEventListener('click', () => {
        if (row.dataset.kind === 'booking') openBookingModal(row.dataset.id);
        else openInquiryModal(row.dataset.id);
      });
    });
  }

  /* ================================================================
     BOOKINGS
  ================================================================ */
  const bookingChips = document.getElementById('bookingFilterChips');
  bookingChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    bookingChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    loadBookings(chip.dataset.status);
  });

  async function loadBookings(status) {
    const tbody = document.querySelector('#bookingsTable tbody');
    tbody.innerHTML = '<tr><td colspan="5"><div class="skeleton-row"></div></td></tr>';
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const list = await api('/bookings' + qs);
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">&#128198;</div>No bookings in this view yet.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map((b) => `
        <tr class="is-clickable" data-id="${b._id}" data-kind="booking">
          <td data-label="Customer">${b.customerName}</td>
          <td data-label="Service">${b.serviceNameSnapshot}</td>
          <td data-label="Date">${formatDatePretty(b.bookingDate)}</td>
          <td data-label="Time">${b.startTime}</td>
          <td data-label="Status"><span class="badge badge-${b.status}">${b.status}</span></td>
        </tr>
      `).join('');
      attachRowClicks(tbody);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">${err.message}</div></td></tr>`;
    }
  }

  const BOOKING_NEXT_STATUS = {
    pending: [['confirmed', 'Confirm'], ['cancelled', 'Cancel']],
    confirmed: [['completed', 'Mark Completed'], ['no-show', 'Mark No-show'], ['cancelled', 'Cancel']],
    completed: [], cancelled: [], 'no-show': [],
  };

  async function openBookingModal(id) {
    try {
      const b = await api(`/bookings/${id}`);
      const actions = (BOOKING_NEXT_STATUS[b.status] || [])
        .map(([status, label]) => `<button class="btn btn-outline-dark" data-action="status" data-status="${status}">${label}</button>`)
        .join('');

      renderModal(`
        <div class="modal-head">
          <div>
            <h2 style="font-size:1.3rem;">${b.customerName}</h2>
            <span class="badge badge-${b.status}" style="margin-top:0.4rem;display:inline-block;">${b.status}</span>
          </div>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>

        <div class="modal-section"><div class="k">Service</div>${b.serviceNameSnapshot} — ${currencySymbol(servicesById[b.serviceId]?.currency)}${b.priceSnapshot}</div>
        <div class="modal-section"><div class="k">Date &amp; Time</div>${formatDatePretty(b.bookingDate)} at ${b.startTime}</div>
        <div class="modal-section"><div class="k">Contact</div>${b.phone}<br>${b.email}</div>
        ${b.customerNotes ? `<div class="modal-section"><div class="k">Customer Notes</div>${b.customerNotes}</div>` : ''}

        <div class="modal-section">
          <div class="k">Internal Notes</div>
          <textarea id="internalNotes" rows="3" style="width:100%;padding:0.8em;border:1px solid var(--line-on-porcelain);border-radius:var(--radius);font-family:inherit;">${b.internalNotes || ''}</textarea>
          <button class="btn btn-outline-dark" id="saveNotes" style="margin-top:0.6rem;font-size:0.75rem;padding:0.5em 1em;">Save Notes</button>
        </div>

        <div class="modal-actions">
          ${actions}
        </div>
        <div class="modal-actions">
          <a class="btn btn-outline-dark" href="tel:${b.phone}">Call</a>
          <a class="btn btn-outline-dark" href="${waLink(b.phone, `Hi ${b.customerName}, this is ${artistName}. Regarding your ${b.serviceNameSnapshot} appointment on ${formatDatePretty(b.bookingDate)} at ${b.startTime}.`)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn btn-outline-dark" href="mailto:${b.email}">Email</a>
        </div>
      `);

      document.getElementById('modalPanel').querySelectorAll('[data-action="status"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status: btn.dataset.status }) });
            toast('Booking updated.');
            closeModal();
            loadBookings(bookingChips.querySelector('.is-active').dataset.status);
            loadOverview();
          } catch (err) {
            toast(err.message, true);
          }
        });
      });

      document.getElementById('saveNotes').addEventListener('click', async () => {
        try {
          await api(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ internalNotes: document.getElementById('internalNotes').value }) });
          toast('Notes saved.');
        } catch (err) {
          toast(err.message, true);
        }
      });
    } catch (err) {
      toast(err.message, true);
    }
  }

  /* ================================================================
     INQUIRIES
  ================================================================ */
  const inquiryChips = document.getElementById('inquiryFilterChips');
  inquiryChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    inquiryChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    loadInquiries(chip.dataset.status);
  });

  async function loadInquiries(status) {
    const tbody = document.querySelector('#inquiriesTable tbody');
    tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton-row"></div></td></tr>';
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const list = await api('/inquiries' + qs);
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">&#128172;</div>No inquiries in this view yet.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map((inq) => `
        <tr class="is-clickable" data-id="${inq._id}" data-kind="inquiry">
          <td data-label="Customer">${inq.customerName}</td>
          <td data-label="Service">${inq.serviceNameSnapshot}</td>
          <td data-label="Date">${formatDatePretty(inq.preferredDate)}</td>
          <td data-label="Time">${inq.preferredTime}</td>
          <td data-label="Phone">${inq.phone}</td>
          <td data-label="Status"><span class="badge badge-${inq.status}">${inq.status}</span></td>
        </tr>
      `).join('');
      attachRowClicks(tbody);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">${err.message}</div></td></tr>`;
    }
  }

  async function openInquiryModal(id) {
    try {
      const inq = await api(`/inquiries/${id}`);
      const waMsg = `Hi ${inq.customerName}, this is ${artistName}. Regarding your ${inq.serviceNameSnapshot} appointment request for ${formatDatePretty(inq.preferredDate)} at ${inq.preferredTime}.`;

      const statusButtons = [];
      if (inq.status === 'new') statusButtons.push(['contacted', 'Mark Contacted']);
      if (inq.status !== 'rejected' && inq.status !== 'converted') statusButtons.push(['rejected', 'Reject']);
      if (inq.status !== 'archived' && inq.status !== 'converted') statusButtons.push(['archived', 'Archive']);

      const canConvert = inq.status !== 'converted';

      renderModal(`
        <div class="modal-head">
          <div>
            <h2 style="font-size:1.3rem;">${inq.customerName}</h2>
            <span class="badge badge-${inq.status}" style="margin-top:0.4rem;display:inline-block;">${inq.status}</span>
          </div>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>

        <div class="modal-section"><div class="k">Requested Service</div>${inq.serviceNameSnapshot}</div>
        <div class="modal-section"><div class="k">Preferred Date &amp; Time</div>${formatDatePretty(inq.preferredDate)} at ${inq.preferredTime}</div>
        <div class="modal-section"><div class="k">Contact</div>${inq.phone}<br>${inq.email}</div>
        ${inq.message ? `<div class="modal-section"><div class="k">Message</div>${inq.message}</div>` : ''}

        ${canConvert ? `
        <div class="modal-section" style="border-top:1px solid var(--line-on-porcelain);padding-top:1.2rem;">
          <div class="k">Convert to booking</div>
          <p style="font-size:0.82rem;color:var(--ink-70);margin-bottom:0.6rem;">Confirm the slot before converting — availability is re-checked on submit.</p>
          <div class="form-row">
            <div class="form-group" style="margin-bottom:0.6rem;">
              <label for="convertDate">Date</label>
              <input type="date" id="convertDate" value="${inq.preferredDate}">
            </div>
            <div class="form-group" style="margin-bottom:0.6rem;">
              <label for="convertTime">Time</label>
              <input type="text" id="convertTime" value="${inq.preferredTime}" placeholder="10:00 AM">
            </div>
          </div>
          <button class="btn btn-primary btn-block" id="convertBtn">Convert to Booking</button>
        </div>` : ''}

        <div class="modal-actions">
          ${statusButtons.map(([s, label]) => `<button class="btn btn-outline-dark" data-action="status" data-status="${s}">${label}</button>`).join('')}
        </div>
        <div class="modal-actions">
          <a class="btn btn-outline-dark" href="tel:${inq.phone}">Call</a>
          <a class="btn btn-outline-dark" href="${waLink(inq.phone, waMsg)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn btn-outline-dark" href="mailto:${inq.email}">Email</a>
        </div>
      `);

      document.getElementById('modalPanel').querySelectorAll('[data-action="status"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/inquiries/${id}`, { method: 'PUT', body: JSON.stringify({ status: btn.dataset.status }) });
            toast('Inquiry updated.');
            closeModal();
            loadInquiries(inquiryChips.querySelector('.is-active').dataset.status);
            loadOverview();
          } catch (err) {
            toast(err.message, true);
          }
        });
      });

      const convertBtn = document.getElementById('convertBtn');
      if (convertBtn) {
        convertBtn.addEventListener('click', async () => {
          const date = document.getElementById('convertDate').value;
          const startTime = document.getElementById('convertTime').value.trim();
          const service = servicesById[inq.serviceId];
          const endTime = service ? addMinutesToLabel(startTime, service.duration) : startTime;

          convertBtn.disabled = true;
          convertBtn.textContent = 'Converting…';
          try {
            await api(`/inquiries/${id}/convert`, {
              method: 'POST',
              body: JSON.stringify({ bookingDate: date, startTime, endTime }),
            });
            toast('Converted to booking.');
            closeModal();
            loadInquiries(inquiryChips.querySelector('.is-active').dataset.status);
            loadOverview();
          } catch (err) {
            toast(err.message, true);
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to Booking';
          }
        });
      }
    } catch (err) {
      toast(err.message, true);
    }
  }

  /* ================================================================
     GENERIC FORM MODAL — used by Services & Testimonials
     (Portfolio has its own modal below because of the file upload)
  ================================================================ */
  function renderField(f) {
    const id = `field_${f.name}`;
    const val = f.value === undefined || f.value === null ? '' : f.value;

    if (f.type === 'checkbox') {
      return `
        <div class="form-group" style="display:flex;align-items:center;gap:0.6rem;">
          <input type="checkbox" id="${id}" ${val ? 'checked' : ''} style="width:auto;">
          <label for="${id}" style="margin:0;text-transform:none;font-weight:500;">${f.label}</label>
        </div>`;
    }
    if (f.type === 'select') {
      const opts = f.options.map((o) => `<option value="${o.value}" ${String(o.value) === String(val) ? 'selected' : ''}>${o.label}</option>`).join('');
      return `<div class="form-group"><label for="${id}">${f.label}</label><select id="${id}">${opts}</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="form-group"><label for="${id}">${f.label}</label><textarea id="${id}" rows="3">${val}</textarea></div>`;
    }
    return `<div class="form-group"><label for="${id}">${f.label}</label><input type="${f.type || 'text'}" id="${id}" value="${val}" ${f.step ? `step="${f.step}"` : ''}></div>`;
  }

  function openFormModal({ title, fields, onSubmit, onDelete }) {
    renderModal(`
      <div class="modal-head"><h2 style="font-size:1.3rem;">${title}</h2><button class="modal-close" id="modalClose">&times;</button></div>
      <form id="genericForm">
        ${fields.map(renderField).join('')}
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          ${onDelete ? '<button type="button" class="btn btn-outline-dark" id="genericDeleteBtn">Delete</button>' : ''}
        </div>
      </form>
    `);

    document.getElementById('genericForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = {};
      fields.forEach((f) => {
        const el = document.getElementById(`field_${f.name}`);
        if (f.type === 'checkbox') values[f.name] = el.checked;
        else if (f.type === 'number') values[f.name] = el.value === '' ? undefined : Number(el.value);
        else values[f.name] = el.value;
      });
      try {
        await onSubmit(values);
        closeModal();
      } catch (err) {
        toast(err.message, true);
      }
    });

    if (onDelete) {
      document.getElementById('genericDeleteBtn').addEventListener('click', async () => {
        if (!confirm('Delete this item? This cannot be undone.')) return;
        try {
          await onDelete();
          closeModal();
        } catch (err) {
          toast(err.message, true);
        }
      });
    }
  }

  /* ================================================================
     SERVICES
  ================================================================ */
  async function loadServices() {
    const tbody = document.querySelector('#servicesTable tbody');
    tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton-row"></div></td></tr>';
    try {
      const list = await api('/services');
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">No services yet — add your first one.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map((s) => `
        <tr>
          <td data-label="Name">${s.name}</td>
          <td data-label="Category">${s.category}</td>
          <td data-label="Price">${currencySymbol(s.currency)}${s.price}</td>
          <td data-label="Duration">${s.duration} min</td>
          <td data-label="Active">${s.isActive ? '<span class="badge badge-confirmed">Active</span>' : '<span class="badge badge-cancelled">Disabled</span>'}</td>
          <td data-label=""><button class="btn btn-outline-dark" data-edit="${s._id}" style="padding:0.4em 1em;font-size:0.75rem;">Edit</button></td>
        </tr>
      `).join('');
      tbody.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => openServiceModal(list.find((s) => s._id === btn.dataset.edit)));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">${err.message}</div></td></tr>`;
    }
  }

  document.getElementById('addServiceBtn').addEventListener('click', () => openServiceModal(null));

  function openServiceModal(service) {
    const fields = [
      { name: 'name', label: 'Name', value: service?.name },
      { name: 'description', label: 'Description', type: 'textarea', value: service?.description },
      { name: 'category', label: 'Category', value: service?.category || 'General' },
      { name: 'price', label: 'Price', type: 'number', value: service?.price },
      {
        name: 'currency', label: 'Currency', type: 'select', value: service?.currency || 'INR',
        options: [
          { value: 'INR', label: 'INR (₹)' },
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
          { value: 'GBP', label: 'GBP (£)' },
        ],
      },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', value: service?.duration },
      { name: 'sortOrder', label: 'Display Order', type: 'number', value: service?.sortOrder ?? 0 },
      { name: 'isActive', label: 'Active (visible on public site)', type: 'checkbox', value: service ? service.isActive : true },
    ];

    openFormModal({
      title: service ? 'Edit Service' : 'Add Service',
      fields,
      onSubmit: async (values) => {
        if (service) {
          await api(`/services/${service._id}`, { method: 'PUT', body: JSON.stringify(values) });
          toast('Service updated.');
        } else {
          await api('/services', { method: 'POST', body: JSON.stringify(values) });
          toast('Service added.');
        }
        loadServices();
      },
      onDelete: service ? async () => {
        await api(`/services/${service._id}`, { method: 'DELETE' });
        toast('Service removed.');
        loadServices();
      } : null,
    });
  }

  /* ================================================================
     PORTFOLIO
  ================================================================ */
  let portfolioAdminCache = [];

  const portfolioChips = document.getElementById('portfolioFilterChips');
  portfolioChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    portfolioChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    loadPortfolioAdmin(chip.dataset.cat);
  });

  async function loadPortfolioAdmin(category) {
    const grid = document.getElementById('portfolioAdminGrid');
    grid.innerHTML = '<div class="skeleton-row" style="height:160px;"></div>';
    try {
      const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
      const list = await api('/portfolio' + qs);
      portfolioAdminCache = list;
      if (!list.length) {
        grid.innerHTML = '<div class="empty-state">No images in this category yet.</div>';
        return;
      }
      grid.innerHTML = list.map((p) => `
        <div style="position:relative;border-radius:var(--radius);overflow:hidden;aspect-ratio:4/5;cursor:pointer;" data-edit="${p._id}">
          <img src="${p.imageUrl}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;">
          <div style="position:absolute;left:0;right:0;bottom:0;padding:0.5rem;background:linear-gradient(0deg,rgba(27,22,19,0.85),transparent);color:#fff;font-size:0.72rem;">
            ${p.title || p.category}${p.isFeatured ? ' &#9733;' : ''}
          </div>
        </div>
      `).join('');
      grid.querySelectorAll('[data-edit]').forEach((el) => {
        el.addEventListener('click', () => openPortfolioModal(portfolioAdminCache.find((p) => p._id === el.dataset.edit)));
      });
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  document.getElementById('addPortfolioBtn').addEventListener('click', () => openPortfolioModal(null));

  function openPortfolioModal(item) {
    const categories = ['makeup', 'hair', 'haircut', 'bridal', 'editorial'];
    renderModal(`
      <div class="modal-head"><h2 style="font-size:1.3rem;">${item ? 'Edit Image' : 'Add Image'}</h2><button class="modal-close" id="modalClose">&times;</button></div>
      <form id="portfolioForm">
        ${imageFieldHTML('pfImg', item?.imageUrl, 'Image')}
        <div class="form-group"><label for="pfTitle">Title</label><input type="text" id="pfTitle" value="${item?.title || ''}"></div>
        <div class="form-group"><label for="pfCaption">Caption</label><input type="text" id="pfCaption" value="${item?.caption || ''}"></div>
        <div class="form-group">
          <label for="pfCategory">Category</label>
          <select id="pfCategory">${categories.map((c) => `<option value="${c}" ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label for="pfSize">Grid size</label>
          <select id="pfSize">
            <option value="" ${!item?.size ? 'selected' : ''}>Normal</option>
            <option value="tall" ${item?.size === 'tall' ? 'selected' : ''}>Tall</option>
            <option value="wide" ${item?.size === 'wide' ? 'selected' : ''}>Wide</option>
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:0.6rem;">
          <input type="checkbox" id="pfFeatured" ${item?.isFeatured ? 'checked' : ''} style="width:auto;">
          <label for="pfFeatured" style="margin:0;text-transform:none;font-weight:500;">Featured</label>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary" id="pfSubmit">Save</button>
          ${item ? '<button type="button" class="btn btn-outline-dark" id="pfDelete">Delete</button>' : ''}
        </div>
      </form>
    `);

    wireImageField('pfImg');

    document.getElementById('portfolioForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('pfSubmit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';

      try {
        const imageUrl = await resolveImageField('pfImg', item?.imageUrl);
        if (!imageUrl) throw new Error('Please add an image — upload a file or paste a URL.');

        const payload = {
          imageUrl,
          title: document.getElementById('pfTitle').value,
          caption: document.getElementById('pfCaption').value,
          category: document.getElementById('pfCategory').value,
          size: document.getElementById('pfSize').value,
          isFeatured: document.getElementById('pfFeatured').checked,
        };

        if (item) {
          await api(`/portfolio/${item._id}`, { method: 'PUT', body: JSON.stringify(payload) });
          toast('Image updated.');
        } else {
          await api('/portfolio', { method: 'POST', body: JSON.stringify(payload) });
          toast('Image added.');
        }
        closeModal();
        loadPortfolioAdmin(portfolioChips.querySelector('.is-active').dataset.cat);
      } catch (err) {
        toast(err.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save';
      }
    });

    const deleteBtn = document.getElementById('pfDelete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this image? This cannot be undone.')) return;
        try {
          await api(`/portfolio/${item._id}`, { method: 'DELETE' });
          toast('Image removed.');
          closeModal();
          loadPortfolioAdmin(portfolioChips.querySelector('.is-active').dataset.cat);
        } catch (err) {
          toast(err.message, true);
        }
      });
    }
  }

  /* ================================================================
     TESTIMONIALS
  ================================================================ */
  async function loadTestimonials() {
    const tbody = document.querySelector('#testimonialsTable tbody');
    tbody.innerHTML = '<tr><td colspan="5"><div class="skeleton-row"></div></td></tr>';
    try {
      const list = await api('/testimonials');
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No reviews yet — add your first one.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map((t) => `
        <tr>
          <td data-label="Client">${t.clientName}</td>
          <td data-label="Service">${t.service || '—'}</td>
          <td data-label="Rating">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</td>
          <td data-label="Active">${t.isActive ? '<span class="badge badge-confirmed">Active</span>' : '<span class="badge badge-cancelled">Hidden</span>'}</td>
          <td data-label=""><button class="btn btn-outline-dark" data-edit="${t._id}" style="padding:0.4em 1em;font-size:0.75rem;">Edit</button></td>
        </tr>
      `).join('');
      tbody.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => openTestimonialModal(list.find((t) => t._id === btn.dataset.edit)));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">${err.message}</div></td></tr>`;
    }
  }

  document.getElementById('addTestimonialBtn').addEventListener('click', () => openTestimonialModal(null));

  function openTestimonialModal(t) {
    renderModal(`
      <div class="modal-head"><h2 style="font-size:1.3rem;">${t ? 'Edit Review' : 'Add Review'}</h2><button class="modal-close" id="modalClose">&times;</button></div>
      <form id="testimonialForm">
        <div class="form-group"><label for="tClientName">Client Name</label><input type="text" id="tClientName" value="${t?.clientName || ''}"></div>
        <div class="form-group"><label for="tReview">Review</label><textarea id="tReview" rows="3">${t?.review || ''}</textarea></div>
        <div class="form-group">
          <label for="tRating">Rating</label>
          <select id="tRating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${(t?.rating || 5) === n ? 'selected' : ''}>${n} stars</option>`).join('')}</select>
        </div>
        <div class="form-group"><label for="tService">Service / Occasion</label><input type="text" id="tService" value="${t?.service || ''}"></div>
        ${imageFieldHTML('tImg', t?.imageUrl, 'Client Photo (optional)')}
        <div class="form-group" style="display:flex;align-items:center;gap:0.6rem;">
          <input type="checkbox" id="tActive" ${t ? (t.isActive ? 'checked' : '') : 'checked'} style="width:auto;">
          <label for="tActive" style="margin:0;text-transform:none;font-weight:500;">Active (visible on public site)</label>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary" id="tSubmit">Save</button>
          ${t ? '<button type="button" class="btn btn-outline-dark" id="tDelete">Delete</button>' : ''}
        </div>
      </form>
    `);

    wireImageField('tImg');

    document.getElementById('testimonialForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('tSubmit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';

      try {
        const imageUrl = await resolveImageField('tImg', t?.imageUrl);
        const payload = {
          clientName: document.getElementById('tClientName').value,
          review: document.getElementById('tReview').value,
          rating: Number(document.getElementById('tRating').value),
          service: document.getElementById('tService').value,
          imageUrl,
          isActive: document.getElementById('tActive').checked,
        };

        if (t) {
          await api(`/testimonials/${t._id}`, { method: 'PUT', body: JSON.stringify(payload) });
          toast('Review updated.');
        } else {
          await api('/testimonials', { method: 'POST', body: JSON.stringify(payload) });
          toast('Review added.');
        }
        closeModal();
        loadTestimonials();
      } catch (err) {
        toast(err.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save';
      }
    });

    const deleteBtn = document.getElementById('tDelete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this review? This cannot be undone.')) return;
        try {
          await api(`/testimonials/${t._id}`, { method: 'DELETE' });
          toast('Review removed.');
          closeModal();
          loadTestimonials();
        } catch (err) {
          toast(err.message, true);
        }
      });
    }
  }

  /* ================================================================
     NEWSLETTER
  ================================================================ */
  let newsletterEmails = [];

  async function loadNewsletter() {
    const tbody = document.querySelector('#newsletterTable tbody');
    tbody.innerHTML = '<tr><td colspan="2"><div class="skeleton-row"></div></td></tr>';
    try {
      const list = await api('/newsletter');
      document.getElementById('newsletterCount').textContent = list.length;
      newsletterEmails = list.map((n) => n.email);
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="2"><div class="empty-state">No subscribers yet.</div></td></tr>';
        return;
      }
      tbody.innerHTML = list.map((n) => `
        <tr>
          <td data-label="Email">${n.email}</td>
          <td data-label="Subscribed">${formatDatePretty(n.createdAt.split('T')[0])}</td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="2"><div class="empty-state">${err.message}</div></td></tr>`;
    }
  }

  document.getElementById('copyNewsletterBtn').addEventListener('click', async () => {
    if (!newsletterEmails.length) {
      toast('No emails to copy yet.', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(newsletterEmails.join('\n'));
      toast(`Copied ${newsletterEmails.length} email${newsletterEmails.length === 1 ? '' : 's'} to clipboard.`);
    } catch (err) {
      toast('Could not copy automatically — please select and copy manually.', true);
    }
  });

  /* ================================================================
     AVAILABILITY + BLOCKED DATES
  ================================================================ */
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  async function loadAvailabilitySection() {
    const form = document.getElementById('availabilityForm');
    form.innerHTML = '<div class="skeleton-row"></div>';
    try {
      const rows = await api('/availability');
      rows.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      form.innerHTML = rows.map((r) => `
        <div class="form-row" style="align-items:end;grid-template-columns:1fr 1fr 1fr auto;margin-bottom:0.6rem;" data-day="${r.dayOfWeek}">
          <div style="font-size:0.9rem;padding-bottom:0.85em;font-weight:500;">${DAY_NAMES[r.dayOfWeek]}</div>
          <div class="form-group" style="margin-bottom:0;"><label>Open</label><input type="time" class="av-start" value="${r.startTime}" ${!r.isAvailable ? 'disabled' : ''}></div>
          <div class="form-group" style="margin-bottom:0;"><label>Close</label><input type="time" class="av-end" value="${r.endTime}" ${!r.isAvailable ? 'disabled' : ''}></div>
          <div class="form-group" style="margin-bottom:0;display:flex;align-items:center;gap:0.4rem;">
            <input type="checkbox" class="av-toggle" ${r.isAvailable ? 'checked' : ''} style="width:auto;">
            <label style="margin:0;text-transform:none;">Open</label>
          </div>
        </div>
      `).join('');

      form.querySelectorAll('.av-toggle').forEach((cb) => {
        cb.addEventListener('change', () => {
          const row = cb.closest('[data-day]');
          row.querySelector('.av-start').disabled = !cb.checked;
          row.querySelector('.av-end').disabled = !cb.checked;
        });
      });
    } catch (err) {
      form.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }

    loadBlockedDates();
  }

  document.getElementById('saveAvailabilityBtn').addEventListener('click', async () => {
    const rows = Array.from(document.querySelectorAll('#availabilityForm [data-day]')).map((row) => ({
      dayOfWeek: Number(row.dataset.day),
      isAvailable: row.querySelector('.av-toggle').checked,
      startTime: row.querySelector('.av-start').value,
      endTime: row.querySelector('.av-end').value,
    }));
    try {
      await api('/availability', { method: 'PUT', body: JSON.stringify(rows) });
      toast('Hours saved.');
    } catch (err) {
      toast(err.message, true);
    }
  });

  async function loadBlockedDates() {
    const list = document.getElementById('blockedDatesList');
    try {
      const rows = await api('/blocked-dates');
      if (!rows.length) {
        list.innerHTML = '<li style="color:var(--ink-70);font-size:0.85rem;">No blocked dates.</li>';
        return;
      }
      list.innerHTML = rows.map((r) => `
        <li style="display:flex;justify-content:space-between;align-items:center;padding:0.6em 0;border-bottom:1px solid var(--line-on-porcelain);">
          <span>${formatDatePretty(r.date)}${r.reason ? ' — ' + r.reason : ''}</span>
          <button class="btn btn-outline-dark" data-remove="${r._id}" style="padding:0.3em 0.9em;font-size:0.72rem;">Remove</button>
        </li>
      `).join('');
      list.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/blocked-dates/${btn.dataset.remove}`, { method: 'DELETE' });
            loadBlockedDates();
          } catch (err) {
            toast(err.message, true);
          }
        });
      });
    } catch (err) {
      list.innerHTML = `<li>${err.message}</li>`;
    }
  }

  document.getElementById('addBlockedDateBtn').addEventListener('click', async () => {
    const date = document.getElementById('blockDateInput').value;
    const reason = document.getElementById('blockReasonInput').value;
    if (!date) return toast('Pick a date first.', true);
    try {
      await api('/blocked-dates', { method: 'POST', body: JSON.stringify({ date, reason }) });
      document.getElementById('blockDateInput').value = '';
      document.getElementById('blockReasonInput').value = '';
      toast('Date blocked.');
      loadBlockedDates();
    } catch (err) {
      toast(err.message, true);
    }
  });

  /* ================================================================
     SETTINGS
  ================================================================ */
  async function loadSettings() {
    const container = document.getElementById('settingsForm');
    container.innerHTML = '<div class="skeleton-row"></div>';
    try {
      const p = await api('/profile');
      const heroImages = p.heroImages || [];
      container.innerHTML = `
        <form id="settingsFormEl">
          <div class="panel-head"><h2>Artist</h2></div>
          <div class="form-group"><label for="stName">Name</label><input type="text" id="stName" value="${p.name || ''}"></div>
          <div class="form-group"><label for="stTitle">Title</label><input type="text" id="stTitle" value="${p.title || ''}"></div>
          <div class="form-group"><label for="stTagline">Tagline</label><input type="text" id="stTagline" value="${p.tagline || ''}"></div>
          <div class="form-group"><label for="stBio">Bio</label><textarea id="stBio" rows="4">${p.bio || ''}</textarea></div>

          <div class="panel-head" style="margin-top:1.5rem;"><h2>Contact</h2></div>
          <div class="form-row">
            <div class="form-group"><label for="stPhone">Phone</label><input type="text" id="stPhone" value="${p.phone || ''}" placeholder="+14155550148"></div>
            <div class="form-group"><label for="stWhatsapp">WhatsApp (digits only)</label><input type="text" id="stWhatsapp" value="${p.whatsapp || ''}" placeholder="14155550148"></div>
          </div>
          <div class="form-group"><label for="stEmail">Email</label><input type="email" id="stEmail" value="${p.email || ''}"></div>

          <div class="panel-head" style="margin-top:1.5rem;"><h2>Location</h2></div>
          <div class="form-group"><label for="stAddress">Address</label><input type="text" id="stAddress" value="${p.address || ''}"></div>
          <div class="form-group"><label for="stCity">City</label><input type="text" id="stCity" value="${p.city || ''}"></div>
          <div class="form-group"><label for="stMaps">Google Maps URL</label><input type="text" id="stMaps" value="${p.mapsUrl || ''}"></div>

          <div class="panel-head" style="margin-top:1.5rem;"><h2>Social</h2></div>
          <div class="form-row">
            <div class="form-group"><label for="stInstagram">Instagram URL</label><input type="text" id="stInstagram" value="${p.instagramUrl || ''}" placeholder="Leave blank to hide the icon"></div>
            <div class="form-group"><label for="stFacebook">Facebook URL</label><input type="text" id="stFacebook" value="${p.facebookUrl || ''}" placeholder="Leave blank to hide the icon"></div>
          </div>

          <div class="panel-head" style="margin-top:1.5rem;"><h2>Pricing</h2></div>
          <div class="form-group" style="display:flex;align-items:center;gap:0.6rem;">
            <input type="checkbox" id="stShowPrices" ${p.showPrices !== false ? 'checked' : ''} style="width:auto;">
            <label for="stShowPrices" style="margin:0;text-transform:none;font-weight:500;">Show prices on the public website</label>
          </div>
          <p class="field-hint">Turn this off if you'd rather clients call or message to ask about pricing — services will show "Call for pricing" instead of a number.</p>

          <div class="panel-head" style="margin-top:1.5rem;"><h2>Theme</h2></div>
          <div class="form-group">
            <label for="stAccentColor">Light theme pop color</label>
            <select id="stAccentColor">
              <option value="violet" ${(p.accentColor || 'violet') === 'violet' ? 'selected' : ''}>Violet</option>
              <option value="orange" ${p.accentColor === 'orange' ? 'selected' : ''}>Orange</option>
            </select>
          </div>
          <p class="field-hint">Applies to the light theme only, on both the dashboard and the public site — dark theme always stays violet.</p>

          <div class="panel-head" style="margin-top:1.5rem;"><h2>Site Images</h2></div>
          <p class="field-hint" style="margin-top:-0.4rem;margin-bottom:1rem;">These power the homepage hero and about section — upload a file or paste a URL for each.</p>
          ${imageFieldHTML('stPortrait', p.profileImage, 'About / portrait photo')}
          <div class="form-row" style="grid-template-columns:1fr 1fr;">
            ${[0, 1, 2, 3, 4].map((i) => imageFieldHTML(`stHero${i}`, heroImages[i], `Hero image ${i + 1}`)).join('')}
          </div>

          <button type="submit" class="btn btn-primary" id="settingsSubmit">Save Settings</button>
        </form>
      `;

      ['stPortrait', 'stHero0', 'stHero1', 'stHero2', 'stHero3', 'stHero4'].forEach(wireImageField);

      document.getElementById('settingsFormEl').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('settingsSubmit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving…';
        try {
          const profileImage = await resolveImageField('stPortrait', p.profileImage);
          const newHeroImages = [];
          for (let i = 0; i < 5; i++) {
            const url = await resolveImageField(`stHero${i}`, heroImages[i]);
            if (url) newHeroImages.push(url);
          }

          await api('/profile', {
            method: 'PUT',
            body: JSON.stringify({
              name: document.getElementById('stName').value,
              title: document.getElementById('stTitle').value,
              tagline: document.getElementById('stTagline').value,
              bio: document.getElementById('stBio').value,
              phone: document.getElementById('stPhone').value,
              whatsapp: document.getElementById('stWhatsapp').value,
              email: document.getElementById('stEmail').value,
              address: document.getElementById('stAddress').value,
              city: document.getElementById('stCity').value,
              mapsUrl: document.getElementById('stMaps').value,
              instagramUrl: document.getElementById('stInstagram').value,
              facebookUrl: document.getElementById('stFacebook').value,
              showPrices: document.getElementById('stShowPrices').checked,
              accentColor: document.getElementById('stAccentColor').value,
              profileImage,
              heroImages: newHeroImages,
            }),
          });
          toast('Settings saved.');
          document.documentElement.dataset.accent = document.getElementById('stAccentColor').value;
          loadSettings();
        } catch (err) {
          toast(err.message, true);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Settings';
        }
      });
    } catch (err) {
      container.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  /* ================================================================
     CHANGE PASSWORD
  ================================================================ */
  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = document.getElementById('pwCurrent').value;
    const next = document.getElementById('pwNew').value;
    const confirm = document.getElementById('pwConfirm').value;

    if (next !== confirm) {
      toast('New password and confirmation don\'t match.', true);
      return;
    }
    if (next.length < 8) {
      toast('New password must be at least 8 characters.', true);
      return;
    }

    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast('Password updated.');
      document.getElementById('passwordForm').reset();
    } catch (err) {
      toast(err.message, true);
    }
  });

  /* ================================================================
     MODAL SHELL
  ================================================================ */
  const modalOverlay = document.getElementById('modalOverlay');
  function renderModal(html) {
    document.getElementById('modalPanel').innerHTML = html;
    modalOverlay.classList.add('is-open');
    document.getElementById('modalClose').addEventListener('click', closeModal);
  }
  function closeModal() {
    modalOverlay.classList.remove('is-open');
  }
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();