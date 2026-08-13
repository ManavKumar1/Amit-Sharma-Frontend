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
      window.location.href = 'login.html';
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

  /* ---------------- PROFILE (for WhatsApp message template) ---------------- */
  let artistName = 'Maya';
  api('/profile').then((p) => { if (p && p.name) artistName = p.name.split(' ')[0]; }).catch(() => {});

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

        <div class="modal-section"><div class="k">Service</div>${b.serviceNameSnapshot} — $${b.priceSnapshot}</div>
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
