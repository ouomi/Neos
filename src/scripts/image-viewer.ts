import photoSwipeStyles from '../vendor/photoswipe/photoswipe.css?inline';
import imageViewerStyles from '../styles/image-viewer.css?inline';
import PhotoSwipeLightbox from '../vendor/photoswipe/photoswipe-lightbox.esm.js';

const imageViewerStyleId = 'neos-image-viewer-styles';
const closeIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
`;

const zoomIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="10.5" cy="10.5" r="5.5" />
    <path d="M15 15l4.5 4.5M10.5 8v5M8 10.5h5" />
  </svg>
`;

const downloadIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14" />
  </svg>
`;

interface PhotoSwipeEventListener {
  (): void;
}

interface PhotoSwipeUiInstance {
  currSlide?: {
    data: {
      src?: unknown;
    };
  };
  on(name: string, listener: PhotoSwipeEventListener): void;
}

let lightbox: PhotoSwipeLightbox | undefined;
const pendingImages = new WeakSet<HTMLImageElement>();

function installImageViewerStyles() {
  if (document.getElementById(imageViewerStyleId) !== null) {
    return;
  }

  const styles = document.createElement('style');
  styles.id = imageViewerStyleId;
  styles.textContent = photoSwipeStyles + '\n' + imageViewerStyles;
  document.head.appendChild(styles);
}

function enableImageViewer(image: HTMLImageElement) {
  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
    image.classList.add('article-image-trigger');
  }
}

function registerImage(image: HTMLImageElement) {
  enableImageViewer(image);

  if (image.classList.contains('article-image-trigger')) {
    return;
  }

  if (pendingImages.has(image)) {
    return;
  }

  pendingImages.add(image);

  image.addEventListener(
    'load',
    function () {
      pendingImages.delete(image);
      enableImageViewer(image);
    },
    { once: true },
  );

  image.addEventListener(
    'error',
    function () {
      pendingImages.delete(image);
    },
    { once: true },
  );
}

function createLightbox() {
  lightbox = new PhotoSwipeLightbox({
    gallery: '.article-content',
    children: 'img.article-image-trigger',
    pswpModule: function () {
      return import('../vendor/photoswipe/photoswipe.esm.js');
    },
    bgOpacity: 0.88,
    padding: { top: 20, bottom: 20, left: 20, right: 20 },
    wheelToZoom: true,
    arrowPrev: false,
    arrowNext: false,
    counter: false,
    closeSVG: closeIcon,
    zoomSVG: zoomIcon,
    closeTitle: '关闭预览',
    zoomTitle: '切换缩放',
    imageClickAction: 'zoom',
    tapAction: 'toggle-controls',
    doubleTapAction: 'zoom',
    secondaryZoomLevel: 2,
    maxZoomLevel: 4,
  });

  lightbox.addFilter('domItemData', function (itemData, element) {
    if (!(element instanceof HTMLImageElement)) {
      return itemData;
    }

    const imageSource = element.currentSrc || element.src;
    itemData.src = imageSource;
    itemData.msrc = imageSource;
    itemData.alt = element.alt;
    itemData.w = element.naturalWidth;
    itemData.h = element.naturalHeight;

    return itemData;
  });

  lightbox.on('uiRegister', function () {
    if (lightbox === undefined) {
      return;
    }

    lightbox.pswp?.ui?.registerElement({
      name: 'download',
      order: 8,
      isButton: true,
      tagName: 'a',
      title: '下载图片',
      ariaLabel: '下载图片',
      html: downloadIcon,
      onInit: function (element: HTMLElement, pswp: PhotoSwipeUiInstance) {
        if (!(element instanceof HTMLAnchorElement)) {
          return;
        }

        const downloadLink = element;
        downloadLink.setAttribute('download', '');

        function updateDownloadLink() {
          const slide = pswp.currSlide;

          if (slide === undefined || typeof slide.data.src !== 'string') {
            downloadLink.removeAttribute('href');
            return;
          }

          downloadLink.href = slide.data.src;
        }

        pswp.on('change', updateDownloadLink);
        updateDownloadLink();
      },
    });
  });

  lightbox.init();
}

function initializeImageViewer() {
  lightbox?.destroy();

  document.querySelectorAll('.article-content img').forEach(function (image) {
    if (image instanceof HTMLImageElement) {
      registerImage(image);
    }
  });

  createLightbox();
}

installImageViewerStyles();
initializeImageViewer();
