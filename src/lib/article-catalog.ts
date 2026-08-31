import { createHash } from 'node:crypto';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { getPaginationConfig } from './site-config';

export type Article = CollectionEntry<'articles'>;

export interface ArticleCategory {
  name: string;
  uuid: string;
  articles: Article[];
}

export interface HomeArticleListPage {
  currentPage: number;
  totalPages: number;
  articles: Article[];
}

export type HomeArticleListPages = [
  HomeArticleListPage,
  ...HomeArticleListPage[],
];

export interface PublishedArticleCounts {
  articleCount: number;
  wordCount: number;
}

export interface SidebarDirectory {
  type: 'directory';
  name: string;
  path: string;
  children: SidebarNode[];
}

export interface SidebarArticle {
  type: 'article';
  id: string;
  title: string;
  permalink: string;
}

export type SidebarNode = SidebarDirectory | SidebarArticle;

const paginationConfig = getPaginationConfig();
const articlesPerPage = paginationConfig.articlesPerPage;

let publishedArticlesPromise: Promise<Article[]> | undefined;
let articleCategoriesPromise: Promise<ArticleCategory[]> | undefined;
let homeArticleListPagesPromise: Promise<HomeArticleListPages> | undefined;
let articleSidebarNodesPromise: Promise<SidebarNode[]> | undefined;
let publishedArticleCountsPromise: Promise<PublishedArticleCounts> | undefined;

function isPublished(article: Article): boolean {
  return article.data.draft === false;
}

function compareArticles(a: Article, b: Article): number {
  const dateDifference = b.data.date.getTime() - a.data.date.getTime();

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return a.id.localeCompare(b.id);
}

function validateUniquePermalinks(articles: Article[]): void {
  const articlesByPermalink = new Map<string, Article>();

  for (const article of articles) {
    const existingArticle = articlesByPermalink.get(article.data.permalink);

    if (existingArticle !== undefined) {
      throw new Error(
        `重复的 permalink "${article.data.permalink}"：` +
          `"${existingArticle.id}" 和 "${article.id}"`,
      );
    }

    articlesByPermalink.set(article.data.permalink, article);
  }
}

async function loadPublishedArticles(): Promise<Article[]> {
  const allArticles = await getCollection('articles');

  validateUniquePermalinks(allArticles);

  return allArticles.filter(isPublished).sort(compareArticles);
}

export function getPublishedArticles(): Promise<Article[]> {
  if (publishedArticlesPromise === undefined) {
    publishedArticlesPromise = loadPublishedArticles();
  }

  return publishedArticlesPromise;
}

function getCategoryUuid(categoryName: string): string {
  return createHash('sha1').update(categoryName).digest('hex').slice(0, 16);
}

function buildArticleCategories(articles: Article[]): ArticleCategory[] {
  const categoryArticles = new Map<string, Article[]>();

  for (const article of articles) {
    for (const categoryName of article.data.categories) {
      let categorizedArticles = categoryArticles.get(categoryName);

      if (categorizedArticles === undefined) {
        categorizedArticles = [];
        categoryArticles.set(categoryName, categorizedArticles);
      }

      categorizedArticles.push(article);
    }
  }

  const categories: ArticleCategory[] = [];

  for (const [name, categorizedArticles] of categoryArticles) {
    categories.push({
      name: name,
      uuid: getCategoryUuid(name),
      articles: categorizedArticles,
    });
  }

  categories.sort(function (a, b) {
    const countDifference = b.articles.length - a.articles.length;

    if (countDifference !== 0) {
      return countDifference;
    }

    return a.name.localeCompare(b.name, 'zh-CN');
  });

  return categories;
}

async function loadArticleCategories(): Promise<ArticleCategory[]> {
  const articles = await getPublishedArticles();

  return buildArticleCategories(articles);
}

export function getArticleCategories(): Promise<ArticleCategory[]> {
  if (articleCategoriesPromise === undefined) {
    articleCategoriesPromise = loadArticleCategories();
  }

  return articleCategoriesPromise;
}

function buildHomeArticleListPage(
  articles: Article[],
  currentPage: number,
  totalPages: number,
): HomeArticleListPage {
  const start = (currentPage - 1) * articlesPerPage;

  return {
    currentPage: currentPage,
    totalPages: totalPages,
    articles: articles.slice(start, start + articlesPerPage),
  };
}

function buildHomeArticleListPages(
  articles: Article[],
): HomeArticleListPages {
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const homeArticleListPages: HomeArticleListPages = [
    buildHomeArticleListPage(articles, 1, totalPages),
  ];

  for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
    homeArticleListPages.push(
      buildHomeArticleListPage(articles, currentPage, totalPages),
    );
  }

  return homeArticleListPages;
}

async function loadHomeArticleListPages(): Promise<HomeArticleListPages> {
  const articles = await getPublishedArticles();

  return buildHomeArticleListPages(articles);
}

export function getHomeArticleListPages(): Promise<HomeArticleListPages> {
  if (homeArticleListPagesPromise === undefined) {
    homeArticleListPagesPromise = loadHomeArticleListPages();
  }

  return homeArticleListPagesPromise;
}

function removeOrderPrefix(value: string): string {
  return value.replace(/^\d{2}\.?/, '');
}

function getNodePath(node: SidebarNode): string {
  if (node.type === 'directory') {
    return node.path;
  }

  return node.id;
}

function compareSidebarNodes(a: SidebarNode, b: SidebarNode): number {
  return getNodePath(a).localeCompare(getNodePath(b));
}

function findDirectory(
  children: SidebarNode[],
  path: string,
): SidebarDirectory | undefined {
  for (const child of children) {
    if (child.type === 'directory' && child.path === path) {
      return child;
    }
  }

  return undefined;
}

function sortSidebarNodes(nodes: SidebarNode[]): void {
  nodes.sort(compareSidebarNodes);

  for (const node of nodes) {
    if (node.type === 'directory') {
      sortSidebarNodes(node.children);
    }
  }
}

function buildSidebarTree(articles: Article[]): SidebarNode[] {
  const root: SidebarNode[] = [];

  for (const article of articles) {
    const parts = article.id.split('/');
    const fileName = parts.pop();

    if (fileName === undefined) {
      continue;
    }

    let children = root;
    let directoryPath = '';

    for (const part of parts) {
      if (directoryPath.length > 0) {
        directoryPath += '/';
      }
      directoryPath += part;

      let directory = findDirectory(children, directoryPath);
      if (directory === undefined) {
        directory = {
          type: 'directory',
          name: removeOrderPrefix(part),
          path: directoryPath,
          children: [],
        };
        children.push(directory);
      }
      children = directory.children;
    }

    children.push({
      type: 'article',
      id: article.id,
      title: article.data.title,
      permalink: article.data.permalink,
    });
  }

  sortSidebarNodes(root);

  return root;
}

async function loadArticleSidebarNodes(): Promise<SidebarNode[]> {
  const articles = await getPublishedArticles();

  return buildSidebarTree(articles);
}

export function getArticleSidebarNodes(): Promise<SidebarNode[]> {
  if (articleSidebarNodesPromise === undefined) {
    articleSidebarNodesPromise = loadArticleSidebarNodes();
  }

  return articleSidebarNodesPromise;
}

function countWords(markdown: string): number {
  const content = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^:{3,}.*$/gm, '')
    .replace(/[`*_>#~-]/g, ' ')
    .replace(/\s/g, '');

  return content.length;
}

function buildPublishedArticleCounts(
  articles: Article[],
): PublishedArticleCounts {
  let wordCount = 0;

  for (const article of articles) {
    if (article.body !== undefined) {
      wordCount += countWords(article.body);
    }
  }

  return {
    articleCount: articles.length,
    wordCount: wordCount,
  };
}

async function loadPublishedArticleCounts(): Promise<PublishedArticleCounts> {
  const articles = await getPublishedArticles();

  return buildPublishedArticleCounts(articles);
}

export function getPublishedArticleCounts(): Promise<PublishedArticleCounts> {
  if (publishedArticleCountsPromise === undefined) {
    publishedArticleCountsPromise = loadPublishedArticleCounts();
  }

  return publishedArticleCountsPromise;
}
