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
  inPoint: number;
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
  trimClip: (
    clipId: string,
    payload: {
      start: number;
      duration: number;
      inPoint: number;
    },
  ) => void;
  splitClip: (clipId: string, time: number) => void;
  positionClip: (clipId: string, targetTrack: TimelineTrack, start: number) => void;
  setPlayhead: (time: number) => void;
  setZoom: (zoom: number) => void;
  getTrackClips: (track: TimelineTrack) => TimelineClip[];
  getClip: (clipId: string) => TimelineClip | undefined;
  getAdjacentClips: (clipId: string) => {
    previous: TimelineClip | null;
    next: TimelineClip | null;
  };
}

const DEFAULT_ZOOM = 80; // pixels per second
export const MIN_CLIP_DURATION = 0.1;

const computeTrackStart = (track: TimelineTrack, clips: TimelineClip[]) => {
  const trackClips = clips.filter((clip) => clip.track === track);
  if (!trackClips.length) {
    return 0;
  }

  const lastClip = trackClips[trackClips.length - 1];
  return lastClip.start + lastClip.duration;
};

const generateClipId = () => crypto.randomUUID?.() ?? `clip-${Date.now()}`;

const reflowTrack = (clips: TimelineClip[], track: TimelineTrack) => {
  const trackClips = clips.filter((clip) => clip.track === track).sort((a, b) => a.start - b.start);

  let cursor = 0;
  const updated = trackClips.map((clip) => {
    const next = { ...clip, start: cursor };
    cursor += clip.duration;
    return next;
  });

  const replacement = new Map(updated.map((clip) => [clip.id, clip]));
  return clips.map((clip) => replacement.get(clip.id) ?? clip);
};

const getAdjacent = (clips: TimelineClip[], clip: TimelineClip) => {
  const sorted = clips
    .filter((item) => item.track === clip.track)
    .sort((a, b) => a.start - b.start);
  const index = sorted.findIndex((item) => item.id === clip.id);
  return {
    previous: index > 0 ? sorted[index - 1] : null,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null,
  };
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
  clips: [],
  playhead: 0,
  zoom: DEFAULT_ZOOM,
  addClip: ({ id, mediaId, duration, name, track = 'main' }) => {
    set((state) => {
      const clipId = id ?? generateClipId();
      const start = computeTrackStart(track, state.clips);

      const next: TimelineClip = {
        id: clipId,
        mediaId,
        duration: Math.max(duration, MIN_CLIP_DURATION),
        name,
        start,
        track,
        inPoint: 0,
      };

      return { clips: [...state.clips, next] };
    });
  },
  removeClip: (clipId) => {
    set((state) => {
      const clip = state.clips.find((item) => item.id === clipId);
      if (!clip) {
        return state;
      }

      const remaining = state.clips.filter((item) => item.id !== clipId);
      return { clips: reflowTrack(remaining, clip.track) };
    });
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
  trimClip: (clipId, payload) => {
    set((state) => {
      const clip = state.clips.find((item) => item.id === clipId);
      if (!clip) {
        return state;
      }

      const duration = Math.max(MIN_CLIP_DURATION, payload.duration);
      const start = Math.max(0, payload.start);
      const inPoint = Math.max(0, payload.inPoint);

      const updated: TimelineClip = {
        ...clip,
        duration,
        start,
        inPoint,
      };

      const nextClips = state.clips.map((item) => (item.id === clipId ? updated : item));
      return { clips: nextClips };
    });
  },
  splitClip: (clipId, time) => {
    set((state) => {
      const clipIndex = state.clips.findIndex((item) => item.id === clipId);
      if (clipIndex === -1) {
        return state;
      }

      const clip = state.clips[clipIndex];
      const localTime = time - clip.start;
      if (localTime <= MIN_CLIP_DURATION || localTime >= clip.duration - MIN_CLIP_DURATION) {
        return state;
      }

      const firstDuration = localTime;
      const secondDuration = clip.duration - firstDuration;
      if (firstDuration < MIN_CLIP_DURATION || secondDuration < MIN_CLIP_DURATION) {
        return state;
      }

      const firstClip: TimelineClip = {
        ...clip,
        duration: firstDuration,
      };

      const secondClip: TimelineClip = {
        ...clip,
        id: generateClipId(),
        start: clip.start + firstDuration,
        duration: secondDuration,
        inPoint: clip.inPoint + firstDuration,
      };

      const nextClips = [...state.clips];
      nextClips.splice(clipIndex, 1, firstClip, secondClip);

      return { clips: reflowTrack(nextClips, clip.track) };
    });
  },
  positionClip: (clipId, targetTrack, start) => {
    set((state) => {
      const clip = state.clips.find((item) => item.id === clipId);
      if (!clip || Number.isNaN(start)) {
        return state;
      }

      const sanitizedStart = Math.max(0, start);
      const withoutClip = state.clips.filter((item) => item.id !== clipId);
      const targetTrackClips = withoutClip
        .filter((item) => item.track === targetTrack)
        .sort((a, b) => a.start - b.start);

      const newClip: TimelineClip = {
        ...clip,
        track: targetTrack,
        start: sanitizedStart,
      };

      const insertion = [...targetTrackClips];
      const insertIndex = insertion.findIndex((item) => item.start > sanitizedStart);
      if (insertIndex === -1) {
        insertion.push(newClip);
      } else {
        insertion.splice(insertIndex, 0, newClip);
      }

      const adjustedTrack: TimelineClip[] = [];
      insertion.forEach((item) => {
        const previous = adjustedTrack[adjustedTrack.length - 1] ?? null;
        const minStart = previous ? previous.start + previous.duration : 0;
        const desiredStart = item.id === newClip.id ? sanitizedStart : item.start;
        const boundedStart = Math.max(minStart, desiredStart);
        adjustedTrack.push({ ...item, start: boundedStart });
      });

      const merged = withoutClip.filter((item) => item.track !== targetTrack).concat(adjustedTrack);

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
  getClip: (clipId) => get().clips.find((clip) => clip.id === clipId),
  getAdjacentClips: (clipId) => {
    const clip = get().clips.find((item) => item.id === clipId);
    if (!clip) {
      return { previous: null, next: null };
    }

    return getAdjacent(get().clips, clip);
  },
}));
