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
let photoSwipeModulePromise:
  | Promise<typeof import('../vendor/photoswipe/photoswipe.esm.js')>
  | undefined;
let openingImage: HTMLImageElement | undefined;

interface ImageViewerItemData {
  src: string;
  msrc: string;
  alt: string;
  width: number;
  height: number;
  element: HTMLImageElement;
}

function installImageViewerStyles() {
  if (document.getElementById(imageViewerStyleId) !== null) {
    return;
  }

  const styles = document.createElement('style');
  styles.id = imageViewerStyleId;
  styles.textContent = photoSwipeStyles + '\n' + imageViewerStyles;
  document.head.appendChild(styles);
}

function loadPhotoSwipeModule() {
  if (photoSwipeModulePromise !== undefined) {
    return photoSwipeModulePromise;
  }

  const promise = import('../vendor/photoswipe/photoswipe.esm.js');
  photoSwipeModulePromise = promise;

  promise.catch(function () {
    if (photoSwipeModulePromise === promise) {
      photoSwipeModulePromise = undefined;
    }
  });

  return promise;
}

function createImageViewerData() {
  const imageData: ImageViewerItemData[] = [];

  document.querySelectorAll('.article-content img.article-image-trigger').forEach(
    function (image) {
      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        return;
      }

      const imageSource = image.currentSrc || image.src;

      imageData.push({
        src: imageSource,
        msrc: imageSource,
        alt: image.alt,
        width: image.naturalWidth,
        height: image.naturalHeight,
        element: image,
      });
    },
  );

  return imageData;
}

function createLightbox() {
  lightbox = new PhotoSwipeLightbox({
    dataSource: [],
    pswpModule: function () {
      return loadPhotoSwipeModule();
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

  lightbox.addFilter('thumbEl', function (thumbEl, itemData) {
    if (itemData.element instanceof HTMLImageElement) {
      return itemData.element;
    }

    return thumbEl;
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

  lightbox.on('destroy', function () {
    const image = openingImage;
    openingImage = undefined;

    if (image === undefined || image.isConnected === false) {
      return;
    }

    window.requestAnimationFrame(function () {
      image.focus({ preventScroll: true });
    });
  });

  lightbox.init();
}

function getLightbox() {
  if (lightbox === undefined) {
    createLightbox();
  }

  return lightbox;
}

function waitForImage(image: HTMLImageElement) {
  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve(true);
  }

  if (image.complete === true) {
    return Promise.resolve(false);
  }

  return new Promise<boolean>(function (resolve) {
    image.addEventListener(
      'load',
      function () {
        resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
      },
      { once: true },
    );

    image.addEventListener(
      'error',
      function () {
        resolve(false);
      },
      { once: true },
    );
  });
}

export async function openImageViewer(image: HTMLImageElement) {
  if (image.classList.contains('article-image-trigger') === false) {
    return false;
  }

  if (openingImage !== undefined || lightbox?.pswp !== undefined) {
    return false;
  }

  const imageLoaded = await waitForImage(image);

  if (imageLoaded === false) {
    return false;
  }

  try {
    await loadPhotoSwipeModule();
  } catch {
    return false;
  }

  if (openingImage !== undefined || lightbox?.pswp !== undefined) {
    return false;
  }

  const imageData = createImageViewerData();
  const imageIndex = imageData.findIndex(function (itemData) {
    return itemData.element === image;
  });

  if (imageIndex < 0) {
    return false;
  }

  openingImage = image;

  try {
    const opened = getLightbox().loadAndOpen(imageIndex, imageData);

    if (opened === false) {
      openingImage = undefined;
      return false;
    }
  } catch {
    openingImage = undefined;
    return false;
  }

  return true;
}

installImageViewerStyles();
