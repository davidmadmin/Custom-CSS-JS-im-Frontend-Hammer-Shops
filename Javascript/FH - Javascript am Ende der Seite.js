
window.addEventListener('DOMContentLoaded', () => {
  const navScrollContainer = document.querySelector('[data-fh-nav-scroll]');
  const navScrollButton = document.querySelector('[data-fh-nav-scroll-next]');
  const navScrollMedia = window.matchMedia('(max-width: 1599.98px) and (min-width: 768px)');

  if (!navScrollContainer || !navScrollButton) {
    return;
  }

  const getNavItems = () => Array.from(navScrollContainer.querySelectorAll('.fh-header__nav-item'));

  const resetScrollIfNeeded = () => {
    if (!navScrollMedia.matches) {
      navScrollContainer.scrollLeft = 0;
      navScrollButton.setAttribute('disabled', 'disabled');
      return;
    }

    navScrollButton.removeAttribute('disabled');
  };

  const scrollToNextNavItem = () => {
    if (!navScrollMedia.matches) {
      return;
    }

    const navItems = getNavItems();

    if (!navItems.length) {
      return;
    }

    const visibleRightEdge = navScrollContainer.scrollLeft + navScrollContainer.clientWidth;

    const nextItem = navItems.find((item) => {
      const itemLeft = item.offsetLeft;
      const itemRight = itemLeft + item.offsetWidth;
      return itemRight > visibleRightEdge + 2;
    });

    if (!nextItem) {
      navScrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    navScrollContainer.scrollTo({ left: nextItem.offsetLeft, behavior: 'smooth' });
  };

  navScrollButton.addEventListener('click', scrollToNextNavItem);

  resetScrollIfNeeded();

  if (typeof navScrollMedia.addEventListener === 'function') {
    navScrollMedia.addEventListener('change', resetScrollIfNeeded);
  } else if (typeof navScrollMedia.addListener === 'function') {
    navScrollMedia.addListener(resetScrollIfNeeded);
  }
});
