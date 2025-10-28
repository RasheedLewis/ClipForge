import { useCallback, useState } from 'react';
import type { IpcResponse, MediaMetadata } from '@shared/types';
import { useMediaStore, type MediaClip } from '../store/media';
import { generateThumbnail } from '../utils/thumbnails';

const dedupePaths = (paths: string[]) =>
  Array.from(new Set(paths.map((path) => path.trim()).filter(Boolean)));

const isIpcError = <T>(
  response: IpcResponse<T>,
): response is { status: 'error'; message: string } => response.status === 'error';

const toClipName = (filePath: string) => {
  const segments = filePath.split(/[\\/]/);
  return segments[segments.length - 1] ?? filePath;
};

const buildClip = async (mediaPath: string, metadata: MediaMetadata): Promise<MediaClip> => {
  const thumbnail = await generateThumbnail(mediaPath);
  console.info('[Importer] Thumbnail generation result', {
    mediaPath,
    hasThumbnail: Boolean(thumbnail),
    thumbnailPreview: thumbnail?.slice(0, 64),
  });
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    path: metadata.path,
    name: toClipName(mediaPath),
    metadata,
    thumbnail,
    createdAt: Date.now(),
  };
};

export const useMediaImporter = () => {
  const addClips = useMediaStore((state) => state.addClips);
  const [isImporting, setIsImporting] = useState(false);

  const processPaths = useCallback(
    async (paths: string[]) => {
      const uniquePaths = dedupePaths(paths);

      if (!uniquePaths.length) {
        return;
      }

      setIsImporting(true);

      try {
        const clipPromises = uniquePaths.map(async (mediaPath) => {
          console.info('[Importer] Fetching metadata for', mediaPath);
          const metadataResponse = await window.clipforge.getMediaMetadata(mediaPath);

          if (isIpcError(metadataResponse)) {
            console.warn('[Importer] Metadata lookup failed', mediaPath, metadataResponse.message);
            throw new Error(metadataResponse.message);
          }

          console.info('[Importer] Generating clip data for', metadataResponse.data.path);
          return buildClip(mediaPath, metadataResponse.data);
        });

        const results = await Promise.allSettled(clipPromises);

        const successfulClips = results
          .filter(
            (result): result is PromiseFulfilledResult<MediaClip> => result.status === 'fulfilled',
          )
          .map((result) => result.value);

        if (successfulClips.length) {
          console.info('[Importer] Adding clips to store', successfulClips);
          addClips(successfulClips);
        }

        results
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          .forEach((result) => {
            console.error('[Importer] Failed to import media clip:', result.reason);
          });
      } finally {
        setIsImporting(false);
      }
    },
    [addClips],
  );

  const importFromDialog = useCallback(async () => {
    setIsImporting(true);

    try {
      const response = await window.clipforge.importClips();

      if (isIpcError(response)) {
        throw new Error(response.message);
      }

      if (response.data.length) {
        await processPaths(response.data);
      }
    } catch (error) {
      console.error('Failed to import clips via dialog:', error);
    } finally {
      setIsImporting(false);
    }
  }, [processPaths]);

  const importFromPaths = useCallback(
    async (paths: string[]) => {
      try {
        await processPaths(paths);
      } catch (error) {
        console.error('Failed to import provided paths:', error);
      }
    },
    [processPaths],
  );

  return {
    importFromDialog,
    importFromPaths,
    isImporting,
  };
};
