// Section: Global scripts for all pages

// Section: Wish list button bootstrap
(function () {
  if (typeof window === 'undefined') return;

  if (!window.__hammerWishlistComponentInitializer) {
    window.__hammerWishlistComponentInitializer = function () {
      if (window.__hammerWishlistComponentRegistered) return;
      if (typeof window.Vue === 'undefined' || !window.Vue) return;

      const Vue = window.Vue;

      if (Vue.options && Vue.options.components && Vue.options.components['add-to-wish-list']) {
        window.__hammerWishlistComponentRegistered = true;
        return;
      }

      const heartIconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';

      function getStore() {
        if (window.vueApp && window.vueApp.$store) return window.vueApp.$store;
        if (window.ceresStore && typeof window.ceresStore.dispatch === 'function') return window.ceresStore;
        if (Vue.prototype && Vue.prototype.$store) return Vue.prototype.$store;
        return null;
      }

      function parseVariationId(value) {
        if (value === null || typeof value === 'undefined') return null;

        const number = parseInt(value, 10);

        if (Number.isNaN(number)) return null;

        return number;
      }

      function getVariationIdFromStore(store, itemId) {
        if (!store) return null;

        let variation = null;

        if (itemId && store.getters) {
          const getterName = itemId + '/currentItemVariation';

          if (store.getters[getterName]) variation = store.getters[getterName];
        }

        if (!variation && store.state) {
          if (itemId && store.state[itemId] && store.state[itemId].currentItemVariation) {
            variation = store.state[itemId].currentItemVariation;
          } else if (store.state.item && store.state.item.currentItemVariation) {
            variation = store.state.item.currentItemVariation;
          } else if (store.state.item && store.state.item.variation) {
            variation = store.state.item.variation;
          }
        }

        if (variation && variation.variation && variation.variation.id) {
          return parseVariationId(variation.variation.id);
        }

        if (variation && variation.id) return parseVariationId(variation.id);

        return null;
      }

      function getVariationIdFromDom(instance) {
        if (!instance || !instance.$el || typeof instance.$el.closest !== 'function') return null;

        const root = instance.$el.closest('[data-variation-id], [data-item-variation-id], [data-variationid]');

        if (!root || !root.dataset) return null;

        if (root.dataset.variationId) {
          const directId = parseVariationId(root.dataset.variationId);
          if (directId !== null) return directId;
        }

        if (root.dataset.itemVariationId) {
          const itemId = parseVariationId(root.dataset.itemVariationId);
          if (itemId !== null) return itemId;
        }

        if (root.dataset.variationid) {
          const legacyId = parseVariationId(root.dataset.variationid);
          if (legacyId !== null) return legacyId;
        }

        return null;
      }

      function translate(instance, key, fallback) {
        if (instance && typeof instance.$translate === 'function') {
          try {
            const text = instance.$translate(key);

            if (typeof text === 'string' && text.trim()) return text;
          } catch (error) {
            /* Ignore translation lookup errors. */
          }
        }

        return fallback;
      }

      Vue.component('add-to-wish-list', {
        name: 'add-to-wish-list',
        inject: {
          itemId: {
            default: null,
          },
        },
        props: {
          variationId: {
            type: [Number, String],
            default: null,
          },
        },
        data: function () {
          return {
            isLoading: false,
          };
        },
        computed: {
          store: function () {
            return getStore();
          },
          resolvedVariationId: function () {
            const explicit = parseVariationId(this.variationId);

            if (explicit !== null) return explicit;

            const storeId = getVariationIdFromStore(this.store, this.itemId);

            if (storeId !== null) return storeId;

            return getVariationIdFromDom(this);
          },
          wishListIds: function () {
            const store = this.store;

            if (!store || !store.state || !store.state.wishList) return [];

            const ids = store.state.wishList.wishListIds;

            return Array.isArray(ids) ? ids : [];
          },
          normalizedWishListIds: function () {
            return this.wishListIds.map(function (entry) {
              const parsed = parseVariationId(entry);

              return parsed === null ? entry : parsed;
            });
          },
          isVariationInWishList: function () {
            const current = this.resolvedVariationId;

            if (current === null) return false;

            const normalized = this.normalizedWishListIds;

            if (normalized.indexOf(current) !== -1) return true;

            return normalized.indexOf(String(current)) !== -1;
          },
          isDisabled: function () {
            return this.resolvedVariationId === null || !this.store;
          },
          buttonText: function () {
            if (this.isVariationInWishList) {
              return translate(this, 'Ceres::Template.singleItemWishListRemove', 'Von der Merkliste entfernen');
            }

            return translate(this, 'Ceres::Template.singleItemWishList', 'Zur Merkliste hinzufügen');
          },
          iconMarkup: function () {
            return heartIconMarkup;
          },
          buttonClasses: function () {
            return {
              'fh-wishlist-button--active': this.isVariationInWishList,
              'is-loading': this.isLoading,
            };
          },
        },
        methods: {
          handleClick: function () {
            if (this.isDisabled || this.isLoading) return;

            this.switchState();
          },
          switchState: function () {
            if (this.isVariationInWishList) this.removeFromWishList(); else this.addToWishList();
          },
          addToWishList: function () {
            const id = this.resolvedVariationId;

            if (id === null || !this.store || typeof this.store.dispatch !== 'function') return;

            this.isLoading = true;

            const result = this.store.dispatch('addToWishList', id);

            this.handlePromise(result, 'Ceres::Template.singleItemWishListAdded', 'Zur Merkliste hinzugefügt');
          },
          removeFromWishList: function () {
            const id = this.resolvedVariationId;

            if (id === null || !this.store || typeof this.store.dispatch !== 'function') return;

            this.isLoading = true;

            const result = this.store.dispatch('removeWishListItem', { id: id });

            this.handlePromise(result, 'Ceres::Template.singleItemWishListRemoved', 'Von der Merkliste entfernt');
          },
          handlePromise: function (promise, translationKey, fallbackText) {
            const vm = this;

            function finalize() {
              vm.isLoading = false;
            }

            function notify() {
              vm.notify(translationKey, fallbackText);
            }

            if (promise && typeof promise.then === 'function') {
              promise.then(function () {
                finalize();
                notify();
              }, function () {
                finalize();
              });

              return;
            }

            finalize();
            notify();
          },
          notify: function (translationKey, fallbackText) {
            const message = translate(this, translationKey, fallbackText);
            const store = this.store;

            if (store && typeof store.dispatch === 'function') {
              try {
                store.dispatch('addNotification', {
                  type: 'success',
                  message: message,
                  duration: 3000,
                });

                return;
              } catch (error) {
                /* Ignore notification dispatch errors. */
              }
            }

            if (typeof window !== 'undefined' && window.NotificationService && typeof window.NotificationService.success === 'function') {
              try {
                const notification = window.NotificationService.success(message);

                if (notification && typeof notification.closeAfter === 'function') notification.closeAfter(3000);
              } catch (error) {
                /* Ignore NotificationService errors. */
              }
            }
          },
        },
        template: '<button type="button" class="btn" :class="buttonClasses" :disabled="isDisabled || isLoading" :aria-pressed="isVariationInWishList ? \"true\" : \"false\"" :aria-busy="isLoading ? \"true\" : \"false\"" @click.prevent="handleClick"><span class="fh-wishlist-button-icon" aria-hidden="true" v-html="iconMarkup"></span><span class="fh-wishlist-button-label">{{ buttonText }}</span></button>',
      });

      window.__hammerWishlistComponentRegistered = true;
    };
  }

  function startWishlistBootstrap() {
    const initializer = window.__hammerWishlistComponentInitializer;

    if (typeof initializer !== 'function') return;

    let attempts = 0;
    const maxAttempts = 200;
    const delay = 50;

    function step() {
      attempts += 1;

      initializer();

      if (window.__hammerWishlistComponentRegistered || attempts >= maxAttempts) return;

      window.setTimeout(step, delay);
    }

    step();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startWishlistBootstrap);
  else startWishlistBootstrap();
})();
// End Section: Wish list button bootstrap

// Section: Bestell-Versand Countdown Code
(function () {
  function getBerlinTime() {
    const now = new Date();
    const berlinParts = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const dateObj = {};
    berlinParts.forEach(({ type, value }) => {
      dateObj[type] = value;
    });
    return new Date(
      `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`,
    );
  }
  function pad2(n) {
    return n < 10 ? "0" + n : n;
  }

  function shOnReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  var holidayCache = {};

  function formatDateKey(date) {
    return (
      date.getFullYear() +
      "-" +
      pad2(date.getMonth() + 1) +
      "-" +
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
      [11, 26], // 2. Weihnachtsfeiertag
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
    return n === 1 ? singular : plural;
  }
  function formatTime(h, m, s, showSeconds, color) {
    let t = '<span style="font-weight:bold;color:' + color + ';">';
    if (h >= 24) {
      const days = Math.floor(h / 24);
      const remainingHours = h % 24;
      t += days + " " + pluralize(days, "Tag", "Tage");
      if (remainingHours > 0) {
        t += " " + remainingHours + " " + pluralize(remainingHours, "Stunde", "Stunden");
      } else if (m > 0) {
        t += " " + m + " " + pluralize(m, "Minute", "Minuten");
      }
    } else {
      if (h > 0) {
        t += h + " " + pluralize(h, "Stunde", "Stunden") + " ";
      }
      t += m + " " + pluralize(m, "Minute", "Minuten");
      if (showSeconds) t += " " + s + " " + pluralize(s, "Sekunde", "Sekunden");
    }
    return t + "</span>";
  }
  var iconUrl =
    "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/shipping_9288277.svg";
  var iconHtml =
    '<img src="' +
    iconUrl +
    '" alt="" style="height:2.6em;width:auto;vertical-align:middle;display:block;">';
  function waitForCountdownDiv() {
    var elem = document.getElementById("cutoff-countdown");
    if (!elem) return setTimeout(waitForCountdownDiv, 300);
    elem.style.display = "flex";
    elem.style.alignItems = "flex-start";
    elem.style.gap = "0.85em";
    elem.style.color = "rgb(108, 117, 125)";
    elem.style.setProperty("color", "rgb(108, 117, 125)", "important");
    var now = getBerlinTime();
    var day = now.getDay();
    var hour = now.getHours();
    var cutoff = new Date(now);
    cutoff.setHours(13, 0, 0, 0);
    var ms, h, m, s, color, dateLabel, showSeconds, zeitHtml;
    function getColor(hours) {
      if (hours < 1) return "#dc2626";
      if (hours < 3) return "#eab308";
      return "#13a10e";
    }
    if (isWorkday(now) && hour >= 1 && hour < 13) {
      ms = cutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = h === 0;
      color = getColor(h);
      zeitHtml = formatTime(h, m, s, showSeconds, color);
      dateLabel = "heute";
    } else {
      var weekdays = [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
      ];
      var nextWorkday = getNextWorkday(now);
      var nextCutoff = new Date(nextWorkday);
      nextCutoff.setHours(13, 0, 0, 0);
      ms = nextCutoff - now;
      h = Math.floor(ms / (1000 * 60 * 60));
      m = Math.floor((ms / (1000 * 60)) % 60);
      s = Math.floor((ms / 1000) % 60);
      showSeconds = h === 0;
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
      var monthNum = pad2(nextWorkday.getMonth() + 1);
      var datum = dayNum + "." + monthNum;
      if (isTomorrow) {
        dateLabel = "Morgen, " + dayName + " den " + datum;
      } else if (diffDays === 2) {
        dateLabel = "Übermorgen, " + dayName + " den " + datum;
      } else if (diffDays > 2 && dayName === "Montag") {
        dateLabel = "nächsten Montag, den " + datum;
      } else {
        dateLabel = dayName + " den " + datum;
      }
    }
    var textHtml =
      '<div style="display:flex;flex-direction:column;justify-content:center;line-height:1.45;">' +
      '<span style="font-weight:600;">Bestellen Sie innerhalb ' +
      zeitHtml +
      ", damit Ihre Ware " +
      dateLabel +
      " unser Lager verlässt.   </span>" +
      "</div>";
    elem.innerHTML =
      '<div style="display:flex;align-items:center;">' +
      iconHtml +
      "</div>" +
      textHtml;
  }
  waitForCountdownDiv();
  setInterval(waitForCountdownDiv, 1000);
})();
// End Section: Bestell-Versand Countdown Code

// Section: Versand Icons ändern & einfügen (läuft auf ALLEN Seiten inkl. Checkout)
shOnReady(function () {
  const shippingIcons = {
    ShippingProfileID931:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/DHLVersand_Icon_D1.png",
    ShippingProfileID945:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/GO_Express_Versand_Icon_D1.1.png",
    ShippingProfileID910:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/Selbstabholung_Lager_Versand_Icon_D1.1.png",
  };

  function applyShippingIcons(root = document) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : document;

    Object.keys(shippingIcons).forEach(function (profileId) {
      const selector = `label[for="${profileId}"]`;
      const labels = scope.querySelectorAll ? scope.querySelectorAll(selector) : [];

      Array.prototype.forEach.call(labels, function (label) {
        const iconContainers = label.querySelectorAll(".icon");

        Array.prototype.forEach.call(iconContainers, function (iconContainer) {
          const existingIcons = iconContainer.querySelectorAll(".shipping-icon");

          Array.prototype.forEach.call(existingIcons, function (existingIcon) {
            if (existingIcon && existingIcon.parentNode) existingIcon.parentNode.removeChild(existingIcon);
          });

          const defaultIcons = iconContainer.querySelectorAll("img:not(.shipping-icon)");

          Array.prototype.forEach.call(defaultIcons, function (defaultIcon) {
            if (!defaultIcon) return;

            defaultIcon.classList.add("shipping-icon-hidden");
            defaultIcon.setAttribute("aria-hidden", "true");
            defaultIcon.style.display = "none";
          });

          const img = document.createElement("img");
          img.src = shippingIcons[profileId];
          img.alt = "Versandart Icon";
          img.className = "shipping-icon";

          iconContainer.appendChild(img);
        });
      });
    });
  }

  window.applyShippingIcons = applyShippingIcons;

  const shippingIconObserverCleanups = [];

  function registerCleanup(callback) {
    if (typeof callback === "function") shippingIconObserverCleanups.push(callback);
  }

  function disconnectShippingIconObservers() {
    while (shippingIconObserverCleanups.length) {
      const cleanup = shippingIconObserverCleanups.pop();

      try {
        cleanup();
      } catch (error) {
        /* Ignore cleanup errors during teardown. */
      }
    }
  }

  function initShippingMethodObserver(container) {
    if (!container || container.__shShippingIconObserver) return;

    const observerConfig = { childList: true, subtree: true };

    const observer = new MutationObserver(function () {
      observer.disconnect();

      try {
        applyShippingIcons(container);
      } finally {
        observer.observe(container, observerConfig);
      }
    });

    applyShippingIcons(container);
    observer.observe(container, observerConfig);

    container.__shShippingIconObserver = observer;

    registerCleanup(function () {
      observer.disconnect();
      delete container.__shShippingIconObserver;
    });
  }

  function bootstrapShippingMethodObservers(root = document) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : document;
    const containers = scope.querySelectorAll ? scope.querySelectorAll(".shipping-method-select") : [];

    Array.prototype.forEach.call(containers, function (container) {
      initShippingMethodObserver(container);
    });
  }

  applyShippingIcons();
  bootstrapShippingMethodObservers();

  if (document.body) {
    const bodyObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;

          if (node.nodeType === 1 && node.matches && node.matches(".shipping-method-select")) {
            initShippingMethodObserver(node);
          }

          if (node.querySelectorAll) {
            bootstrapShippingMethodObservers(node);
            applyShippingIcons(node);
          }
        });
      });
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    registerCleanup(function () {
      bodyObserver.disconnect();
    });
  }

  window.addEventListener("beforeunload", disconnectShippingIconObservers);
});
// End Section: Versand Icons ändern & einfügen

// Section: Gratisversand Fortschritt Balken
  document.addEventListener('DOMContentLoaded', function () {
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
      styles.getPropertyValue('--primary') ||
      styles.getPropertyValue('--color-primary') ||
      styles.getPropertyValue('--bs-primary') ||
      '#f20000'
    ).trim();
  }

  const primaryColor = getPrimaryColor();

  function parseEuro(el) {
    if (!el) return 0;
    return (
      parseFloat(
        el.textContent.replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.')
      ) || 0
    );
  }

  function formatEuro(val) {
    return (
      val.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + '\u00a0€'
    );
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
    const pickup = document.getElementById('ShippingProfileID1310');
    if (!bar) return;
    const path = window.location.pathname;
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const inCartPreview = Boolean(bar.closest('.basket-preview'));
    const shouldHideOnPage =
      path.includes('/kundenkonto') || path.includes('/bestellbestaetigung');
    const hide =
      (pickup && pickup.checked) ||
      (isCheckoutPage() && !isGermanySelected()) ||
      (inCartPreview && !isGermanySelectedInCartPreview()) ||
      shouldHideOnPage;
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

(function () {
  var path = window.location.pathname;
  // Bei folgenden Pfaden abbrechen:
  if (
    path.includes("/checkout") ||
    path.includes("/kaufabwicklung") ||
    path.includes("/kasse")
  ) {
    return;
  }

  // Section: Restlicher Code

  // Section: Animierte Suchplatzhalter Vorschläge

  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("input.search-input");
    if (!searchInput) return;

    const clearButton = document.querySelector("[data-search-clear]");
    const toggleClearButton = () => {
      if (!clearButton) return;
      clearButton.style.display = searchInput.value ? "flex" : "none";
    };

    if (clearButton) {
      clearButton.addEventListener("click", function (event) {
        event.preventDefault();
        searchInput.value = "";
        searchInput.focus();
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        toggleClearButton();
      });

      searchInput.addEventListener("input", toggleClearButton);
      searchInput.addEventListener("focus", toggleClearButton);
      searchInput.addEventListener("blur", toggleClearButton);

      toggleClearButton();
    }

    let inputFocused = false;

    // CSS-based device detection
    function getDeviceType() {
      return getComputedStyle(document.body, "::after").content.replace(
        /"/g,
        "",
      );
    }

    function getPrefix() {
      return getDeviceType() === "mobile" ? "Suche: " : "Häufig gesucht: ";
    }

    let prefix = getPrefix();

    const allWords = [
      '"Bolzenanker"',
      '"Terrassenschrauben"',
      '"Holzschutzband"',
      '"Solar Befestigung"',
      '"Edelstahl Ketten"',
      '"Schrauben mit ETA"',
      '"Winkel"',
      '"Edelstahl Bits"',
      '"Terrassenschrauben"',
      '"Holzschutzband"',
      '"Fassadenschrauben"',
      '"Nägel"',
      '"Universalbohrer"',
      '"Wera Werkzeug"',
      '"Tellerkopfschrauben"',
      '"Justierschraube"',
    ];

    // Track the current word index in the full word list
    let currentWord = 0;
    let currentChar = 0;
    let isDeleting = false;
    let typingTimer;
    let animationActive = false;
    let inactivityTimer;

    function isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight)
      );
    }

    function type() {
      if (!animationActive || !isInViewport(searchInput) || inputFocused)
        return;

      const fullWord = allWords[currentWord];
      const currentText = fullWord.substring(0, currentChar);
      searchInput.placeholder = prefix + currentText;

      if (!isDeleting && currentChar < fullWord.length) {
        currentChar++;
        if (animationActive) typingTimer = setTimeout(type, 100);
      } else if (!isDeleting && currentChar === fullWord.length) {
        isDeleting = true;
        if (animationActive) typingTimer = setTimeout(type, 2000);
      } else if (isDeleting && currentChar > 0) {
        currentChar--;
        if (animationActive) typingTimer = setTimeout(type, 50);
      } else {
        isDeleting = false;
        currentWord = (currentWord + 1) % allWords.length;
        currentChar = 0;
        prefix = getPrefix();
        if (animationActive) typingTimer = setTimeout(type, 500);
      }
    }

    function startTyping() {
      if (!animationActive && !inputFocused && !searchInput.value) {
        prefix = getPrefix();
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
        if (!inputFocused && !searchInput.value) {
          startTyping();
        }
      }, 10000);
    }

    // --- Fokus- und Input-Logik ---
    function showPlaceholder() {
      stopTyping();
      clearTimeout(inactivityTimer);
      searchInput.placeholder = "Wonach suchen Sie?";
    }

    function handleFocus() {
      inputFocused = true;
      showPlaceholder();
      // Keine Animation starten während Fokus!
    }

    searchInput.addEventListener("focus", handleFocus);
    searchInput.addEventListener("click", function () {
      if (!searchInput.value) handleFocus();
    });

    searchInput.addEventListener("input", function () {
      stopTyping();
      clearTimeout(inactivityTimer);
      if (!searchInput.value) {
        searchInput.placeholder = "Wonach suchen Sie?";
      } else {
        searchInput.placeholder = "";
      }
      // Keine Animation starten während Fokus!
    });

    searchInput.addEventListener("blur", function () {
      inputFocused = false;
      if (!searchInput.value) {
        // Wenn nichts eingegeben ist, den Standardplatzhalter anzeigen
        searchInput.placeholder = "Wonach suchen Sie?";
      }
      resetInactivityTimer(); // Erst nach Verlassen ggf. Animation nach 10s
    });

    window.addEventListener("scroll", function () {
      if (!isInViewport(searchInput)) {
        stopTyping();
      } else if (!animationActive && !inputFocused) {
        startTyping();
      }
    });

    // Beim Start direkt Animation starten
    startTyping();
  });

  // End Section: Animierte Suchplatzhalter Vorschläge

  // Section: Trusted Shops Badge toggle during search overlay
  (function () {
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

      if (!document.body) return;

      document.body.classList.toggle(BODY_CLASS, overlayIsActive);
    }

    function setupObserver() {
      var observerTarget = document.body || document.documentElement;

      if (!observerTarget) return;

      var observer = new MutationObserver(function () {
        updateOverlayState();
      });

      observer.observe(observerTarget, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'data-dfd-screen'],
      });

      updateOverlayState();

      window.addEventListener('beforeunload', function () {
        observer.disconnect();
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
      setupObserver();
    }
  })();
  // End Section: Trusted Shops Badge toggle during search overlay

  // Section: Restrict focus to the basket preview while it is open
  function installBasketPreviewFocusLock() {
    var body = document.body;

    if (!body) return;

    var focusableSelector = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]'
    ].join(',');

    function isInsideBasket(element) {
      return Boolean(element.closest('.fh-basket-preview') || element.closest('.sh-basket-preview') || element.closest('.basket-preview'));
    }

    function restoreElement(element) {
      if (!element || !element.hasAttribute('data-sh-basket-tab-restore')) return;

      var previous = element.getAttribute('data-sh-basket-tab-restore');
      element.removeAttribute('data-sh-basket-tab-restore');

      if (previous) element.setAttribute('tabindex', previous); else element.removeAttribute('tabindex');
    }

    var lastKnownState = null;

    function updateFocusState() {
      var basketOpen = body.classList.contains('basket-open');

      if (basketOpen === lastKnownState) return;
      lastKnownState = basketOpen;

      var elements = document.querySelectorAll(focusableSelector);

      for (var index = 0; index < elements.length; index += 1) {
        var element = elements[index];

        if (!element) continue;

        if (basketOpen && !isInsideBasket(element)) {
          if (!element.hasAttribute('data-sh-basket-tab-restore')) {
            var existing = element.getAttribute('tabindex');
            element.setAttribute('data-sh-basket-tab-restore', existing === null ? '' : existing);
          }

          element.setAttribute('tabindex', '-1');
        } else if (!basketOpen && element.hasAttribute('data-sh-basket-tab-restore')) {
          restoreElement(element);
        }
      }
    }

    var observer = new MutationObserver(function (mutations) {
      for (var index = 0; index < mutations.length; index += 1) {
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

      var storedElements = document.querySelectorAll('[data-sh-basket-tab-restore]');

      for (var index = 0; index < storedElements.length; index += 1) {
        restoreElement(storedElements[index]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installBasketPreviewFocusLock);
  } else {
    installBasketPreviewFocusLock();
  }
  // End Section: Restrict focus to the basket preview while it is open

  // Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

  function patchBasketButton() {
    var weiterEinkaufenBtn = document.querySelector(
      ".basket-preview-footer .btn-outline-primary.btn-block",
    );
    var closeBtn = document.querySelector(".basket-preview-header .close");
    if (weiterEinkaufenBtn && closeBtn) {
      // Button immer entsperren und Ladeklassen entfernen
      weiterEinkaufenBtn.removeAttribute("disabled");
      weiterEinkaufenBtn.disabled = false;
      weiterEinkaufenBtn.classList.remove(
        "disabled",
        "is-loading",
        "loading",
        "plenty-loader",
      );

      // Nur Spinner-Icons entfernen (nicht das Arrow-Icon!)
      weiterEinkaufenBtn
        .querySelectorAll("i.fa-spin, i.fa-circle-o-notch")
        .forEach(function (spinner) {
          spinner.remove();
        });

      // Button-Text und Arrow setzen, falls Icon fehlt (kein Spinner!)
      if (!weiterEinkaufenBtn.querySelector("i.fa-arrow-left")) {
        weiterEinkaufenBtn.innerHTML =
          '<i class="fa fa-arrow-left" aria-hidden="true" style="margin-right:8px"></i>Weiter einkaufen';
      }

      // Eventlistener nur einmal hinzufügen
      if (!weiterEinkaufenBtn.classList.contains("weiter-einkaufen-patched")) {
        weiterEinkaufenBtn.addEventListener("click", function (e) {
          e.preventDefault();

          // Spinner sofort entfernen
          weiterEinkaufenBtn
            .querySelectorAll("i.fa-spin, i.fa-circle-o-notch")
            .forEach(function (spinner) {
              spinner.remove();
            });
          // Button aktiv lassen
          weiterEinkaufenBtn.removeAttribute("disabled");
          weiterEinkaufenBtn.disabled = false;
          weiterEinkaufenBtn.classList.remove(
            "disabled",
            "is-loading",
            "loading",
            "plenty-loader",
          );

          // Overlay schließen
          closeBtn.click();

          // Nach kurzem Timeout sicherheitshalber Spinner nochmal entfernen
          setTimeout(function () {
            weiterEinkaufenBtn
              .querySelectorAll("i.fa-spin, i.fa-circle-o-notch")
              .forEach(function (spinner) {
                spinner.remove();
              });
            weiterEinkaufenBtn.removeAttribute("disabled");
            weiterEinkaufenBtn.disabled = false;
            weiterEinkaufenBtn.classList.remove(
              "disabled",
              "is-loading",
              "loading",
              "plenty-loader",
            );
          }, 80);
        });

        weiterEinkaufenBtn.classList.add("weiter-einkaufen-patched");
      }
    }
  }

  var observer = new MutationObserver(function (mutationsList, observer) {
    patchBasketButton();
  });

  document.addEventListener("DOMContentLoaded", function () {
    observer.observe(document.body, { childList: true, subtree: true });
    patchBasketButton();
  });

  // End Section: Warenkorbvorschau "Warenkorb" zu "Weiter einkaufen" Funktion

})();
