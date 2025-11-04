// FH Free Shipping Progress Logic

// Section: Gratisversand Fortschritt Balken
fhOnReady(function () {
  const THRESHOLD = 150;

  const COUNTRY_SELECT_ID_FRAGMENTS = [
    'shipping-country-select',
    'invoice-country-select',
    'country-id-select'
  ];

  function findCountrySelects(fragment, root = document) {
    return Array.from(root.querySelectorAll(`select[id*="${fragment}"]`));
  }

  function isGermanySelected() {
    return COUNTRY_SELECT_ID_FRAGMENTS.some((fragment) =>
      findCountrySelects(fragment).some((select) => select.value === '1')
    );
  }

  function isGermanySelectedInCartPreview() {
    const bar = document.getElementById('free-shipping-bar');
    if (!bar) return true;
    const previewRoot = bar.closest('.basket-preview');
    if (!previewRoot) return true;
    const selects = findCountrySelects('shipping-country-select', previewRoot);
    if (!selects.length) return true;
    return selects.some((select) => select.value === '1');
  }

  function isCheckoutPage() {
    const path = window.location.pathname;
    return (
      path.includes('/checkout') ||
      path.includes('/kaufabwicklung') ||
      path.includes('/kasse')
    );
  }

  function getPrimaryColor() {
    const styles = getComputedStyle(document.documentElement);
    return (
      styles.getPropertyValue('--fh-color-bright-blue') ||
      styles.getPropertyValue('--primary') ||
      styles.getPropertyValue('--color-primary') ||
      styles.getPropertyValue('--bs-primary') ||
      'var(--fh-color-bright-blue)'
    ).trim();
  }

  const primaryColor = getPrimaryColor();

  function parseEuro(el) {
    if (!el) return 0;
    return parseFloat(
      el.textContent.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.')
    ) || 0;
  }

  function formatEuro(val) {
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€';
  }

  function createBar(id) {
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'free-shipping-bar';

    const text = document.createElement('div');
    text.className = 'free-shipping-bar__text';
    text.setAttribute('role', 'status');
    text.setAttribute('aria-live', 'polite');
    wrapper.appendChild(text);

    const progress = document.createElement('div');
    progress.className = 'free-shipping-bar__progress';
    wrapper.appendChild(progress);

    const bar = document.createElement('div');
    bar.className = 'free-shipping-bar__progress-fill';
    bar.style.background = primaryColor;
    progress.appendChild(bar);

    const shine = document.createElement('div');
    shine.className = 'free-shipping-bar__shine';
    bar.appendChild(shine);

    return { wrapper, bar, text, shine };
  }

  function createCheckIcon() {
    const check = document.createElement('span');
    check.className = 'free-shipping-bar__check';
    check.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('role', 'presentation');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 13l4 4L19 7');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(path);
    check.appendChild(svg);

    return check;
  }

  function ensureTextContent(container) {
    let content = container.querySelector('.free-shipping-bar__text-content');
    if (!content) {
      content = document.createElement('span');
      content.className = 'free-shipping-bar__text-content';
      container.appendChild(content);
    }

    let label = content.querySelector('.free-shipping-bar__label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'free-shipping-bar__label';
      content.appendChild(label);
    }

    return { content, label };
  }

  function setRegularText(container, message) {
    const { content, label } = ensureTextContent(container);
    content.classList.remove('free-shipping-bar__text-content--celebrate-enter');
    content.classList.remove('free-shipping-bar__text-content--celebrate-exit');

    const check = content.querySelector('.free-shipping-bar__check');
    if (check) check.remove();

    if (label.textContent !== message) label.textContent = message;
  }

  function celebrateText(container, message) {
    const current = container.querySelector('.free-shipping-bar__text-content');
    if (current) {
      current.classList.add('free-shipping-bar__text-content--celebrate-exit');
      current.addEventListener(
        'animationend',
        () => {
          current.remove();
        },
        { once: true }
      );
    }

    const next = document.createElement('span');
    next.className =
      'free-shipping-bar__text-content free-shipping-bar__text-content--celebrate-enter';

    const check = createCheckIcon();
    next.appendChild(check);

    const label = document.createElement('span');
    label.className = 'free-shipping-bar__label';
    label.textContent = message;
    next.appendChild(label);

    container.appendChild(next);
  }

  function update(bar, text, shine, state) {
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const ratio = THRESHOLD === 0 ? 1 : total / THRESHOLD;
    const reached = total >= THRESHOLD;
    const widthRatio = reached ? 1 : Math.max(Math.min(ratio, 1), 0.02);

    bar.style.width = (widthRatio * 100).toFixed(2) + '%';

    const wrapper = bar.closest('.free-shipping-bar');
    if (wrapper) wrapper.classList.toggle('free-shipping-bar--reached', reached);

    if (shine) {
      if (reached) shine.classList.add('free-shipping-bar__shine--paused');
      else shine.classList.remove('free-shipping-bar__shine--paused');
    }

    const message = reached
      ? 'Gratisversand erreicht!'
      : `Noch ${formatEuro(Math.max(THRESHOLD - total, 0))} bis zum Gratisversand`;

    if (reached) {
      if (!state.reached) celebrateText(text, message);
    } else if (state.reached || state.message !== message) {
      setRegularText(text, message);
    }

    state.message = message;
    state.reached = reached;
  }

  function toggleFreeShippingBar() {
    const bar = document.getElementById('free-shipping-bar');
    const pickup = document.getElementById('ShippingProfileID1510');
    if (!bar) return;
    const path = window.location.pathname;
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const inCartPreview = Boolean(bar.closest('.basket-preview'));
    const hide =
      (pickup && pickup.checked) ||
      (isCheckoutPage() && !isGermanySelected()) ||
      (inCartPreview && !isGermanySelectedInCartPreview()) ||
      (path.includes('/bestellbestaetigung') && total < THRESHOLD);
    bar.style.display = hide ? 'none' : '';
  }

  const observer = new MutationObserver(() => {
    const totals = document.querySelector('.cmp-totals');
    if (totals && !document.getElementById('free-shipping-bar')) {
      const { wrapper, bar, text, shine } = createBar('free-shipping-bar');
      totals.parentNode.insertBefore(wrapper, totals);
      const state = { message: '', reached: false };
      update(bar, text, shine, state);
      setInterval(() => update(bar, text, shine, state), 1000);
    }
    toggleFreeShippingBar();
  });
  observer.observe(document.body, { childList: true, subtree: true });

    const countrySelectors = COUNTRY_SELECT_ID_FRAGMENTS.map(
      (frag) => `select[id*="${frag}"]`
    ).join(', ');

    document.body.addEventListener('change', function (e) {
      if (
        e.target.matches('input[type="radio"][id^="ShippingProfileID"]') ||
        e.target.matches(countrySelectors)
      ) {
        toggleFreeShippingBar();
      }
    });
  });
// End Section: Gratisversand Fortschritt Balken

// ===============================
// RESTLICHER JS-Code (ausgeblendet auf Checkout/Kaufabwicklung/Kasse)
// ===============================

(function() {
  var path = window.location.pathname;
  // Bei folgenden Pfaden abbrechen:
  if (path.includes("/checkout") || path.includes("/kaufabwicklung") || path.includes("/kasse")) return;

  // -- Anfang des restlichen Codes --
