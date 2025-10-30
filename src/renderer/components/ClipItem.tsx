import type { FC, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import classNames from 'classnames';
import { useTimelineStore, MIN_CLIP_DURATION, type TimelineClip } from '../store/timeline';
import { useMediaStore } from '../store/media';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ClipItemProps {
  clip: TimelineClip;
  zoom: number;
  isSelected?: boolean;
  onContextMenu?: (clipId: string, position: ContextMenuPosition) => void;
  onCloseContextMenu?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const ClipItem: FC<ClipItemProps> = ({
  clip,
  zoom,
  isSelected,
  onContextMenu,
  onCloseContextMenu,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });
  const trimClip = useTimelineStore((state) => state.trimClip);
  const getAdjacentClips = useTimelineStore((state) => state.getAdjacentClips);
  const mediaClip = useMediaStore((state) => state.getClip(clip.mediaId));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${clip.duration * zoom}px`,
    left: `${clip.start * zoom}px`,
  } as const;

  const mediaDuration = mediaClip?.metadata.duration ?? clip.inPoint + clip.duration;

  const handleTrimStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onCloseContextMenu?.();

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const initialClip = clip;
    const { previous } = getAdjacentClips(clip.id);
    const minStart = previous ? previous.start + previous.duration : 0;
    const minDelta = Math.max(minStart - initialClip.start, -initialClip.inPoint);
    const maxDelta = initialClip.duration - MIN_CLIP_DURATION;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      const deltaSeconds = (moveEvent.clientX - startX) / zoom;
      const boundedDelta = clamp(
        deltaSeconds,
        Math.min(minDelta, maxDelta),
        Math.max(minDelta, maxDelta),
      );

      const nextStart = initialClip.start + boundedDelta;
      const nextDuration = initialClip.duration - boundedDelta;
      const nextInPoint = initialClip.inPoint + boundedDelta;

      trimClip(initialClip.id, {
        start: nextStart,
        duration: nextDuration,
        inPoint: nextInPoint,
      });
    };

    const handlePointerUp = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) {
        return;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleTrimEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onCloseContextMenu?.();

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const initialClip = clip;
    const { next } = getAdjacentClips(clip.id);
    const minDelta = MIN_CLIP_DURATION - initialClip.duration;
    const maxDeltaFromNext = next
      ? next.start - (initialClip.start + initialClip.duration)
      : Number.POSITIVE_INFINITY;
    const availableInMedia = Math.max(
      0,
      mediaDuration - (initialClip.inPoint + initialClip.duration),
    );
    const maxDelta = Math.min(maxDeltaFromNext, availableInMedia);

    if (maxDelta < minDelta) {
      return;
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      const deltaSeconds = (moveEvent.clientX - startX) / zoom;
      const boundedDelta = clamp(deltaSeconds, minDelta, maxDelta);
      const nextDuration = initialClip.duration + boundedDelta;
      if (nextDuration < MIN_CLIP_DURATION) {
        return;
      }

      trimClip(initialClip.id, {
        start: initialClip.start,
        duration: nextDuration,
        inPoint: initialClip.inPoint,
      });
    };

    const handlePointerUp = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) {
        return;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(clip.id, { x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={classNames(
        'timeline-clip',
        isDragging && 'timeline-clip--dragging',
        isSelected && 'timeline-clip--selected',
      )}
      style={style}
      {...attributes}
      onContextMenu={handleContextMenu}
    >
      <div
        className="timeline-clip__handle timeline-clip__handle--start"
        onPointerDown={handleTrimStart}
      />
      <div className="timeline-clip__content" {...listeners}>
        <span className="timeline-clip__label" title={clip.name}>
          {clip.name}
        </span>
        <span className="timeline-clip__duration">{formatDuration(clip.duration)}</span>
      </div>
      <div
        className="timeline-clip__handle timeline-clip__handle--end"
        onPointerDown={handleTrimEnd}
      />
    </div>
  );
};

const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
