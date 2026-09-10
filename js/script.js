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

    const cloneSlide = function (item) {
      const clone = item.cloneNode(true);
      clone.classList.add('carousel-clone');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(function (element) {
        element.removeAttribute('id');
      });
      return clone;
    };

    track.insertBefore(cloneSlide(items[items.length - 1]), track.firstChild);
    track.appendChild(cloneSlide(items[0]));

    const status = switcher.querySelector('.mobile-switcher-status');
    const buttons = switcher.querySelectorAll('button[data-step]');
    let currentIndex = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerTracking = false;
    let horizontalDrag = false;
    let pointerId = null;
    let suppressClick = false;
    let isSnapping = false;

    const getBaseOffset = function (index) {
      return -(index + 1) * carousel.clientWidth;
    };

    const setTrackPosition = function (offset, animate) {
      track.style.transition = animate
        ? 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none';
      track.style.transform = 'translate3d(' + offset + 'px, 0, 0)';
    };

    const updateItemState = function (index) {
      currentIndex = (index + items.length) % items.length;

      items.forEach(function (item, itemIndex) {
        item.classList.toggle('is-active', itemIndex === currentIndex);
        if (window.innerWidth > MOBILE_BREAKPOINT) item.setAttribute('open', '');
      });

      if (section.classList.contains('about-detail-staff')) {
        carousel.style.height = window.innerWidth <= MOBILE_BREAKPOINT
          ? items[currentIndex].offsetHeight + 'px'
          : '';
      }

      if (status) {
        status.textContent = items.map(function (_, itemIndex) {
          return itemIndex === currentIndex ? '●' : '○';
        }).join(' ');
      }
    };

    const showItem = function (index, animate) {
      updateItemState(index);
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setTrackPosition(getBaseOffset(currentIndex), animate !== false);
      } else {
        track.style.transition = '';
        track.style.transform = '';
      }
    };

    const moveBy = function (step) {
      if (isSnapping || !step) return;

      const targetIndex = currentIndex + step;
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (!isMobile || (targetIndex >= 0 && targetIndex < items.length)) {
        showItem(targetIndex, true);
        return;
      }

      const wrappedIndex = (targetIndex + items.length) % items.length;
      const clonePosition = targetIndex < 0 ? 0 : items.length + 1;
      isSnapping = true;
      updateItemState(wrappedIndex);
      setTrackPosition(-clonePosition * carousel.clientWidth, true);

      const finishLoop = function (event) {
        if (event.target !== track || event.propertyName !== 'transform') return;
        track.removeEventListener('transitionend', finishLoop);
        setTrackPosition(getBaseOffset(wrappedIndex), false);
        isSnapping = false;
      };
      track.addEventListener('transitionend', finishLoop);
    };

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const step = Number(button.dataset.step);
        moveBy(Number.isFinite(step) ? step : 0);
      });
    });

    carousel.addEventListener('pointerdown', function (event) {
      if (window.innerWidth > MOBILE_BREAKPOINT || event.target.closest('button') || isSnapping) return;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerTracking = true;
      horizontalDrag = false;
      pointerId = event.pointerId;
      track.style.transition = 'none';
      if (carousel.setPointerCapture) carousel.setPointerCapture(event.pointerId);
    });

    carousel.addEventListener('pointermove', function (event) {
      if (!pointerTracking) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      if (!horizontalDrag) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          pointerTracking = false;
          setTrackPosition(getBaseOffset(currentIndex), true);
          return;
        }
        horizontalDrag = true;
        suppressClick = true;
      }

      event.preventDefault();
      setTrackPosition(getBaseOffset(currentIndex) + deltaX, false);
    });

    const finishPointer = function (event, cancelled) {
      if (!pointerTracking) return;

      const deltaX = event ? event.clientX - pointerStartX : 0;
      const threshold = carousel.clientWidth * 0.18;
      const step = horizontalDrag && !cancelled && Math.abs(deltaX) >= threshold
        ? (deltaX < 0 ? 1 : -1)
        : 0;

      pointerTracking = false;
      horizontalDrag = false;
      if (pointerId !== null && carousel.releasePointerCapture) {
        try { carousel.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
      }
      pointerId = null;

      if (step) moveBy(step);
      else showItem(currentIndex, true);
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

    const hash = window.location.hash.slice(1);
    const hashIndex = items.findIndex(function (item) {
      return item.id === hash || item.dataset.card === hash;
    });
    showItem(hashIndex >= 0 ? hashIndex : 0, false);
    if (hashIndex >= 0) {
      window.requestAnimationFrame(function () {
        const target = document.getElementById(hash);
        if (target) target.scrollIntoView({ block: 'start' });
      });
    }

    return {
      reset: function () {
        isSnapping = false;
        showItem(0, false);
      }
    };
  }

  function setupNewsPagination() {
    const newsPage = document.querySelector('.news-detail');
    if (!newsPage) return;

    const articles = Array.from(newsPage.querySelectorAll('.news-article'));
    const pagination = newsPage.querySelector('.news-pagination');
    if (!articles.length || !pagination) return;

    const pageSize = 10;
    const pageCount = Math.ceil(articles.length / pageSize);
    const pageNumbers = pagination.querySelector('[data-news-pages]');
    const previousButton = pagination.querySelector('[data-news-prev]');
    const nextButton = pagination.querySelector('[data-news-next]');
    const mobilePrevious = newsPage.querySelector('[data-news-mobile-prev]');
    const mobileNext = newsPage.querySelector('[data-news-mobile-next]');
    const mobileStatus = newsPage.querySelector('[data-news-mobile-status]');
    const articleViewport = newsPage.querySelector('.news-articles');
    let currentPage = 0;
    let mobileIndex = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragDeltaX = 0;
    let isDragging = false;
    let isHorizontalDrag = false;

    function isMobile() {
      return window.innerWidth <= 767;
    }

    function getHashArticle() {
      const id = window.location.hash.slice(1);
      return id ? articles.find(function (article) { return article.id === id; }) : null;
    }

    function renderPage(pageIndex, shouldScroll) {
      currentPage = Math.max(0, Math.min(pageIndex, pageCount - 1));
      const start = currentPage * pageSize;
      const end = start + pageSize;
      const target = getHashArticle();
      const mobile = isMobile();
      const targetIndex = target ? articles.indexOf(target) : -1;
      mobileIndex = targetIndex >= start && targetIndex < end ? targetIndex - start : 0;
      newsPage.classList.toggle('news-mobile-ready', mobile);

      articles.forEach(function (article, index) {
        article.hidden = index < start || index >= end;
        article.open = mobile ? !article.hidden : article === target && !article.hidden;
      });

      pageNumbers.replaceChildren();
      for (let index = 0; index < pageCount; index += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(index + 1);
        button.setAttribute('aria-label', 'お知らせ ' + (index + 1) + 'ページ');
        if (index === currentPage) {
          button.setAttribute('aria-current', 'page');
          button.classList.add('is-current');
        }
        button.addEventListener('click', function () {
          renderPage(index, true);
        });
        pageNumbers.appendChild(button);
      }

      previousButton.disabled = currentPage === 0;
      nextButton.disabled = currentPage === pageCount - 1;
      pagination.hidden = pageCount <= 1;

      if (mobile) {
        updateMobileCarousel(false);
      } else {
        resetMobileCarousel();
      }

      if (shouldScroll) {
        newsPage.scrollIntoView({ block: 'start' });
      }
    }

    previousButton.addEventListener('click', function () {
      if (currentPage > 0) renderPage(currentPage - 1, true);
    });

    nextButton.addEventListener('click', function () {
      if (currentPage < pageCount - 1) renderPage(currentPage + 1, true);
    });

    function updateMobileCarousel(animate) {
      if (!isMobile()) return;

      const start = currentPage * pageSize;
      const end = Math.min(start + pageSize, articles.length);
      const visibleArticles = articles.slice(start, end);
      const activeArticle = visibleArticles[mobileIndex];
      if (!activeArticle) return;

      visibleArticles.forEach(function (article, index) {
        article.classList.toggle('is-mobile-active', index === mobileIndex);
        article.style.transition = animate ? 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
        article.style.transform = 'translate3d(' + ((index - mobileIndex) * 100) + '%, 0, 0)';
      });

      articleViewport.style.height = activeArticle.offsetHeight + 'px';
      mobileStatus.textContent = (mobileIndex + 1) + ' / ' + visibleArticles.length;
      mobilePrevious.disabled = mobileIndex === 0;
      mobileNext.disabled = mobileIndex === visibleArticles.length - 1;
    }

    function resetMobileCarousel() {
      articleViewport.style.height = '';
      articles.forEach(function (article) {
        article.classList.remove('is-mobile-active');
        article.style.transition = '';
        article.style.transform = '';
      });
    }

    function moveMobileCarousel(index, animate) {
      const start = currentPage * pageSize;
      const count = Math.min(pageSize, articles.length - start);
      mobileIndex = Math.max(0, Math.min(index, count - 1));
      updateMobileCarousel(animate);
    }

    mobilePrevious.addEventListener('click', function () {
      moveMobileCarousel(mobileIndex - 1, true);
    });

    mobileNext.addEventListener('click', function () {
      moveMobileCarousel(mobileIndex + 1, true);
    });

    articleViewport.addEventListener('pointerdown', function (event) {
      if (!isMobile() || event.pointerType === 'mouse' && event.button !== 0) return;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragDeltaX = 0;
      isDragging = true;
      isHorizontalDrag = false;
      articleViewport.setPointerCapture(event.pointerId);
    });

    articleViewport.addEventListener('pointermove', function (event) {
      if (!isDragging || !isMobile()) return;

      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      if (!isHorizontalDrag && Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      if (!isHorizontalDrag && Math.abs(deltaY) > Math.abs(deltaX)) {
        isDragging = false;
        return;
      }

      isHorizontalDrag = true;
      event.preventDefault();
      dragDeltaX = deltaX;
      const start = currentPage * pageSize;
      const count = Math.min(pageSize, articles.length - start);
      const atStart = mobileIndex === 0 && deltaX > 0;
      const atEnd = mobileIndex === count - 1 && deltaX < 0;
      const resistance = atStart || atEnd ? 0.35 : 1;

      articles.slice(start, start + count).forEach(function (article, index) {
        article.style.transition = 'none';
        article.style.transform = 'translate3d(calc(' + ((index - mobileIndex) * 100) + '% + ' + (deltaX * resistance) + 'px), 0, 0)';
      });
    });

    function finishMobileDrag() {
      if (!isDragging) return;
      isDragging = false;
      if (!isHorizontalDrag) return;

      const threshold = articleViewport.clientWidth * 0.18;
      const nextIndex = Math.abs(dragDeltaX) >= threshold
        ? mobileIndex + (dragDeltaX < 0 ? 1 : -1)
        : mobileIndex;
      moveMobileCarousel(nextIndex, true);
      dragDeltaX = 0;
      isHorizontalDrag = false;
    }

    articleViewport.addEventListener('pointerup', finishMobileDrag);
    articleViewport.addEventListener('pointercancel', finishMobileDrag);

    window.addEventListener('resize', function () {
      if (isMobile()) {
        articles.forEach(function (article, index) {
          article.open = index >= currentPage * pageSize && index < (currentPage + 1) * pageSize;
        });
        updateMobileCarousel(false);
      } else {
        renderPage(currentPage, false);
      }
    });

    function renderHashTarget() {
      const target = getHashArticle();
      const targetIndex = target ? articles.indexOf(target) : 0;
      renderPage(Math.floor(targetIndex / pageSize), false);
      if (target && !target.hidden) {
        target.open = true;
        window.requestAnimationFrame(function () {
          target.scrollIntoView({ block: 'start' });
        });
      }
    }

    renderHashTarget();
    window.addEventListener('hashchange', renderHashTarget);
  }

  function init() {
    setupMenu();
    setupNewsPagination();
    const switchers = [
      setupSwitcher('.medical', '.medical-item'),
      setupSwitcher('.staff', '.staff-item'),
      setupSwitcher('.about-detail-staff', '.about-staff-card')
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
