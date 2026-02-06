// Section: Produktdetail scripts

function fhOnReady(callback) {
  if (typeof callback !== 'function') return;

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', callback); return; }

  callback();
}

// Section: MwSt.-Anzeige auf Produktdetailseiten
fhOnReady(function () {
  if (!document.body || !document.body.classList.contains('page-singleitem')) return;

  const PRICE_TOGGLE_EVENT_NAME = 'fh:price-toggle-change';

  function resolveShowNetState() {
    if (window.vueApp && window.vueApp.$store && window.vueApp.$store.state && window.vueApp.$store.state.basket &&
      typeof window.vueApp.$store.state.basket.showNetPrices !== 'undefined'
    ) {
      return !!window.vueApp.$store.state.basket.showNetPrices;
    }

    if (window.ceresStore && window.ceresStore.state && window.ceresStore.state.basket &&
      typeof window.ceresStore.state.basket.showNetPrices !== 'undefined'
    ) {
      return !!window.ceresStore.state.basket.showNetPrices;
    }

    if (window.App && window.App.initialData && typeof window.App.initialData.showNetPrices !== 'undefined') {
      return !!window.App.initialData.showNetPrices;
    }

    if (document.documentElement) {
      const attribute = document.documentElement.getAttribute('data-fh-show-net-prices');
      if (attribute === 'net') return true;
      if (attribute === 'gross') return false;
    }

    return false;
  }

  function updateSingleItemVatWidgets(showNet) {
    if (typeof document === 'undefined') return;

    const prefix = showNet ? '* zzgl. ges. MwSt. zzgl. ' : '* inkl. ges. MwSt. zzgl. ';
    const vatSpans = document.querySelectorAll('.widget.widget-code.widget-none.vat .widget-inner > span');

    vatSpans.forEach(function (span) {
      if (!span) return;

      let firstTextNode = null;

      for (let index = 0; index < span.childNodes.length; index += 1) {
        const node = span.childNodes[index];

        if (node && node.nodeType === 3) {
          firstTextNode = node;
          break;
        }
      }

      if (!firstTextNode) {
        firstTextNode = document.createTextNode('');
        span.insertBefore(firstTextNode, span.firstChild || null);
      }

      firstTextNode.textContent = prefix;
    });
  }

  let currentShowNet = resolveShowNetState();
  updateSingleItemVatWidgets(currentShowNet);

  function handleToggle(event) {
    if (!event || !event.detail || typeof event.detail.showNet === 'undefined') return;

    currentShowNet = !!event.detail.showNet;
    updateSingleItemVatWidgets(currentShowNet);
  }

  document.addEventListener(PRICE_TOGGLE_EVENT_NAME, handleToggle);

  if (typeof MutationObserver === 'function' && document.body) {
    const observer = new MutationObserver(function () {
      updateSingleItemVatWidgets(currentShowNet);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
});
// End Section: MwSt.-Anzeige auf Produktdetailseiten

// Section: Availability state handling for product page
fhOnReady(function () {
  window.shAvailabilityHideCountdown = false;

  const initialCountdown = document.getElementById('cutoff-countdown');
  const availabilityTextSelector = '#kjvItemAvailabilityText, .availability .availability-text, [data-testing="availability-text"]';
  const availabilityContainerSelector = '.availability, [data-testing="availability"]';

  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;

    return null;
  }

  function resolveIsSalable(state) {
    const variation = state && state.item ? state.item.variation : null;

    if (!variation) return null;

    const availability = variation.availability || {};
    const stock = variation.stock || {};
    const filter = variation.filter || {};

    if (typeof filter.isSalable !== 'undefined') return !!filter.isSalable;

    if (typeof availability.isSalable !== 'undefined') {
      return availability.isSalable !== false && availability.isSalable !== 0;
    }

    if (typeof availability.id === 'number' && availability.id >= 7) return false;

    if (typeof stock.isSalable !== 'undefined') return !!stock.isSalable;

    if (typeof stock.stockLevel !== 'undefined') return stock.stockLevel > 0;

    return null;
  }

  function resolveIsSalableFromText() {
    const availabilityText = document.querySelector(availabilityTextSelector);

    if (!availabilityText) return null;

    const text = (availabilityText.textContent || availabilityText.innerText || '').trim().toLowerCase();

    if (!text) return null;

    const unavailablePatterns = [
      /artikel nicht lieferbar/,
      /\bnicht\s+(mehr\s+)?lieferbar\b/,
      /\bnicht\s+auf\s+lager\b/,
      /\bnicht\s+lagernd\b/,
      /\bnicht\s+verf\u00fcgbar\b/,
      /\bnicht\s+vorr\u00e4tig\b/,
      /\baktuell\s+nicht\s+lieferbar\b/,
      /\b(momentan|derzeit|zurzeit)\s+nicht\s+lieferbar\b/,
      /\bausverkauft\b/,
    ];

    if (unavailablePatterns.some((pattern) => pattern.test(text))) return false;

    if (/\bauf\s+lager\b|\blagernd\b|\blieferbar\b|\bverf\u00fcgbar\b/.test(text)) return true;

    return null;
  }

  function applyAvailabilityUi(isSalable) {
    const availabilityText = document.querySelector(availabilityTextSelector);
    const availabilityIcon = document.querySelector('#kjvItemAvailabilityIcon, .availability .availability-icon, [data-testing="availability-icon"]');
    const availabilityContainer = document.querySelector(availabilityContainerSelector);
    const smartButton = document.querySelector('#smart.paypal-smart-button, #smart.widget.paypal-smart-button');

    if (availabilityText) {
      if (!availabilityText.id) availabilityText.id = 'kjvItemAvailabilityText';

      availabilityText.classList.toggle('is-sold-out', !isSalable);
      availabilityText.classList.toggle('is-available', !!isSalable);
    }

    if (availabilityIcon) {
      if (!availabilityIcon.id) availabilityIcon.id = 'kjvItemAvailabilityIcon';

      availabilityIcon.classList.toggle('is-sold-out', !isSalable);
      availabilityIcon.classList.toggle('is-available', !!isSalable);
    }

    if (availabilityContainer) {
      availabilityContainer.classList.toggle('is-sold-out', !isSalable);
      availabilityContainer.classList.toggle('is-available', !!isSalable);
    }

    window.shAvailabilityIsSalable = !!isSalable;

    window.shAvailabilityHideCountdown = !isSalable;

    const countdown = document.getElementById('cutoff-countdown');

    if (countdown) countdown.style.display = isSalable ? '' : 'none';

    if (smartButton) smartButton.style.display = isSalable ? '' : 'none';
  }

  function bootstrapAvailabilityWatcher() {
    const store = getVueStore();

    if (!store || typeof store.watch !== 'function') {
      setTimeout(bootstrapAvailabilityWatcher, 400);
      return;
    }

    store.watch(function (state) { return state.item; }, function () {
      const isSalable = resolveIsSalable(store.state);
      const domSalable = resolveIsSalableFromText();
      const resolved = typeof isSalable === 'boolean' ? isSalable : domSalable;

      if (resolved === null) return;

      applyAvailabilityUi(resolved);
    }, { immediate: true, deep: true });
  }

  function bootstrapAvailabilityTextWatcher() {
    const target = document.querySelector(availabilityTextSelector);

    if (!target) {
      setTimeout(bootstrapAvailabilityTextWatcher, 400);
      return;
    }

    function applyFromText() {
      const domSalable = resolveIsSalableFromText();

      if (domSalable === null) return;

      applyAvailabilityUi(domSalable);
    }

    applyFromText();

    const observer = new MutationObserver(function () { applyFromText(); });

    observer.observe(target, { childList: true, characterData: true, subtree: true });
  }

  function isCheckoutPath() {
    const path = (window.location && window.location.pathname || '').toLowerCase();

    return path.includes('/checkout') || path.includes('/kaufabwicklung') || path.includes('/kasse');
  }

  function hasAvailabilityDom() {
    return !!document.querySelector(availabilityTextSelector) || !!document.querySelector(availabilityContainerSelector);
  }

  function startAvailabilityHandling(retriesLeft) {
    if (isCheckoutPath()) {
      window.shAvailabilityHideCountdown = false;

      if (initialCountdown) initialCountdown.style.display = '';

      return;
    }

    const store = getVueStore();
    const hasItemState = !!(store && store.state && store.state.item);

    if (!hasItemState && !hasAvailabilityDom()) {
      if (retriesLeft > 0) return setTimeout(function () { startAvailabilityHandling(retriesLeft - 1); }, 300);

      window.shAvailabilityHideCountdown = false;

      if (initialCountdown) initialCountdown.style.display = '';

      return;
    }

    window.shAvailabilityHideCountdown = true;

    if (initialCountdown) initialCountdown.style.display = 'none';

    bootstrapAvailabilityWatcher();
    bootstrapAvailabilityTextWatcher();
  }

  startAvailabilityHandling(6);

  const smartButtonObserver = new MutationObserver(function () {
    if (typeof window.shAvailabilityIsSalable !== 'boolean') return;

    const smartButton = document.querySelector('#smart.paypal-smart-button, #smart.widget.paypal-smart-button');

    if (!smartButton) return;

    smartButton.style.display = window.shAvailabilityIsSalable ? '' : 'none';
  });

  smartButtonObserver.observe(document.body, { childList: true, subtree: true });
});
// End Section: Availability state handling for product page

// Section: FH availability text sync on item pages
fhOnReady(function () {
  if (!document.body || !document.body.classList.contains('page-singleitem')) return;

  function syncAvailabilityText() {
    var availabilityText = document.querySelector('#kjvItemAvailabilityText');
    if (!availabilityText) return false;

    var badgeText = document.querySelector('.widget-availability .availability > span');
    if (!badgeText) return false;

    var nextText = badgeText.textContent ? badgeText.textContent.trim() : '';

    if (availabilityText.textContent !== nextText) {
      availabilityText.textContent = nextText;
    }

    return true;
  }

  syncAvailabilityText();

  var observer = new MutationObserver(function () {
    syncAvailabilityText();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
});
