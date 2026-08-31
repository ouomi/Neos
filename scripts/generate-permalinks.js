#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';

function collectMarkdownFiles(path, files) {
  const metadata = statSync(path);
  if (metadata.isFile() === true) {
    const extension = extname(path).toLowerCase();
    if (extension === '.md') {
      files.push(path);
    }

    return;
  }

  if (metadata.isDirectory() === false) {
    return;
  }

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = resolve(path, entry.name);
    collectMarkdownFiles(entryPath, files);
  }
}

function needsPermalink(value) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  if (value.trim().length === 0) {
    return true;
  }

  return false;
}

function createPermalink(usedPermalinks) {
  let permalink = '';
  do {
    permalink = 'pages/' + randomBytes(3).toString('hex');
  } while (usedPermalinks.has(permalink));

  return permalink;
}

function getLineEnd(content, lineStart) {
  const lineFeedPosition = content.indexOf('\n', lineStart);
  if (lineFeedPosition === -1) {
    return content.length;
  }

  if (lineFeedPosition > lineStart &&
      content[lineFeedPosition - 1] === '\r') {
    return lineFeedPosition - 1;
  }

  return lineFeedPosition;
}

function getNextLineStart(content, lineEnd) {
  if (lineEnd === content.length) {
    return content.length;
  }

  if (content[lineEnd] === '\r' && content[lineEnd + 1] === '\n') {
    return lineEnd + 2;
  }

  return lineEnd + 1;
}

function isFrontmatterDelimiter(content, lineStart, lineEnd) {
  const delimiter = content.slice(lineStart, lineStart + 3);
  if (delimiter !== '---') {
    return false;
  }

  let characterPosition = lineStart + 3;

  while (characterPosition < lineEnd) {
    const character = content[characterPosition];
    if (character !== ' ' && character !== '\t') {
      return false;
    }

    characterPosition++;
  }

  return true;
}

function getFrontmatter(content) {
  let openingLineStart = 0;
  if (content.startsWith('\uFEFF') === true) {
    openingLineStart = 1;
  }

  const openingLineEnd = getLineEnd(content, openingLineStart);
  if (openingLineEnd === content.length) {
    return undefined;
  }

  if (isFrontmatterDelimiter(content, openingLineStart, openingLineEnd) === false) {
    return undefined;
  }

  const metadataStart = getNextLineStart(content, openingLineEnd);
  let lineStart = metadataStart;

  while (lineStart < content.length) {
    const lineEnd = getLineEnd(content, lineStart);
    if (isFrontmatterDelimiter(content, lineStart, lineEnd) === true) {
      let separatorStart = lineStart - 1;
      if (content[separatorStart] === '\n') {
        if (content[separatorStart - 1] === '\r') {
          separatorStart--;
        }
      }

      const contentStart = getNextLineStart(content, lineEnd);

      return {
        opening: content.slice(0, metadataStart),
        metadata: content.slice(metadataStart, separatorStart),
        closing: content.slice(separatorStart, contentStart),
        contentEnd: contentStart,
      };
    }

    lineStart = getNextLineStart(content, lineEnd);
  }

  return undefined;
}

function findPermalinkLine(metadata) {
  let lineStart = 0;

  while (lineStart < metadata.length) {
    const lineEnd = getLineEnd(metadata, lineStart);
    if (metadata.startsWith('permalink:', lineStart) === true) {
      return { start: lineStart, end: lineEnd };
    }

    lineStart = getNextLineStart(metadata, lineEnd);
  }

  return undefined;
}

function getMetadataLineBreak(metadata) {
  if (metadata.indexOf('\r\n') !== -1) {
    return '\r\n';
  }

  return '\n';
}

function writePermalink(content, permalink) {
  const frontmatter = getFrontmatter(content);
  if (frontmatter === undefined) {
    return content;
  }

  const permalinkLine = findPermalinkLine(frontmatter.metadata);
  let metadata = frontmatter.metadata;

  if (permalinkLine !== undefined) {
    metadata = metadata.slice(0, permalinkLine.start) +
      'permalink: ' + permalink +
      metadata.slice(permalinkLine.end);
  } else {
    const lineBreak = getMetadataLineBreak(metadata);
    metadata += lineBreak + 'permalink: ' + permalink;
  }

  return frontmatter.opening + metadata + frontmatter.closing +
    content.slice(frontmatter.contentEnd);
}

function inspectMarkdownFile(path) {
  const content = readFileSync(path, 'utf8');
  const parsed = parseFrontmatter(content);
  const permalinkValue = parsed.frontmatter.permalink;
  if (needsPermalink(permalinkValue) === true) {
    return {
      content: content,
      needsPermalink: true,
      path: path,
    };
  }

  if (typeof permalinkValue === 'string') {
    return {
      content: content,
      needsPermalink: false,
      path: path,
      permalink: permalinkValue,
    };
  }

  return {
    content: content,
    needsPermalink: false,
    path: path,
  };
}

function fillMissingPermalinks(articlesPath) {
  const paths = [];
  const missingFiles = [];
  const usedPermalinks = new Map();

  collectMarkdownFiles(articlesPath, paths);
  paths.sort();

  for (const path of paths) {
    const file = inspectMarkdownFile(path);

    if (file.needsPermalink === true) {
      missingFiles.push(file);
      continue;
    }

    const permalink = file.permalink;
    if (permalink === undefined) {
      continue;
    }

    const existingPath = usedPermalinks.get(permalink);
    if (existingPath !== undefined) {
      throw new Error(
        '重复的 permalink "' + permalink + '"："' +
          existingPath + '" 和 "' + file.path + '"',
      );
    }

    usedPermalinks.set(permalink, file.path);
  }

  for (const file of missingFiles) {
    const permalink = createPermalink(usedPermalinks);
    const updatedContent = writePermalink(file.content, permalink);
    if (updatedContent === file.content) {
      throw new Error(
        '文章缺少 frontmatter，无法写入 permalink："' + file.path + '"',
      );
    }

    writeFileSync(file.path, updatedContent, 'utf8');
    usedPermalinks.set(permalink, file.path);
  }

  return missingFiles.length;
}

function main() {
  const articlesUrl = new URL('../src/content/articles/', import.meta.url);
  const articlesPath = fileURLToPath(articlesUrl);
  const generatedCount = fillMissingPermalinks(articlesPath);

  console.log('已为 ' + generatedCount + ' 篇文章生成 permalink。');
}

main();
