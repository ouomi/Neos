import { articleSidebarOpenStorageKey } from '../lib/article-sidebar-state';
import { normalizeSitePathname } from '../lib/site-routes';

const sidebarScrollStorageKey = 'neos-article-sidebar-scroll-top';
const sidebarContentStorageKey = 'neos-article-sidebar-content';
const sidebarContentSavedAtStorageKey = 'neos-article-sidebar-content-saved-at';
const sidebarContentMaxAge = 24 * 60 * 60 * 1000;


function getSavedSidebarContent(): string | null {
  try {
    const savedContent = sessionStorage.getItem(sidebarContentStorageKey);
    const savedAt = sessionStorage.getItem(sidebarContentSavedAtStorageKey);

    if (savedContent === null || savedAt === null) {
      sessionStorage.removeItem(sidebarContentStorageKey);
      sessionStorage.removeItem(sidebarContentSavedAtStorageKey);
      return null;
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
      return null;
    }

    return savedContent;
  } catch (_error) {
    return null;
  }
}

function saveSidebarContent(html: string): void {
  try {
    sessionStorage.setItem(sidebarContentStorageKey, html);
    sessionStorage.setItem(sidebarContentSavedAtStorageKey, String(Date.now()));
  } catch (_error) {
    // 目录缓存失败时仍可依靠普通网络请求加载。
  }
}

function getSavedSidebarScrollTop(): number {
  try {
    const savedScrollTop = sessionStorage.getItem(sidebarScrollStorageKey);

    if (savedScrollTop !== null) {
      const parsedScrollTop = Number(savedScrollTop);

      if (Number.isFinite(parsedScrollTop) === true) {
        return parsedScrollTop;
      }
    }
  } catch (_error) {
    return 0;
  }

  return 0;
}

function saveSidebarScrollTop(panel: HTMLElement): void {
  try {
    sessionStorage.setItem(sidebarScrollStorageKey, String(panel.scrollTop));
  } catch (_error) {
    // 某些隐私模式可能禁用 sessionStorage，此时不影响侧边栏使用。
  }
}

function getSavedSidebarOpen(): boolean {
  try {
    return sessionStorage.getItem(articleSidebarOpenStorageKey) === 'true';
  } catch (_error) {
    return false;
  }
}

function saveSidebarOpen(sidebarIsOpen: boolean): void {
  try {
    sessionStorage.setItem(articleSidebarOpenStorageKey, String(sidebarIsOpen));
  } catch (_error) {
    // 某些隐私模式可能禁用 sessionStorage，此时不影响侧边栏使用。
  }
}

function prepareSidebarTree(content: HTMLElement): void {
  const currentPathname = normalizeSitePathname(window.location.pathname);
  const sidebarLinks = content.querySelectorAll<HTMLAnchorElement>('a');
  let currentLink: HTMLAnchorElement | null = null;

  for (const link of sidebarLinks) {
    let sidebarPath = link.dataset.sidebarPath;

    if (sidebarPath === undefined) {
      sidebarPath = link.getAttribute('href') ?? undefined;
    }

    link.removeAttribute('aria-current');

    if (
      sidebarPath !== undefined &&
      normalizeSitePathname(sidebarPath) === currentPathname
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

function getSidebarEndpoint(sidebar: HTMLElement): string | null {
  const endpoint = sidebar.dataset.sidebarEndpoint;

  if (endpoint === undefined || endpoint.length === 0) {
    return null;
  }

  return endpoint;
}

function mountArticleSidebar(
  sidebar: HTMLElement,
  toggle: HTMLButtonElement,
  panel: HTMLElement,
  content: HTMLElement,
): void {
  let sidebarLoadPromise: Promise<void> | null = null;

  function restoreSidebarScrollTop(): void {
    if (content.getAttribute('data-sidebar-scroll-restored') === 'true') {
      return;
    }

    panel.scrollTop = getSavedSidebarScrollTop();
    content.setAttribute('data-sidebar-scroll-restored', 'true');
  }

  function prepareLoadedSidebarTree(): void {
    prepareSidebarTree(content);
    content.setAttribute('data-sidebar-content-ready', 'true');
    restoreSidebarScrollTop();
  }

  function setSidebarState(sidebarIsOpen: boolean): void {
    saveSidebarOpen(sidebarIsOpen);

    if (sidebarIsOpen === true) {
      document.documentElement.dataset.sidebarIsopen = 'true';
      sidebar.dataset.state = 'open';
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', '收起文章目录');
      toggle.textContent = '‹';
      panel.setAttribute('aria-hidden', 'false');
      panel.removeAttribute('inert');
      return;
    }

    document.documentElement.removeAttribute('data-sidebar-isopen');
    sidebar.dataset.state = 'closed';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '展开文章目录');
    toggle.textContent = '›';
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('inert', '');
  }

  function loadSidebarTree(): Promise<void> {
    if (sidebarLoadPromise !== null) {
      return sidebarLoadPromise;
    }

    if (content.getAttribute('data-sidebar-content-ready') === 'true') {
      restoreSidebarScrollTop();
      sidebarLoadPromise = Promise.resolve();
      return sidebarLoadPromise;
    }

    if (content.getAttribute('data-sidebar-content-restored') === 'true') {
      prepareLoadedSidebarTree();
      sidebarLoadPromise = Promise.resolve();
      return sidebarLoadPromise;
    }

    const savedContent = getSavedSidebarContent();

    if (savedContent !== null) {
      content.innerHTML = savedContent;
      prepareLoadedSidebarTree();
      sidebarLoadPromise = Promise.resolve();
      return sidebarLoadPromise;
    }

    const sidebarEndpoint = getSidebarEndpoint(sidebar);
    if (sidebarEndpoint === null) {
      content.innerHTML = '<p class="article-sidebar-status">文章目录加载失败，请收起后重试</p>';
      return Promise.resolve();
    }

    content.innerHTML = '<p class="article-sidebar-status">正在加载文章目录…</p>';
    sidebarLoadPromise = fetch(sidebarEndpoint)
      .then(function (response) {
        if (response.ok === false) {
          throw new Error(`加载文章目录失败：${response.status}`);
        }

        return response.text();
      })
      .then(function (html) {
        saveSidebarContent(html);
        content.innerHTML = html;
        prepareLoadedSidebarTree();
      })
      .catch(function (_error) {
        sidebarLoadPromise = null;
        content.innerHTML = '<p class="article-sidebar-status">文章目录加载失败，请收起后重试</p>';
      });

    return sidebarLoadPromise;
  }

  const sidebarIsOpen = getSavedSidebarOpen();
  setSidebarState(sidebarIsOpen);
  sidebar.removeAttribute('data-initial');

  if (sidebarIsOpen === true) {
    loadSidebarTree();
  }

  panel.addEventListener('scroll', function () {
    saveSidebarScrollTop(panel);
  }, { passive: true });

  content.addEventListener('click', function (event) {
    const target = event.target;

    if (target instanceof Element === false) {
      return;
    }

    if (target.closest('a') !== null) {
      saveSidebarScrollTop(panel);
    }
  });

  toggle.addEventListener('click', function () {
    const nextSidebarIsOpen = sidebar.dataset.state !== 'open';
    setSidebarState(nextSidebarIsOpen);

    if (nextSidebarIsOpen === true) {
      loadSidebarTree();
    }
  });
}

const sidebar = document.querySelector<HTMLElement>('.article-sidebar');
const toggle = document.querySelector<HTMLButtonElement>('.article-sidebar-toggle');
const panel = document.querySelector<HTMLElement>('.article-sidebar-panel');
const content = document.querySelector<HTMLElement>('[data-sidebar-content]');

if (sidebar !== null && toggle !== null && panel !== null && content !== null) {
  mountArticleSidebar(sidebar, toggle, panel, content);
}
