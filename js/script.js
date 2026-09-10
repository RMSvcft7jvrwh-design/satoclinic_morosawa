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
    const track = carousel ? carousel.querySelector('.carousel-track') : null;
    if (!items.length || !switcher || !carousel || !track) return null;

    const status = switcher.querySelector('.mobile-switcher-status');
    const buttons = switcher.querySelectorAll('button[data-step]');
    let currentIndex = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerTracking = false;
    let horizontalDrag = false;
    let pointerId = null;
    let suppressClick = false;

    const setTrackPosition = function (offset, animate) {
      track.style.transition = animate
        ? 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none';
      track.style.transform = 'translate3d(' + offset + 'px, 0, 0)';
    };

    const showItem = function (index, animate) {
      if (!items.length) return;

      currentIndex = (index + items.length) % items.length;
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      items.forEach(function (item, itemIndex) {
        const isActive = itemIndex === currentIndex;
        item.classList.toggle('is-active', isActive);

        if (!isMobile) {
          item.setAttribute('open', '');
        }
      });

      if (status) {
        status.textContent = items.map(function (_, itemIndex) {
          return itemIndex === currentIndex ? '●' : '○';
        }).join(' ');
      }

      if (isMobile) {
        setTrackPosition(-currentIndex * carousel.clientWidth, animate !== false);
      } else {
        track.style.transition = '';
        track.style.transform = '';
      }
    };

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const step = Number(button.dataset.step);
        showItem(currentIndex + (Number.isFinite(step) ? step : 0), true);
      });
    });

    carousel.addEventListener('pointerdown', function (event) {
      if (window.innerWidth > MOBILE_BREAKPOINT || event.target.closest('button')) return;

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerTracking = true;
      horizontalDrag = false;
      pointerId = event.pointerId;
      track.style.transition = 'none';

      if (carousel.setPointerCapture) {
        carousel.setPointerCapture(event.pointerId);
      }
    });

    carousel.addEventListener('pointermove', function (event) {
      if (!pointerTracking) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      if (!horizontalDrag) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          pointerTracking = false;
          setTrackPosition(-currentIndex * carousel.clientWidth, true);
          return;
        }
        horizontalDrag = true;
        suppressClick = true;
      }

      event.preventDefault();
      setTrackPosition(-currentIndex * carousel.clientWidth + deltaX, false);
    });

    const finishPointer = function (event, cancelled) {
      if (!pointerTracking) return;

      const deltaX = event ? event.clientX - pointerStartX : 0;
      const threshold = carousel.clientWidth * 0.18;
      const shouldMove = horizontalDrag && !cancelled && Math.abs(deltaX) >= threshold;
      const step = shouldMove ? (deltaX < 0 ? 1 : -1) : 0;
      pointerTracking = false;
      horizontalDrag = false;

      if (pointerId !== null && carousel.releasePointerCapture) {
        try { carousel.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
      }
      pointerId = null;
      showItem(currentIndex + step, true);
    };

    carousel.addEventListener('pointerup', function (event) {
      finishPointer(event, false);
    });

    carousel.addEventListener('click', function (event) {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    });

    carousel.addEventListener('pointercancel', function () {
      finishPointer(null, true);
    });

    carousel.addEventListener('lostpointercapture', function () {
      if (pointerTracking) finishPointer(null, true);
    });

    const hashIndex = items.findIndex(function (item) {
      return item.id === window.location.hash.slice(1) || item.dataset.card === window.location.hash.slice(1);
    });
    showItem(hashIndex >= 0 ? hashIndex : 0, false);
    if (hashIndex >= 0) {
      window.requestAnimationFrame(function () {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView({ block: 'start' });
      });
    }

    return {
      reset: function () {
        showItem(0, false);
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
