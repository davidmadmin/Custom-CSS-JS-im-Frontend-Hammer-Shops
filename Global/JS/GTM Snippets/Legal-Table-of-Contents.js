<script>
(function () {
  var TOC_PLACEHOLDER_ID = 'legal-toc';
  var TOC_NAV_ID = 'legal-toc-nav';
  var CONTAINER_SELECTOR = '.widget-legal-texts';
  var HEADING_SELECTOR = 'h1, h2, h3';

  // Sticky header height (px) + a little breathing room
  var HEADER_OFFSET_PX = 250;

  // Light version of your primary blue (adjust to match brand if needed)
  var HOVER_BG = 'rgba(0, 102, 204, 0.12)';

  function injectCss() {
    if (document.getElementById('legal-toc-css')) return;

    var style = document.createElement('style');
    style.id = 'legal-toc-css';
    style.type = 'text/css';
    style.textContent = [
      // ensure anchor targets aren't hidden behind sticky header (only within legal widget)
      CONTAINER_SELECTOR + ' ' + HEADING_SELECTOR + ' {',
      '  scroll-margin-top: ' + HEADER_OFFSET_PX + 'px;',
      '}',

      // TOC link styling
      '#' + TOC_NAV_ID + ' a {',
      '  color: #000;',
      '  text-decoration: none;',
      '  display: inline-block;',
      '  padding: 4px 8px;',
      '  border-radius: 6px;',
      '  line-height: 1.4;',
      '}',

      '#' + TOC_NAV_ID + ' a:hover {',
      '  background: ' + HOVER_BG + ';',
      '}',

      // optional: make hierarchy visually clear (keep minimal; you can override in your CSS)
      '#' + TOC_NAV_ID + ' .legal-toc__list { margin: 8px 0 0; padding-left: 0; list-style: none; }',
      '#' + TOC_NAV_ID + ' .legal-toc__list--level-2 { margin-left: 14px; }',
      '#' + TOC_NAV_ID + ' .legal-toc__list--level-3 { margin-left: 14px; }',

      // target highlight animation (2s fade in/out)
      '@keyframes legalTocHighlightFade {',
      '  0%   { background-color: transparent; }',
      '  15%  { background-color: ' + HOVER_BG + '; }',
      '  70%  { background-color: ' + HOVER_BG + '; }',
      '  100% { background-color: transparent; }',
      '}',

      '.legal-toc__highlight {',
      '  animation: legalTocHighlightFade 2s ease-in-out;',
      '  border-radius: 6px;',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

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

    var allHeadings = Array.prototype.slice.call(container.querySelectorAll(HEADING_SELECTOR));
    if (allHeadings.length < 2) return;

    // Count headings per level
    var counts = { H1: 0, H2: 0, H3: 0 };
    allHeadings.forEach(function (h) {
      var t = h.tagName.toUpperCase();
      if (counts[t] !== undefined) counts[t] += 1;
    });

    // Only include levels with more than 1 occurrence
    var allowed = {
      H1: counts.H1 > 1,
      H2: counts.H2 > 1,
      H3: counts.H3 > 1
    };

    // Filter headings to include only allowed levels
    var headings = allHeadings.filter(function (h) {
      return !!allowed[h.tagName.toUpperCase()];
    });

    // If nothing qualifies, don't render TOC
    if (headings.length === 0) return;

    injectCss();

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

    function highlightHeadingById(id) {
      var target = document.getElementById(id);
      if (!target) return;

      // restart animation reliably
      target.classList.remove('legal-toc__highlight');
      // force reflow
      void target.offsetWidth;
      target.classList.add('legal-toc__highlight');

      // clean up class after animation
      window.setTimeout(function () {
        target.classList.remove('legal-toc__highlight');
      }, 2100);
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

    // Hierarchy builders (we keep nesting rules, but gracefully handle missing levels)
    var currentH1Item = null;
    var currentH2Item = null;

    function ensureChildList(parentLi, level) {
      var existing = parentLi.querySelector(':scope > ul');
      if (existing) return existing;

      var ul = document.createElement('ul');
      ul.className = 'legal-toc__list legal-toc__list--level-' + level;
      parentLi.appendChild(ul);
      return ul;
    }

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

      a.addEventListener('click', function (e) {
        e.preventDefault();

        var target = document.getElementById(id);
        if (!target) return;

        var y = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET_PX;

        // Update URL hash without default jump
        if (history && history.pushState) {
          history.pushState(null, '', '#' + id);
        } else {
          window.location.hash = id;
        }

        window.scrollTo({ top: y, behavior: 'smooth' });

        // Highlight after scroll starts (slight delay feels better)
        window.setTimeout(function () {
          highlightHeadingById(id);
        }, 150);
      });

      li.appendChild(a);
      return li;
    }

    // Build nested structure with fallback:
    // - If H1 is included, it becomes top level.
    // - If H1 isn't included, H2 becomes top level.
    // - If H2 isn't included, H3 becomes top level.
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
        if (currentH1Item) {
          var ul2 = ensureChildList(currentH1Item, 2);
          var li2 = makeItem(heading, 2);
          ul2.appendChild(li2);
          currentH2Item = li2;
        } else {
          // no H1 in TOC -> treat H2 as top-level
          var li2Top = makeItem(heading, 1);
          rootList.appendChild(li2Top);
          currentH2Item = li2Top;
        }
        return;
      }

      if (tag === 'H3') {
        if (currentH2Item) {
          var ul3 = ensureChildList(currentH2Item, currentH1Item ? 3 : 2);
          ul3.appendChild(makeItem(heading, currentH1Item ? 3 : 2));
          return;
        }

        if (currentH1Item) {
          var ul3UnderH1 = ensureChildList(currentH1Item, 2);
          ul3UnderH1.appendChild(makeItem(heading, 2));
          return;
        }

        // no prior levels -> top level
        rootList.appendChild(makeItem(heading, 1));
      }
    });

    var divider = document.createElement('hr');
    nav.appendChild(divider);

    var itkanzleiImage = document.createElement('img');
    itkanzleiImage.id = 'itkanzleiI_img_copyright';
    itkanzleiImage.alt = 'Datenschutzerklärung der IT-Recht Kanzlei';
    itkanzleiImage.style.maxWidth = '100%';
    itkanzleiImage.style.height = 'auto';
    itkanzleiImage.style.display = 'block';
    var sourceImage = document.getElementById('itkanzlei_img_copyright');
    if (sourceImage && sourceImage.getAttribute('src')) {
      itkanzleiImage.src = sourceImage.getAttribute('src');
    }
    nav.appendChild(itkanzleiImage);

    // Place it: replace placeholder if present, otherwise insert before container
    var placeholder = document.getElementById(TOC_PLACEHOLDER_ID);
    if (placeholder) {
      placeholder.replaceWith(nav);
    } else if (container && container.parentNode) {
      container.parentNode.insertBefore(nav, container);
    } else {
      (document.querySelector('main') || document.body).insertBefore(nav, (document.body.firstChild || null));
    }

    // If page loads with a hash already, apply highlight + offset scroll
    if (window.location.hash && window.location.hash.length > 1) {
      var hashId = window.location.hash.slice(1);
      var targetOnLoad = document.getElementById(hashId);
      if (targetOnLoad && container.contains(targetOnLoad)) {
        // ensure correct offset positioning
        window.setTimeout(function () {
          var y = targetOnLoad.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET_PX;
          window.scrollTo({ top: y, behavior: 'auto' });
          highlightHeadingById(hashId);
        }, 0);
      }
    }
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
