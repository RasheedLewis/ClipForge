import type { FC, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface TrackProps {
  id: string;
  title: ReactNode;
  width: number;
  children: ReactNode;
}

export const Track: FC<TrackProps> = ({ id, title, width, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={`timeline-track${isOver ? ' timeline-track--active' : ''}`}>
      <header className="timeline-track__header">{title}</header>
      <div className="timeline-track__body" ref={setNodeRef}>
        <div className="timeline-track__clips" style={{ width }}>
          {children}
        </div>
      </div>
    </div>
  );
};
