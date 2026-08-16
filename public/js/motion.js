/**
 * motion.js — the "alive" layer on top of the plain, functional site.
 *
 * Hard rule this file follows: nothing here is load-bearing. main.js,
 * booking.js, and api.js work completely independently of this file.
 * If GSAP/Lenis fail to load from the CDN, or prefers-reduced-motion is
 * set, or this whole file 404s, the site still renders and functions —
 * it just won't have the extra motion. Every block below checks its own
 * dependency before touching the DOM.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const hasSplitText = hasGSAP && typeof window.SplitText !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';

  if (hasGSAP && hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && hasSplitText) gsap.registerPlugin(SplitText);

  /* ================================================================
     PRELOADER
     A safety <script> inline in the HTML (not this file) already
     guarantees removal even if this whole file fails to load — see
     the inline fallback next to the preloader markup in index.html.
  ================================================================ */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    if (reduceMotion) {
      preloader.remove();
    } else {
      const finish = () => {
        preloader.classList.add('is-loaded');
        setTimeout(() => preloader.classList.add('is-hidden'), 500);
        setTimeout(() => preloader.remove(), 1300);
      };
      if (document.readyState === 'complete') {
        setTimeout(finish, 400);
      } else {
        window.addEventListener('load', () => setTimeout(finish, 300));
      }
    }
  }

  /* ================================================================
     LENIS — smooth inertial scroll. Wraps native scroll (Lenis's own
     docs: position:sticky, anchor links, and a11y keep working), so
     nav's existing #anchor links need no changes.
  ================================================================ */
  if (hasLenis && !reduceMotion) {
    try {
      const lenis = new Lenis({ duration: 1.1, wheelMultiplier: 1 });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      if (hasScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      }
    } catch (err) {
      /* Lenis failed to init — native scroll still works, nothing lost. */
    }
  }

  /* ================================================================
     HERO — cursor-reactive gold spotlight + video background wiring
  ================================================================ */
  const hero = document.querySelector('.hero');
  if (hero) {
    if (hasFinePointer && !reduceMotion) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', px + '%');
        hero.style.setProperty('--my', py + '%');
      });
    }

    // Video background: only activates if assets/hero-reel.mp4 actually
    // exists. Until then the poster <img> (with its Ken Burns animation
    // from style.css) is what visitors see — this just wires the plug
    // in so dropping a real file in later needs zero code changes.
    const heroMedia = document.querySelector('.hero-media');
    const heroVideo = document.getElementById('heroVideo');
    if (heroMedia && heroVideo) {
      heroVideo.addEventListener('canplay', () => heroVideo.classList.add('is-ready'));
      heroVideo.addEventListener('error', () => heroVideo.remove());
      // If it hasn't fired canplay/error shortly (e.g. no <source> resolves),
      // just remove it rather than leaving a dead element in the DOM.
      setTimeout(() => {
        if (heroVideo.isConnected && heroVideo.readyState === 0) heroVideo.remove();
      }, 2500);
    }
  }

  /* ================================================================
     PHILOSOPHY — pinned scroll sequence (desktop only). Default CSS
     already renders this as a normal readable stack of paragraphs;
     the .js-pinned class is only added here, after GSAP + ScrollTrigger
     are confirmed present, so a failed CDN load just leaves the plain,
     fully-readable version in place.
  ================================================================ */
  if (hasGSAP && hasScrollTrigger && !reduceMotion && window.innerWidth > 860) {
    const philo = document.getElementById('philosophySection');
    if (philo) {
      philo.classList.add('js-pinned');
      const phrases = philo.querySelectorAll('.philo-phrase');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: philo,
          start: 'top top',
          end: '+=220%',
          scrub: 0.6,
          pin: true,
        },
      });

      phrases.forEach((phrase, i) => {
        tl.to(phrase, { opacity: 1, duration: 0.6 }, i * 0.9)
          .to(phrase, { opacity: 1, duration: 0.5 }, i * 0.9 + 0.6)
          .to(phrase, { opacity: 0, duration: 0.5 }, i * 0.9 + 1.1);
      });
      // keep the final phrase visible through the end of the pin
      tl.to(phrases[phrases.length - 1], { opacity: 1 }, tl.duration() - 0.5);
    }
  }

  /* ================================================================
     KINETIC HEADINGS — split + stagger reveal, GSAP + SplitText only
  ================================================================ */
  if (hasGSAP && hasSplitText && !reduceMotion) {
    // Hero name: reveal once, on load, no scroll trigger needed (above the fold)
    const heroName = document.querySelector('.hero-name');
    if (heroName) {
      const split = new SplitText(heroName, { type: 'chars', charsClass: 'gs-char' });
      gsap.set(split.chars, { yPercent: 120, opacity: 0 });
      gsap.to(split.chars, {
        yPercent: 0, opacity: 1,
        duration: 0.9, ease: 'power4.out', stagger: 0.03, delay: 0.5,
      });
    }

    // Every other section heading: split + reveal when scrolled into view
    if (hasScrollTrigger) {
      document.querySelectorAll('.section-heading').forEach((el) => {
        const split = new SplitText(el, { type: 'words', wordsClass: 'gs-word' });
        gsap.set(split.words, { yPercent: 100, opacity: 0 });
        gsap.to(split.words, {
          yPercent: 0, opacity: 1,
          duration: 0.8, ease: 'power3.out', stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });
    }
  }

  /* ================================================================
     MAGNETIC BUTTONS — primary CTAs pull gently toward the cursor
  ================================================================ */
  if (hasGSAP && hasFinePointer && !reduceMotion) {
    document.querySelectorAll('.btn-primary, .hero-ctas .btn').forEach((btn) => {
      const moveX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const moveY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        moveX(relX * 0.35);
        moveY(relY * 0.35);
      });
      btn.addEventListener('mouseleave', () => { moveX(0); moveY(0); });
    });
  }

  /* ================================================================
     PORTFOLIO TILT — re-binds automatically whenever main.js
     re-renders #portfolioGrid (category filter clicks), via
     MutationObserver, so it never goes stale.
  ================================================================ */
  if (hasGSAP && hasFinePointer && !reduceMotion) {
    const grid = document.getElementById('portfolioGrid');
    if (grid) {
      function bindTilt(item) {
        if (item.dataset.tiltBound) return;
        item.dataset.tiltBound = 'true';
        const rotateX = gsap.quickTo(item, 'rotateX', { duration: 0.5, ease: 'power3.out' });
        const rotateY = gsap.quickTo(item, 'rotateY', { duration: 0.5, ease: 'power3.out' });
        const scale = gsap.quickTo(item, 'scale', { duration: 0.5, ease: 'power3.out' });
        item.addEventListener('mousemove', (e) => {
          const rect = item.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          rotateY(px * 14);
          rotateX(py * -14);
          scale(1.03);
        });
        item.addEventListener('mouseleave', () => {
          rotateX(0); rotateY(0); scale(1);
        });
      }

      grid.querySelectorAll('.portfolio-item').forEach(bindTilt);
      new MutationObserver(() => {
        grid.querySelectorAll('.portfolio-item').forEach(bindTilt);
      }).observe(grid, { childList: true });
    }
  }
})();