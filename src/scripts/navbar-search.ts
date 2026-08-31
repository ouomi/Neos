interface PagefindModal extends Element {
  open: () => void;
  close: () => void;
}

let pagefindLoadPromise: Promise<void> | null = null;
let pagefindBaseUrl = import.meta.env.BASE_URL;

if (pagefindBaseUrl.endsWith('/') === false) {
  pagefindBaseUrl += '/';
}

function getNavbarSearchModal(): PagefindModal | null {
  const modal = document.querySelector(
    "[data-navbar-search-modal] pagefind-modal",
  );

  if (modal === null) {
    return null;
  }

  const pagefindModal = modal as PagefindModal;

  if (
    typeof pagefindModal.open !== "function" ||
    typeof pagefindModal.close !== "function"
  ) {
    return null;
  }

  return pagefindModal;
}

function loadPagefindStyles(): Promise<void> {
  const existingStyles = document.querySelector<HTMLLinkElement>(
    'link[data-pagefind-component-styles]',
  );

  if (existingStyles !== null) {
    if (existingStyles.sheet !== null) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      existingStyles.addEventListener("load", function () {
        resolve();
      }, { once: true });
      existingStyles.addEventListener("error", function () {
        reject(new Error("Pagefind CSS 加载失败"));
      }, { once: true });
    });
  }

  return new Promise(function (resolve, reject) {
    const styles = document.createElement("link");
    styles.rel = "stylesheet";
    styles.href = `${pagefindBaseUrl}pagefind/pagefind-component-ui.css`;
    styles.dataset.pagefindComponentStyles = "";
    styles.addEventListener("load", function () {
      resolve();
    }, { once: true });
    styles.addEventListener("error", function () {
      styles.remove();
      reject(new Error("Pagefind CSS 加载失败"));
    }, { once: true });
    document.head.append(styles);
  });
}

function loadPagefindScript(): Promise<void> {
  if (customElements.get("pagefind-modal") !== undefined) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[data-pagefind-component-script]',
  );

  if (existingScript !== null) {
    return customElements.whenDefined("pagefind-modal");
  }

  return new Promise(function (resolve, reject) {
    const script = document.createElement("script");
    script.type = "module";
    script.src = `${pagefindBaseUrl}pagefind/pagefind-component-ui.js`;
    script.dataset.pagefindComponentScript = "";
    script.addEventListener("load", function () {
      customElements.whenDefined("pagefind-modal").then(function () {
        resolve();
      });
    }, { once: true });
    script.addEventListener("error", function () {
      script.remove();
      reject(new Error("Pagefind JavaScript 加载失败"));
    }, { once: true });
    document.head.append(script);
  });
}

function loadPagefind(): Promise<void> {
  if (pagefindLoadPromise !== null) {
    return pagefindLoadPromise;
  }

  pagefindLoadPromise = Promise.all([
    loadPagefindStyles(),
    loadPagefindScript(),
  ]).then(function () {
    return undefined;
  }).catch(function (error) {
    pagefindLoadPromise = null;
    throw error;
  });

  return pagefindLoadPromise;
}

function setButtonsExpanded(isExpanded: boolean): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "[data-navbar-search-trigger]",
  );

  buttons.forEach(function (button) {
    if (isExpanded === true) {
      button.setAttribute("aria-expanded", "true");
    } else {
      button.setAttribute("aria-expanded", "false");
    }
  });
}

function prepareNavbarSearchModal(): PagefindModal {
  const modal = getNavbarSearchModal();

  if (modal === null) {
    throw new Error("Pagefind 搜索组件初始化失败");
  }

  const dialog = modal.querySelector(":scope > dialog");

  if (dialog === null) {
    throw new Error("Pagefind 搜索对话框初始化失败");
  }

  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "[data-navbar-search-trigger]",
  );

  buttons.forEach(function (button) {
    button.setAttribute("aria-controls", dialog.id);
  });

  if (dialog.hasAttribute("data-navbar-search-dialog-ready") === false) {
    dialog.setAttribute("data-navbar-search-dialog-ready", "");
    dialog.addEventListener("close", function () {
      setButtonsExpanded(false);
    });
  }

  return modal;
}

function setupNavbarSearch(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "[data-navbar-search-trigger]",
  );

  buttons.forEach(function (button) {
    if (button.hasAttribute("data-navbar-search-ready") === true) {
      return;
    }

    button.setAttribute("data-navbar-search-ready", "");
    button.addEventListener("click", function () {
      if (button.getAttribute("aria-busy") === "true") {
        return;
      }

      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-label", "正在加载搜索");

      loadPagefind().then(function () {
        const modal = prepareNavbarSearchModal();
        modal.open();
        setButtonsExpanded(true);
      }).catch(function (_error) {
        button.setAttribute("title", "搜索加载失败，请重试");
      }).finally(function () {
        button.removeAttribute("aria-busy");
        button.setAttribute("aria-label", "搜索");
      });
    });
  });
}

setupNavbarSearch();
