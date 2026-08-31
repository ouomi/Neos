/*
 * 为静态生成的代码块复制按钮绑定交互。
 * 按钮、图标和工具栏结构由 Astro/Shiki 在构建阶段生成。
 */

const copiedTimeouts = new WeakMap<HTMLButtonElement, number>();

function getCodeText(pre: HTMLPreElement): string {
  const code = pre.querySelector('code');

  if (code === null) {
    return '';
  }

  const lines = code.querySelectorAll('span.line');

  if (lines.length > 0) {
    const parts: string[] = [];

    lines.forEach(function (line) {
      const text = line.textContent;

      if (text !== null) {
        parts.push(text);
      } else {
        parts.push('');
      }
    });

    return parts.join('\n');
  }

  const text = code.textContent;

  if (text === null) {
    return '';
  }

  return text;
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard !== undefined && window.isSecureContext === true) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // 继续走下面的兼容路径
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;

  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }

  textarea.remove();

  return copied;
}

function showCopiedState(button: HTMLButtonElement) {
  const previousTimeout = copiedTimeouts.get(button);

  if (previousTimeout !== undefined) {
    window.clearTimeout(previousTimeout);
  }

  button.classList.add('is-copied');
  button.setAttribute('aria-label', '已复制');

  const timeout = window.setTimeout(function () {
    button.classList.remove('is-copied');
    button.setAttribute('aria-label', '复制代码');
    copiedTimeouts.delete(button);
  }, 1600);

  copiedTimeouts.set(button, timeout);
}

async function handleCopy(button: HTMLButtonElement, pre: HTMLPreElement) {
  const copied = await copyText(getCodeText(pre));

  if (copied === true) {
    showCopiedState(button);
  }
}

function enhanceCodeBlock(pre: HTMLPreElement) {
  const wrapper = pre.closest('.code-block');

  if (!(wrapper instanceof HTMLDivElement)) {
    return;
  }

  const bar = wrapper.querySelector('.code-block-bar');

  if (!(bar instanceof HTMLDivElement)) {
    return;
  }

  const button = bar.querySelector<HTMLButtonElement>('.code-block-copy');

  if (button === null) {
    return;
  }

  if (button.getAttribute('data-code-block-copy-ready') === 'true') {
    return;
  }

  button.setAttribute('data-code-block-copy-ready', 'true');

  button.addEventListener('click', function () {
    handleCopy(button, pre);
  });
}

function enhanceCodeBlocks() {
  document.querySelectorAll('.article-content pre.astro-code').forEach(function (pre) {
    if (!(pre instanceof HTMLPreElement)) {
      return;
    }

    enhanceCodeBlock(pre);
  });
}

enhanceCodeBlocks();
