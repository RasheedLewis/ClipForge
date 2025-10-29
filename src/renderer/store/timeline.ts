import { create } from 'zustand';
import { arrayMove } from '../utils/arrayMove';

export type TimelineTrack = 'main' | 'overlay';

export interface TimelineClip {
  id: string;
  mediaId: string;
  track: TimelineTrack;
  start: number;
  duration: number;
  name: string;
}

export interface TimelineState {
  clips: TimelineClip[];
  playhead: number;
  zoom: number;
  addClip: (clip: {
    id?: string;
    mediaId: string;
    duration: number;
    name: string;
    track?: TimelineTrack;
  }) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, targetTrack: TimelineTrack, targetIndex: number) => void;
  reorderClip: (clipId: string, targetIndex: number) => void;
  setPlayhead: (time: number) => void;
  setZoom: (zoom: number) => void;
  getTrackClips: (track: TimelineTrack) => TimelineClip[];
}

const DEFAULT_ZOOM = 80; // pixels per second

const computeTrackStart = (track: TimelineTrack, clips: TimelineClip[]) => {
  const trackClips = clips.filter((clip) => clip.track === track);
  if (!trackClips.length) {
    return 0;
  }

  const lastClip = trackClips[trackClips.length - 1];
  return lastClip.start + lastClip.duration;
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  clips: [],
  playhead: 0,
  zoom: DEFAULT_ZOOM,
  addClip: ({ id, mediaId, duration, name, track = 'main' }) => {
    set((state) => {
      const clipId = id ?? crypto.randomUUID?.() ?? `clip-${Date.now()}`;
      const start = computeTrackStart(track, state.clips);

      const next: TimelineClip = {
        id: clipId,
        mediaId,
        duration: Math.max(duration, 0.1),
        name,
        start,
        track,
      };

      return { clips: [...state.clips, next] };
    });
  },
  removeClip: (clipId) => {
    set((state) => ({ clips: state.clips.filter((clip) => clip.id !== clipId) }));
  },
  moveClip: (clipId, targetTrack, targetIndex) => {
    set((state) => {
      const clip = state.clips.find((item) => item.id === clipId);
      if (!clip) {
        return state;
      }

      const withoutClip = state.clips.filter((item) => item.id !== clipId);
      const targetTrackClips = withoutClip
        .filter((item) => item.track === targetTrack)
        .sort((a, b) => a.start - b.start);

      const boundedIndex = Math.max(0, Math.min(targetIndex, targetTrackClips.length));
      const newClip: TimelineClip = {
        ...clip,
        track: targetTrack,
      };

      const nextTrackClips = [...targetTrackClips];
      nextTrackClips.splice(boundedIndex, 0, newClip);

      let cursor = 0;
      const recalculated = nextTrackClips.map((item) => {
        const updated = { ...item, start: cursor };
        cursor += item.duration;
        return updated;
      });

      const merged = withoutClip.filter((item) => item.track !== targetTrack).concat(recalculated);

      return { clips: merged };
    });
  },
  reorderClip: (clipId, targetIndex) => {
    set((state) => {
      const track = state.clips.find((clip) => clip.id === clipId)?.track;
      if (!track) {
        return state;
      }

      const trackClips = state.clips
        .filter((clip) => clip.track === track)
        .sort((a, b) => a.start - b.start);
      const currentIndex = trackClips.findIndex((clip) => clip.id === clipId);
      if (currentIndex === -1 || currentIndex === targetIndex) {
        return state;
      }

      const reorderedTrack = arrayMove(trackClips, currentIndex, targetIndex);
      let cursor = 0;
      const updatedTrack = reorderedTrack.map((clip) => {
        const updated = { ...clip, start: cursor };
        cursor += clip.duration;
        return updated;
      });

      const merged = state.clips.map((clip) => {
        const updated = updatedTrack.find((item) => item.id === clip.id);
        return updated ?? clip;
      });

      return { clips: merged };
    });
  },
  setPlayhead: (time) => {
    set({ playhead: Math.max(0, time) });
  },
  setZoom: (zoom) => {
    set({ zoom: Math.min(240, Math.max(20, zoom)) });
  },
  getTrackClips: (track) =>
    get()
      .clips.filter((clip) => clip.track === track)
      .sort((a, b) => a.start - b.start),
}));
