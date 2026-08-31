import { defineCollection } from 'astro:content';
import { defineConfig } from 'astro/config'
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { getPermalinkError } from './lib/site-routes';

function validatePermalink(permalink: string, context: z.RefinementCtx): void {
  const message = getPermalinkError(permalink);

  if (message !== undefined) {
    context.addIssue({
      code: 'custom',
      message: message,
    });
  }
}

const nonEmptyText = z
  .string('必须是文本')
  .trim()
  .min(1, '不能为空');

const articlesSchema = z.object({
  title: z
    .string('文章标题 title 必须是文本，例如：title: 我的文章')
    .trim()
    .min(1, '文章标题 title 不能为空'),
  categories: z
    .array(nonEmptyText, '文章分类 categories 必须是列表，例如：categories: [技术, 随笔]')
    .default([]),
  date: z.coerce.date(
    '发布日期 date 缺失或格式不正确，例如：date: 2026-01-30',
  ),
  draft: z
    .boolean('草稿状态 draft 必须是 true 或 false')
    .default(false),
  author: z
    .string('文章作者 author 必须是文本')
    .trim()
    .min(1, '文章作者 author 不能为空；不需要作者时请删除该字段')
    .nullish(),
  tags: z
    .array(nonEmptyText, '文章标签 tags 必须是列表，例如：tags: [Astro, Markdown]')
    .default([]),
  permalink: z
    .string('文章路径 permalink 必须是文本')
    .superRefine(validatePermalink),
});

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/articles',
    retainBody: true,
  }),
  schema: articlesSchema,
});

export const collections = { articles };

export default defineConfig({
  compressHTML: true,
})