import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { formatBitrate, formatBytes, formatDuration } from '../utils/format';
import type { MediaClip } from '../store/media';

interface ClipCardProps {
  clip: MediaClip;
  onRemove?: (clipId: string) => void;
  onAddToTimeline?: (clip: MediaClip) => void;
}

export const ClipCard: FC<ClipCardProps> = ({ clip, onRemove, onAddToTimeline }) => {
  const { metadata } = clip;
  const resolution =
    metadata.video && metadata.video.width && metadata.video.height
      ? `${metadata.video.width}×${metadata.video.height}`
      : '—';

  const frameRate =
    metadata.video?.frameRate && metadata.video.frameRate !== '0/0'
      ? metadata.video.frameRate
      : undefined;

  const loggedThumbnailRef = useRef<string | null>(null);
  const loggedMissingRef = useRef(false);

  useEffect(() => {
    if (clip.thumbnail) {
      if (loggedThumbnailRef.current !== clip.thumbnail) {
        console.info('[ClipCard] Rendering thumbnail', {
          clipId: clip.id,
          thumbnailLength: clip.thumbnail.length,
        });
        loggedThumbnailRef.current = clip.thumbnail;
      }
      loggedMissingRef.current = false;
    } else if (!loggedMissingRef.current) {
      console.info('[ClipCard] No thumbnail present for clip', clip.id);
      loggedMissingRef.current = true;
      loggedThumbnailRef.current = null;
    }
  }, [clip.id, clip.thumbnail]);

  return (
    <article className="clip-card">
      <div className="clip-card__thumbnail">
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt={`${clip.name} thumbnail`}
            className="clip-card__thumbnail-image"
            onLoad={(event) => {
              const target = event.currentTarget;
              console.info('[ClipCard] Thumbnail image loaded', clip.id, {
                naturalWidth: target.naturalWidth,
                naturalHeight: target.naturalHeight,
                clientRect: target.getBoundingClientRect(),
              });
            }}
            onError={(event) => {
              console.warn('[ClipCard] Thumbnail image failed to load', clip.id, event);
            }}
          />
        ) : (
          <span>{resolution}</span>
        )}
      </div>
      <div className="clip-card__details">
        <header className="clip-card__header">
          <h3 title={clip.name}>{clip.name}</h3>
        </header>
        <div className="clip-card__actions">
          {onAddToTimeline ? (
            <button
              type="button"
              className="clip-card__action"
              onClick={() => onAddToTimeline(clip)}
            >
              Add to Timeline
            </button>
          ) : null}
          {onRemove ? (
            <button type="button" className="clip-card__remove" onClick={() => onRemove(clip.id)}>
              Remove
            </button>
          ) : null}
        </div>
        <dl className="clip-card__meta">
          <div>
            <dt>Duration</dt>
            <dd>{formatDuration(metadata.duration)}</dd>
          </div>
          <div>
            <dt>Resolution</dt>
            <dd>{resolution}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatBytes(metadata.size)}</dd>
          </div>
          <div>
            <dt>Codec</dt>
            <dd>{metadata.video?.codec ?? '—'}</dd>
          </div>
          {frameRate ? (
            <div>
              <dt>FPS</dt>
              <dd>{frameRate}</dd>
            </div>
          ) : null}
          {metadata.bitRate ? (
            <div>
              <dt>Bitrate</dt>
              <dd>{formatBitrate(metadata.bitRate)}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
};
