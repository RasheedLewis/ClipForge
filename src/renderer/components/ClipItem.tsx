import type { FC } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { TimelineClip } from '../store/timeline';

interface ClipItemProps {
  clip: TimelineClip;
  zoom: number;
  isSelected?: boolean;
}

export const ClipItem: FC<ClipItemProps> = ({ clip, zoom, isSelected }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clip.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: `${clip.duration * zoom}px`,
    left: `${clip.start * zoom}px`,
  } as const;

  return (
    <div
      ref={setNodeRef}
      className={`timeline-clip${isDragging ? ' timeline-clip--dragging' : ''}${
        isSelected ? ' timeline-clip--selected' : ''
      }`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <span className="timeline-clip__label">{clip.name}</span>
      <span className="timeline-clip__duration">{formatDuration(clip.duration)}</span>
    </div>
  );
};

const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
