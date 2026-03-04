// Section: Global scripts for all pages

function shOnReady(callback) {
  if (typeof callback !== 'function') return;

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', callback); return; }

  callback();
}


// Section: SH auth indicator state bridge
(function () {
  const authStorageKey = 'shAuthIndicatorState';
  const authAttributeName = 'data-sh-auth-state';
  const root = document.documentElement;

  if (!root) return;

  function applyAuthState(nextState) {
    if (nextState !== 'in' && nextState !== 'out') return;
    root.setAttribute(authAttributeName, nextState);
  }

  function readStoredState() {
    if (!window.sessionStorage) return null;

    const value = window.sessionStorage.getItem(authStorageKey);

    return value === 'in' || value === 'out' ? value : null;
  }

  function persistState(nextState) {
    if (!window.sessionStorage || (nextState !== 'in' && nextState !== 'out')) return;
    window.sessionStorage.setItem(authStorageKey, nextState);
  }

  function resolveStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;
    if (window.ceresStore && typeof window.ceresStore.watch === 'function') return window.ceresStore;
    return null;
  }

  function installStoreWatcher(store) {
    if (!store || typeof store.watch !== 'function') return false;

    let lastState = null;

    store.watch(
      function (state, getters) {
        if (getters && typeof getters.isLoggedIn !== 'undefined') return !!getters.isLoggedIn;
        if (store.getters && typeof store.getters.isLoggedIn !== 'undefined') return !!store.getters.isLoggedIn;
        if (state && state.user && state.user.userData && state.user.userData.id) return true;
        return false;
      },
      function (isLoggedIn) {
        const nextState = isLoggedIn ? 'in' : 'out';

        if (nextState === lastState) return;

        lastState = nextState;
        applyAuthState(nextState);
        persistState(nextState);
      },
      { immediate: true }
    );

    return true;
  }

  const storedState = readStoredState();
  if (storedState) applyAuthState(storedState);

  let retries = 0;
  const maxRetries = 40;

  function tryBindStore() {
    const store = resolveStore();

    if (installStoreWatcher(store)) return;

    retries += 1;
    if (retries < maxRetries) window.setTimeout(tryBindStore, 100);
  }

  tryBindStore();
})();
// End Section: SH auth indicator state bridge

// Section: SH cookie settings link
shOnReady(function () {
  function handleCookieSettingsClick(event) {
    const trigger = event.target.closest('[data-sh-cookie-settings]');

    if (!trigger) return;

    event.preventDefault();

    if (window.__ucCmp && typeof window.__ucCmp.showSecondLayer === 'function') {
      window.__ucCmp.showSecondLayer();
    }
  }

  document.addEventListener('click', handleCookieSettingsClick);
});

// Section: sh account page navigation
shOnReady(function () {
  const nav = document.querySelector('[data-sh-account-nav]');

  if (!nav) return;

  const links = Array.prototype.slice.call(nav.querySelectorAll('[data-sh-account-nav-link]'));

  if (!links.length) return;

  if (window.shAccountMenu && typeof window.shAccountMenu.applyGreeting === 'function') {
    window.shAccountMenu.applyGreeting(nav);

    if (typeof MutationObserver === 'function') {
      const greetingObserver = new MutationObserver(function () {
        window.shAccountMenu.applyGreeting(nav);
      });

      greetingObserver.observe(nav, { childList: true, subtree: true, characterData: true });
    }
  }

  const pathParser = document.createElement('a');
  const rootTarget = 'overview';
  const rootPath = normalisePath(nav.getAttribute('data-sh-account-nav-root') || '/my-account');

  function normaliseTarget(value) {
    if (typeof value !== 'string') return rootTarget;

    let normalised = value.trim();

    if (!normalised) return rootTarget;

    if (normalised.charAt(0) === '#') normalised = normalised.slice(1);

    if (!normalised) return rootTarget;

    return normalised.toLowerCase();
  }

  function normalisePath(value) {
    if (typeof value !== 'string' || !value) return '/';

    pathParser.href = value;

    const path = pathParser.pathname || '/';

    return path.replace(/\/+$/, '') || '/';
  }

  function extractHash(value) {
    if (typeof value !== 'string') return '';

    const index = value.indexOf('#');

    return index === -1 ? '' : value.slice(index);
  }

  function applyActive(targetValue) {
    const activeTarget = normaliseTarget(targetValue);

    links.forEach(function (link) {
      const linkTarget = normaliseTarget(
        link.getAttribute('data-sh-account-nav-target') || link.hash || extractHash(link.getAttribute('href') || '')
      );

      if (linkTarget === activeTarget) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active');
      }
    });
  }

  applyActive(window.location.hash);

  window.addEventListener('hashchange', function () {
    applyActive(window.location.hash);
  });

  nav.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-sh-account-nav-link]');

    if (!trigger) return;

    const href = trigger.getAttribute('href') || '';
    const targetHint = trigger.getAttribute('data-sh-account-nav-target');
    const nextTarget = targetHint || trigger.hash || extractHash(href);

    if (
      href &&
      !trigger.hash &&
      extractHash(href) === '' &&
      normalisePath(href) === rootPath &&
      normalisePath(window.location && window.location.pathname) === rootPath
    ) {
      event.preventDefault();
    }

    applyActive(nextTarget);
  });
});
// End Section: sh account page navigation

// Section: Restrict focus to the basket preview while it is open
shOnReady(function () {
  const body = document.body;

  if (!body) return;

  const focusableSelector = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]'
  ].join(',');

  function isInsideBasket(element) {
    return !!(element.closest('.sh-basket-preview') || element.closest('.sh-basket-preview') || element.closest('.basket-preview'));
  }

  function restoreElement(element) {
    if (!element || !element.hasAttribute('data-sh-basket-tab-restore')) return;

    const previous = element.getAttribute('data-sh-basket-tab-restore');
    element.removeAttribute('data-sh-basket-tab-restore');

    if (previous) element.setAttribute('tabindex', previous); else element.removeAttribute('tabindex');
  }

  let lastKnownState = null;

  function updateFocusState() {
    const basketOpen = body.classList.contains('basket-open');

    if (basketOpen === lastKnownState) return;
    lastKnownState = basketOpen;

    if (basketOpen) {
      if (window.shAccountMenu && typeof window.shAccountMenu.close === 'function') {
        window.shAccountMenu.close();
      }
      if (window.shWishlistMenu && typeof window.shWishlistMenu.close === 'function') {
        window.shWishlistMenu.close();
      }
    }

    const elements = document.querySelectorAll(focusableSelector);

    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (!element) continue;

      if (basketOpen && !isInsideBasket(element)) {
        if (!element.hasAttribute('data-sh-basket-tab-restore')) {
          const existing = element.getAttribute('tabindex');
          element.setAttribute('data-sh-basket-tab-restore', existing === null ? '' : existing);
        }

        element.setAttribute('tabindex', '-1');
      } else if (!basketOpen && element.hasAttribute('data-sh-basket-tab-restore')) {
        restoreElement(element);
      }
    }
  }

  const observer = new MutationObserver(function (mutations) {
    for (let index = 0; index < mutations.length; index += 1) {
      if (mutations[index].type === 'attributes') {
        updateFocusState();
        break;
      }
    }
  });

  observer.observe(body, { attributes: true, attributeFilter: ['class'] });

  updateFocusState();

  window.addEventListener('beforeunload', function () {
    observer.disconnect();
    lastKnownState = null;

    const storedElements = document.querySelectorAll('[data-sh-basket-tab-restore]');

    for (let index = 0; index < storedElements.length; index += 1) {
      restoreElement(storedElements[index]);
    }
  });
});
// End Section: Restrict focus to the basket preview while it is open

// Section: Basket preview attribute cleanup
shOnReady(function () {
  const attributeKeywords = ['inhalt', 'abmess', 'länge', 'laenge', 'breite', 'höhe', 'hoehe'];
  const previewSelectors = ['.basket-preview', '.basket-preview-list', '.basket-preview-items'];
  const labelSelectors = [
    '[class*="attribute-name" i]',
    '[class*="property-name" i]',
    '[class*="characteristic-name" i]',
    '[data-attribute-name]',
    '[data-property-name]'
  ];

  function normalizeLabel(text) {
    return text
      .replace(/[\/:|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function shouldHideLabel(text) {
    if (!text) return false;

    const normalized = normalizeLabel(text);

    if (!normalized) return false;

    return attributeKeywords.some(function (keyword) {
      return normalized.startsWith(keyword) || normalized.includes(' ' + keyword);
    });
  }

  function hideAttributeNode(node) {
    if (!node || node.nodeType !== 1) return;

    if (node.dataset && node.dataset.shAttributeHidden === 'true') return;

    node.style.display = 'none';

    if (node.dataset) node.dataset.shAttributeHidden = 'true';

    const tagName = node.tagName ? node.tagName.toLowerCase() : '';

    if (tagName === 'dt') {
      const dd = node.nextElementSibling;

      if (dd && dd.tagName && dd.tagName.toLowerCase() === 'dd') hideAttributeNode(dd);
    } else if (tagName === 'dd') {
      const prev = node.previousElementSibling;

      if (prev && prev.tagName && prev.tagName.toLowerCase() === 'dt') hideAttributeNode(prev);
    }
  }

  function suppressAttributeContainer(node) {
    if (!node) return;

    const container = node.closest('li, tr, div, dd, dt') || node;
    hideAttributeNode(container);
  }

  function pruneAttributePairs(item) {
    if (!item || item.nodeType !== 1) return;

    const dtNodes = item.querySelectorAll('dt');

    dtNodes.forEach(function (dt) {
      if (shouldHideLabel(dt.textContent || '')) hideAttributeNode(dt);
    });

    const explicitLabelNodes = item.querySelectorAll(labelSelectors.join(', '));

    explicitLabelNodes.forEach(function (labelNode) {
      if (shouldHideLabel(labelNode.textContent || '')) suppressAttributeContainer(labelNode);
    });

    const fallbackNodes = item.querySelectorAll('li, div, span, dd');

    fallbackNodes.forEach(function (node) {
      if (!node || (node.dataset && node.dataset.shAttributeChecked === 'true')) return;

      if (!node.closest('.basket-preview-item, [data-basket-item]')) return;

      if (node.dataset) node.dataset.shAttributeChecked = 'true';

      if (node.children && node.children.length > 1 && !node.matches('dd')) return;

      const text = node.textContent || '';
      const separatorIndex = text.indexOf(':');

      if (separatorIndex === -1) return;

      const label = text.slice(0, separatorIndex);

      if (shouldHideLabel(label)) suppressAttributeContainer(node);
    });
  }

  function prunePreview(previewRoot) {
    if (!previewRoot || previewRoot.nodeType !== 1) return;

    const items = previewRoot.querySelectorAll('.basket-preview-item, [data-basket-item]');

    if (items.length) items.forEach(pruneAttributePairs); else if (previewRoot.matches('.basket-preview-item, [data-basket-item]')) {
      pruneAttributePairs(previewRoot);
    }
  }

  function bindPreview(previewRoot) {
    if (!previewRoot || previewRoot.nodeType !== 1) return;

    if (previewRoot.dataset && previewRoot.dataset.shAttributeObserver === 'true') { prunePreview(previewRoot); return; }

    if (previewRoot.dataset) previewRoot.dataset.shAttributeObserver = 'true';

    prunePreview(previewRoot);

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation) return;

        mutation.addedNodes.forEach(function (node) {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches('.basket-preview-item, [data-basket-item]')) pruneAttributePairs(node); else {
            prunePreview(node);
          }
        });
      });

      prunePreview(previewRoot);
    });

    observer.observe(previewRoot, { childList: true, subtree: true });
  }

  function scanForPreview() {
    previewSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(bindPreview);
    });
  }

  const bodyObserver = new MutationObserver(function () {
    scanForPreview();
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
  scanForPreview();
});
// End Section: Basket preview attribute cleanup

// Section: Ensure auth modals load their Vue components before opening
shOnReady(function () {
  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;

    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;

    return null;
  }

  function loadLazyComponent(componentName) {
    const store = getVueStore();

    if (!store || typeof store.dispatch !== 'function') return;

    store.dispatch('loadComponent', componentName);
  }

  function registerTrigger(selector, componentName) {
    document.querySelectorAll(selector).forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        loadLazyComponent(componentName);
      });
    });
  }

  registerTrigger('[data-sh-login-trigger]', 'login-modal');
  registerTrigger('[data-sh-registration-trigger]', 'register-modal');
});
// End Section: Ensure auth modals load their Vue components before opening


// Section: Bestell-Versand Countdown Code
(function(){
  if (typeof window.shAvailabilityHideCountdown === 'undefined') {
    window.shAvailabilityHideCountdown = true;
  }

  function getBerlinTime() {
    const now = new Date();
    const berlinParts = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(now);
    const dateObj = {};
    berlinParts.forEach(({type, value}) => { dateObj[type] = value; });
    return new Date(`${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`);
  }
  function pad2(n){ return n < 10 ? '0'+n : n; }

  var holidayCache = {};

  function formatDateKey(date) {
    return (
      date.getFullYear() +
      '-' +
      pad2(date.getMonth() + 1) +
      '-' +
      pad2(date.getDate())
    );
  }

  function calculateEasterSunday(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function addDays(date, days) {
    var copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function getHolidaySet(year) {
    if (holidayCache[year]) return holidayCache[year];

    var holidays = new Set();
    function add(date) {
      holidays.add(formatDateKey(date));
    }

    [
      [0, 1],   // Neujahr
      [4, 1],   // Tag der Arbeit
      [9, 3],   // Tag der Deutschen Einheit
      [11, 25], // 1. Weihnachtsfeiertag
      [11, 26]  // 2. Weihnachtsfeiertag
    ].forEach(function (parts) {
      add(new Date(year, parts[0], parts[1]));
    });

    var easterSunday = calculateEasterSunday(year);
    [
      -2, // Karfreitag
      1,  // Ostermontag
      39, // Christi Himmelfahrt
      50, // Pfingstmontag
      60  // Fronleichnam (NRW)
    ].forEach(function (offset) {
      add(addDays(easterSunday, offset));
    });

    add(new Date(year, 10, 1)); // Allerheiligen (NRW)

    holidayCache[year] = holidays;
    return holidays;
  }

  function isHoliday(date) {
    var set = getHolidaySet(date.getFullYear());
    return set.has(formatDateKey(date));
  }

  function isWorkday(date) {
    var day = date.getDay();
    if (day === 0 || day === 6) return false;
    if (isHoliday(date)) return false;
    return true;
  }

  function getNextWorkday(date) {
    var next = new Date(date);
    do {
      next.setDate(next.getDate() + 1);
    } while (!isWorkday(next));
    return next;
  }
  function pluralize(n, singular, plural) {
    return (n === 1) ? singular : plural;
  }
  function formatTime(h, m, s, showSeconds, color) {
    let t = '<span style="font-weight:bold;color:' + color + ';">';
    if (h >= 24) {
      const days = Math.floor(h / 24);
      const remainingHours = h % 24;
      t += days + ' ' + pluralize(days, 'Tag', 'Tage');
      if (remainingHours > 0) {
        t += ' ' + remainingHours + ' ' + pluralize(remainingHours, 'Stunde', 'Stunden');
      } else if (m > 0) {
        t += ' ' + m + ' ' + pluralize(m, 'Minute', 'Minuten');
      }
    } else {
      if(h > 0) {
        t += h + ' ' + pluralize(h, 'Stunde', 'Stunden') + ' ';
      }
      t += m + ' ' + pluralize(m, 'Minute', 'Minuten');
      if(showSeconds) t += ' ' + s + ' ' + pluralize(s, 'Sekunde', 'Sekunden');
    }
    return t + '</span>';
  }
  var iconUrl = "https://bilder.schrauben-hammer.de/frontend/shipping_9288277.svg";
  var iconHtml = '<img src="' + iconUrl + '" alt="" style="height:2.6em;width:auto;vertical-align:middle;display:block;">';
  function waitForCountdownDiv(){
    var elem = document.getElementById('cutoff-countdown');
    if (!elem) return setTimeout(waitForCountdownDiv, 300);

    if (window.shAvailabilityHideCountdown) {
      elem.style.display = "none";
      return setTimeout(waitForCountdownDiv, 1000);
    }

    elem.style.display = "flex";
    elem.style.alignItems = "flex-start";
    elem.style.gap = "0.85em";
    elem.style.color = '';
    elem.style.setProperty('color', '', 'important');
    var now = getBerlinTime();
    var day = now.getDay();
    var hour = now.getHours();
    var cutoff = new Date(now);
    cutoff.setHours(13, 0, 0, 0);
    var ms, h, m, s, color, dateLabel, showSeconds, zeitHtml;
    var weekdays = [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag" ];
    function getColor(hours){
      if (hours < 1) return "#dc2626";
      if (hours < 3) return "#eab308";
      return "#13a10e";
    }
    if (isWorkday(now) && hour >= 1 && hour < 13) {
      ms = cutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = (h === 0);
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      var todayName = weekdays[now.getDay()];
      var todayNum = pad2(now.getDate());
      var todayMonth = pad2(now.getMonth() + 1);
      var todayDate = todayNum + '.' + todayMonth;
      dateLabel = '<span style="font-weight:700;color:#000;">Heute</span>, <span style="font-weight:700;color:#000;">' + todayName + ' den ' + todayDate + '</span>';
    } else {
      var nextWorkday = getNextWorkday(now);
      var nextCutoff = new Date(nextWorkday);
      nextCutoff.setHours(13, 0, 0, 0);
      ms = nextCutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = (h === 0);
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      var startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      var startOfNext = new Date(nextWorkday);
      startOfNext.setHours(0, 0, 0, 0);
      var diffDays = Math.round((startOfNext - startOfToday) / (1000 * 60 * 60 * 24));
      var tomorrow = new Date(startOfToday);
      tomorrow.setDate(startOfToday.getDate() + 1);
      var isTomorrow = startOfNext.getTime() === tomorrow.getTime();
      var dayName = weekdays[nextWorkday.getDay()];
      var dayNum = pad2(nextWorkday.getDate());
      var monthNum = pad2(nextWorkday.getMonth()+1);
      var datum = dayNum + '.' + monthNum;
      if (isTomorrow) {
        dateLabel = '<span style="font-weight:700;color:#000;">Morgen</span>, <span style="font-weight:700;color:#000;">' + dayName + ' den ' + datum + '</span>';
      } else if (diffDays === 2) {
        dateLabel = '<span style="font-weight:700;color:#000;">Übermorgen</span>, <span style="font-weight:700;color:#000;">' + dayName + ' den ' + datum + '</span>';
      } else if (diffDays > 2 && dayName === "Montag") {
        dateLabel = '<span style="font-weight:700;color:#000;">nächsten Montag</span>, <span style="font-weight:700;color:#000;">den ' + datum + '</span>';
      } else {
        dateLabel = '<span style="font-weight:700;color:#000;">' + dayName + ' den ' + datum + '</span>';
      }
    }
    var textHtml = '<div style="display:flex;flex-direction:column;justify-content:center;line-height:1.45;max-width:640px;">' +
     '<span>Bestelle innerhalb ' + zeitHtml + ', damit Deine Ware ' + dateLabel + ' unser Lager verlässt.   </span>' +
  '</div>';
    elem.innerHTML = 
      '<div style="display:flex;align-items:center;">' +
        iconHtml +
      '</div>' +
      textHtml;
  }
  waitForCountdownDiv();
  setInterval(waitForCountdownDiv, 1000);
})();
// End Section: Bestell-Versand Countdown Code


// ===============================
// RESTLICHER JS-Code (ausgeblendet auf Checkout/Kaufabwicklung/Kasse)
// ===============================

(function() {
  var path = window.location.pathname;
  // Bei folgenden Pfaden abbrechen:
  if (path.includes("/checkout") || path.includes("/kaufabwicklung") || path.includes("/kasse")) return;

  // -- Anfang des restlichen Codes --
  
// Section: Animierte Suchplatzhalter Vorschläge

shOnReady(function () {
  const searchInput = document.querySelector('input.search-input');
  if (!searchInput) return;

  const clearButton = document.querySelector('[data-search-clear]');
  const toggleClearButton = () => {
    if (!clearButton) return;
    clearButton.style.display = searchInput.value ? 'flex' : 'none';
  };

  if (clearButton) {
    clearButton.addEventListener('click', function (event) {
      event.preventDefault();
      searchInput.value = '';
      searchInput.focus();
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      toggleClearButton();
    });

    searchInput.addEventListener('input', toggleClearButton);
    searchInput.addEventListener('focus', toggleClearButton);
    searchInput.addEventListener('blur', toggleClearButton);

    toggleClearButton();
  }

  let inputFocused = false;

  // CSS-based device detection
  function getDeviceType() {
    return getComputedStyle(document.body, '::after').content.replace(/"/g, '');
  }

  function getPrefix() {
    return getDeviceType() === "mobile" ? "Suche: " : "Häufig gesucht: ";
  }

  let prefix = getPrefix();

  const allWords = [
    "\"Terrassenschrauben\"",
    "\"Sichtschutzstreifen PVC\"",
    "\"Terrassenzubehör\"",
    "\"Klebeband\"",
    "\"Tellerkopfschrauben 320mm\"",
    "\"Tieflochmarker\"",
    "\"Silikon\"",
    "\"Schrauben Edelstahl\"",
    "\"Edelstahl Bits\"",
    "\"Holzschutzband\"",
    "\"Bolzenanker INDEX\"",
    "\"Solar Befestigung\"",
    "\"Bohrerset\"",
    "\"Justierschraube\"",
    "\"Dübel\""
  ];

  let currentSet = [];
  let currentWord = 0;
  let currentChar = 0;
  let isDeleting = false;
  let typingTimer;
  let animationActive = false;
  let inactivityTimer;

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function getRandomWords(count = 5) {
    return shuffle([...allWords]).slice(0, count);
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  }

  function type() {
    if (!animationActive || !isInViewport(searchInput) || inputFocused) return;

    const fullWord = currentSet[currentWord];
    const currentText = fullWord.substring(0, currentChar);
    searchInput.placeholder = prefix + currentText;

    if (!isDeleting && currentChar < fullWord.length) {
      currentChar++;
      typingTimer = setTimeout(type, 100);
    } else if (!isDeleting && currentChar === fullWord.length) {
      isDeleting = true;
      typingTimer = setTimeout(type, 2000);
    } else if (isDeleting && currentChar > 0) {
      currentChar--;
      typingTimer = setTimeout(type, 50);
    } else {
      isDeleting = false;
      currentWord++;
      if (currentWord >= currentSet.length) {
        currentSet = getRandomWords(5);
        currentWord = 0;
      }
      currentChar = 0;
      typingTimer = setTimeout(type, 500);
    }
  }

  function startTyping() {
    if (!animationActive && !inputFocused) {
      prefix = getPrefix();
      currentSet = getRandomWords(5);
      currentWord = 0;
      currentChar = 0;
      animationActive = true;
      type();
    }
  }

  function stopTyping() {
    animationActive = false;
    clearTimeout(typingTimer);
  }

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (!inputFocused) startTyping();
    }, 10000);
  }

  // --- Fokus- und Input-Logik ---
  searchInput.addEventListener("focus", function () {
    inputFocused = true;
    stopTyping();
    if (!searchInput.value) searchInput.placeholder = "Wonach suchst du?";
    // Keine Animation starten während Fokus!
  });

  searchInput.addEventListener("input", function () {
    stopTyping();
    if (!searchInput.value) searchInput.placeholder = "Wonach suchst du?";
    // Keine Animation starten während Fokus!
  });

  searchInput.addEventListener("blur", function () {
    inputFocused = false;
    resetInactivityTimer(); // Erst nach Verlassen ggf. Animation nach 10s
  });

  window.addEventListener("scroll", function () {
    if (!isInViewport(searchInput)) stopTyping(); else if (!animationActive && !inputFocused) {
      startTyping();
    }
  });

  // Beim Start direkt Animation starten
  startTyping();
});

// End Section: Animierte Suchplatzhalter Vorschläge


// Section: Trusted Shops Badge toggle during search overlay
shOnReady(function () {
  var BODY_CLASS = 'sh-search-overlay-open';
  var OVERLAY_SELECTORS = ['[data-dfd-screen="mobile-initial"]', '[data-dfd-screen="embedded"]'];

  function isElementVisible(element) {
    if (!(element instanceof HTMLElement)) return false;

    var style = window.getComputedStyle(element);

    if (!style) return false;

    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

    return true;
  }

  function updateOverlayState() {
    var overlayIsActive = OVERLAY_SELECTORS.some(function (selector) {
      var element = document.querySelector(selector);

      if (!element) return false;

      return isElementVisible(element);
    });

    if (!overlayIsActive) {
      overlayIsActive = Boolean(document.querySelector('.dfd-results-grid'));
    }

    document.body.classList.toggle(BODY_CLASS, overlayIsActive);
  }

  var observerTarget = document.body || document.documentElement;

  if (!observerTarget) return;

  var observer = new MutationObserver(function () {
    updateOverlayState();
  });

  observer.observe(observerTarget, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'data-dfd-screen'] });

  updateOverlayState();

  window.addEventListener('beforeunload', function () {
    observer.disconnect();
  });
});
// End Section: Trusted Shops Badge toggle during search overlay



// Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

function patchBasketButton() {
  var weiterEinkaufenBtn = document.querySelector('.basket-preview-footer .btn-outline-primary.btn-block');
  var closeBtn = document.querySelector('.basket-preview-header .close');
  if (weiterEinkaufenBtn && closeBtn) {
    // Button entsperren
    weiterEinkaufenBtn.removeAttribute('disabled');
    weiterEinkaufenBtn.disabled = false;
    weiterEinkaufenBtn.classList.remove('disabled', 'is-loading', 'loading', 'plenty-loader');

    // Entferne gezielt alle Spinner-i-Tags im Button (FontAwesome Spinner)
    weiterEinkaufenBtn.querySelectorAll('i.fa-spin, i.fa-circle-o-notch').forEach(function(spinner) {
      spinner.remove();
    });

    // Button-Text und Custom-Icon setzen, falls Icon fehlt (ohne Spinner!)
    if (!weiterEinkaufenBtn.querySelector('i.fa-arrow-left')) weiterEinkaufenBtn.innerHTML = '<i class="fa fa-arrow-left" aria-hidden="true" style="margin-right:8px"></i>Weiter einkaufen';

    if (!weiterEinkaufenBtn.classList.contains('weiter-einkaufen-patched')) {
      weiterEinkaufenBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Spinner sofort entfernen!
        weiterEinkaufenBtn.querySelectorAll('i.fa-spin, i.fa-circle-o-notch').forEach(function(spinner) {
          spinner.remove();
        });
        // Button aktiv halten
        weiterEinkaufenBtn.removeAttribute('disabled');
        weiterEinkaufenBtn.disabled = false;
        weiterEinkaufenBtn.classList.remove('disabled', 'is-loading', 'loading', 'plenty-loader');
        // Overlay schließen
        closeBtn.click();
        // Sicherheitshalber Spinner nach kurzem Delay nochmal entfernen
        setTimeout(function() {
          weiterEinkaufenBtn.querySelectorAll('i.fa-spin, i.fa-circle-o-notch').forEach(function(spinner) {
            spinner.remove();
          });
          weiterEinkaufenBtn.removeAttribute('disabled');
          weiterEinkaufenBtn.disabled = false;
          weiterEinkaufenBtn.classList.remove('disabled', 'is-loading', 'loading', 'plenty-loader');
        }, 80);
      });
      weiterEinkaufenBtn.classList.add('weiter-einkaufen-patched');
    }
  }
}

var observer = new MutationObserver(function(mutationsList, observer) {
  patchBasketButton();
});

shOnReady(function () {
  observer.observe(document.body, { childList: true, subtree: true });
  patchBasketButton();
});


// End Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

})();

// Section: SH add-to-wishlist reload after toggle
shOnReady(function () {
  const reloadStorageKey = 'shWishlistAutoOpen';
  const wishlistButtonSelector = '.widget-add-to-wish-list .btn';

  function getVueStore() {
    if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;
    if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;
    return null;
  }

  function setWishListLoadingState(button) {
    if (!button) return;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    if (document.body) {
      document.body.classList.add('wishlist-is-loading');
    }
  }

  function handleWishListButtonClick(event) {
    const button = event.target.closest(wishlistButtonSelector);
    if (!button) return;

    setWishListLoadingState(button);

    const store = getVueStore();
    const initialStoreIds = store && store.state && store.state.wishList && Array.isArray(store.state.wishList.wishListIds)
      ? store.state.wishList.wishListIds.join(',')
      : null;
    let didReload = false;
    let storeWatcherCleanup = null;
    let fallbackTimeout = null;

    if (store && typeof store.watch === 'function') {
      storeWatcherCleanup = store.watch(
        function (state) {
          if (!state || !state.wishList || !Array.isArray(state.wishList.wishListIds)) return '';
          return state.wishList.wishListIds.join(',');
        },
        function (nextValue) {
          if (didReload || initialStoreIds === null || nextValue === initialStoreIds) return;
          didReload = true;
          if (typeof storeWatcherCleanup === 'function') {
            storeWatcherCleanup();
          }
          if (window.sessionStorage) {
            window.sessionStorage.setItem(reloadStorageKey, '1');
          }
          window.location.reload();
        }
      );
    }

    fallbackTimeout = window.setTimeout(function () {
      if (didReload) return;
      didReload = true;
      if (typeof storeWatcherCleanup === 'function') {
        storeWatcherCleanup();
      }
      if (window.sessionStorage) {
        window.sessionStorage.setItem(reloadStorageKey, '1');
      }
      window.location.reload();
    }, 1500);

    window.setTimeout(function () {
      if (!didReload) {
        if (typeof storeWatcherCleanup === 'function') {
          storeWatcherCleanup();
        }
        if (fallbackTimeout) {
          window.clearTimeout(fallbackTimeout);
          fallbackTimeout = null;
        }
      }
    }, 3000);
  }

  document.addEventListener('click', handleWishListButtonClick);
});

// Section: SH Custom Slider Overlay Text
(function shCustomSliderOverlayText() {
  function initCustomSliderOverlay() {
    var slider = document.getElementById('sh-custom-slider');
    if (!slider) {
      return;
    }

    var overlayTexts = slider.querySelectorAll('.sh-custom-slider__overlay-text');
    if (!overlayTexts.length) {
      return;
    }

    var navContainer = document.querySelector(
      '.sh-custom-slider__nav[data-target="#' + slider.id + '"]',
    );
    var navLinks = navContainer ? navContainer.querySelectorAll('.sh-custom-slider__nav-link') : [];

    var setActiveNav = function (index) {
      if (!navLinks.length) {
        return;
      }
      navLinks.forEach(function (link) {
        var dataIndex = Number(link.getAttribute('data-slide-index'));
        var isMatch = Number.isNaN(dataIndex) ? false : dataIndex === index;
        link.classList.toggle('is-active', isMatch);
      });
    };

    var activeOverlay = null;
    var activateOverlay = function (index) {
      var nextOverlay = null;
      var fallbackOverlay = overlayTexts[index] || null;
      overlayTexts.forEach(function (item) {
        var dataIndex = Number(item.getAttribute('data-slide-index'));
        var isMatch = Number.isNaN(dataIndex) ? false : dataIndex === index;
        if (isMatch) {
          nextOverlay = item;
        }
      });
      if (!nextOverlay) {
        nextOverlay = fallbackOverlay;
      }

      overlayTexts.forEach(function (item) {
        item.classList.remove('is-active', 'is-exiting');
      });

      if (nextOverlay) {
        nextOverlay.classList.add('is-active');
        activeOverlay = nextOverlay;
      }

      setActiveNav(index);
    };

    var beginOverlayExit = function () {
      if (!activeOverlay) {
        return;
      }
      activeOverlay.classList.remove('is-active');
      activeOverlay.classList.add('is-exiting');
    };

    var finishOverlayExit = function () {
      overlayTexts.forEach(function (item) {
        item.classList.remove('is-exiting');
      });
    };

    var getActiveIndex = function () {
      var activeItem = slider.querySelector('.carousel-item.active');
      if (activeItem && activeItem.parentNode) {
        return Array.prototype.indexOf.call(activeItem.parentNode.children, activeItem);
      }
      return 0;
    };
    activateOverlay(getActiveIndex());

    slider.addEventListener('slide.bs.carousel', function () {
      beginOverlayExit();
    });
    slider.addEventListener('slid.bs.carousel', function (event) {
      var nextIndex = typeof event.to === 'number' ? event.to : getActiveIndex();
      finishOverlayExit();
      activateOverlay(nextIndex);
    });

    if (window.MutationObserver) {
      var carouselInner = slider.querySelector('.carousel-inner');
      if (carouselInner) {
        var observer = new MutationObserver(function () {
          activateOverlay(getActiveIndex());
        });
        observer.observe(carouselInner, {
          attributes: true,
          subtree: true,
          attributeFilter: ['class'],
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomSliderOverlay);
  } else {
    initCustomSliderOverlay();
  }
})();
// End Section: SH Custom Slider Overlay Text

// Section: Signature console log by David M. Abdin
(function shSignatureLog() {
  var headingStyle = [
    'color: #ffffff',
    'font-weight: 600',
    'font-size: 10px',
    'font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  ].join('; ');

  var detailStyle = [
    'color: #bfbfbf',
    'font-weight: 400',
    'font-size: 8px',
    'font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  ].join('; ');

  console.log(
    '%cSoftware Systems Integrations was done by David M. Abdin for INTRA-TEC GmbH\n%cMore of this page was designed and coded by David M. Abdin.\nContact me on LinkedIn for problems, questions or business inquires https://www.linkedin.com/in/david-m-abdin-5656aa367/',
    headingStyle,
    detailStyle,
  );
})();
