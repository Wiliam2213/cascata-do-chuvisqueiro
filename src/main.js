import 'leaflet/dist/leaflet.css';
import './styles.css';

import {
  initHeroAndVideo,
  jumpToAct,
  getHeroState,
  setFallbackPreview,
} from './modules/heroVideo.js';
import { initMapSection } from './modules/mapSection.js';
import { initDynamicAnimations } from './modules/animations.js';
import { initCheckout } from './modules/checkout.js';

function setupNavbarAndModals() {
  const nav = document.getElementById('site-nav');
  const navToggle = document.getElementById('nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');
  const voucherModal = document.getElementById('voucher-modal');

  const closeMobileDrawer = () => {
    if (!mobileDrawer || !navToggle) return;
    mobileDrawer.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && mobileDrawer) {
    navToggle.addEventListener('click', () => {
      const isOpen = !mobileDrawer.hidden;
      mobileDrawer.hidden = isOpen;
      navToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Alterna contraste da navbar conforme a seção visível
  const lightSections = ['#galeria', '#guia', '#mapa'];
  const darkSections = ['#hero', '#transicao-video', '#bilheteria', '#contato'];

  const setNavTheme = (theme) => {
    nav.classList.toggle('nav-light', theme === 'light');
    nav.classList.toggle('nav-dark', theme !== 'light');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        if (lightSections.includes(id)) setNavTheme('light');
        else if (darkSections.includes(id)) setNavTheme('dark');
      });
    },
    { rootMargin: '-8% 0px -82% 0px', threshold: 0 }
  );

  [...lightSections, ...darkSections].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) observer.observe(el);
  });

  // Lightbox
  document.querySelectorAll('.gallery-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      lightboxImg.src = btn.getAttribute('data-lightbox-src');
      lightboxCaption.textContent = btn.getAttribute('data-lightbox-caption') || '';
      lightboxModal.classList.remove('hidden');
    });
  });

  closeLightboxBtn?.addEventListener('click', () => lightboxModal.classList.add('hidden'));
  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) lightboxModal.classList.add('hidden');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      lightboxModal?.classList.add('hidden');
      voucherModal?.classList.add('hidden');
      closeMobileDrawer();
    }
  });

  return { closeMobileDrawer };
}

const { closeMobileDrawer } = setupNavbarAndModals();

initHeroAndVideo({ closeMobileDrawer });
const mapApi = initMapSection();
initDynamicAnimations({
  focusWaypoint: mapApi ? mapApi.focusWaypoint : undefined,
});
const checkoutApi = initCheckout({ closeMobileDrawer });

window.__chuvisqueiroDebug = {
  getState: () => ({
    ...getHeroState(),
    total: checkoutApi.getTotal(),
    activeVoucher: checkoutApi.getActiveVoucher(),
    map: mapApi ? mapApi.getMapInfo() : null,
  }),
  setFallbackPreview,
  jumpToAct,
  flyToWaypoint: (idx) => mapApi?.focusWaypoint(idx),
};
