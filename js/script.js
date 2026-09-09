(function () {
  'use strict';

  const MOBILE_BREAKPOINT = 767;

  function setupMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const header = document.querySelector('.site-header');
    const nav = header ? header.querySelector('nav') : null;

    if (!toggle || !header || !nav) return;

    const closeMenu = function () {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', function () {
      const isOpen = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  function setupSwitcher(sectionSelector, itemSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return null;

    const items = Array.from(section.querySelectorAll(itemSelector));
    const switcher = section.querySelector('.mobile-switcher');
    if (!items.length || !switcher) return null;

    const status = switcher.querySelector('.mobile-switcher-status');
    const buttons = switcher.querySelectorAll('button[data-step]');
    let currentIndex = 0;

    const showItem = function (index) {
      if (!items.length) return;

      currentIndex = (index + items.length) % items.length;
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      items.forEach(function (item, itemIndex) {
        const isActive = itemIndex === currentIndex;
        item.classList.toggle('is-active', isActive);

        if (isMobile) {
          item.toggleAttribute('open', isActive);
        } else {
          item.setAttribute('open', '');
        }
      });

      if (status) {
        status.textContent = (currentIndex + 1) + ' / ' + items.length;
      }
    };

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const step = Number(button.dataset.step);
        showItem(currentIndex + (Number.isFinite(step) ? step : 0));
      });
    });

    showItem(0);

    return {
      reset: function () {
        showItem(0);
      }
    };
  }

  function init() {
    setupMenu();

    const switchers = [
      setupSwitcher('.medical', '.medical-item'),
      setupSwitcher('.staff', '.staff-item')
    ].filter(Boolean);

    let wasMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    window.addEventListener('resize', function () {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (isMobile !== wasMobile) {
        switchers.forEach(function (switcher) { switcher.reset(); });
        wasMobile = isMobile;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
