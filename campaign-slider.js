let sliderCleanup = () => {};

export function stopCampaignSlider() {
  sliderCleanup();
  sliderCleanup = () => {};
}

export function mountCampaignSlider(scope = document) {
  stopCampaignSlider();
  const root = scope.querySelector('.campaign-slider');
  if (!root) return;

  const slides = [...root.querySelectorAll('.campaign-slide')];
  const dots = [...root.querySelectorAll('[data-slide-to]')];
  if (!slides.length || slides.length !== dots.length) return;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let index = 0;
  let timer = null;
  let autoplayStopped = reduceMotion;
  let hovered = false;
  let focused = false;
  let inView = true;
  let touchStart = null;

  const playbackBlocked = () => autoplayStopped || !inView || document.hidden || hovered || focused;

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      dots[position].setAttribute('aria-current', String(active));
    });
    root.dataset.slide = String(index + 1);
  }

  function updateTimer() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    if (!playbackBlocked()) {
      timer = window.setInterval(() => show(index + 1), 6500);
    }
  }

  function selectSlide(next) {
    autoplayStopped = true;
    show(next);
    updateTimer();
  }

  root.querySelector('[data-slide-prev]').addEventListener('click', () => selectSlide(index - 1));
  root.querySelector('[data-slide-next]').addEventListener('click', () => selectSlide(index + 1));
  dots.forEach((dot, position) => dot.addEventListener('click', () => selectSlide(position)));
  root.addEventListener('mouseenter', () => { hovered = true; updateTimer(); });
  root.addEventListener('mouseleave', () => { hovered = false; updateTimer(); });
  root.addEventListener('focusin', () => { focused = true; updateTimer(); });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) { focused = false; updateTimer(); }
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      selectSlide(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  root.addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }, { passive: true });
  root.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const touch = event.changedTouches[0];
    const dx = (touch?.clientX ?? touchStart.x) - touchStart.x;
    const dy = (touch?.clientY ?? touchStart.y) - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      selectSlide(index + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });

  const onVisibility = () => updateTimer();
  document.addEventListener('visibilitychange', onVisibility);
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      inView = entries[0]?.isIntersecting ?? true;
      updateTimer();
    }, { threshold: 0.15 });
    observer.observe(root);
  }

  let revealObserver = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const features = [...scope.querySelectorAll('[data-reveal]')];
    features.forEach(feature => feature.classList.add('will-reveal'));
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    features.forEach(feature => revealObserver.observe(feature));
  }

  show(0);
  updateTimer();
  sliderCleanup = () => {
    if (timer !== null) window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    observer?.disconnect();
    revealObserver?.disconnect();
  };
}
