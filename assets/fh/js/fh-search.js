// FH Search Overlay Enhancements

// Section: Animierte Suchplatzhalter Vorschläge

fhOnReady(function () {
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
    "\"Profilzylinder\"",
    "\"Sichtschutzstreifen PVC\"",
    "\"Terrassenschrauben\"",
    "\"Klebebänder\"",
    "\"Fenstersicherungen\"",
    "\"FH Schlösser\"",
    "\"Dichtungsprofile\"",
    "\"Garagentorschlösser\"",
    "\"Edelstahl Bits\"",
    "\"Fensterleisten\"",
    "\"Fenstergriffe\"",
    "\"Aluminium Türdrücker\"",
    "\"Fenstergriffe\"",
    "\"Zahlenschlösser\"",
    "\"Wera Werkzeug\""
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
fhOnReady(function () {
  var BODY_CLASS = 'fh-search-overlay-open';
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
