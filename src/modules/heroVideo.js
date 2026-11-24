import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;

const heroState = {
  scrollProgress: 0,
  currentAct: 1,
  countersAnimated: false,
  videoReady: false,
  fallbackForced: false,
  transitionVideoReady: false,
  transitionProgress: 0,
};

export function scrollToElement(target, offset = 0) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  }
}

export function jumpToAct(actNumber) {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const heroRect = hero.getBoundingClientRect();
  const heroTop = heroRect.top + window.scrollY;
  const maxHeroScroll = Math.max(0, hero.offsetHeight - window.innerHeight);
  const ratios = { 1: 0, 2: 0.49, 3: 0.88 };
  const targetY = heroTop + maxHeroScroll * (ratios[actNumber] ?? 0);
  scrollToElement(targetY);
}

export function getHeroState() {
  const video = document.getElementById('scroll-video');
  const transVideo = document.getElementById('transition-video');
  return {
    scrollProgress: heroState.scrollProgress,
    currentAct: heroState.currentAct,
    videoReady: heroState.videoReady,
    videoCurrentTime: video ? video.currentTime : 0,
    videoDuration: video ? video.duration : 0,
    fallbackActive: !heroState.videoReady || heroState.fallbackForced,
    transitionVideoReady: heroState.transitionVideoReady,
    transitionCurrentTime: transVideo ? transVideo.currentTime : 0,
    transitionProgress: heroState.transitionProgress,
  };
}

export function setFallbackPreview(enabled) {
  heroState.fallbackForced = Boolean(enabled);
  const heroSticky = document.getElementById('hero-sticky');
  if (heroSticky) {
    heroSticky.classList.toggle('is-fallback', !heroState.videoReady || heroState.fallbackForced);
  }
}

export function initHeroAndVideo({ closeMobileDrawer } = {}) {
  const hero = document.getElementById('hero');
  const heroSticky = document.getElementById('hero-sticky');
  const heroFrame = document.getElementById('hero-stage-frame');
  const video = document.getElementById('scroll-video');
  const fbCanvas = document.getElementById('hero-fallback-canvas');
  const topoCanvas = document.getElementById('hero-topo-overlay');
  const progressFill = document.getElementById('hero-progress-fill');
  const progressSteps = Array.from(document.querySelectorAll('.progress-step'));
  const act1 = document.getElementById('act-1');
  const act2 = document.getElementById('act-2');
  const act3 = document.getElementById('act-3');

  lenisInstance = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenisInstance.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Ancoras suaves e botoes de salto entre Atos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const customAct = anchor.getAttribute('data-scroll-act');
      e.preventDefault();
      if (closeMobileDrawer) closeMobileDrawer();
      if (customAct) {
        jumpToAct(Number(customAct));
      } else {
        scrollToElement(href, -16);
      }
    });
  });

  document.querySelectorAll('[data-goto-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (closeMobileDrawer) closeMobileDrawer();
      jumpToAct(Number(btn.getAttribute('data-goto-act')));
    });
  });

  // Timeline dos 3 Atos (duração exata 1.0s para alinhar com progresso 0..1)
  const expCards = Array.from(document.querySelectorAll('.exp-card'));
  gsap.set(act1, { opacity: 1, y: 0, filter: 'blur(0px)' });
  gsap.set(act2, { opacity: 0, x: 64 });
  gsap.set(act3, { opacity: 0, y: 30 });
  gsap.set(expCards, { opacity: 0, y: 34 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => updateHeroProgress(self.progress),
    },
  });

  // Ato 1 (0% -> 33%)
  tl.to(act1, {
    opacity: 0,
    y: -64,
    filter: 'blur(8px)',
    duration: 0.12,
  }, 0.18);

  // Ato 2 (34% -> 66%)
  tl.to(act2, {
    opacity: 1,
    x: 0,
    duration: 0.08,
  }, 0.33);

  tl.to(act2, {
    opacity: 0,
    x: -56,
    duration: 0.08,
  }, 0.56);

  // Ato 3 (67% -> 100%)
  tl.to(act3, {
    opacity: 1,
    y: 0,
    duration: 0.06,
  }, 0.66);

  tl.to(expCards, {
    opacity: 1,
    y: 0,
    stagger: 0.016,
    duration: 0.06,
  }, 0.67);

  // Transição dinâmica suave na saída final do Hero (90% -> 100%)
  if (heroFrame) {
    tl.to(heroFrame, {
      borderRadius: '32px',
      scale: 0.96,
      duration: 0.10,
    }, 0.90);
  }

  tl.set({}, {}, 1.0);

  function updateHeroProgress(progress) {
    heroState.scrollProgress = Math.min(1, Math.max(0, progress));

    if (progressFill) {
      progressFill.style.height = `${14 + heroState.scrollProgress * 86}%`;
    }

    let nextAct = 1;
    if (heroState.scrollProgress >= 0.66) nextAct = 3;
    else if (heroState.scrollProgress >= 0.33) nextAct = 2;

    if (nextAct !== heroState.currentAct) {
      heroState.currentAct = nextAct;
      const acts = [act1, act2, act3];
      acts.forEach((el, idx) => {
        const active = idx + 1 === nextAct;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      progressSteps.forEach((step) => {
        const stepAct = Number(step.getAttribute('data-goto-act'));
        step.classList.toggle('is-active', stepAct === nextAct);
      });
    }

    if (nextAct === 2 && !heroState.countersAnimated) {
      animateCounters();
    }
  }

  function animateCounters() {
    heroState.countersAnimated = true;
    const counters = Array.from(document.querySelectorAll('.counter[data-target]'));
    counters.forEach((el) => {
      const target = Number(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const start = performance.now();
      const duration = 900;

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(eased * target)}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = `${target}${suffix}`;
      };

      requestAnimationFrame(tick);
    });
  }

  // Motor de vídeo scrubbing (Hero + Transição Dinâmica) + Canvas Fallback
  let blobPromotedHero = false;
  let blobPromotedTrans = false;

  const ensureSeekable = (vid, getFlag, setFlag) => {
    if (!vid || getFlag()) return;
    const seekEnd = vid.seekable && vid.seekable.length ? vid.seekable.end(0) : 0;
    if (seekEnd >= Math.max(0.5, vid.duration * 0.5)) return;
    setFlag(true);
    const rawSrc = vid.getAttribute('src');
    if (!rawSrc || rawSrc.startsWith('blob:')) return;
    fetch(rawSrc)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('blob fetch failed'))))
      .then((blob) => {
        vid.src = URL.createObjectURL(blob);
        vid.load();
      })
      .catch(() => {});
  };

  if (video) {
    const markReady = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        heroState.videoReady = true;
        video.pause();
        ensureSeekable(video, () => blobPromotedHero, (v) => { blobPromotedHero = v; });
        if (!heroState.fallbackForced) heroSticky.classList.remove('is-fallback');
      }
    };
    if (video.readyState >= 1) markReady();
    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('canplay', markReady);
    video.addEventListener('error', () => {
      heroState.videoReady = false;
      heroSticky.classList.add('is-fallback');
    });
    setTimeout(() => {
      if (!heroState.videoReady) heroSticky.classList.add('is-fallback');
    }, 4500);
  }

  // Portal de transição com vídeo dinâmico (#transicao-video)
  const transitionSection = document.getElementById('transicao-video');
  const transitionFrame = document.getElementById('video-portal-frame');
  const transitionVideo = document.getElementById('transition-video');

  if (transitionVideo) {
    const markTransReady = () => {
      if (Number.isFinite(transitionVideo.duration) && transitionVideo.duration > 0) {
        heroState.transitionVideoReady = true;
        transitionVideo.pause();
        ensureSeekable(transitionVideo, () => blobPromotedTrans, (v) => { blobPromotedTrans = v; });
      }
    };
    if (transitionVideo.readyState >= 1) markTransReady();
    transitionVideo.addEventListener('loadedmetadata', markTransReady);
    transitionVideo.addEventListener('canplay', markTransReady);
  }

  if (transitionSection && transitionFrame) {
    gsap.fromTo(
      transitionFrame,
      {
        clipPath: 'inset(10% 8% 10% 8% round 32px)',
        scale: 0.92,
      },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: transitionSection,
          start: 'top 80%',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            heroState.transitionProgress = self.progress;
          },
        },
      }
    );
  }

  // Canvas fallback + topografia
  const fbCtx = fbCanvas.getContext('2d');
  const topoCtx = topoCanvas.getContext('2d');

  const resizeCanvases = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = heroSticky.clientWidth || window.innerWidth;
    const h = heroSticky.clientHeight || window.innerHeight;
    [fbCanvas, topoCanvas].forEach((canvas) => {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    });
    fbCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    topoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resizeCanvases();
  window.addEventListener('resize', resizeCanvases, { passive: true });

  let timeAcc = 0;
  let lastTs = performance.now();

  const renderLoop = (now) => {
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;
    timeAcc += dt;

    const w = heroSticky.clientWidth || window.innerWidth;
    const h = heroSticky.clientHeight || window.innerHeight;
    const p = heroState.scrollProgress;

    if (heroState.videoReady && !heroState.fallbackForced && video?.duration) {
      const seekEnd = video.seekable && video.seekable.length ? video.seekable.end(0) : 0;
      if (seekEnd > 0.2) {
        const target = p * Math.max(0.1, Math.min(video.duration - 0.06, seekEnd));
        const diff = target - video.currentTime;
        if (Math.abs(diff) > 0.015 && !video.seeking) {
          video.currentTime = Math.abs(diff) > 0.8 ? target : video.currentTime + diff * 0.35;
        }
      }
    }

    if (heroState.transitionVideoReady && transitionVideo?.duration) {
      const seekEnd = transitionVideo.seekable && transitionVideo.seekable.length
        ? transitionVideo.seekable.end(0)
        : 0;
      if (seekEnd > 0.2) {
        const targetT = heroState.transitionProgress * Math.max(0.1, Math.min(transitionVideo.duration - 0.06, seekEnd));
        const diffT = targetT - transitionVideo.currentTime;
        if (Math.abs(diffT) > 0.015 && !transitionVideo.seeking) {
          transitionVideo.currentTime = Math.abs(diffT) > 0.8
            ? targetT
            : transitionVideo.currentTime + diffT * 0.35;
        }
      }
    }

    if (!heroState.videoReady || heroState.fallbackForced) {
      drawEmeraldFallback(fbCtx, w, h, p, timeAcc);
    }

    drawTopographicOverlay(topoCtx, w, h, p, timeAcc);
    requestAnimationFrame(renderLoop);
  };

  requestAnimationFrame(renderLoop);
}

function drawEmeraldFallback(ctx, w, h, progress, t) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.4, h);
  grad.addColorStop(0, '#071710');
  grad.addColorStop(0.55, progress > 0.5 ? '#123A2A' : '#0B2118');
  grad.addColorStop(1, '#18543C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const glowX = w * (0.68 - progress * 0.14);
  const glowY = h * (0.34 + progress * 0.18);
  const radial = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, Math.max(w, h) * 0.55);
  radial.addColorStop(0, 'rgba(217, 114, 54, 0.34)');
  radial.addColorStop(0.45, 'rgba(30, 142, 99, 0.22)');
  radial.addColorStop(1, 'rgba(11, 33, 24, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);

  const bands = 14;
  for (let i = 0; i < bands; i++) {
    const ratio = i / bands;
    const baseY = h * (0.2 + ratio * 0.72);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 28) {
      const wave =
        Math.sin(x * 0.0042 + t * 0.55 + i * 0.45 + progress * 6.0) * (24 + progress * 22) +
        Math.cos(x * 0.0022 - t * 0.35 + i * 0.3) * 18;
      const y = baseY + wave;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = i % 4 === 0
      ? `rgba(217, 114, 54, ${0.14 + ratio * 0.14})`
      : `rgba(52, 195, 139, ${0.12 + ratio * 0.22})`;
    ctx.lineWidth = i % 3 === 0 ? 1.6 : 1;
    ctx.stroke();
  }
}

function drawTopographicOverlay(ctx, w, h, progress, t) {
  ctx.clearRect(0, 0, w, h);
  const intensity = progress < 0.22
    ? 0.08
    : progress < 0.65
      ? 0.08 + ((progress - 0.22) / 0.43) * 0.26
      : 0.34 - ((progress - 0.65) / 0.35) * 0.14;

  if (intensity <= 0.01) return;

  const lines = 7;
  for (let i = 0; i < lines; i++) {
    const baseY = h * (0.18 + (i / lines) * 0.7);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 40) {
      const y = baseY
        + Math.sin(x * 0.0038 + progress * 5.2 + i * 0.6 + t * 0.22) * 26
        + Math.cos(x * 0.0019 + i) * 14;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = i % 3 === 0
      ? `rgba(217, 114, 54, ${intensity * 0.72})`
      : `rgba(52, 195, 139, ${intensity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
