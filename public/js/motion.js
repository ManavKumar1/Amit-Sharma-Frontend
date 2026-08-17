/**
 * motion.js — the "alive" layer on top of the plain, functional site.
 *
 * Hard rule this file follows: nothing here is load-bearing. main.js,
 * booking.js, and api.js work completely independently of this file.
 * If GSAP/Lenis fail to load from the CDN, or prefers-reduced-motion is
 * set, or this whole file 404s, the site still renders and functions —
 * the hero, headings, and statement band are all fully opaque/readable
 * in plain CSS already; this file only adds movement on top of that.
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
     HERO — cursor-reactive violet spotlight behind the photo collage.
     Everything else in the hero (kicker, headline, script accent,
     CTAs) is a pure CSS on-load animation — see style.css — so it
     always plays even if every script on this page fails.
  ================================================================ */
  const hero = document.querySelector('.hero');
  if (hero && hasFinePointer && !reduceMotion) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--mx', px + '%');
      hero.style.setProperty('--my', py + '%');
    });
  }

  /* ================================================================
     ABOUT — two-column statement scrubs word-by-word as the section
     scrolls through view (not pinned; it just scrolls normally).
     Default CSS already renders full-opacity, fully readable text,
     so this only layers a dim -> bright wipe on top of content that
     was never actually hidden.
  ================================================================ */
  if (hasGSAP && hasScrollTrigger && hasSplitText && !reduceMotion) {
    document.querySelectorAll('.about-col').forEach((col) => {
      const split = new SplitText(col, { type: 'words', wordsClass: 'gs-word' });
      gsap.set(split.words, { opacity: 0.16 });
      gsap.to(split.words, {
        opacity: 1,
        stagger: 0.04,
        ease: 'none',
        scrollTrigger: {
          trigger: col,
          start: 'top 85%',
          end: 'bottom 55%',
          scrub: 0.4,
        },
      });
    });
  }

  /* ================================================================
     STATEMENT BAND — pinned scroll-scrub kinetic line, desktop only
     ("Every appointment is a collaboration... flawless"). Default
     CSS already renders this fully opaque and readable; the dim
     starting state is only ever applied here, after GSAP +
     ScrollTrigger are confirmed present — a failed CDN load just
     leaves the plain, fully-readable version in place, unpinned.
  ================================================================ */
  if (hasGSAP && hasScrollTrigger && !reduceMotion && window.innerWidth > 860) {
    const statement = document.getElementById('statementSection');
    if (statement) {
      statement.classList.add('js-pinned');
      const lines = statement.querySelectorAll('.statement-line, .statement-accent');
      gsap.set(lines, { opacity: 0.14 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: statement,
          start: 'top top',
          end: '+=160%',
          scrub: 0.6,
          pin: true,
        },
      });

      lines.forEach((line, i) => {
        tl.to(line, { opacity: 1, duration: 0.6 }, i * 0.8);
      });
      tl.to({}, { duration: 0.4 }); // brief hold at full brightness before the pin releases
    }
  }

  /* ================================================================
     KINETIC HEADINGS — every section heading splits into words and
     reveals as it scrolls into view. GSAP + SplitText + ScrollTrigger
     only; plain CSS already shows headings normally otherwise.
  ================================================================ */
  if (hasGSAP && hasSplitText && hasScrollTrigger && !reduceMotion) {
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