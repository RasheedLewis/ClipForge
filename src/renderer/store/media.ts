import { create } from 'zustand';
import type { MediaMetadata } from '@shared/types';

export interface MediaClip {
  id: string;
  path: string;
  name: string;
  metadata: MediaMetadata;
  thumbnail?: string;
  createdAt: number;
}

interface MediaLibraryState {
  clips: MediaClip[];
  addClips: (clips: MediaClip[]) => void;
  removeClip: (clipId: string) => void;
  clear: () => void;
}

const sortByCreatedAtDesc = (clips: MediaClip[]) =>
  [...clips].sort((a, b) => b.createdAt - a.createdAt);

export const useMediaStore = create<MediaLibraryState>((set) => ({
  clips: [],
  addClips: (incoming) =>
    set((state) => {
      if (!incoming.length) {
        return state;
      }

      const merged = new Map<string, MediaClip>();
      state.clips.forEach((clip) => merged.set(clip.path, clip));
      incoming.forEach((clip) => merged.set(clip.path, clip));

      return { clips: sortByCreatedAtDesc(Array.from(merged.values())) };
    }),
  removeClip: (clipId) =>
    set((state) => ({
      clips: state.clips.filter((clip) => clip.id !== clipId),
    })),
  clear: () => set({ clips: [] }),
}));
