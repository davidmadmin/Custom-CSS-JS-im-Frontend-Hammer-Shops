// Section: Global scripts for all pages

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
    if (h > 0) {
      t += h + " " + pluralize(h, "Stunde", "Stunden") + " ";
    }
    t += m + " " + pluralize(m, "Minute", "Minuten");
    if (showSeconds) t += " " + s + " " + pluralize(s, "Sekunde", "Sekunden");
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
document.addEventListener("DOMContentLoaded", function () {
  const shippingIcons = {
    ShippingProfileID1331:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/DHLVersand_Icon_D1.png",
    ShippingProfileID1345:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/GO_Express_Versand_Icon_D1.1.png",
    ShippingProfileID1310:
      "https://cdn02.plentymarkets.com/nteqnk1xxnkn/frontend/Selbstabholung_Lager_Versand_Icon_D1.1.png",
  };

  Object.entries(shippingIcons).forEach(([profileId, iconUrl]) => {
    const label = document.querySelector(`label[for="${profileId}"]`);
    if (label) {
      const iconContainer = label.querySelector(".icon");

      if (iconContainer) {
        // Bestehendes leeren
        iconContainer.innerHTML = "";

        // Neues Icon einfügen
        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = "Versandart Icon";
        img.className = "shipping-icon";
        iconContainer.appendChild(img);
      }
    }
  });
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
    wrapper.style.marginTop = '0px';
    wrapper.style.marginBottom = '30px';

    const text = document.createElement('div');
    text.style.fontSize = '0.9rem';
    text.style.fontWeight = '600';
    text.style.marginBottom = '0.5rem';
    wrapper.appendChild(text);

    const bg = document.createElement('div');
    bg.style.width = '100%';
    bg.style.height = '8px';
    bg.style.background = '#e0e0e0';
    bg.style.borderRadius = '4px';
    bg.style.overflow = 'hidden';
    wrapper.appendChild(bg);

    const bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.width = '0%';
    bar.style.background = primaryColor;
    bar.style.transition = 'width 0.3s ease';
    bg.appendChild(bar);

    return { wrapper, bar, text };
  }

  function update(bar, text) {
    const total = parseEuro(document.querySelector('dd[data-testing="item-sum"]'));
    const ratio = Math.min(total / THRESHOLD, 1);
    bar.style.width = ratio * 100 + '%';
    if (total < THRESHOLD) {
      text.textContent = `Noch ${formatEuro(THRESHOLD - total)} bis zum Gratisversand`;
    } else {
      text.textContent = 'Gratisversand erreicht!';
    }
  }
    function toggleFreeShippingBar() {
      const bar = document.getElementById('free-shipping-bar');
      const pickup = document.getElementById('ShippingProfileID1310');
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
      const { wrapper, bar, text } = createBar('free-shipping-bar');
      totals.parentNode.insertBefore(wrapper, totals);
      update(bar, text);
      setInterval(() => update(bar, text), 1000);
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
