import { useEffect, useMemo, useRef, useState } from 'react';
import { useTimelineStore } from '../store/timeline';

const FPS_TARGET = 30;
const FRAME_DURATION = 1000 / FPS_TARGET;

export const useTimelinePlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playhead = useTimelineStore((state) => state.playhead);
  const setPlayhead = useTimelineStore((state) => state.setPlayhead);
  const clips = useTimelineStore((state) => state.clips);

  const playheadRef = useRef(playhead);
  const duration = useMemo(
    () => (clips.length ? Math.max(...clips.map((clip) => clip.start + clip.duration)) : 0),
    [clips],
  );
  const durationRef = useRef(duration);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      if (delta >= FRAME_DURATION) {
        const nextTime = playheadRef.current + delta / 1000;
        if (nextTime >= durationRef.current) {
          setPlayhead(0);
          playheadRef.current = 0;
          setIsPlaying(false);
          lastTimeRef.current = null;
          return;
        }
        playheadRef.current = nextTime;
        setPlayhead(nextTime);
        lastTimeRef.current = timestamp;
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [isPlaying, setPlayhead]);

  const play = () => {
    if (!clips.length) {
      return;
    }
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const seek = (time: number) => {
    const clamped = Math.max(0, Math.min(time, durationRef.current));
    playheadRef.current = clamped;
    setPlayhead(clamped);
  };

  const toggle = () => {
    setIsPlaying((prev) => {
      if (prev) {
        return false;
      }
      if (!clips.length) {
        return prev;
      }
      return true;
    });
  };

  return {
    isPlaying,
    playhead,
    duration,
    play,
    pause,
    seek,
    toggle,
  } as const;
};
