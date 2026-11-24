import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initDynamicAnimations({ focusWaypoint } = {}) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  initTextAnimations(prefersReduced);
  initButtonAnimations(prefersReduced, finePointer);
  initCardTransformations(prefersReduced, finePointer, focusWaypoint);
}

/* --------------------------------------------------------------------------
 * 1. ANIMAÇÕES DE TEXTO (REVEAL POR PALAVRA, MARQUEE CINÉTICO, FOOTER WORDMARK)
 * -------------------------------------------------------------------------- */
function initTextAnimations(prefersReduced) {
  const headings = Array.from(document.querySelectorAll('.reveal-words'));

  headings.forEach((heading) => {
    const raw = heading.textContent.trim();
    if (!raw) return;
    heading.setAttribute('aria-label', raw);
    heading.textContent = '';

    const words = raw.split(/\s+/);
    const inners = [];
    words.forEach((word, idx) => {
      const mask = document.createElement('span');
      mask.className = 'word-mask';
      mask.setAttribute('aria-hidden', 'true');

      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = word;
      mask.appendChild(inner);
      heading.appendChild(mask);

      if (idx < words.length - 1) {
        heading.appendChild(document.createTextNode(' '));
      }
      inners.push(inner);
    });

    if (prefersReduced) return;

    gsap.fromTo(
      inners,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.72,
        stagger: 0.045,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  // Footer monumental CHUVISQUEIRO letra a letra
  const wordmark = document.getElementById('footer-wordmark');
  if (wordmark && !prefersReduced) {
    const chars = wordmark.textContent.trim().split('');
    wordmark.textContent = '';
    const charInners = chars.map((ch) => {
      const mask = document.createElement('span');
      mask.className = 'char-mask';
      const inner = document.createElement('span');
      inner.className = 'char-inner';
      inner.textContent = ch;
      mask.appendChild(inner);
      wordmark.appendChild(mask);
      return inner;
    });

    gsap.fromTo(
      charInners,
      { yPercent: 100, opacity: 0.25 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.035,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wordmark,
          start: 'top 92%',
          once: true,
        },
      }
    );
  }
}

/* --------------------------------------------------------------------------
 * 2. ANIMAÇÕES DE BOTÕES (MAGNETIC CURSOR + RIPPLE TÁTIL)
 * -------------------------------------------------------------------------- */
function initButtonAnimations(prefersReduced, finePointer) {
  // Ripple radial tátil ao clicar em qualquer .btn
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (prefersReduced) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;
      const x = e.clientX ? e.clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
      const y = e.clientY ? e.clientY - rect.top - size / 2 : rect.height / 2 - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Atração magnética suave em desktop
  if (prefersReduced || !finePointer) return;

  document.querySelectorAll('.magnetic-btn').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
      xTo(Math.max(-10, Math.min(10, dx)));
      yTo(Math.max(-8, Math.min(8, dy)));
    });

    btn.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* --------------------------------------------------------------------------
 * 3. CARDS COM TRANSFORMAÇÕES DINÂMICAS (TILT 3D, GLOW, DRAWER EXPANSÍVEL)
 * -------------------------------------------------------------------------- */
function initCardTransformations(prefersReduced, finePointer, focusWaypoint) {
  // Brilho radial e micro-inclinação 3D no ponteiro
  document.querySelectorAll('[data-tilt-card]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${mx}px`);
      card.style.setProperty('--mouse-y', `${my}px`);

      if (prefersReduced || !finePointer) return;

      const nx = mx / rect.width - 0.5;
      const ny = my / rect.height - 0.5;
      const rotY = nx * 7;
      const rotX = -ny * 7;

      gsap.to(card, {
        rotateX: rotX,
        rotateY: rotY,
        transformPerspective: 950,
        duration: 0.35,
        ease: 'power2.out',
      });
    });

    card.addEventListener('mouseleave', () => {
      if (prefersReduced || !finePointer) return;
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.55)',
      });
    });
  });

  // Gaveta expansível interativa nos 4 cards do Ato 3
  document.querySelectorAll('.exp-toggle-btn').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = toggle.closest('.exp-card');
      const drawer = card?.querySelector('.exp-detail-drawer');
      if (!card || !drawer) return;

      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      toggle.textContent = isExpanded ? 'Ver detalhes +' : 'Fechar detalhes −';
      card.classList.toggle('is-expanded', !isExpanded);

      if (isExpanded) {
        drawer.hidden = true;
      } else {
        drawer.hidden = false;
        if (!prefersReduced) {
          gsap.fromTo(
            drawer,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
          );
        }
      }
    });
  });

  // Links dentro da gaveta do Ato 3 que já focam o ponto no Mapa
  document.querySelectorAll('[data-focus-waypoint]').forEach((link) => {
    link.addEventListener('click', () => {
      const idx = Number(link.getAttribute('data-focus-waypoint'));
      if (focusWaypoint && !Number.isNaN(idx)) {
        setTimeout(() => focusWaypoint(idx), 450);
      }
    });
  });

  // Entrada dinâmica nos cards da Galeria e Bento Grid
  if (!prefersReduced) {
    gsap.from('.gallery-item', {
      y: 36,
      opacity: 0,
      scale: 0.97,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.gallery-mosaic',
        start: 'top 84%',
        once: true,
      },
    });

    gsap.from('.bento-card', {
      y: 34,
      opacity: 0,
      scale: 0.98,
      duration: 0.65,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.bento-grid',
        start: 'top 85%',
        once: true,
      },
    });
  }
}
