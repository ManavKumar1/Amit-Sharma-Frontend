(function () {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- SOCIAL ICONS (real SVGs, currentColor so they follow existing hover styles) ---------------- */
  const SOCIAL_ICONS = {
    instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.5 8.5H17V5.2c-.43-.06-1.9-.2-3.62-.2-3.58 0-6.03 2.24-6.03 6.35v2.9H3.9v3.7h3.45V21h3.8v-3.05h3.32l.53-3.7h-3.85v-2.55c0-1.07.29-1.8 1.85-1.8Z"/></svg>',
  };

  /* ---------------- NAV ---------------- */
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---------------- SERVICES ---------------- */
  function renderServicePrice(s, showPrices) {
    if (!showPrices) return '<div class="service-price service-price--hidden">Call for pricing</div>';
    return `<div class="service-price">${currencySymbol(s.currency)}${s.price}</div>`;
  }

  /* ---------------- REVEAL ON SCROLL ---------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function observeReveal(el) {
    el.classList.add('reveal');
    revealObserver.observe(el);
  }
  document.querySelectorAll('.reveal').forEach(observeReveal);

  /* ---------------- PROFILE-DEPENDENT CONTENT ---------------- */
  function waLink(phoneDigits, message) {
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  }

  // Builds a real, embeddable Google Maps src from whatever the owner
  // pasted into Settings — a proper embed URL is used as-is, a "place"
  // or "?q=" link has its query extracted and re-embedded, and if nothing
  // usable was set, it falls back to the studio address on file so the
  // map is never just a stale hardcoded location.
  function buildMapEmbedSrc(mapsUrl, address, city) {
    const addressQuery = [address, city].filter(Boolean).join(', ');
    if (mapsUrl) {
      if (mapsUrl.includes('/maps/embed') || mapsUrl.includes('output=embed')) return mapsUrl;
      try {
        const url = new URL(mapsUrl);
        const q = url.searchParams.get('q') || url.searchParams.get('query');
        if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        const placeMatch = mapsUrl.match(/\/maps\/place\/([^/@]+)/);
        if (placeMatch) {
          const place = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
          return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        }
      } catch (err) { /* not a parseable URL — fall through to the address fallback below */ }
    }
    if (addressQuery) return `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    return '';
  }

  Api.getProfile().then((profile) => {
    // Owner's chosen pop color for light theme (dark theme always stays violet).
    document.documentElement.dataset.accent = profile.accentColor || 'violet';

    // Floating WhatsApp button
    const waFloat = document.getElementById('whatsappFloat');
    waFloat.href = waLink(profile.whatsapp, `Hi ${profile.name}, I'd love to know more about your services.`);

    // Hero collage — built entirely from Profile.heroImages instead of
    // hardcoded placeholders. Fills the biggest/most central slots first
    // so 1–4 images still look art-directed instead of leaving gaps, and
    // the whole collage is skipped if the owner hasn't set any yet.
    const heroCollage = document.getElementById('heroCollage');
    const heroImages = (profile.heroImages || []).filter(Boolean);
    if (heroCollage) {
      if (!heroImages.length) {
        heroCollage.remove();
      } else {
        const slotFillOrder = [3, 1, 4, 2, 5];
        const slots = slotFillOrder.slice(0, Math.min(heroImages.length, slotFillOrder.length));
        heroCollage.innerHTML = slots.map((slotNum, i) => `
          <img class="hero-photo hp-${slotNum}" src="${heroImages[i]}" alt="" loading="eager">
        `).join('');
      }
    }
    if (profile.profileImage) {
      const portrait = document.querySelector('.about-media img');
      if (portrait) portrait.src = profile.profileImage;
    }
    const ogImage = heroImages[0];
    if (ogImage) {
      const ogTag = document.querySelector('meta[property="og:image"]');
      if (ogTag) ogTag.setAttribute('content', ogImage);
    }

    // Studio map — pulled from Profile.mapsUrl (or the address on file)
    // instead of the static src baked into the page.
    const mapIframe = document.getElementById('contactMapIframe');
    const mapFrame = document.getElementById('contactMapFrame');
    if (mapIframe && mapFrame) {
      const embedSrc = buildMapEmbedSrc(profile.mapsUrl, profile.address, profile.city);
      if (embedSrc) {
        mapIframe.src = embedSrc;
        mapFrame.hidden = false;
      } else {
        mapFrame.hidden = true;
      }
    }

    // Footer social links — real SVG icons, hidden entirely when a link
    // hasn't been set in the dashboard.
    const footerSocial = document.querySelector('.footer-social');
    if (footerSocial) {
      const links = [
        { url: profile.instagramUrl, label: 'Instagram', svg: SOCIAL_ICONS.instagram },
        { url: profile.facebookUrl, label: 'Facebook', svg: SOCIAL_ICONS.facebook },
      ].filter((s) => s.url && s.url.trim());
      footerSocial.innerHTML = links.map((s) => `
        <a href="${s.url}" aria-label="${s.label}" target="_blank" rel="noopener">${s.svg}</a>
      `).join('');
      const followCol = footerSocial.closest('.footer-col');
      if (followCol) followCol.hidden = links.length === 0;
    }

    // Contact list
    const contactList = document.getElementById('contactList');
    contactList.innerHTML = `
      <li><span class="k">Phone</span><span class="v"><a href="tel:${profile.phone}">${profile.phoneDisplay}</a></span></li>
      <li><span class="k">WhatsApp</span><span class="v"><a href="${waLink(profile.whatsapp, `Hi ${profile.name}, I'd love to know more about your services.`)}" target="_blank" rel="noopener">Message on WhatsApp</a></span></li>
      <li><span class="k">Email</span><span class="v"><a href="mailto:${profile.email}">${profile.email}</a></span></li>
      <li><span class="k">Studio</span><span class="v">${profile.address}<br>${profile.city}</span></li>
      <li><span class="k">Instagram</span><span class="v"><a href="${profile.instagramUrl}" target="_blank" rel="noopener">@amitsharmamakeup</a></span></li>
    `;

    // Hours table
    const today = new Date().getDay();
    const hoursTable = document.getElementById('hoursTable');
    hoursTable.innerHTML = profile.businessHours.map((h, i) => `
      <tr class="${i === today ? 'is-today' : ''}">
        <td>${h.day}</td>
        <td>${h.closed ? 'Closed' : `${h.open} – ${h.close}`}</td>
      </tr>
    `).join('');

    // Services list needs to know whether to show prices, so it's chained
    // after the profile resolves rather than fired independently.
    return Api.getServices().then((services) => {
      const list = document.getElementById('servicesList');
      if (!services.length) {
        list.innerHTML = '<p class="list-empty">Services are being updated — please check back shortly.</p>';
        return;
      }
      list.innerHTML = services.map((s) => `
        <div class="service-row reveal">
          <div class="service-name">${s.name}</div>
          <div class="service-desc">${s.description}</div>
          <div class="service-meta">
            ${renderServicePrice(s, profile.showPrices)}
            <span class="service-duration">${s.duration} min</span>
          </div>
          <a href="book.html?service=${encodeURIComponent(s.id)}" class="btn btn-outline-dark">Book</a>
        </div>
      `).join('');
      list.querySelectorAll('.reveal').forEach(observeReveal);
    });
  });

  /* ---------------- PORTFOLIO + LIGHTBOX ---------------- */
  const grid = document.getElementById('portfolioGrid');
  const filterBar = document.getElementById('filterBar');
  const HOME_PORTFOLIO_CAP = 6;
  let currentItems = [];
  let lightboxIndex = 0;

  function renderPortfolio(items, category) {
    // Featured pieces (the owner's picks) lead the homepage teaser, so
    // marking something "Featured" in the dashboard actually does
    // something on the site instead of just toggling a hidden flag.
    const ordered = items.slice().sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    const capped = ordered.slice(0, HOME_PORTFOLIO_CAP);
    currentItems = capped;

    if (!items.length) {
      grid.innerHTML = '<p class="portfolio-empty">No work in this category yet — check back soon.</p>';
      return;
    }
    grid.innerHTML = capped.map((item, i) => `
      <button class="portfolio-item ${item.size ? 'size-' + item.size : ''} reveal" data-index="${i}" aria-label="View ${item.title} full screen">
        <img src="${item.imageUrl}" alt="${item.title} — ${item.category}" loading="lazy">
        <span class="portfolio-index">N°${String(i + 1).padStart(2, '0')}</span>
        ${item.isFeatured ? '<span class="portfolio-star" aria-hidden="true">&#10022;</span>' : ''}
        <span class="portfolio-caption">
          <span class="cat">${item.category}</span>
          <span class="title">${item.title}</span>
        </span>
      </button>
    `).join('');
    grid.querySelectorAll('.portfolio-item').forEach((btn) => {
      btn.addEventListener('click', () => openLightbox(Number(btn.dataset.index)));
      observeReveal(btn);
    });

    const existingMore = document.getElementById('portfolioMore');
    if (existingMore) existingMore.remove();
    if (items.length > HOME_PORTFOLIO_CAP) {
      const more = document.createElement('div');
      more.className = 'portfolio-more';
      more.id = 'portfolioMore';
      more.innerHTML = `<a class="btn btn-outline-dark" href="portfolio.html?filter=${encodeURIComponent(category || 'all')}">Show More (${items.length - HOME_PORTFOLIO_CAP} more)</a>`;
      grid.insertAdjacentElement('afterend', more);
    }
  }

  function loadPortfolio(category) {
    grid.setAttribute('aria-busy', 'true');
    Api.getPortfolio({ category }).then((items) => {
      renderPortfolio(items, category);
      grid.setAttribute('aria-busy', 'false');
    });
  }

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach((b) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    loadPortfolio(btn.dataset.filter);
  });

  loadPortfolio('all');

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  let lastFocusedEl = null;

  function openLightbox(index) {
    lightboxIndex = index;
    lastFocusedEl = document.activeElement;
    updateLightbox();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('lightboxClose').focus();
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  }
  function updateLightbox() {
    const item = currentItems[lightboxIndex];
    lightboxImg.src = item.imageUrl.replace('/800/', '/1400/').replace('/900/', '/1400/');
    lightboxImg.alt = `${item.title} — ${item.category}`;
    lightboxCaption.textContent = `${item.title} — ${item.caption}`;
  }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + currentItems.length) % currentItems.length;
    updateLightbox();
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % currentItems.length;
    updateLightbox();
  });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
  });

  /* ---------------- TESTIMONIALS ---------------- */
  const track = document.getElementById('testimonialTrack');
  Api.getTestimonials().then((items) => {
    if (!items.length) {
      track.innerHTML = '<p class="list-empty">Reviews are on their way.</p>';
      return;
    }
    track.innerHTML = items.map((t) => `
      <article class="testimonial-card">
        <div class="testimonial-rating" aria-label="${t.rating} out of 5 stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
        <p class="testimonial-quote">"${t.review}"</p>
        <div class="testimonial-person">
          <img src="${t.imageUrl}" alt="" loading="lazy">
          <div>
            <div class="name">${t.clientName}</div>
            <div class="occasion">${t.service}</div>
          </div>
        </div>
      </article>
    `).join('');
  });

  document.getElementById('testimonialPrev').addEventListener('click', () => {
    track.scrollBy({ left: -420, behavior: 'smooth' });
  });
  document.getElementById('testimonialNext').addEventListener('click', () => {
    track.scrollBy({ left: 420, behavior: 'smooth' });
  });

  /* ---------------- ANIMATED STAT COUNTERS ---------------- */
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function animateCount(el) {
    const target = parseFloat(el.dataset.countTo);
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    if (Number.isNaN(target)) return;

    if (reduceMotionQuery.matches) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.stat-band-item .num[data-count-to]').forEach((el) => countObserver.observe(el));

  /* ---------------- NEWSLETTER SIGNUP ---------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterNote = document.getElementById('newsletterNote');
  const newsletterDefaultNote = newsletterNote.textContent;
  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');
    const submitBtn = newsletterForm.querySelector('button');
    submitBtn.disabled = true;
    newsletterNote.classList.remove('is-success');
    try {
      const result = await Api.subscribeNewsletter(emailInput.value.trim());
      newsletterNote.textContent = result.alreadySubscribed
        ? "You're already on the list — thank you!"
        : 'Thanks for subscribing!';
      newsletterNote.classList.add('is-success');
      emailInput.value = '';
    } catch (err) {
      newsletterNote.textContent = err.message || 'Something went wrong — please try again.';
    } finally {
      submitBtn.disabled = false;
      setTimeout(() => {
        newsletterNote.textContent = newsletterDefaultNote;
        newsletterNote.classList.remove('is-success');
      }, 6000);
    }
  });
})();