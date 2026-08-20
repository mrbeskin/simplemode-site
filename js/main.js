(() => {
  const root = document.documentElement;
  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');
  const media = document.getElementById('hero-media');
  const video = document.getElementById('hero-video');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ----- hero video playback: only while it can be seen -----
  let heroInView = true;
  const syncPlayback = () => {
    if (!video) return;
    if (reduceMotion.matches || !heroInView || document.visibilityState === 'hidden') video.pause();
    else video.play().catch(() => {});
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  if (hero) {
    new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 }).observe(hero);
  }
  syncPlayback();

  // ----- theme (light/dark) + city (chicago/seattle) switches -----
  // The footage follows both: light pairs with day, dark with night.
  const themeToggle = document.getElementById('theme-toggle');
  const cityButtons = document.querySelectorAll('.seg-opt');
  const metaTheme = document.getElementById('meta-theme');

  const variant = () =>
    `${root.getAttribute('data-city') || 'seattle'}-${root.getAttribute('data-theme') === 'dark' ? 'night' : 'day'}`;
  let currentVariant = variant();
  let unfadeTimer = null;

  const applyMedia = () => {
    const next = variant();
    if (!video || next === currentVariant) return;
    currentVariant = next;
    media.classList.add('swapping');
    const go = () => {
      video.poster = `assets/hero-${next}-poster.jpg`;
      video.src = `assets/hero-${next}.mp4`;
      video.load();
      video.addEventListener('canplay', () => {
        media.classList.remove('swapping');
        clearTimeout(unfadeTimer);
        syncPlayback();
      }, { once: true });
    };
    if (reduceMotion.matches) go();
    else setTimeout(go, 300);
    // never leave the hero faded if loading stalls
    clearTimeout(unfadeTimer);
    unfadeTimer = setTimeout(() => media.classList.remove('swapping'), 4000);
  };

  const syncControls = () => {
    const theme = root.getAttribute('data-theme');
    const city = root.getAttribute('data-city');
    if (themeToggle) themeToggle.setAttribute('aria-checked', String(theme === 'dark'));
    cityButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.cityOpt === city));
    });
    if (metaTheme) metaTheme.content = theme === 'dark' ? '#232321' : '#EDEDEA';
  };

  const store = (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('sm-theme', next);
      syncControls();
      applyMedia();
    });
  }
  cityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const city = btn.dataset.cityOpt;
      if (city === root.getAttribute('data-city')) return;
      root.setAttribute('data-city', city);
      store('sm-city', city);
      syncControls();
      applyMedia();
    });
  });
  syncControls();

  // ----- nav gains its backdrop once past the hero -----
  const setNav = () => {
    const threshold = (hero ? hero.offsetHeight : 600) - 72;
    nav.classList.toggle('scrolled', window.scrollY > threshold);
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { setNav(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  addEventListener('resize', setNav);
  setNav();

  // ----- scroll reveals -----
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // ----- contact form: composes the message and hands it to the visitor's
  // email app, addressed to CONTACT_EMAIL. No backend required. To switch to
  // a hosted endpoint later, replace the handler body with a fetch() POST.
  const CONTACT_EMAIL = 'hello@simplemode.co';
  const form = document.getElementById('contact-form');
  const note = document.getElementById('form-note');
  const hint = document.getElementById('form-hint');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      const subject = 'Project inquiry — ' + name;
      const body = 'Hi simplemode,\n\n' + message + '\n\n— ' + name + '\n' + email;
      const href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      form.dataset.lastMailto = href;
      window.location.href = href;
      if (hint) hint.hidden = true;
      note.hidden = false;
      // No form.reset() here: if no mail app opens, the visitor's message
      // is still on screen to copy next to the fallback address.
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
