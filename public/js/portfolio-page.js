(function () {
  'use strict';

  /* ---------------- NAV (same behavior as main.js, this page just doesn't
     carry the rest of main.js's homepage-only wiring) ---------------- */
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

  /* ---------------- ACCENT COLOR ---------------- */
  Api.getProfile().then((profile) => {
    document.documentElement.dataset.accent = profile.accentColor || 'violet';
  }).catch(() => {});

  /* ---------------- PORTFOLIO GRID (uncapped) + LIGHTBOX ---------------- */
  const grid = document.getElementById('portfolioGrid');
  const filterBar = document.getElementById('filterBar');
  let currentItems = [];
  let lightboxIndex = 0;

  function renderPortfolio(items) {
    // Featured pieces still lead here too, for a consistent sense of order
    // with the homepage teaser.
    const ordered = items.slice().sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    currentItems = ordered;

    if (!items.length) {
      grid.innerHTML = '<p class="portfolio-empty">No work in this category yet — check back soon.</p>';
      return;
    }
    grid.innerHTML = ordered.map((item, i) => `
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
  }

  function loadPortfolio(category) {
    grid.setAttribute('aria-busy', 'true');
    Api.getPortfolio({ category }).then((items) => {
      renderPortfolio(items);
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
    const url = new URL(window.location.href);
    url.searchParams.set('filter', btn.dataset.filter);
    window.history.replaceState({}, '', url);
  });

  // Deep-link support — "Show More" on the homepage links here with
  // ?filter=<category> so visitors land on the same filter they were on.
  const KNOWN_FILTERS = ['all', 'makeup', 'hair', 'haircut', 'bridal', 'editorial'];
  const params = new URLSearchParams(window.location.search);
  const requestedFilter = params.get('filter');
  const initialFilter = KNOWN_FILTERS.includes(requestedFilter) ? requestedFilter : 'all';
  const initialBtn = filterBar.querySelector(`.filter-btn[data-filter="${initialFilter}"]`);
  if (initialBtn) {
    filterBar.querySelectorAll('.filter-btn').forEach((b) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', 'false');
    });
    initialBtn.classList.add('is-active');
    initialBtn.setAttribute('aria-selected', 'true');
  }
  loadPortfolio(initialFilter);

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
})();