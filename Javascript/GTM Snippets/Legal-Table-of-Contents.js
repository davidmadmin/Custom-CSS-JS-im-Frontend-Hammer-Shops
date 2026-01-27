<script>
(function () {
  var TOC_PLACEHOLDER_ID = 'legal-toc';
  var TOC_NAV_ID = 'legal-toc-nav';
  var CONTAINER_SELECTOR = '.widget-legal-texts';
  var HEADING_SELECTOR = 'h1, h2, h3';

  function slugify(text) {
    return (text || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'toc-heading';
  }

  function buildToc() {
    // prevent duplicates
    if (document.getElementById(TOC_NAV_ID)) return;

    var container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) return;

    var headings = Array.prototype.slice.call(container.querySelectorAll(HEADING_SELECTOR));
    if (headings.length < 2) return; // adjust if you want it with 1 heading

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
        var parentForH2 = currentH1Item || rootList;
        if (parentForH2 === rootList) {
          // no H1 yet: append as level-1 item to keep structure valid
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
        // Prefer nesting under the latest H2; fallback to latest H1; fallback root
        if (currentH2Item) {
          var ul3 = ensureChildList(currentH2Item, 3);
          var li3 = makeItem(heading, 3);
          ul3.appendChild(li3);
          return;
        }

        if (currentH1Item) {
          var ul3UnderH1 = ensureChildList(currentH1Item, 2);
          var li3UnderH1 = makeItem(heading, 2);
          ul3UnderH1.appendChild(li3UnderH1);
          return;
        }

        // no previous headings: just add to root
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
