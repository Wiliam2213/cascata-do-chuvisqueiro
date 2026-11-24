import gsap from 'gsap';

const PRICES = {
  adult: 17,
  child: 10,
  parking: 20,
  camping: 65,
};

const STORAGE_KEYS = {
  voucher: 'chuvisqueiro_voucher_v1',
  checklist: 'chuvisqueiro_checklist_v1',
};

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function initCheckout({ closeMobileDrawer } = {}) {
  const state = {
    quantities: {
      adult: 2,
      child: 0,
      parking: 1,
      camping: 0,
    },
    visitDate: '',
    payMethod: 'pix',
    cardMode: 'credit',
    pixSecondsLeft: 900,
    pixTimerId: null,
    pixPayload: '',
    activeVoucher: null,
  };

  const dom = {
    navVoucherBtn: document.getElementById('nav-voucher-btn'),
    drawerVoucherBtn: document.getElementById('drawer-voucher-btn'),
    savedVoucherBanner: document.getElementById('saved-voucher-banner'),
    savedVoucherSummary: document.getElementById('saved-voucher-summary'),
    openSavedVoucherBtn: document.getElementById('open-saved-voucher-btn'),

    visitDateInput: document.getElementById('visit-date'),
    formattedDateLabel: document.getElementById('formatted-date-label'),
    summaryDateShort: document.getElementById('summary-date-short'),
    quickDateBtns: Array.from(document.querySelectorAll('[data-quick-date]')),
    stepBtns: Array.from(document.querySelectorAll('.step-btn')),
    qtyOutputs: {
      adult: document.getElementById('qty-adult'),
      child: document.getElementById('qty-child'),
      parking: document.getElementById('qty-parking'),
      camping: document.getElementById('qty-camping'),
    },
    ticketsError: document.getElementById('tickets-error'),
    visitorName: document.getElementById('visitor-name'),
    visitorPhone: document.getElementById('visitor-phone'),
    visitorEmail: document.getElementById('visitor-email'),
    visitorError: document.getElementById('visitor-error'),
    summaryLines: document.getElementById('summary-lines'),
    summaryTotal: document.getElementById('summary-total'),
    totalMirrors: Array.from(document.querySelectorAll('.btn-total-mirror')),

    payTabs: Array.from(document.querySelectorAll('.pay-tab')),
    payPanels: {
      pix: document.getElementById('panel-pix'),
      card: document.getElementById('panel-card'),
      gate: document.getElementById('panel-gate'),
    },

    pixStage: document.getElementById('pix-stage'),
    pixGenerated: document.getElementById('pix-generated'),
    generatePixBtn: document.getElementById('generate-pix-btn'),
    pixQrCanvas: document.getElementById('pix-qr-canvas'),
    pixCountdown: document.getElementById('pix-countdown'),
    pixCodeInput: document.getElementById('pix-code-input'),
    copyPixBtn: document.getElementById('copy-pix-btn'),
    copyFeedback: document.getElementById('copy-feedback'),
    confirmPixBtn: document.getElementById('confirm-pix-btn'),
    resetPixBtn: document.getElementById('reset-pix-btn'),

    virtualCardInner: document.getElementById('virtual-card-inner'),
    vcModeLabel: document.getElementById('vc-mode-label'),
    vcBrandLabel: document.getElementById('vc-brand-label'),
    vcNumberPreview: document.getElementById('vc-number-preview'),
    vcHolderPreview: document.getElementById('vc-holder-preview'),
    vcExpiryPreview: document.getElementById('vc-expiry-preview'),
    vcCvvPreview: document.getElementById('vc-cvv-preview'),

    cardForm: document.getElementById('card-form'),
    cardModeBtns: Array.from(document.querySelectorAll('[data-card-mode]')),
    cardNumber: document.getElementById('card-number'),
    cardBrandPill: document.getElementById('card-brand-pill'),
    cardHolder: document.getElementById('card-holder'),
    cardExpiry: document.getElementById('card-expiry'),
    cardCvv: document.getElementById('card-cvv'),
    installmentsGroup: document.getElementById('installments-group'),
    cardInstallments: document.getElementById('card-installments'),
    cardError: document.getElementById('card-error'),
    cardSubmitBtn: document.getElementById('card-submit-btn'),

    confirmGateBtn: document.getElementById('confirm-gate-btn'),

    voucherModal: document.getElementById('voucher-modal'),
    closeVoucherBtn: document.getElementById('close-voucher-btn'),
    voucherStatusPill: document.getElementById('voucher-status-pill'),
    voucherCode: document.getElementById('voucher-code'),
    voucherVisitor: document.getElementById('voucher-visitor'),
    voucherDate: document.getElementById('voucher-date'),
    voucherMethod: document.getElementById('voucher-method'),
    voucherItems: document.getElementById('voucher-items'),
    voucherTotalLabel: document.getElementById('voucher-total-label'),
    voucherTotalValue: document.getElementById('voucher-total-value'),
    voucherQrCanvas: document.getElementById('voucher-qr-canvas'),
    downloadVoucherBtn: document.getElementById('download-voucher-btn'),
    printVoucherBtn: document.getElementById('print-voucher-btn'),
    shareWhatsappBtn: document.getElementById('share-whatsapp-btn'),
  };

  function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getUpcomingWeekday(targetDay) {
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    const diff = (targetDay - base.getDay() + 7) % 7 || 7;
    base.setDate(base.getDate() + diff);
    return base;
  }

  function formatDatePtBr(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d, 12, 0, 0);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(dt);
  }

  function formatShortDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function updateDateLabels() {
    const longStr = formatDatePtBr(state.visitDate);
    dom.formattedDateLabel.textContent = longStr.charAt(0).toUpperCase() + longStr.slice(1);
    dom.summaryDateShort.textContent = formatShortDate(state.visitDate);
  }

  function initDates() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    dom.visitDateInput.min = toIsoDate(today);
    state.visitDate = toIsoDate(tomorrow);
    dom.visitDateInput.value = state.visitDate;
    updateDateLabels();

    dom.visitDateInput.addEventListener('change', () => {
      state.visitDate = dom.visitDateInput.value || toIsoDate(tomorrow);
      dom.quickDateBtns.forEach((b) => b.classList.remove('is-selected'));
      updateDateLabels();
    });

    dom.quickDateBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-quick-date');
        let chosen = new Date();
        if (mode === 'tomorrow') chosen.setDate(chosen.getDate() + 1);
        else if (mode === 'saturday') chosen = getUpcomingWeekday(6);
        else if (mode === 'sunday') chosen = getUpcomingWeekday(0);

        state.visitDate = toIsoDate(chosen);
        dom.visitDateInput.value = state.visitDate;
        dom.quickDateBtns.forEach((b) => b.classList.toggle('is-selected', b === btn));
        updateDateLabels();
      });
    });
  }

  function computeTotal() {
    return (
      state.quantities.adult * PRICES.adult +
      state.quantities.child * PRICES.child +
      state.quantities.parking * PRICES.parking +
      state.quantities.camping * PRICES.camping
    );
  }

  function getOrderItems() {
    const items = [];
    if (state.quantities.adult > 0) {
      items.push({ label: `${state.quantities.adult}× Ingresso Adulto`, amount: state.quantities.adult * PRICES.adult });
    }
    if (state.quantities.child > 0) {
      items.push({ label: `${state.quantities.child}× Ingresso Infantil (6–10)`, amount: state.quantities.child * PRICES.child });
    }
    if (state.quantities.parking > 0) {
      items.push({ label: `${state.quantities.parking}× Estacionamento`, amount: state.quantities.parking * PRICES.parking });
    }
    if (state.quantities.camping > 0) {
      items.push({ label: `${state.quantities.camping}× Pernoite Camping`, amount: state.quantities.camping * PRICES.camping });
    }
    return items;
  }

  function updateInstallmentOptions(total) {
    const select = dom.cardInstallments;
    const prevValue = select.value || '1';
    select.innerHTML = '';
    const safeTotal = Math.max(0, total);
    [1, 2, 3].forEach((n) => {
      const opt = document.createElement('option');
      const val = safeTotal / n;
      opt.value = String(n);
      opt.textContent = n === 1
        ? `1x de ${brl.format(val)} (à vista sem juros)`
        : `${n}x de ${brl.format(val)} sem juros`;
      select.appendChild(opt);
    });
    select.value = ['1', '2', '3'].includes(prevValue) ? prevValue : '1';
  }

  function recalculateOrder(animateTotal = false) {
    Object.keys(dom.qtyOutputs).forEach((key) => {
      dom.qtyOutputs[key].textContent = String(state.quantities[key]);
    });

    const items = getOrderItems();
    const total = computeTotal();
    const formattedTotal = brl.format(total);

    dom.summaryLines.innerHTML = '';
    if (items.length === 0) {
      const li = document.createElement('li');
      li.innerHTML = '<span>Nenhum item selecionado</span><strong>R$ 0,00</strong>';
      dom.summaryLines.appendChild(li);
    } else {
      items.forEach((item) => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.label;
        const priceStrong = document.createElement('strong');
        priceStrong.textContent = brl.format(item.amount);
        li.append(nameSpan, priceStrong);
        dom.summaryLines.appendChild(li);
      });
    }

    dom.summaryTotal.textContent = formattedTotal;
    if (animateTotal) {
      gsap.fromTo(dom.summaryTotal, { scale: 1.09 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
    }

    document.querySelectorAll('.btn-total-mirror').forEach((el) => {
      el.textContent = formattedTotal;
    });

    updateInstallmentOptions(total);

    if (!dom.pixGenerated.classList.contains('hidden')) {
      resetPixPanel();
    }
  }

  function initSteppersAndInputs() {
    dom.stepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        const action = btn.getAttribute('data-action');
        const current = state.quantities[target] ?? 0;
        state.quantities[target] = action === 'inc' ? Math.min(30, current + 1) : Math.max(0, current - 1);
        dom.ticketsError.classList.add('hidden');
        recalculateOrder(true);
      });
    });

    dom.visitorPhone.addEventListener('input', () => {
      const digits = dom.visitorPhone.value.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 2) dom.visitorPhone.value = digits;
      else if (digits.length <= 7) dom.visitorPhone.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      else dom.visitorPhone.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      dom.visitorError.classList.add('hidden');
    });

    dom.visitorName.addEventListener('input', () => {
      dom.visitorError.classList.add('hidden');
    });
  }

  function validateBaseOrder() {
    dom.ticketsError.classList.add('hidden');
    dom.visitorError.classList.add('hidden');

    const hasVisitorTicket =
      state.quantities.adult > 0 || state.quantities.child > 0 || state.quantities.camping > 0;
    if (!hasVisitorTicket) {
      dom.ticketsError.classList.remove('hidden');
      dom.ticketsError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    const name = dom.visitorName.value.trim();
    const phoneDigits = dom.visitorPhone.value.replace(/\D/g, '');
    if (name.length < 3) {
      dom.visitorError.textContent = 'Informe seu nome completo para constar no voucher de entrada.';
      dom.visitorError.classList.remove('hidden');
      dom.visitorName.focus();
      return false;
    }
    if (phoneDigits.length < 10) {
      dom.visitorError.textContent = 'Informe um WhatsApp válido com DDD (ex.: 51 99999-9999).';
      dom.visitorError.classList.remove('hidden');
      dom.visitorPhone.focus();
      return false;
    }
    return true;
  }

  function detectCardBrand(digits) {
    if (digits.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(digits)) return 'Elo';
    if (/^3[47]/.test(digits)) return 'Amex';
    return 'Cartão';
  }

  function syncVirtualCard() {
    const rawNum = dom.cardNumber.value.replace(/\D/g, '');
    const grouped = rawNum.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
    dom.vcNumberPreview.textContent = grouped;
    const brand = detectCardBrand(rawNum);
    dom.cardBrandPill.textContent = brand;
    dom.vcBrandLabel.textContent = brand.toUpperCase();

    const holder = dom.cardHolder.value.trim().toUpperCase();
    dom.vcHolderPreview.textContent = holder || 'SEU NOME AQUI';

    dom.vcExpiryPreview.textContent = dom.cardExpiry.value.trim() || 'MM/AA';
    dom.vcCvvPreview.textContent = dom.cardCvv.value.trim() || '•••';
    dom.vcModeLabel.textContent = state.cardMode === 'debit' ? 'DÉBITO' : 'CRÉDITO';
  }

  function buildPixPayload(amount, refCode) {
    const valueStr = amount.toFixed(2);
    const body =
      '000201' +
      '26580014br.gov.bcb.pix0136chuvisqueiro-riozinho@paranhana.org' +
      '52040000' +
      '5303986' +
      `54${String(valueStr.length).padStart(2, '0')}${valueStr}` +
      '5802BR' +
      '5924CASCATA DO CHUVISQUEIRO' +
      '6008RIOZINHO' +
      `62120508${refCode}`;
    const crc = ((refCode.charCodeAt(4) * 97 + Math.round(amount * 13)) % 9999)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
    return `${body}6304${crc}`;
  }

  function updateCountdownDisplay() {
    const min = String(Math.floor(state.pixSecondsLeft / 60)).padStart(2, '0');
    const sec = String(state.pixSecondsLeft % 60).padStart(2, '0');
    dom.pixCountdown.textContent = `${min}:${sec}`;
  }

  function resetPixPanel() {
    if (state.pixTimerId) clearInterval(state.pixTimerId);
    dom.pixGenerated.classList.add('hidden');
    dom.pixStage.classList.remove('hidden');
    dom.copyFeedback.textContent = '';
  }

  function generatePixExperience() {
    const total = computeTotal();
    const ref = `CHV${String(Math.floor(10000 + Math.random() * 89999))}`;
    state.pixPayload = buildPixPayload(total, ref);
    dom.pixCodeInput.value = state.pixPayload;
    dom.copyFeedback.textContent = '';

    drawQRCode(dom.pixQrCanvas, state.pixPayload);
    dom.pixStage.classList.add('hidden');
    dom.pixGenerated.classList.remove('hidden');

    if (state.pixTimerId) clearInterval(state.pixTimerId);
    state.pixSecondsLeft = 900;
    updateCountdownDisplay();
    state.pixTimerId = setInterval(() => {
      state.pixSecondsLeft = Math.max(0, state.pixSecondsLeft - 1);
      updateCountdownDisplay();
      if (state.pixSecondsLeft === 0) clearInterval(state.pixTimerId);
    }, 1000);
  }

  function drawQRCode(canvas, payload) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const modules = 25;
    const quiet = 2;
    const cell = size / (modules + quiet * 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const grid = Array.from({ length: modules }, () => Array(modules).fill(false));
    const placeFinder = (ox, oy) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const border = x === 0 || y === 0 || x === 6 || y === 6;
          const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[oy + y][ox + x] = border || inner;
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(modules - 7, 0);
    placeFinder(0, modules - 7);

    for (let i = 8; i < modules - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    let seed = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      seed ^= payload.charCodeAt(i);
      seed = Math.imul(seed, 16777619) >>> 0;
    }

    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        const inFinder =
          (x < 8 && y < 8) || (x >= modules - 8 && y < 8) || (x < 8 && y >= modules - 8);
        if (inFinder || x === 6 || y === 6) continue;
        seed = (Math.imul(seed ^ (x * 31 + y * 17), 1664525) + 1013904223) >>> 0;
        grid[y][x] = (seed & 1) === 1;
      }
    }

    ctx.fillStyle = '#0B2118';
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (grid[y][x]) {
          ctx.fillRect(
            Math.floor((x + quiet) * cell),
            Math.floor((y + quiet) * cell),
            Math.ceil(cell),
            Math.ceil(cell)
          );
        }
      }
    }
  }

  function showCardError(msg) {
    dom.cardError.textContent = msg;
    dom.cardError.classList.remove('hidden');
  }

  function initPaymentTabs() {
    dom.payTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const method = tab.getAttribute('data-pay-method');
        state.payMethod = method;

        dom.payTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });

        Object.entries(dom.payPanels).forEach(([key, panel]) => {
          const active = key === method;
          panel.classList.toggle('hidden', !active);
          panel.classList.toggle('is-active', active);
        });
      });
    });

    dom.generatePixBtn.addEventListener('click', () => {
      if (!validateBaseOrder()) return;
      generatePixExperience();
    });

    dom.copyPixBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(dom.pixCodeInput.value);
        dom.copyFeedback.textContent = 'Código Pix copiado para a área de transferência!';
      } catch {
        dom.pixCodeInput.select();
        dom.copyFeedback.textContent = 'Código selecionado — pressione Ctrl+C para copiar.';
      }
    });

    dom.confirmPixBtn.addEventListener('click', () => {
      if (!validateBaseOrder()) return;
      issueVoucher('pix', 'Pago via Pix Instantâneo');
    });

    dom.resetPixBtn.addEventListener('click', resetPixPanel);

    // Cartão + Cartão Virtual 3D dinâmico
    dom.cardModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.cardMode = btn.getAttribute('data-card-mode');
        dom.cardModeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        dom.installmentsGroup.classList.toggle('hidden', state.cardMode === 'debit');
        syncVirtualCard();
      });
    });

    dom.cardNumber.addEventListener('input', () => {
      const digits = dom.cardNumber.value.replace(/\D/g, '').slice(0, 16);
      dom.cardNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
      dom.cardError.classList.add('hidden');
      syncVirtualCard();
    });

    dom.cardHolder.addEventListener('input', syncVirtualCard);

    dom.cardExpiry.addEventListener('input', () => {
      const digits = dom.cardExpiry.value.replace(/\D/g, '').slice(0, 4);
      dom.cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      dom.cardError.classList.add('hidden');
      syncVirtualCard();
    });

    dom.cardNumber.addEventListener('focus', () => dom.virtualCardInner?.classList.remove('is-flipped'));
    dom.cardHolder.addEventListener('focus', () => dom.virtualCardInner?.classList.remove('is-flipped'));
    dom.cardExpiry.addEventListener('focus', () => dom.virtualCardInner?.classList.remove('is-flipped'));

    dom.cardCvv.addEventListener('input', () => {
      dom.cardCvv.value = dom.cardCvv.value.replace(/\D/g, '').slice(0, 4);
      dom.cardError.classList.add('hidden');
      dom.virtualCardInner?.classList.add('is-flipped');
      syncVirtualCard();
    });

    dom.cardCvv.addEventListener('focus', () => {
      dom.virtualCardInner?.classList.add('is-flipped');
    });
    dom.cardCvv.addEventListener('blur', () => {
      dom.virtualCardInner?.classList.remove('is-flipped');
    });

    dom.cardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateBaseOrder()) return;

      const digits = dom.cardNumber.value.replace(/\D/g, '');
      const holder = dom.cardHolder.value.trim();
      const expiry = dom.cardExpiry.value.trim();
      const cvv = dom.cardCvv.value.trim();

      if (digits.length < 16) return showCardError('Digite os 16 dígitos do cartão.');
      if (holder.length < 3) return showCardError('Informe o nome impresso no cartão.');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        return showCardError('Informe uma validade válida no formato MM/AA.');
      }
      const [mm, yy] = expiry.split('/').map(Number);
      const now = new Date();
      const fullYear = 2000 + yy;
      if (fullYear < now.getFullYear() || (fullYear === now.getFullYear() && mm < now.getMonth() + 1)) {
        return showCardError('Este cartão parece estar com a validade expirada.');
      }
      if (cvv.length < 3) return showCardError('Informe o código de segurança (CVV) com 3 ou 4 dígitos.');

      dom.cardError.classList.add('hidden');
      dom.cardSubmitBtn.disabled = true;
      const originalHtml = dom.cardSubmitBtn.innerHTML;
      dom.cardSubmitBtn.textContent = 'Processando autorização...';

      setTimeout(() => {
        const selectedInstallments = dom.cardInstallments.value || '1';
        dom.cardSubmitBtn.disabled = false;
        dom.cardSubmitBtn.innerHTML = originalHtml;
        recalculateOrder(false);

        const installments = state.cardMode === 'debit'
          ? 'Cartão de Débito à vista'
          : `Crédito ${selectedInstallments}x (${detectCardBrand(digits)})`;

        issueVoucher('card', installments);
      }, 450);
    });

    dom.confirmGateBtn.addEventListener('click', () => {
      if (!validateBaseOrder()) return;
      issueVoucher('gate', 'Pré-reserva · Pagar na Guarita');
    });
  }

  function issueVoucher(type, methodLabel) {
    const code = `CHV-${Math.floor(100000 + Math.random() * 899999)}`;
    const voucher = {
      code,
      type,
      methodLabel,
      visitorName: dom.visitorName.value.trim(),
      visitorPhone: dom.visitorPhone.value.trim(),
      visitorEmail: dom.visitorEmail.value.trim(),
      visitDate: state.visitDate,
      items: getOrderItems(),
      total: computeTotal(),
      createdAt: new Date().toISOString(),
    };

    state.activeVoucher = voucher;
    try {
      localStorage.setItem(STORAGE_KEYS.voucher, JSON.stringify(voucher));
    } catch {}

    syncSavedVoucherBanner();
    openVoucherModal(voucher);
  }

  function loadSavedVoucher() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.voucher);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.code) {
        state.activeVoucher = parsed;
        syncSavedVoucherBanner();
      }
    } catch {}
  }

  function syncSavedVoucherBanner() {
    const v = state.activeVoucher;
    if (!v) return;
    dom.navVoucherBtn.classList.remove('hidden');
    dom.drawerVoucherBtn.classList.remove('hidden');
    dom.savedVoucherBanner.classList.remove('hidden');
    dom.savedVoucherSummary.textContent =
      `Reserva ${v.code} · ${v.visitorName} · Visita em ${formatShortDate(v.visitDate)} (${brl.format(v.total)})`;
  }

  function openVoucherModal(voucher) {
    dom.voucherCode.textContent = voucher.code;
    dom.voucherVisitor.textContent = voucher.visitorName;
    dom.voucherDate.textContent = formatShortDate(voucher.visitDate);
    dom.voucherMethod.textContent = voucher.methodLabel;

    dom.voucherStatusPill.classList.toggle('is-gate', voucher.type === 'gate');
    if (voucher.type === 'pix') {
      dom.voucherStatusPill.textContent = 'PAGO VIA PIX';
      dom.voucherTotalLabel.textContent = 'Total pago';
    } else if (voucher.type === 'card') {
      dom.voucherStatusPill.textContent = 'PAGO NO CARTÃO';
      dom.voucherTotalLabel.textContent = 'Total aprovado';
    } else {
      dom.voucherStatusPill.textContent = 'PRÉ-RESERVA · PAGAR NA GUARITA';
      dom.voucherTotalLabel.textContent = 'A pagar na chegada (dinheiro/cartão)';
    }

    dom.voucherItems.innerHTML = '';
    voucher.items.forEach((item) => {
      const li = document.createElement('li');
      const left = document.createElement('span');
      left.textContent = item.label;
      const right = document.createElement('strong');
      right.textContent = brl.format(item.amount);
      li.append(left, right);
      dom.voucherItems.appendChild(li);
    });

    dom.voucherTotalValue.textContent = brl.format(voucher.total);
    const qrData = `CHUVISQUEIRO|${voucher.code}|${voucher.visitDate}|${voucher.visitorName}|${voucher.total.toFixed(2)}|${voucher.type}`;
    drawQRCode(dom.voucherQrCanvas, qrData);

    const waMsg = encodeURIComponent(
      `Olá! Segue minha reserva para a Cascata do Chuvisqueiro:\n` +
      `Código: ${voucher.code}\nData: ${formatShortDate(voucher.visitDate)}\n` +
      `Titular: ${voucher.visitorName}\nModalidade: ${voucher.methodLabel}\nValor: ${brl.format(voucher.total)}`
    );
    dom.shareWhatsappBtn.href = `https://wa.me/5551998028474?text=${waMsg}`;

    dom.voucherModal.classList.remove('hidden');
  }

  function downloadVoucherPNG(voucher) {
    if (!voucher) return;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1140;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F4F5F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0B2118';
    ctx.fillRect(0, 0, canvas.width, 250);

    ctx.fillStyle = '#34C38B';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('CASCATA DO CHUVISQUEIRO · RIOZINHO, RS', 56, 78);

    ctx.fillStyle = '#F4F5F0';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('Voucher de Entrada', 56, 152);

    ctx.fillStyle = voucher.type === 'gate' ? '#D97236' : '#1E8E63';
    ctx.fillRect(56, 178, 430, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(voucher.methodLabel.toUpperCase(), 74, 207);

    ctx.fillStyle = '#4C5952';
    ctx.font = '18px sans-serif';
    ctx.fillText('CÓDIGO DA RESERVA', 56, 320);
    ctx.fillText('DATA DA VISITA', 480, 320);
    ctx.fillText('TITULAR', 56, 420);

    ctx.fillStyle = '#131A17';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(voucher.code, 56, 362);
    ctx.fillText(formatShortDate(voucher.visitDate), 480, 362);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(voucher.visitorName, 56, 462);

    let y = 540;
    ctx.strokeStyle = 'rgba(19,26,23,0.16)';
    ctx.beginPath();
    ctx.moveTo(56, 502);
    ctx.lineTo(844, 502);
    ctx.stroke();

    ctx.font = '24px sans-serif';
    voucher.items.forEach((item) => {
      ctx.fillStyle = '#131A17';
      ctx.fillText(item.label, 56, y);
      ctx.fillText(brl.format(item.amount), 680, y);
      y += 42;
    });

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#0B2118';
    ctx.fillText(`Total: ${brl.format(voucher.total)}`, 56, y + 34);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(300, 740, 300, 300);
    ctx.drawImage(dom.voucherQrCanvas, 325, 765, 250, 250);

    ctx.fillStyle = '#4C5952';
    ctx.font = '20px sans-serif';
    ctx.fillText('Apresente na guarita · Acesso válido das 07h às 18h', 200, 1085);

    const link = document.createElement('a');
    link.download = `voucher-chuvisqueiro-${voucher.code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function initVoucherModalEvents() {
    dom.openSavedVoucherBtn.addEventListener('click', () => {
      if (state.activeVoucher) openVoucherModal(state.activeVoucher);
    });
    dom.navVoucherBtn.addEventListener('click', () => {
      if (state.activeVoucher) openVoucherModal(state.activeVoucher);
    });
    dom.drawerVoucherBtn.addEventListener('click', () => {
      if (closeMobileDrawer) closeMobileDrawer();
      if (state.activeVoucher) openVoucherModal(state.activeVoucher);
    });

    dom.closeVoucherBtn.addEventListener('click', () => dom.voucherModal.classList.add('hidden'));
    dom.voucherModal.addEventListener('click', (e) => {
      if (e.target === dom.voucherModal) dom.voucherModal.classList.add('hidden');
    });
    dom.downloadVoucherBtn.addEventListener('click', () => downloadVoucherPNG(state.activeVoucher));
    dom.printVoucherBtn.addEventListener('click', () => window.print());
  }

  function initChecklist() {
    const checkboxes = Array.from(document.querySelectorAll('#visitor-checklist input[type="checkbox"]'));
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.checklist) || '{}');
    } catch {
      saved = {};
    }

    checkboxes.forEach((cb) => {
      const id = cb.getAttribute('data-check-id');
      cb.checked = Boolean(saved[id]);
      cb.addEventListener('change', () => {
        saved[id] = cb.checked;
        try {
          localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(saved));
        } catch {}
      });
    });
  }

  initDates();
  initSteppersAndInputs();
  initPaymentTabs();
  initVoucherModalEvents();
  initChecklist();
  recalculateOrder(false);
  syncVirtualCard();
  loadSavedVoucher();

  return {
    getTotal: computeTotal,
    getActiveVoucher: () => state.activeVoucher,
  };
}
