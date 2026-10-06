/* A Beautiful Beginning — framework-free, works directly from index.html. */
(() => {
  'use strict';

  // Ragama is in Sri Lanka (UTC+05:30), regardless of the visitor's timezone.
  const WEDDING_START = new Date('2026-11-05T09:00:00+05:30').getTime();
  const WEDDING_DAY_END = new Date('2026-11-06T00:00:00+05:30').getTime();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const motionButton = document.querySelector('.motion-toggle');
  let storedMotion = null;
  try { storedMotion = localStorage.getItem('invitation-motion'); } catch { /* Storage is optional. */ }
  let motionPaused = reducedMotion.matches || storedMotion === 'paused';

  // Mobile navigation follows normal anchor behavior and stays keyboard accessible.
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  function closeMenu(returnFocus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNav.classList.remove('is-open');
    mobileNav.inert = true;
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.inert = !open;
    mobileNav.classList.toggle('is-open', open);
  });
  mobileNav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    if (link.hash) {
      const destination = document.querySelector(link.hash);
      if (destination) {
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
      }
    } else menuButton.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 651px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  // No per-second live announcements: the date is also available as static text.
  const units = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));
  const countdownNote = document.getElementById('countdown-note');
  let countdownInterval;
  function updateCountdown() {
    const now = Date.now();
    const secondsLeft = Math.max(0, Math.floor((WEDDING_START - now) / 1000));
    const values = [Math.floor(secondsLeft / 86400), Math.floor(secondsLeft / 3600) % 24, Math.floor(secondsLeft / 60) % 60, secondsLeft % 60];
    values.forEach((value, index) => {
      const text = String(value).padStart(2, '0');
      if (units[index].textContent !== text) units[index].textContent = text;
    });
    countdownNote.textContent = now >= WEDDING_DAY_END
      ? 'A beautiful day. Memories to cherish for a lifetime.'
      : now >= WEDDING_START
        ? 'The day is here. Let the beautiful memories begin.'
        : 'Until we gather, celebrate, and make memories.';
    // The timer stops on the following day, after updating the final message.
    if (now >= WEDDING_DAY_END && countdownInterval) clearInterval(countdownInterval);
  }
  updateCountdown();
  if (Date.now() < WEDDING_DAY_END) countdownInterval = setInterval(updateCountdown, 1000);

  // Content is only hidden when a functioning observer can reveal it.
  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      if (!motionPaused) element.classList.add('is-pending');
      reveals.observe(element);
    });
  }

  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.desktop-nav a')];
  const sections = navLinks.map(link => document.querySelector(link.hash));
  let scrollQueued = false;
  function updateNavigation() {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
    const marker = header.offsetHeight + Math.min(window.innerHeight * 0.3, 230);
    let active = 0;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= marker) active = index; });
    navLinks.forEach((link, index) => {
      link.classList.toggle('is-active', index === active);
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  updateNavigation();

  // A real, local calendar attachment also works without JavaScript.
  const toast = document.querySelector('.toast');
  let toastTimeout;
  document.querySelectorAll('a[download]').forEach(link => {
    link.addEventListener('click', () => {
      clearTimeout(toastTimeout);
      toast.textContent = 'Open the downloaded calendar file to keep November 5 close.';
      toast.classList.add('is-visible');
      toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 5000);
    });
  });

  // Sparse golden dust, drawn at 30 fps; paused offscreen and in background tabs.
  const canvas = document.getElementById('gold-particles');
  const context = canvas.getContext('2d');
  const hero = document.querySelector('.hero');
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = 0;
  let lastFrame = 0;
  let heroVisible = true;

  function sizeParticles() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 650 ? 18 : 37;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      radius: 0.5 + Math.random() * 1.4, speed: 0.12 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2, opacity: 0.13 + Math.random() * 0.34
    }));
  }
  function drawParticles(timestamp) {
    if (motionPaused || document.hidden || !heroVisible || !context) { animationFrame = 0; return; }
    animationFrame = requestAnimationFrame(drawParticles);
    if (timestamp - lastFrame < 32) return;
    const elapsed = Math.min((timestamp - lastFrame) / 33.3, 2);
    lastFrame = timestamp;
    context.clearRect(0, 0, width, height);
    particles.forEach(particle => {
      particle.y -= particle.speed * elapsed;
      particle.x += Math.sin(timestamp * 0.0002 + particle.phase) * 0.11 * elapsed;
      if (particle.y < -6) { particle.y = height + 6; particle.x = Math.random() * width; }
      const alpha = particle.opacity * (0.55 + Math.sin(timestamp * 0.0008 + particle.phase) * 0.45);
      context.fillStyle = `rgba(168, 128, 55, ${alpha})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      if (particle.radius > 1.5) {
        context.strokeStyle = `rgba(190, 149, 77, ${alpha * 0.7})`;
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(particle.x - 4, particle.y); context.lineTo(particle.x + 4, particle.y);
        context.moveTo(particle.x, particle.y - 4); context.lineTo(particle.x, particle.y + 4);
        context.stroke();
      }
    });
  }
  function syncAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (!motionPaused && !document.hidden && heroVisible && context) {
      lastFrame = performance.now();
      animationFrame = requestAnimationFrame(drawParticles);
    } else if (context && motionPaused) context.clearRect(0, 0, width, height);
  }
  function applyMotionPreference() {
    root.classList.toggle('motion-paused', motionPaused);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    const label = motionPaused ? 'Resume decorative animations' : 'Pause decorative animations';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.querySelector('use').setAttribute('href', motionPaused ? '#icon-play' : '#icon-pause');
    if (motionPaused) document.querySelectorAll('.reveal.is-pending').forEach(element => element.classList.remove('is-pending'));
    syncAnimation();
  }
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    motionPaused = !motionPaused;
    storedMotion = motionPaused ? 'paused' : 'playing';
    try { localStorage.setItem('invitation-motion', storedMotion); } catch { /* Private browsing/file URLs may disable storage. */ }
    applyMotionPreference();
  });
  reducedMotion.addEventListener('change', event => {
    motionPaused = event.matches || storedMotion === 'paused';
    applyMotionPreference();
  });
  if ('ResizeObserver' in window) new ResizeObserver(sizeParticles).observe(hero);
  else window.addEventListener('resize', sizeParticles, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    syncAnimation();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { updateCountdown(); syncAnimation(); });
  sizeParticles();
  applyMotionPreference();

  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.reveal.is-pending').forEach(element => element.classList.remove('is-pending'));
  });
})();
