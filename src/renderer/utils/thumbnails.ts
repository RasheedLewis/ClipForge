import type { IpcResponse } from '@shared/types';

const MAX_THUMBNAIL_WIDTH = 320;
const CAPTURE_TIMEOUT_MS = 8000;

const isIpcError = (
  response: IpcResponse<unknown>,
): response is { status: 'error'; message: string } => response.status === 'error';

const waitForVideoFrame = (video: HTMLVideoElement) =>
  new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };

    const handleLoadedData = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Unable to load video for thumbnail generation.'));
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out while generating thumbnail.'));
    }, CAPTURE_TIMEOUT_MS);

    video.addEventListener('loadeddata', handleLoadedData, { once: true });
    video.addEventListener('error', handleError, { once: true });
  });

const drawThumbnail = (video: HTMLVideoElement) => {
  const sourceWidth = video.videoWidth || MAX_THUMBNAIL_WIDTH;
  const sourceHeight = video.videoHeight || MAX_THUMBNAIL_WIDTH * 0.5625;

  const scale = Math.min(1, MAX_THUMBNAIL_WIDTH / sourceWidth);
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    return undefined;
  }

  context.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/png', 0.85);
};

export const generateThumbnail = async (mediaPath: string): Promise<string | undefined> => {
  try {
    const urlResponse = await window.clipforge.getMediaFileUrl(mediaPath);

    if (isIpcError(urlResponse)) {
      throw new Error(urlResponse.message);
    }

    console.info('[Thumbnail] Loading video for thumbnail', {
      mediaPath,
      url: urlResponse.data,
    });

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = urlResponse.data;
    video.load();

    await waitForVideoFrame(video);
    console.info('[Thumbnail] Video metadata ready', {
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    });

    const thumbnail = drawThumbnail(video);
    video.removeAttribute('src');
    video.load();

    if (!thumbnail) {
      console.warn('[Thumbnail] Canvas draw returned empty thumbnail', mediaPath);
    }

    return thumbnail;
  } catch (error) {
    console.warn('[Thumbnail] Falling back to placeholder thumbnail:', error);
    return undefined;
  }
};
