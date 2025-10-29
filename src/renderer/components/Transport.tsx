import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { usePlaybackControls } from '../context/PlaybackContext';

const formatTimestamp = (seconds: number) => {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Transport: FC = () => {
  const playback = usePlaybackControls();
  const sliderRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        playback.toggle();
      }
      if (event.code === 'ArrowRight') {
        playback.seek(playback.playhead + 1);
      }
      if (event.code === 'ArrowLeft') {
        playback.seek(playback.playhead - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playback]);

  const progress = playback.duration > 0 ? (playback.playhead / playback.duration) * 100 : 0;

  return (
    <div className="transport">
      <button
        type="button"
        className={classNames('transport__button', playback.isPlaying && 'is-active')}
        onClick={playback.toggle}
      >
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>
      <div className="transport__time">
        <span>{formatTimestamp(playback.playhead)}</span>
        <span>/</span>
        <span>{formatTimestamp(playback.duration)}</span>
      </div>
      <input
        ref={sliderRef}
        className="transport__seek"
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={Number.isFinite(progress) ? progress : 0}
        onChange={(event) => {
          const ratio = Number(event.target.value) / 100;
          playback.seek(playback.duration * ratio);
        }}
      />
    </div>
  );
};
