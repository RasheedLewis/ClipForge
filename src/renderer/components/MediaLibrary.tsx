import { useCallback } from 'react';
import type { FC } from 'react';
import { useMediaStore } from '../store/media';
import { useMediaImporter } from '../hooks/useMediaImporter';
import { DropZone } from './DropZone';
import { ClipCard } from './ClipCard';

export const MediaLibrary: FC = () => {
  const clips = useMediaStore((state) => state.clips);
  const removeClip = useMediaStore((state) => state.removeClip);
  const { importFromDialog, importFromPaths, isImporting } = useMediaImporter();

  const handleDrop = useCallback(
    (paths: string[]) => {
      void importFromPaths(paths);
    },
    [importFromPaths],
  );

  return (
    <div className="media-library">
      <div className="media-library__toolbar">
        <button
          type="button"
          className="library-button"
          onClick={() => {
            void importFromDialog();
          }}
          disabled={isImporting}
        >
          {isImporting ? 'Importing…' : 'Import Clips'}
        </button>
        <div className="media-library__meta">
          <span>
            {clips.length} clip{clips.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <DropZone onDropPaths={handleDrop} isBusy={isImporting}>
        {clips.length === 0 ? (
          <div className="media-library__empty">
            <p>Drop video files here or click “Import Clips”.</p>
            <small>Supports MP4, MOV, WebM, MKV and more.</small>
          </div>
        ) : (
          <div className="media-library__grid">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} onRemove={removeClip} />
            ))}
          </div>
        )}
      </DropZone>
    </div>
  );
};
