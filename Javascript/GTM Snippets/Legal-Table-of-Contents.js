<script>
(function () {
  var TOC_PLACEHOLDER_ID = 'legal-toc';
  var TOC_NAV_ID = 'legal-toc-nav';
  var SELECTOR = 'h1, h2, h3';

  function slugify(text) {
    return (text || '')
      .trim()
      .toLowerCase()
      // basic latin slug; keeps numbers
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'toc-heading';
  }

  function buildToc() {
    // prevent duplicates
    if (document.getElementById(TOC_NAV_ID)) return;

    var headings = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    // build TOC if there are at least 2 headings (adjust if you want)
    if (headings.length < 2) return;

    // Ensure unique ids
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

    var list = document.createElement('ul');
    list.className = 'legal-toc__list';

    headings.forEach(function (heading) {
      var id = ensureId(heading);

      var item = document.createElement('li');
      item.className = 'legal-toc__item legal-toc__item--' + heading.tagName.toLowerCase();

      var link = document.createElement('a');
      link.href = '#' + id;
      link.textContent = heading.textContent.trim();

      item.appendChild(link);
      list.appendChild(item);
    });

    nav.appendChild(list);

    // Place it: replace placeholder if present, otherwise insert before first heading
    var placeholder = document.getElementById(TOC_PLACEHOLDER_ID);
    if (placeholder) {
      placeholder.replaceWith(nav);
      return;
    }

    var firstHeading = headings[0];
    if (firstHeading && firstHeading.parentNode) {
      firstHeading.parentNode.insertBefore(nav, firstHeading);
      return;
    }

    (document.querySelector('main') || document.body).insertBefore(nav, (document.body.firstChild || null));
  }

  function runWhenReady() {
    // Try now, then retry a few times for late-rendered content (common with CMPs/SPAs)
    buildToc();

    var attempts = 0;
    var maxAttempts = 20; // ~5s total
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
