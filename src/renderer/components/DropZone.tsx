import type { DragEvent, FC, PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';

interface DropZoneProps {
  onDropPaths: (paths: string[]) => void | Promise<void>;
  isBusy?: boolean;
}

const parseUriList = (dataTransfer: DataTransfer | null) => {
  if (!dataTransfer) {
    return '';
  }

  try {
    return dataTransfer.getData('text/uri-list') ?? '';
  } catch {
    return '';
  }
};

const extractPathsFromEvent = (event: DragEvent<HTMLDivElement>) => {
  if (event.dataTransfer) {
    console.info('[DropZone] dataTransfer types', Array.from(event.dataTransfer.types));
    console.info('[DropZone] file count', event.dataTransfer.files?.length ?? 0);
  }

  const paths = new Set<string>();

  Array.from(event.dataTransfer?.files ?? []).forEach((file, index) => {
    const candidate = (file as File & { path?: string }).path;
    console.info('[DropZone] File entry inspected', index, {
      candidate,
      name: file.name,
      type: file.type,
      size: file.size,
      keys: Object.keys(file),
    });
    if (typeof candidate === 'string' && candidate.length > 0) {
      paths.add(candidate);
    }
  });

  const uriList = parseUriList(event.dataTransfer);
  if (uriList.trim().length) {
    console.info('[DropZone] Received URI list payload', uriList);
  }
  uriList
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && line.startsWith('file://'))
    .forEach((uri) => {
      try {
        const url = new URL(uri);
        if (url.protocol === 'file:') {
          const decoded = decodeURIComponent(url.pathname);
          if (decoded) {
            paths.add(decoded);
          }
        }
      } catch (error) {
        console.warn('Failed to parse dropped URI', uri, error);
      }
    });

  return { paths: Array.from(paths), uriList };
};

export const DropZone: FC<PropsWithChildren<DropZoneProps>> = ({
  children,
  onDropPaths,
  isBusy,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }

      if (!isBusy) {
        setIsDragging(true);
      }
    },
    [isBusy],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragging(false);

      if (isBusy) {
        console.info('[DropZone] Ignoring drop because importer is busy.');
        return;
      }

      try {
        const { paths, uriList } = extractPathsFromEvent(event);

        if (paths.length) {
          console.info('[DropZone] Processing dropped file paths', paths);
          await onDropPaths(paths);
          return;
        }

        if (uriList.trim().length) {
          console.info('[DropZone] No direct paths, resolving URI list.');
          const resolution = await window.clipforge.resolveDroppedPaths(uriList);
          if (resolution.status === 'ok' && resolution.data.length) {
            console.info('[DropZone] Resolved dropped files from URI list', resolution.data);
            await onDropPaths(resolution.data);
            return;
          }
          console.warn(
            '[DropZone] Failed to resolve dropped files',
            resolution.status === 'error' ? resolution.message : 'Unknown error',
          );
        } else {
          console.warn('[DropZone] Drop contained no recognisable data. Falling back to dialog.');
          const response = await window.clipforge.importClips();
          if (response.status === 'ok' && response.data.length) {
            console.info('[DropZone] Dialog fallback returned files', response.data);
            await onDropPaths(response.data);
          } else if (response.status === 'error') {
            console.warn('[DropZone] Dialog fallback failed', response.message);
          }
        }
      } catch (error) {
        console.error('Unexpected error handling drop import:', error);
      }
    },
    [isBusy, onDropPaths],
  );

  return (
    <div
      className={`drop-zone${isDragging ? ' drop-zone--active' : ''}${isBusy ? ' drop-zone--busy' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};
