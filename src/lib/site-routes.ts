const systemRouteSegments = {
  pagination: 'neospage',
  categories: 'categories',
  search: 'sss',
  articleSidebar: 'article-sidebar',
};

const articleNavigationPrefix = 'pages';
let baseUrl = import.meta.env.BASE_URL;

if (baseUrl.endsWith('/') === false) {
  baseUrl += '/';
}

const reservedPathPrefixes = new Set([
  systemRouteSegments.pagination,
  'index',
  systemRouteSegments.categories,
  systemRouteSegments.search,
  systemRouteSegments.articleSidebar,
]);

function isLowercaseLetter(character: string): boolean {
  if (character >= 'a' && character <= 'z') {
    return true;
  }

  return false;
}

function isDigit(character: string): boolean {
  if (character >= '0' && character <= '9') {
    return true;
  }

  return false;
}

function getSiteRelativePathname(pathname: string): string {
  const normalizedPathname = normalizeSitePathname(pathname);

  if (baseUrl === '/') {
    return normalizedPathname;
  }

  const basePathname = normalizeSitePathname(baseUrl);

  if (normalizedPathname === basePathname) {
    return '/';
  }

  if (normalizedPathname.startsWith(`${basePathname}/`) === true) {
    return normalizedPathname.slice(basePathname.length);
  }

  return normalizedPathname;
}

function getFirstPathSegment(pathname: string): string {
  const siteRelativePathname = getSiteRelativePathname(pathname);
  const segments = siteRelativePathname.split('/');

  if (segments.length < 2) {
    return '';
  }

  return segments[1];
}

export function normalizeSitePathname(pathname: string): string {
  let normalizedPathname = pathname;

  while (
    normalizedPathname.length > 1 &&
    normalizedPathname.endsWith('/') === true
  ) {
    normalizedPathname = normalizedPathname.slice(0, -1);
  }

  return normalizedPathname;
}

export function getSiteUrl(pathname: string): string {
  if (pathname.startsWith('/') === false) {
    return pathname;
  }

  return `${baseUrl}${pathname.slice(1)}`;
}

export function getHomeUrl(): string {
  return baseUrl;
}

export function getArticleUrl(permalink: string): string {
  return getSiteUrl(`/${permalink}/`);
}

export function getArticlePageUrl(page: number): string {
  if (Number.isInteger(page) === false || page < 1) {
    throw new Error('文章页码必须是大于等于 1 的整数');
  }

  if (page === 1) {
    return getHomeUrl();
  }

  return getSiteUrl(`/${systemRouteSegments.pagination}/${page}/`);
}

export function getCategoryUrl(categoryUuid: string): string {
  return getSiteUrl(`/${systemRouteSegments.categories}/${categoryUuid}/`);
}

export function getArticleSidebarUrl(): string {
  return getSiteUrl(`/${systemRouteSegments.articleSidebar}/`);
}

export function isActiveNavbarLink(
  pathname: string,
  href: string,
): boolean {
  if (href.startsWith('/') === false) {
    return false;
  }

  const normalizedPathname = normalizeSitePathname(pathname);
  const hrefWithoutHash = href.split('#', 1)[0];
  const hrefPathname = normalizeSitePathname(hrefWithoutHash);

  if (normalizedPathname === hrefPathname) {
    return true;
  }

  if (
    getFirstPathSegment(normalizedPathname) === articleNavigationPrefix &&
    getFirstPathSegment(hrefPathname) === articleNavigationPrefix
  ) {
    return true;
  }

  return false;
}

export function getPermalinkError(permalink: string): string | undefined {
  if (permalink.length === 0) {
    return 'permalink 不能为空';
  }

  const segments = permalink.split('/');

  for (const segment of segments) {
    if (segment.length === 0) {
      return 'permalink 不能以 / 开头或结尾，也不能包含连续的 //';
    }

    if (segment[0] === '-' || segment[segment.length - 1] === '-') {
      return `路径段 "${segment}" 不能以连字符开头或结尾`;
    }

    for (const character of segment) {
      const isAllowed =
        isLowercaseLetter(character) ||
        isDigit(character) ||
        character === '-';

      if (isAllowed === false) {
        return `字符 "${character}" 不合法；只允许小写英文字母、数字、连字符和用于分隔路径的 /`;
      }
    }
  }

  if (reservedPathPrefixes.has(segments[0])) {
    return `permalink 不能使用保留路径前缀 "${segments[0]}"`;
  }

  return undefined;
}
