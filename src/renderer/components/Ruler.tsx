import type { FC } from 'react';

interface RulerProps {
  duration: number;
  zoom: number;
  onSelectTime: (time: number) => void;
}

const markerStepSeconds = (zoom: number) => {
  if (zoom >= 180) return 1;
  if (zoom >= 120) return 2;
  if (zoom >= 80) return 5;
  if (zoom >= 60) return 10;
  if (zoom >= 40) return 15;
  return 30;
};

export const Ruler: FC<RulerProps> = ({ duration, zoom, onSelectTime }) => {
  const step = markerStepSeconds(zoom);
  const markers = [];
  for (let time = 0; time <= duration; time += step) {
    markers.push(time);
  }

  return (
    <div
      className="timeline-ruler"
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const offset = event.clientX - rect.left;
        const time = offset / zoom;
        onSelectTime(Math.max(0, time));
      }}
    >
      {markers.map((time) => (
        <div key={time} className="timeline-ruler__marker" style={{ left: `${time * zoom}px` }}>
          <span>{formatTimeLabel(time)}</span>
        </div>
      ))}
    </div>
  );
};

const formatTimeLabel = (seconds: number) => {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
