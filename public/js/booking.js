(function () {
  'use strict';

  const state = {
    services: [],
    availability: [],
    selectedService: null,
    selectedDate: '',
    selectedTime: '',
    profile: null,
  };

  const panels = document.querySelectorAll('.booking-panel');
  const stepEls = document.querySelectorAll('.booking-step');

  function goToStep(n) {
    panels.forEach((p) => { p.hidden = Number(p.dataset.panel) !== n; });
    stepEls.forEach((s) => {
      const step = Number(s.dataset.step);
      s.classList.toggle('is-active', step === n);
      s.classList.toggle('is-done', step < n);
    });
    document.querySelector('.booking-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function servicePriceLabel(s) {
    if (state.profile && state.profile.showPrices === false) return 'Call for pricing';
    return `${currencySymbol(s.currency)}${s.price}`;
  }

  /* ---------------- STEP 1: SERVICE ---------------- */
  const servicePickGrid = document.getElementById('servicePickGrid');
  const toStep2 = document.getElementById('toStep2');

  const params = new URLSearchParams(window.location.search);
  const preselectId = params.get('service');

  Promise.all([Api.getProfile(), Api.getServices()]).then(([profile, services]) => {
    state.profile = profile;
    state.services = services;
    if (!services.length) {
      servicePickGrid.innerHTML = '<p class="list-empty">No services available right now — please check back soon.</p>';
      return;
    }
    servicePickGrid.innerHTML = services.map((s) => `
      <button type="button" class="service-pick" data-id="${s.id}">
        <div class="name">${s.name}</div>
        <div class="meta">${servicePriceLabel(s)} · ${s.duration} min</div>
      </button>
    `).join('');

    servicePickGrid.querySelectorAll('.service-pick').forEach((btn) => {
      btn.addEventListener('click', () => selectService(btn.dataset.id));
    });

    if (preselectId && services.some((s) => s.id === preselectId)) {
      selectService(preselectId);
    }
  });

  function selectService(id) {
    state.selectedService = state.services.find((s) => s.id === id);
    servicePickGrid.querySelectorAll('.service-pick').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.id === id);
    });
    toStep2.disabled = false;
  }

  toStep2.addEventListener('click', () => goToStep(2));
  document.getElementById('backTo1').addEventListener('click', () => goToStep(1));

  /* ---------------- STEP 2: DATE & TIME ---------------- */
  const dateInput = document.getElementById('dateInput');
  const dateError = document.getElementById('dateError');
  const timeGrid = document.getElementById('timeGrid');
  const toStep3 = document.getElementById('toStep3');

  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.min = todayStr;

  Api.getAvailability().then((avail) => { state.availability = avail; });

  dateInput.addEventListener('change', async () => {
    state.selectedDate = dateInput.value;
    state.selectedTime = '';
    toStep3.disabled = true;

    if (!state.selectedDate) return;

    const dayOfWeek = new Date(state.selectedDate + 'T00:00:00').getDay();
    const dayRule = state.availability.find((a) => a.dayOfWeek === dayOfWeek);

    dateInput.closest('.form-group').classList.remove('has-error');

    if (!dayRule || !dayRule.isAvailable) {
      dateInput.closest('.form-group').classList.add('has-error');
      timeGrid.innerHTML = '<p class="list-empty" style="grid-column:1/-1;">Closed on this day — please choose another date.</p>';
      return;
    }

    const booked = await Api.getBookedSlots(state.selectedDate);
    renderTimeSlots(dayRule.startTime, dayRule.endTime, booked);
  });

  function renderTimeSlots(startTime, endTime, bookedSlots) {
    const slots = [];
    let [h, m] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    while (h < endH || (h === endH && m < endM)) {
      const label = formatTime(h, m);
      slots.push(label);
      m += 60;
      if (m >= 60) { h += 1; m = 0; }
    }

    if (!slots.length) {
      timeGrid.innerHTML = '<p class="list-empty" style="grid-column:1/-1;">No slots available this day.</p>';
      return;
    }

    timeGrid.innerHTML = slots.map((slot) => {
      const isBooked = bookedSlots.includes(slot);
      return `<button type="button" class="time-slot" data-time="${slot}" ${isBooked ? 'disabled' : ''}>${slot}</button>`;
    }).join('');

    timeGrid.querySelectorAll('.time-slot:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTime = btn.dataset.time;
        timeGrid.querySelectorAll('.time-slot').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        toStep3.disabled = false;
      });
    });
  }

  function formatTime(h, m) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  }

  toStep3.addEventListener('click', () => {
    renderSummary();
    goToStep(3);
  });
  document.getElementById('backTo2').addEventListener('click', () => goToStep(2));

  /* ---------------- STEP 3: CUSTOMER INFO ---------------- */
  function renderSummary() {
    const priceRow = state.profile && state.profile.showPrices === false
      ? ''
      : `<div class="booking-summary-row"><span class="k">Price</span><span>${currencySymbol(state.selectedService.currency)}${state.selectedService.price}</span></div>`;
    document.getElementById('bookingSummary').innerHTML = `
      <div class="booking-summary-row"><span class="k">Service</span><span>${state.selectedService.name}</span></div>
      <div class="booking-summary-row"><span class="k">Date</span><span>${new Date(state.selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
      <div class="booking-summary-row"><span class="k">Time</span><span>${state.selectedTime}</span></div>
      ${priceRow}
    `;
  }

  const customerForm = document.getElementById('customerForm');
  const submitBtn = document.getElementById('submitRequest');

  customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');

    let valid = true;
    [fullName, phone, email].forEach((el) => el.closest('.form-group').classList.remove('has-error'));

    if (!fullName.value.trim()) { fullName.closest('.form-group').classList.add('has-error'); valid = false; }
    if (!/^[\d\s()+-]{7,}$/.test(phone.value.trim())) { phone.closest('.form-group').classList.add('has-error'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.closest('.form-group').classList.add('has-error'); valid = false; }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      await Api.submitInquiry({
        fullName: fullName.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        serviceId: state.selectedService.id,
        serviceName: state.selectedService.name,
        preferredDate: state.selectedDate,
        preferredTime: state.selectedTime,
        message: document.getElementById('message').value.trim(),
      });
      goToStep(4);
    } catch (err) {
      alert(err.message || 'Something went wrong submitting your request. Please try again or reach out on WhatsApp.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
    }
  });
})();
