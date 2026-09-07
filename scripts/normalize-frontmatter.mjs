#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const EMPTY_LIST_PATTERN = /^(tags|categories):(?:[ \t]*(?:null[ \t]*)?(?=\r?$)(?!\r?\n(?:[ \t]*(?:#[^\r\n]*)?\r?\n)*[ \t]*-)|[ \t]*\r?\n[ \t]*-[ \t]*(?:null[ \t]*)?(?=\r?$)(?!\r?\n(?:[ \t]*(?:#[^\r\n]*)?\r?\n)*[ \t]*-))/gm;
const PERMALINK_PATTERN = /^(permalink:[ \t]*)(['"]?)(\/+)(.*?)(\/+)\2[ \t]*(\r?)$/gm;
const FRONTMATTER_PATTERN = /^(\uFEFF?---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?=\r?\n|$))/;

function collectMarkdownFiles(path, files) {
  const metadata = statSync(path);

  if (metadata.isFile()) {
    if (extname(path).toLowerCase() === '.md') {
      files.push(path);
    }
    return;
  }

  if (metadata.isDirectory() === false) {
    return;
  }

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    collectMarkdownFiles(resolve(path, entry.name), files);
  }
}

function normalizeFrontmatter(content) {
  const match = content.match(FRONTMATTER_PATTERN);

  if (match === null) {
    return content;
  }

  let normalized = match[2].replace(EMPTY_LIST_PATTERN, function replaceEmptyList(_value, key) {
    return key + ': []';
  });

  normalized = normalized.replace(
    PERMALINK_PATTERN,
    function replacePermalink(_value, prefix, quote, _leadingSlashes, permalink, _trailingSlashes, carriageReturn) {
      return prefix + quote + permalink + quote + carriageReturn;
    },
  );

  if (normalized === match[2]) {
    return content;
  }

  return match[1] + normalized + match[3] + content.slice(match[0].length);
}

function main() {
  const argumentsList = process.argv.slice(2);
  const paths = [];
  let checkOnly = false;

  for (const argument of argumentsList) {
    if (argument === '--check') {
      checkOnly = true;
      continue;
    }
    paths.push(resolve(argument));
  }

  if (paths.length === 0) {
    paths.push(resolve('src/content/articles'));
  }

  const files = [];
  for (const path of paths) {
    collectMarkdownFiles(path, files);
  }
  files.sort();

  let changedCount = 0;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const normalized = normalizeFrontmatter(content);

    if (normalized === content) {
      continue;
    }

    changedCount += 1;
    if (checkOnly === true) {
      console.log('needs normalization: ' + file);
    } else {
      console.log('normalized: ' + file);
    }

    if (checkOnly === false) {
      writeFileSync(file, normalized, 'utf8');
    }
  }

  console.log('checked ' + files.length + ' Markdown file(s), found ' + changedCount + ' file(s) to normalize.');

  if (checkOnly === true && changedCount > 0) {
    process.exitCode = 1;
  }
}

main();
