import { createContext, useContext } from 'react';

export interface PlaybackControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggle: () => void;
  isPlaying: boolean;
  playhead: number;
  duration: number;
}

export const PlaybackContext = createContext<PlaybackControls | null>(null);

export const usePlaybackControls = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlaybackControls must be used within PlaybackProvider');
  }
  return context;
};
