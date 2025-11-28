
window.addEventListener('DOMContentLoaded', () => {
  const navScrollContainer = document.querySelector('[data-fh-nav-scroll]');
  const navScrollButton = document.querySelector('[data-fh-nav-scroll-next]');
  const navScrollMedia = window.matchMedia('(max-width: 1599.98px) and (min-width: 768px)');

  if (!navScrollContainer || !navScrollButton) {
    return;
  }

  const navItems = Array.from(navScrollContainer.querySelectorAll('.fh-header__nav-item'));

  const scrollToNextNavItem = () => {
    if (!navScrollMedia.matches || !navItems.length) {
      return;
    }

    const nextIndex = navItems.findIndex(
      (item) => item.offsetLeft + item.offsetWidth > navScrollContainer.scrollLeft + navScrollContainer.clientWidth + 4
    );

    if (nextIndex === -1) {
      navScrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    navScrollContainer.scrollTo({ left: navItems[nextIndex].offsetLeft, behavior: 'smooth' });
  };

  navScrollButton.addEventListener('click', scrollToNextNavItem);
});
