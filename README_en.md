**Now in English** | [简体中文](README.md)

---

# Neos

Neos is a simple and high-performance Astro blog template.

## Seeing is believing

demo [click here](https://ouomi.github.io/Neos)

## What can she do?

Show your writing clearly and quickly. That's it.

## What does she have?

Make every Markdown article have its own routable page after building.

Generate a sidebar based on your file directory.

Fast initial page load. As fast as possible.

## What doesn't she have?

No complex animations.

No comment system.

No smooth transition effects.

## 3rd dependencies

```json
  "devDependencies": {
    "@astrojs/markdown-satteri": "0.3.5",
    "pagefind": "^1.5.2",
    "photoswipe": "^5.4.4",
  }
```

Photoswipe is compiled from source to reduce the risk of upstream 3rd supply chain poisoning.

## Quick start

```bash
git clone https://github.com/ouomi/Neos.git
cd neos
pnpm install
pnpm approve-builds
curl -LO https://github.com/ouomi/Neos/releases/download/photoswipe-v5.4.4/photoswipe-5.4.4-built.tar.gz
mkdir -p src/vendor
tar -zxvf photoswipe-5.4.4-built.tar.gz -C src/vendor
pnpm build && pnpm preview
```

## Thanks

Inspired by [here](https://github.com/xugaoyi/vuepress-theme-vdoing)。

Image Preview [Dependency](https://github.com/dimsemenov/photoswipe)。

## About AI

Model: gpt-5.6-sol, gpt-5.6-terra, DeepSeek-V4-Flash-0731

Agent：[Pi](https://github.com/earendil-works/pi)

skills：

- [mattpocock/engineering/improve-codebase-architecture](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture)


## Development Environment

- **OS:** Debian 13 VM running on Proxmox VE
- **Node.js Manager:** mise
- **Node.js Version:** v22

## LICENCE

MIT 