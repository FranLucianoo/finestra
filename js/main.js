/* ============================================
   FINESTRA VIAJES — JavaScript
   
   Video scroll: DIRECTO, sin intermediarios
   Usa scroll event nativo + requestAnimationFrame
   ============================================ */

(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 768;
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => [...document.querySelectorAll(sel)];

  const loader      = qs('#loader');
  const loaderFill  = qs('.loader__bar-fill');
  const video       = qs('#bg-video');
  const navbar      = qs('#navbar');
  const burger      = qs('#menu-toggle');
  const mobMenu     = qs('#mobile-menu');
  const progressBar = qs('.progress__bar');

  // ─── VIDEO SCROLL — Ultra directo ────────
  // Sin GSAP scrub, sin Lenis, sin LERP.
  // Scroll event → requestAnimationFrame → video.currentTime
  // Lo más directo posible.

  let videoDuration = 0;
  let videoReady = false;
  let ticking = false;

  // Para el hero fade (usa la zona de video-section)
  let videoSection = null;
  let videoSectionTop = 0;
  let videoSectionHeight = 0;

  function initVideo() {
    if (!video) return;
    videoSection = qs('#video-section');

    const onReady = () => {
      if (videoReady) return;
      videoDuration = video.duration;
      videoReady = true;
      video.pause();
      video.currentTime = 0;

      if (isMobile()) {
        video.loop = true;
        video.play().catch(() => {});
        return;
      }

      updateSectionBounds();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', updateSectionBounds, { passive: true });
    };

    video.addEventListener('loadedmetadata', onReady);
    if (video.readyState >= 1) onReady();
  }

  function updateSectionBounds() {
    if (!videoSection) return;
    const rect = videoSection.getBoundingClientRect();
    videoSectionTop = window.scrollY + rect.top;
    videoSectionHeight = videoSection.offsetHeight - window.innerHeight;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateVideoTime);
      ticking = true;
    }
  }

  function updateVideoTime() {
    ticking = false;
    if (!videoReady || !video) return;

    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // ── VIDEO: mapeado a TODA la página ──
    let pageProgress = scrollY / maxScroll;
    pageProgress = Math.max(0, Math.min(1, pageProgress));

    // Mapeo usa el 76% del video
    const usableEnd = videoDuration * 0.76;
    const targetTime = Math.min(pageProgress * usableEnd, usableEnd);

    if (video.fastSeek) {
      video.fastSeek(targetTime);
    } else {
      video.currentTime = targetTime;
    }

    // ── Progress bar ──
    if (progressBar) {
      progressBar.style.transform = `scaleX(${pageProgress})`;
    }

    // ── Navbar ──
    if (navbar) {
      navbar.classList.toggle('is-scrolled', scrollY > 80);
    }

    // ── Hero fade: usa la zona de video-section para el timing ──
    const scrollInSection = scrollY - videoSectionTop;
    let heroProgress = videoSectionHeight > 0 ? scrollInSection / videoSectionHeight : 0;
    heroProgress = Math.max(0, Math.min(1, heroProgress));

    const heroInner = qs('.hero__inner');
    const heroScroll = qs('.hero__scroll');

    if (heroInner) {
      if (heroProgress < 1) {
        const fadeProgress = Math.min(1, heroProgress / 0.5);
        heroInner.style.opacity = 1 - fadeProgress;
        heroInner.style.transform = `translateY(${-fadeProgress * 80}px) scale(${1 - fadeProgress * 0.05})`;
      } else {
        heroInner.style.opacity = 0;
      }
    }
    if (heroScroll) {
      heroScroll.style.opacity = Math.max(0, 1 - heroProgress * 5);
    }
  }

  // ─── LOADER ──────────────────────────────
  let loadProgress = 0;

  function runLoader() {
    const interval = setInterval(() => {
      loadProgress += Math.random() * 18;
      if (loadProgress > 92) loadProgress = 92;
      if (loaderFill) loaderFill.style.width = loadProgress + '%';
    }, 150);

    const done = () => {
      clearInterval(interval);
      if (loaderFill) loaderFill.style.width = '100%';
      setTimeout(() => {
        if (loader) loader.classList.add('is-hidden');
        setTimeout(animateHero, 300);
      }, 500);
    };

    if (video) {
      video.addEventListener('canplaythrough', done, { once: true });
      if (video.readyState >= 4) { done(); return; }
    }

    setTimeout(done, 4000);
  }

  // ─── HERO ANIMATION ─────────────────────
  function animateHero() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero__line', {
      opacity: 1, y: 0,
      duration: 1.2, stagger: 0.15,
    });

    qsa('.hero [data-anim="fade"]').forEach(el => {
      const delay = parseFloat(el.dataset.delay) || 0;
      tl.to(el, { opacity: 1, y: 0, duration: 0.9 }, delay);
    });
  }

  // ─── SCROLL ANIMATIONS (GSAP para el contenido) ─
  function initScrollAnimations() {
    if (typeof gsap === 'undefined') return;

    qsa('.content [data-anim]').forEach(el => {
      const type  = el.dataset.anim;
      const delay = parseFloat(el.dataset.delay) || 0;
      const to = { opacity: 1, duration: 0.9, delay, ease: 'power3.out' };

      switch (type) {
        case 'fade':         to.y = 0; break;
        case 'reveal-left':  to.x = 0; break;
        case 'reveal-right': to.x = 0; break;
        case 'card':         to.y = 0; to.scale = 1; break;
      }

      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: isMobile() ? 'top 92%' : 'top 82%',
          toggleActions: 'play reverse play reverse',
        },
        ...to,
      });
    });
  }

  // ─── COUNTERS ───────────────────────────
  function initCounters() {
    if (typeof gsap === 'undefined') return;

    qsa('[data-count]').forEach(counter => {
      const target = parseInt(counter.dataset.count, 10);
      gsap.to(counter, {
        scrollTrigger: {
          trigger: counter,
          start: 'top 88%',
          toggleActions: 'play reverse play reverse',
        },
        innerText: target,
        duration: 2.2,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate() {
          counter.textContent = Math.round(
            parseFloat(counter.textContent)
          ).toLocaleString('es-AR');
        },
      });
    });
  }

  // ─── MOBILE MENU ───────────────────────
  function initMobileMenu() {
    if (!burger || !mobMenu) return;
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      mobMenu.classList.toggle('is-active');
      document.body.style.overflow =
        mobMenu.classList.contains('is-active') ? 'hidden' : '';
    });
    qsa('.mob-menu a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('is-active');
        mobMenu.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── SMOOTH ANCHORS ────────────────────
  function initAnchors() {
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = qs(id);
        if (target) {
          e.preventDefault();
          // Offset de 80px para compensar el navbar fijo
          const y = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
  }

  // ─── INIT ──────────────────────────────
  function init() {
    if (typeof gsap !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    initVideo();
    runLoader();
    initMobileMenu();
    initAnchors();
    initScrollAnimations();
    initCounters();

    // Set initial progress bar state
    if (progressBar) {
      progressBar.style.transformOrigin = 'left center';
      progressBar.style.transform = 'scaleX(0)';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
