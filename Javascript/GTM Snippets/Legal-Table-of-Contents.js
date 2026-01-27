(() => {
  const tocSelector = 'h1, h2, h3';
  const headings = Array.from(document.querySelectorAll(tocSelector));
  if (headings.length === 0) {
    return;
  }

  const counts = headings.reduce(
    (acc, heading) => {
      const tag = heading.tagName;
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    { H1: 0, H2: 0, H3: 0 },
  );

  const eligibleTags = Object.keys(counts).filter((tag) => counts[tag] > 1);
  if (eligibleTags.length === 0) {
    return;
  }

  const eligibleHeadings = headings.filter((heading) => eligibleTags.includes(heading.tagName));
  if (eligibleHeadings.length === 0) {
    return;
  }

  const slugCounts = new Map();
  const ensureId = (heading) => {
    if (heading.id) {
      return heading.id;
    }

    const baseSlug = heading.textContent
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'toc-heading';

    const currentCount = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, currentCount + 1);

    let candidate = baseSlug;
    if (currentCount > 0) {
      candidate = `${baseSlug}-${currentCount + 1}`;
    }

    while (document.getElementById(candidate)) {
      const nextCount = (slugCounts.get(baseSlug) || 1) + 1;
      slugCounts.set(baseSlug, nextCount);
      candidate = `${baseSlug}-${nextCount}`;
    }

    heading.id = candidate;
    return candidate;
  };

  const nav = document.createElement('nav');
  nav.id = 'legal-toc';
  nav.className = 'legal-toc';
  nav.setAttribute('aria-label', 'Inhaltsverzeichnis');

  const title = document.createElement('strong');
  title.textContent = 'Inhalt';
  nav.appendChild(title);

  const list = document.createElement('ul');
  list.className = 'legal-toc__list';

  eligibleHeadings.forEach((heading) => {
    const id = ensureId(heading);
    const item = document.createElement('li');
    item.className = `legal-toc__item legal-toc__item--${heading.tagName.toLowerCase()}`;

    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = heading.textContent.trim();

    item.appendChild(link);
    list.appendChild(item);
  });

  nav.appendChild(list);

  const placeholder = document.getElementById('legal-toc');
  if (!placeholder) {
    console.error('Legal TOC placeholder with id "legal-toc" was not found.');
    return;
  }

  placeholder.replaceWith(nav);
})();
