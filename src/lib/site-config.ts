import { siteConfigInput } from '../../config.js';

type ConfigObject = Record<string, unknown>;

export interface SiteBasicInfo {
  title: string;
  description: string;
  language: string;
  establishedAt: string;
}

export interface SiteOwner {
  name: string;
  avatar: string;
}

export interface NavbarLink {
  label: string;
  href: string;
}

interface ImageNavbarBrand {
  kind: 'image';
  src: string;
  width: string;
}

interface TextNavbarBrand {
  kind: 'text';
  text: string;
}

export type NavbarBrand = ImageNavbarBrand | TextNavbarBrand;

export interface NavbarConfig {
  brand: NavbarBrand;
  name: string;
  links: readonly NavbarLink[];
}

export interface PaginationConfig {
  articlesPerPage: number;
  position: 'UP' | 'DOWN';
}

export interface SiteInfoLabels {
  ariaLabel: string;
  avatarAltSuffix: string;
  label: string;
  articleCountLabel: string;
  articleCountUnit: string;
  runtimeLabel: string;
  runtimeLessThanOneDayLabel: string;
  runtimeUnit: string;
  wordCountLabel: string;
  wordCountUnit: string;
}

export interface SiteInfoConfig {
  owner: SiteOwner;
  establishedAt: string;
  language: string;
  labels: SiteInfoLabels;
}

export interface AboutMeLink {
  label: string;
  href: string;
  icon: string;
}

export interface AboutMeConfig {
  bio: string;
  links: readonly AboutMeLink[];
}

export interface Milestone {
  date: string;
  title: string;
  description?: string;
}

function getConfigObject(value: unknown, path: string): ConfigObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value) === true) {
    throw new Error(`站点配置 ${path} 必须是对象`);
  }

  return value as ConfigObject;
}

function getConfigList(value: unknown, path: string): unknown[] {
  if (Array.isArray(value) === false) {
    throw new Error(`站点配置 ${path} 必须是列表`);
  }

  return value;
}

function getText(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`站点配置 ${path} 必须是文本`);
  }

  return value.trim();
}

function getRequiredText(value: unknown, path: string): string {
  const text = getText(value, path);

  if (text.length === 0) {
    throw new Error(`站点配置 ${path} 不能为空`);
  }

  return text;
}

function getOptionalText(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return getRequiredText(value, path);
}

function getLanguage(value: unknown, path: string): string {
  const language = getRequiredText(value, path);
  let supportedLanguages: string[];

  try {
    supportedLanguages = Intl.DateTimeFormat.supportedLocalesOf([language]);
  } catch (_error) {
    throw new Error(`站点配置 ${path} 不是有效的语言标识`);
  }

  if (supportedLanguages.length === 0) {
    throw new Error(`站点配置 ${path} 不是受支持的语言标识`);
  }

  return language;
}

function getEstablishedAt(value: unknown, path: string): string {
  const establishedAt = getRequiredText(value, path);

  if (Number.isFinite(Date.parse(establishedAt)) === false) {
    throw new Error(`站点配置 ${path} 必须是有效日期`);
  }

  return establishedAt;
}

function getArticlesPerPage(value: unknown): number {
  if (typeof value !== 'number' || Number.isInteger(value) === false) {
    throw new Error('站点配置 pagination.articlesPerPage 必须是整数');
  }

  if (value < 10) {
    throw new Error('站点配置 pagination.articlesPerPage 必须大于等于 10');
  }

  return value;
}

function getPaginationPosition(value: unknown): 'UP' | 'DOWN' {
  if (value === 'UP' || value === 'DOWN') {
    return value;
  }

  throw new Error('站点配置 pagination.position 必须是 UP 或 DOWN');
}

function getNavbarBrand(value: unknown): NavbarBrand {
  const brand = getConfigObject(value, 'navbar.brand');
  const kind = getRequiredText(brand.kind, 'navbar.brand.kind');

  if (kind === 'image') {
    return Object.freeze({
      kind: 'image',
      src: getRequiredText(brand.src, 'navbar.brand.src'),
      width: getRequiredText(brand.width, 'navbar.brand.width'),
    });
  }

  if (kind === 'text') {
    return Object.freeze({
      kind: 'text',
      text: getRequiredText(brand.text, 'navbar.brand.text'),
    });
  }

  throw new Error('站点配置 navbar.brand.kind 必须是 image 或 text');
}

function getNavbarLinks(value: unknown): readonly NavbarLink[] {
  const linkInputs = getConfigList(value, 'navbar.links');
  const links: NavbarLink[] = [];

  for (let index = 0; index < linkInputs.length; index += 1) {
    const link = getConfigObject(linkInputs[index], `navbar.links[${index}]`);

    links.push(Object.freeze({
      label: getRequiredText(link.label, `navbar.links[${index}].label`),
      href: getRequiredText(link.href, `navbar.links[${index}].href`),
    }));
  }

  return Object.freeze(links);
}

function getAboutMeLinks(value: unknown): readonly AboutMeLink[] {
  const linkInputs = getConfigList(value, 'aboutMe.links');
  const links: AboutMeLink[] = [];

  for (let index = 0; index < linkInputs.length; index += 1) {
    const link = getConfigObject(linkInputs[index], `aboutMe.links[${index}]`);

    links.push(Object.freeze({
      label: getRequiredText(link.label, `aboutMe.links[${index}].label`),
      href: getRequiredText(link.href, `aboutMe.links[${index}].href`),
      icon: getRequiredText(link.icon, `aboutMe.links[${index}].icon`),
    }));
  }

  return Object.freeze(links);
}

function getMilestoneList(value: unknown): readonly Milestone[] {
  const milestoneInputs = getConfigList(value, 'milestones');
  const milestones: Milestone[] = [];

  for (let index = 0; index < milestoneInputs.length; index += 1) {
    const milestone = getConfigObject(
      milestoneInputs[index],
      `milestones[${index}]`,
    );
    const description = getOptionalText(
      milestone.description,
      `milestones[${index}].description`,
    );

    if (description === undefined) {
      milestones.push(Object.freeze({
        date: getRequiredText(milestone.date, `milestones[${index}].date`),
        title: getRequiredText(milestone.title, `milestones[${index}].title`),
      }));
    } else {
      milestones.push(Object.freeze({
        date: getRequiredText(milestone.date, `milestones[${index}].date`),
        title: getRequiredText(milestone.title, `milestones[${index}].title`),
        description: description,
      }));
    }
  }

  return Object.freeze(milestones);
}

const input = getConfigObject(siteConfigInput, '根对象');
const siteInput = getConfigObject(input.site, 'site');
const ownerInput = getConfigObject(input.owner, 'owner');
const navbarInput = getConfigObject(input.navbar, 'navbar');
const paginationInput = getConfigObject(input.pagination, 'pagination');
const siteInfoInput = getConfigObject(input.siteInfoCard, 'siteInfoCard');
const aboutMeInput = getConfigObject(input.aboutMe, 'aboutMe');

const siteBasicInfo: SiteBasicInfo = Object.freeze({
  title: getRequiredText(siteInput.title, 'site.title'),
  description: getRequiredText(siteInput.description, 'site.description'),
  language: getLanguage(siteInput.language, 'site.language'),
  establishedAt: getEstablishedAt(siteInput.establishedAt, 'site.establishedAt'),
});

const siteOwner: SiteOwner = Object.freeze({
  name: getRequiredText(ownerInput.name, 'owner.name'),
  avatar: getRequiredText(ownerInput.avatar, 'owner.avatar'),
});

const navbarConfig: NavbarConfig = Object.freeze({
  brand: getNavbarBrand(navbarInput.brand),
  name: getText(navbarInput.name, 'navbar.name'),
  links: getNavbarLinks(navbarInput.links),
});

const paginationConfig: PaginationConfig = Object.freeze({
  articlesPerPage: getArticlesPerPage(paginationInput.articlesPerPage),
  position: getPaginationPosition(paginationInput.position),
});

const siteInfoLabels: SiteInfoLabels = Object.freeze({
  ariaLabel: getRequiredText(siteInfoInput.ariaLabel, 'siteInfoCard.ariaLabel'),
  avatarAltSuffix: getRequiredText(
    siteInfoInput.avatarAltSuffix,
    'siteInfoCard.avatarAltSuffix',
  ),
  label: getRequiredText(siteInfoInput.label, 'siteInfoCard.label'),
  articleCountLabel: getRequiredText(
    siteInfoInput.articleCountLabel,
    'siteInfoCard.articleCountLabel',
  ),
  articleCountUnit: getRequiredText(
    siteInfoInput.articleCountUnit,
    'siteInfoCard.articleCountUnit',
  ),
  runtimeLabel: getRequiredText(
    siteInfoInput.runtimeLabel,
    'siteInfoCard.runtimeLabel',
  ),
  runtimeLessThanOneDayLabel: getRequiredText(
    siteInfoInput.runtimeLessThanOneDayLabel,
    'siteInfoCard.runtimeLessThanOneDayLabel',
  ),
  runtimeUnit: getRequiredText(
    siteInfoInput.runtimeUnit,
    'siteInfoCard.runtimeUnit',
  ),
  wordCountLabel: getRequiredText(
    siteInfoInput.wordCountLabel,
    'siteInfoCard.wordCountLabel',
  ),
  wordCountUnit: getRequiredText(
    siteInfoInput.wordCountUnit,
    'siteInfoCard.wordCountUnit',
  ),
});

const siteInfoConfig: SiteInfoConfig = Object.freeze({
  owner: siteOwner,
  establishedAt: siteBasicInfo.establishedAt,
  language: siteBasicInfo.language,
  labels: siteInfoLabels,
});

const aboutMeConfig: AboutMeConfig = Object.freeze({
  bio: getRequiredText(aboutMeInput.bio, 'aboutMe.bio'),
  links: getAboutMeLinks(aboutMeInput.links),
});

const milestones = getMilestoneList(input.milestones);

export function getSiteBasicInfo(): SiteBasicInfo {
  return siteBasicInfo;
}

export function getSiteOwner(): SiteOwner {
  return siteOwner;
}

export function getNavbarConfig(): NavbarConfig {
  return navbarConfig;
}

export function getPaginationConfig(): PaginationConfig {
  return paginationConfig;
}

export function getSiteInfoConfig(): SiteInfoConfig {
  return siteInfoConfig;
}

export function getAboutMe(): AboutMeConfig {
  return aboutMeConfig;
}

export function getMilestones(): readonly Milestone[] {
  return milestones;
}
