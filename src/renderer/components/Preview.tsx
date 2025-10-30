import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlaybackControls } from '../context/PlaybackContext';
import { useTimelineStore } from '../store/timeline';
import { useMediaStore } from '../store/media';

interface PreviewProps {
  className?: string;
}

export const Preview = ({ className }: PreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clips = useTimelineStore((state) => state.clips);
  const playhead = useTimelineStore((state) => state.playhead);
  const getMediaClip = useMediaStore((state) => state.getClip);
  const playback = usePlaybackControls();
  const urlCacheRef = useRef(new Map<string, string>());
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  const activeClip = useMemo(() => {
    if (!clips.length) return null;
    return (
      clips.find((clip) => playhead >= clip.start && playhead < clip.start + clip.duration) ?? null
    );
  }, [clips, playhead]);

  const nextClip = useMemo(() => {
    if (!activeClip) return null;
    const sorted = [...clips].sort((a, b) => a.start - b.start);
    const currentIndex = sorted.findIndex((clip) => clip.id === activeClip.id);
    if (currentIndex === -1) return null;
    return sorted[currentIndex + 1] ?? null;
  }, [clips, activeClip]);

  useEffect(() => {
    let cancelled = false;

    const ensureUrl = async (mediaId: string) => {
      const cached = urlCacheRef.current.get(mediaId);
      if (cached) {
        return cached;
      }

      const mediaClip = getMediaClip(mediaId);
      if (!mediaClip) {
        throw new Error(`Media clip ${mediaId} not found`);
      }

      const response = await window.clipforge.getMediaFileUrl(mediaClip.path);
      if (response.status === 'error') {
        throw new Error(response.message);
      }

      urlCacheRef.current.set(mediaId, response.data);
      return response.data;
    };

    const applyClip = async () => {
      if (!videoRef.current) {
        return;
      }

      if (!activeClip) {
        if (videoRef.current.src && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        setActiveClipId(null);
        return;
      }

      try {
        const url = await ensureUrl(activeClip.mediaId);
        if (cancelled || !videoRef.current) {
          return;
        }

        if (activeClipId !== activeClip.id) {
          videoRef.current.src = url;
          videoRef.current.load();
          setActiveClipId(activeClip.id);
        }

        const mediaClip = getMediaClip(activeClip.mediaId);
        const mediaDuration = mediaClip?.metadata.duration;
        const relativeTime = Math.max(0, playhead - activeClip.start);
        const targetTime = activeClip.inPoint + relativeTime;
        const clampedTime =
          typeof mediaDuration === 'number' ? Math.min(targetTime, mediaDuration) : targetTime;
        const tolerance = playback.isPlaying ? 0.25 : 0.02;
        if (Math.abs(videoRef.current.currentTime - clampedTime) > tolerance) {
          videoRef.current.currentTime = clampedTime;
        }

        if (playback.isPlaying) {
          void videoRef.current.play().catch(() => {
            /* ignored */
          });
        } else {
          videoRef.current.pause();
        }

        if (nextClip) {
          void ensureUrl(nextClip.mediaId).catch(() => {
            /* ignore preload errors */
          });
        }
      } catch (error) {
        console.warn('[Preview] Failed to load clip', error);
      }
    };

    void applyClip();

    return () => {
      cancelled = true;
    };
  }, [activeClip, nextClip, playhead, getMediaClip, playback.isPlaying, activeClipId]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    if (playback.isPlaying) {
      void videoRef.current.play().catch(() => {
        /* ignore */
      });
    } else {
      videoRef.current.pause();
    }
  }, [playback.isPlaying]);

  return (
    <div className={classNames('preview', className)}>
      <div className="preview__surface">
        <video ref={videoRef} className="preview__video" controls={false} />
      </div>
    </div>
  );
};
