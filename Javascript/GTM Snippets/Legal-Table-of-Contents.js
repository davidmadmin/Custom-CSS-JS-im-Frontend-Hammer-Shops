<script>
(function () {
  var TOC_PLACEHOLDER_ID = 'legal-toc';
  var TOC_NAV_ID = 'legal-toc-nav';
  var CONTAINER_SELECTOR = '.widget-legal-texts';
  var HEADING_SELECTOR = 'h1, h2, h3';

  // Sticky header height (px) + a little breathing room
  var HEADER_OFFSET_PX = 250;

  function injectScrollOffsetCss() {
    if (document.getElementById('legal-toc-scroll-offset-css')) return;

    var style = document.createElement('style');
    style.id = 'legal-toc-scroll-offset-css';
    style.type = 'text/css';
    style.textContent =
      CONTAINER_SELECTOR + ' ' + HEADING_SELECTOR + ' {' +
      '  scroll-margin-top: ' + HEADER_OFFSET_PX + 'px;' +
      '}' +
      // optional: if you ever land with a hash on initial load, help ensure offset is respected
      'html { scroll-behavior: smooth; }';

    document.head.appendChild(style);
  }

  function slugify(text) {
    return (text || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'toc-heading';
  }

  function buildToc() {
    // prevent duplicates
    if (document.getElementById(TOC_NAV_ID)) return;

    var container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) return;

    var headings = Array.prototype.slice.call(container.querySelectorAll(HEADING_SELECTOR));
    if (headings.length < 2) return;

    injectScrollOffsetCss();

    // Ensure unique ids (global uniqueness)
    var slugCounts = Object.create(null);
    function ensureId(heading) {
      if (heading.id) return heading.id;

      var base = slugify(heading.textContent);
      var n = slugCounts[base] || 0;
      slugCounts[base] = n + 1;

      var candidate = n === 0 ? base : (base + '-' + (n + 1));
      while (document.getElementById(candidate)) {
        n += 1;
        slugCounts[base] = n + 1;
        candidate = base + '-' + (n + 1);
      }

      heading.id = candidate;
      return candidate;
    }

    // Create nav
    var nav = document.createElement('nav');
    nav.id = TOC_NAV_ID;
    nav.className = 'legal-toc';
    nav.setAttribute('aria-label', 'Inhaltsverzeichnis');

    var title = document.createElement('strong');
    title.textContent = 'Inhalt';
    nav.appendChild(title);

    // Root list
    var rootList = document.createElement('ul');
    rootList.className = 'legal-toc__list legal-toc__list--level-1';
    nav.appendChild(rootList);

    // Hierarchy builders
    var currentH1Item = null;
    var currentH2Item = null;

    function makeItem(heading, level) {
      var id = ensureId(heading);

      var li = document.createElement('li');
      li.className =
        'legal-toc__item legal-toc__item--' +
        heading.tagName.toLowerCase() +
        ' legal-toc__item--level-' +
        level;

      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = heading.textContent.trim();

      // JS fallback offset scroll (works even if CSS scroll-margin is ignored)
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(id);
        if (!target) return;

        var y = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET_PX;

        // Update URL hash without jumping
        if (history && history.pushState) {
          history.pushState(null, '', '#' + id);
        } else {
          window.location.hash = id;
        }

        window.scrollTo({ top: y, behavior: 'smooth' });
      });

      li.appendChild(a);
      return li;
    }

    function ensureChildList(parentLi, level) {
      var existing = parentLi.querySelector(':scope > ul');
      if (existing) return existing;

      var ul = document.createElement('ul');
      ul.className = 'legal-toc__list legal-toc__list--level-' + level;
      parentLi.appendChild(ul);
      return ul;
    }

    // Build nested structure: H1 > H2 > H3
    headings.forEach(function (heading) {
      var tag = heading.tagName.toUpperCase();

      if (tag === 'H1') {
        var li1 = makeItem(heading, 1);
        rootList.appendChild(li1);
        currentH1Item = li1;
        currentH2Item = null;
        return;
      }

      if (tag === 'H2') {
        // If no H1 exists before, create an implicit bucket under root
        if (!currentH1Item) {
          var li2NoH1 = makeItem(heading, 1);
          rootList.appendChild(li2NoH1);
          currentH1Item = li2NoH1;
          currentH2Item = null;
          return;
        }

        var ul2 = ensureChildList(currentH1Item, 2);
        var li2 = makeItem(heading, 2);
        ul2.appendChild(li2);
        currentH2Item = li2;
        return;
      }

      if (tag === 'H3') {
        if (currentH2Item) {
          var ul3 = ensureChildList(currentH2Item, 3);
          ul3.appendChild(makeItem(heading, 3));
          return;
        }

        if (currentH1Item) {
          var ul3UnderH1 = ensureChildList(currentH1Item, 2);
          ul3UnderH1.appendChild(makeItem(heading, 2));
          return;
        }

        rootList.appendChild(makeItem(heading, 1));
      }
    });

    // Place it: replace placeholder if present, otherwise insert before container
    var placeholder = document.getElementById(TOC_PLACEHOLDER_ID);
    if (placeholder) {
      placeholder.replaceWith(nav);
      return;
    }

    if (container && container.parentNode) {
      container.parentNode.insertBefore(nav, container);
      return;
    }

    (document.querySelector('main') || document.body).insertBefore(nav, (document.body.firstChild || null));
  }

  function runWhenReady() {
    buildToc();

    // retry for late-rendered content
    var attempts = 0;
    var maxAttempts = 20; // ~5s
    var interval = setInterval(function () {
      attempts += 1;
      buildToc();
      if (document.getElementById(TOC_NAV_ID) || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runWhenReady);
  } else {
    runWhenReady();
  }
})();
</script>
