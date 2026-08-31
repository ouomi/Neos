import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

interface HtmlImageNode {
  properties?: Record<string, unknown>;
}

interface HtmlRawNode {
  value: string;
}

interface HtmlVisitorContext {
  setProperty(node: HtmlImageNode, key: string, value: unknown): void;
}

function addAttributes(imageHtml: string) {
  let updatedImageHtml = imageHtml;
  const hasLoadingAttribute = /\sloading\s*=/i.test(imageHtml);
  const hasDecodingAttribute = /\sdecoding\s*=/i.test(imageHtml);

  if (hasLoadingAttribute === false) {
    updatedImageHtml = updatedImageHtml.replace(/\/?>(\s*)$/, ' loading="lazy">$1');
  }

  if (hasDecodingAttribute === false) {
    updatedImageHtml = updatedImageHtml.replace(/\/?>(\s*)$/, ' decoding="async">$1');
  }

  return updatedImageHtml;
}

function addImageLoadingAttributes() {
  return {
    name: 'add-image-loading-attributes',
    element: {
      filter: ['img'],
      visit(node: HtmlImageNode, context: HtmlVisitorContext) {
        const properties = node.properties;

        if (properties === undefined || properties.loading === undefined) {
          context.setProperty(node, 'loading', 'lazy');
        }

        if (properties === undefined || properties.decoding === undefined) {
          context.setProperty(node, 'decoding', 'async');
        }
      },
    },
  };
}

function addRawImageLoadingAttributes() {
  return {
    name: 'add-raw-image-loading-attributes',
    html(node: HtmlRawNode) {
      const value = node.value.replace(/<img\b[^>]*>/gi, addAttributes);

      if (value === node.value) {
        return;
      }

      return { ...node, value };
    },
  };
}

export default defineConfig({
  compressHTML: true,
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  markdown: {
    processor: satteri({
      mdastPlugins: [addRawImageLoadingAttributes()],
      hastPlugins: [addImageLoadingAttributes()],
    }),
    shikiConfig: {
      transformers: [
        {
          name: 'code-block-language-label',
          root: function (hast) {
            const language = this.options.lang;
            const preStyle = this.pre.properties.style;
            const barChildren = [];

            if (language !== '') {
              barChildren.push({
                type: 'element',
                tagName: 'span',
                properties: {
                  className: ['code-block-lang'],
                },
                children: [
                  {
                    type: 'text',
                    value: language,
                  },
                ],
              });
            }

            barChildren.push({
              type: 'element',
              tagName: 'button',
              properties: {
                className: ['code-block-copy'],
                type: 'button',
                ariaLabel: '复制代码',
              },
              children: [
                {
                  type: 'element',
                  tagName: 'svg',
                  properties: {
                    className: ['code-block-copy-icon'],
                    ariaHidden: 'true',
                    viewBox: '0 0 24 24',
                  },
                  children: [
                    {
                      type: 'element',
                      tagName: 'rect',
                      properties: {
                        x: '9',
                        y: '9',
                        width: '13',
                        height: '13',
                        rx: '2',
                      },
                      children: [],
                    },
                    {
                      type: 'element',
                      tagName: 'path',
                      properties: {
                        d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
                      },
                      children: [],
                    },
                  ],
                },
                {
                  type: 'element',
                  tagName: 'svg',
                  properties: {
                    className: ['code-block-copy-check'],
                    ariaHidden: 'true',
                    viewBox: '0 0 24 24',
                  },
                  children: [
                    {
                      type: 'element',
                      tagName: 'path',
                      properties: {
                        d: 'M20 6L9 17l-5-5',
                      },
                      children: [],
                    },
                  ],
                },
              ],
            });

            hast.children = [
              {
                type: 'element',
                tagName: 'div',
                properties: {
                  className: ['code-block'],
                  style: preStyle,
                },
                children: [
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['code-block-bar'],
                      style: preStyle,
                    },
                    children: barChildren,
                  },
                  this.pre,
                ],
              },
            ];

            return hast;
          },
        },
      ],
    },
  },
});
