(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const closeMenu = () => { nav?.classList.remove('is-open'); menu?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
  const current = location.pathname.split('/').pop() || 'index.html';
  nav?.querySelectorAll('a').forEach(a => { if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page'); });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    reveals.forEach(el => { el.classList.add('pending-reveal'); observer.observe(el); });
  }
  // Pointer updates are capped to one paint; touch and reduced-motion users get a static card.
  document.querySelectorAll('[data-tilt]').forEach(card => {
    let frame = 0;
    const reset = () => { cancelAnimationFrame(frame); frame = 0; card.style.transform = ''; };
    card.addEventListener('pointermove', e => {
      if (!fine.matches || reduced.matches) return;
      const x = e.clientX, y = e.clientY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.transform = 'perspective(900px) rotateX(' + (-(y-r.top-r.height/2)/r.height*7) + 'deg) rotateY(' + ((x-r.left-r.width/2)/r.width*7) + 'deg) translateY(-4px)';
      });
    });
    card.addEventListener('pointerleave', reset);
    reduced.addEventListener('change', reset);
  });
  const scene = document.querySelector('.orbital-scene');
  if (scene) {
    let visible = true, paused = false;
    const update = () => scene.classList.toggle('motion-paused', paused || !visible || document.hidden || reduced.matches);
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'motion-control'; toggle.textContent = 'หยุดโมชัน'; toggle.setAttribute('aria-pressed', 'false');
    document.querySelector('.hero-bottom').append(toggle);
    toggle.addEventListener('click', () => {
      paused = !paused; toggle.textContent = paused ? 'เล่นโมชัน' : 'หยุดโมชัน';
      toggle.setAttribute('aria-pressed', String(paused)); update();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(scene);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', () => { toggle.hidden = reduced.matches; update(); });
    toggle.hidden = reduced.matches; update();
  }
})();
