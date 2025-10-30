import type { FC } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimelineStore, type TimelineTrack, MIN_CLIP_DURATION } from '../store/timeline';
import { Ruler } from './Ruler';
import { Track } from './Track';
import { ClipItem } from './ClipItem';

const TRACK_IDS: TimelineTrack[] = ['main', 'overlay'];

export const Timeline: FC = () => {
  const clips = useTimelineStore((state) => state.clips);
  const playhead = useTimelineStore((state) => state.playhead);
  const zoom = useTimelineStore((state) => state.zoom);
  const setPlayhead = useTimelineStore((state) => state.setPlayhead);
  const setZoom = useTimelineStore((state) => state.setZoom);
  const getTrackClips = useTimelineStore((state) => state.getTrackClips);
  const removeClip = useTimelineStore((state) => state.removeClip);
  const splitClip = useTimelineStore((state) => state.splitClip);
  const getClip = useTimelineStore((state) => state.getClip);
  const positionClip = useTimelineStore((state) => state.positionClip);

  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(
    null,
  );
  const tracksRef = useRef<HTMLDivElement | null>(null);
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef<{ clipId: string; start: number; track: TimelineTrack } | null>(
    null,
  );

  useEffect(() => {
    const container = tracksRef.current;
    const ruler = rulerRef.current;
    if (!container || !ruler) {
      return undefined;
    }

    const handleScroll = () => {
      const current = container.scrollLeft;
      ruler.scrollLeft = current;
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const duration = Math.max(60, Math.max(...clips.map((clip) => clip.start + clip.duration), 0));
  const trackWidth = Math.max(duration * zoom + 200, 800);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const clipId = event.active.id as string;
      setActiveClipId(clipId);
      setContextMenu(null);

      const clip = clips.find((item) => item.id === clipId);
      if (clip) {
        dragOriginRef.current = { clipId, start: clip.start, track: clip.track };
      }
    },
    [clips],
  );

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over || !activeClipId) {
      return;
    }

    if (event.over.id === activeClipId) {
      return;
    }
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      const origin = dragOriginRef.current;
      dragOriginRef.current = null;
      setActiveClipId(null);

      if (!origin || (over && over.id === active.id)) {
        return;
      }

      let targetTrack: TimelineTrack = origin.track;
      if (over) {
        const overId = over.id as string;
        const parsedTrack = parseTrackId(overId);
        if (parsedTrack) {
          targetTrack = parsedTrack;
        } else {
          const overClip = clips.find((clip) => clip.id === overId);
          if (overClip) {
            targetTrack = overClip.track;
          }
        }
      }

      const deltaSeconds = delta.x / zoom;
      const proposedStart = origin.start + deltaSeconds;
      positionClip(origin.clipId, targetTrack, proposedStart);
    },
    [clips, positionClip, zoom],
  );

  useEffect(() => {
    if (!clips.length) {
      setPlayhead(0);
    }
  }, [clips, setPlayhead]);

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const exists = clips.some((clip) => clip.id === contextMenu.clipId);
    if (!exists) {
      setContextMenu(null);
    }
  }, [clips, contextMenu]);

  const handleRulerSelect = (time: number) => {
    setPlayhead(Math.max(0, time));
  };

  const trackClipMap = TRACK_IDS.reduce<Record<TimelineTrack, ReturnType<typeof getTrackClips>>>(
    (acc, track) => ({
      ...acc,
      [track]: getTrackClips(track),
    }),
    { main: [], overlay: [] },
  );

  const handleClipContextMenu = useCallback(
    (clipId: string, position: { x: number; y: number }) => {
      setContextMenu({ clipId, ...position });
    },
    [],
  );

  const contextClip = useMemo(
    () => (contextMenu ? (getClip(contextMenu.clipId) ?? null) : null),
    [contextMenu, getClip],
  );

  const canSplit = useMemo(() => {
    if (!contextClip) {
      return false;
    }
    const clipStart = contextClip.start + MIN_CLIP_DURATION;
    const clipEnd = contextClip.start + contextClip.duration - MIN_CLIP_DURATION;
    return playhead > clipStart && playhead < clipEnd;
  }, [contextClip, playhead]);

  const handleSplitAtPlayhead = () => {
    if (!contextClip || !canSplit) {
      return;
    }
    splitClip(contextClip.id, playhead);
    setContextMenu(null);
  };

  const handleDeleteClip = () => {
    if (!contextClip) {
      return;
    }
    removeClip(contextClip.id);
    setContextMenu(null);
  };

  const closeContextMenu = () => setContextMenu(null);

  const menuPosition = useMemo(() => {
    if (!contextMenu || typeof window === 'undefined') {
      return null;
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200;
    const menuHeight = 120;
    const margin = 12;
    const x = Math.min(contextMenu.x, viewportWidth - menuWidth - margin);
    const y = Math.min(contextMenu.y, viewportHeight - menuHeight - margin);
    return { x: Math.max(margin, x), y: Math.max(margin, y) };
  }, [contextMenu]);

  return (
    <div className="timeline">
      <div className="timeline__header">
        <div className="timeline__controls">
          <label className="timeline__zoom">
            Zoom
            <input
              type="range"
              min={20}
              max={240}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <span className="timeline__zoom-value">{zoom}px / s</span>
        </div>
        <button type="button" className="timeline__playhead-reset" onClick={() => setPlayhead(0)}>
          Reset Playhead
        </button>
      </div>
      <div className="timeline__body">
        <div className="timeline__ruler" ref={rulerRef}>
          <Ruler duration={duration} zoom={zoom} width={trackWidth} onSelect={handleRulerSelect} />
        </div>
        <div className="timeline__tracks" ref={tracksRef} onPointerDown={closeContextMenu}>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
          >
            {TRACK_IDS.map((trackId) => (
              <SortableContext key={trackId} items={trackClipMap[trackId].map((clip) => clip.id)}>
                <Track
                  id={`track:${trackId}`}
                  title={trackId === 'main' ? 'Main Track' : 'Overlay Track'}
                  width={trackWidth}
                >
                  {trackClipMap[trackId].map((clip) => (
                    <ClipItem
                      key={clip.id}
                      clip={clip}
                      zoom={zoom}
                      isSelected={
                        clip.id === activeClipId || clip.id === contextMenu?.clipId || false
                      }
                      onContextMenu={handleClipContextMenu}
                      onCloseContextMenu={closeContextMenu}
                    />
                  ))}
                </Track>
              </SortableContext>
            ))}
          </DndContext>
          <div className="timeline__playhead" style={{ left: `${playhead * zoom}px` }}>
            <span className="timeline__playhead-handle" />
          </div>
        </div>
      </div>
      {contextMenu ? (
        <>
          <div className="timeline-context-menu-backdrop" onPointerDown={closeContextMenu} />
          {menuPosition ? (
            <div
              className="timeline-context-menu"
              style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
            >
              <button
                type="button"
                className="timeline-context-menu__item"
                onClick={handleSplitAtPlayhead}
                disabled={!canSplit}
              >
                Split at Playhead
              </button>
              <button
                type="button"
                className="timeline-context-menu__item"
                onClick={handleDeleteClip}
              >
                Delete Clip
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

const parseTrackId = (id: string): TimelineTrack | null => {
  if (id === 'track:main') return 'main';
  if (id === 'track:overlay') return 'overlay';
  return null;
};
