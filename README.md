[English](README_en.md) | **现在是简体中文**

---

# Neos

Neos 是一个基于 Astro 的极简、高性能博客模板。

## 百闻不如一见

展示站请[点这里](https://ouomi.github.io/Neos)

## 它可以做什么？

清晰、快速地展示你写的文章，仅此而已。

## 它有什么？

把你的每一篇 Markdown文章，在构建后都拥有一个可独立路由的页面。

根据你的文件目录生成侧边栏。

尽可能快的首屏响应。

## 它没有什么？

没有复杂动效。

没有评论功能。

没有丝滑的过渡动画。

## 第三方依赖

```json
  "devDependencies": {
    "@astrojs/markdown-satteri": "0.3.5",
    "pagefind": "^1.5.2",
    "photoswipe": "^5.4.4",
  }
```
其中photoswipe是手动编译的，目的是尽可能减少第三方上游被投毒。

## 快速上手

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

## 致谢

灵感来源在[这里](https://github.com/xugaoyi/vuepress-theme-vdoing)。

图片查看[依赖](https://github.com/dimsemenov/photoswipe)。

## 关于AI

模型：gpt-5.6-sol、gpt-5.6-terra、DeepSeek-V4-Flash-0731

Agent：[Pi](https://github.com/earendil-works/pi)

skills：

[mattpocock/engineering/improve-codebase-architecture](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture)


## 关于开发环境

- **操作系统：** Proxmox VE 运行 Debian13 虚拟机

- **Node.js 管理器：** 使用 mise 管理 node

- **Node.js 版本：** v22

## 许可证

[MIT](LICENSE)