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
    const carousel = section.querySelector('.medical-carousel, .staff-carousel');
    if (!items.length || !switcher || !carousel) return null;

    const status = switcher.querySelector('.mobile-switcher-status');
    const buttons = switcher.querySelectorAll('button[data-step]');
    let currentIndex = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerTracking = false;
    let suppressClick = false;

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
        status.textContent = items.map(function (_, itemIndex) {
          return itemIndex === currentIndex ? '●' : '○';
        }).join(' ');
      }
    };

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const step = Number(button.dataset.step);
        showItem(currentIndex + (Number.isFinite(step) ? step : 0));
      });
    });

    carousel.addEventListener('pointerdown', function (event) {
      if (window.innerWidth > MOBILE_BREAKPOINT || event.target.closest('button')) return;

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerTracking = true;

      if (carousel.setPointerCapture) {
        carousel.setPointerCapture(event.pointerId);
      }
    });

    carousel.addEventListener('pointerup', function (event) {
      if (!pointerTracking) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      pointerTracking = false;

      if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      suppressClick = true;
      showItem(currentIndex + (deltaX < 0 ? 1 : -1));
    });

    carousel.addEventListener('click', function (event) {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    });

    carousel.addEventListener('pointercancel', function () {
      pointerTracking = false;
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
