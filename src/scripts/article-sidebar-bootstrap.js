(function () {
  const sidebarOpenStorageKey = 'sidebarIsopen';
  const sidebarScrollStorageKey = 'neos-article-sidebar-scroll-top';
  const sidebarContentStorageKey = 'neos-article-sidebar-content';
  const sidebarContentSavedAtStorageKey = 'neos-article-sidebar-content-saved-at';
  const sidebarContentMaxAge = 24 * 60 * 60 * 1000;

  function normalizePathname(pathname) {
    let normalizedPathname = pathname;

    while (
      normalizedPathname.length > 1 &&
      normalizedPathname.endsWith('/') === true
    ) {
      normalizedPathname = normalizedPathname.slice(0, -1);
    }

    return normalizedPathname;
  }

  function prepareSidebarTree(content) {
    const currentPathname = normalizePathname(window.location.pathname);
    const sidebarLinks = content.querySelectorAll('a');
    let currentLink = null;

    for (const link of sidebarLinks) {
      let sidebarPath = link.dataset.sidebarPath;

      if (sidebarPath === undefined) {
        const href = link.getAttribute('href');

        if (href !== null) {
          sidebarPath = href;
        }
      }

      link.removeAttribute('aria-current');

      if (
        sidebarPath !== undefined &&
        normalizePathname(sidebarPath) === currentPathname
      ) {
        link.setAttribute('aria-current', 'page');
        currentLink = link;
      }
    }

    if (currentLink === null) {
      return;
    }

    let parent = currentLink.parentElement;
    while (parent !== null && parent !== content) {
      if (parent instanceof HTMLDetailsElement) {
        parent.open = true;
      }
      parent = parent.parentElement;
    }
  }

  function restoreSidebarScrollTop(panel) {
    const savedScrollTop = sessionStorage.getItem(sidebarScrollStorageKey);

    if (savedScrollTop === null) {
      return;
    }

    const parsedScrollTop = Number(savedScrollTop);

    if (Number.isFinite(parsedScrollTop) === true) {
      panel.scrollTop = parsedScrollTop;
    }
  }

  try {
    if (sessionStorage.getItem(sidebarOpenStorageKey) !== 'true') {
      return;
    }

    const savedContent = sessionStorage.getItem(sidebarContentStorageKey);
    const savedAt = sessionStorage.getItem(sidebarContentSavedAtStorageKey);

    if (savedContent === null || savedAt === null) {
      sessionStorage.removeItem(sidebarContentStorageKey);
      sessionStorage.removeItem(sidebarContentSavedAtStorageKey);
      return;
    }

    const parsedSavedAt = Number(savedAt);
    const contentAge = Date.now() - parsedSavedAt;

    if (
      Number.isFinite(parsedSavedAt) === false ||
      contentAge < 0 ||
      contentAge >= sidebarContentMaxAge
    ) {
      sessionStorage.removeItem(sidebarContentStorageKey);
      sessionStorage.removeItem(sidebarContentSavedAtStorageKey);
      return;
    }

    const sidebar = document.querySelector('.article-sidebar');

    if (sidebar === null) {
      return;
    }

    const content = sidebar.querySelector('[data-sidebar-content]');
    const panel = sidebar.querySelector('.article-sidebar-panel');

    if (content === null || panel === null) {
      return;
    }

    content.innerHTML = savedContent;
    prepareSidebarTree(content);
    restoreSidebarScrollTop(panel);
    content.setAttribute('data-sidebar-content-restored', 'true');
    content.setAttribute('data-sidebar-content-ready', 'true');
    content.setAttribute('data-sidebar-scroll-restored', 'true');
  } catch (_error) {
    // 某些隐私模式可能禁用 sessionStorage，此时由常规脚本加载目录。
  }
})();
