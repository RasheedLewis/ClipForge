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
import { useEffect, useRef, useState } from 'react';
import { useTimelineStore, type TimelineTrack } from '../store/timeline';
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
  const reorderClip = useTimelineStore((state) => state.reorderClip);
  const moveClip = useTimelineStore((state) => state.moveClip);

  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const tracksRef = useRef<HTMLDivElement | null>(null);
  const rulerRef = useRef<HTMLDivElement | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveClipId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over || !activeClipId) {
      return;
    }

    if (event.over.id === activeClipId) {
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveClipId(null);
      return;
    }

    if (over.id === active.id) {
      setActiveClipId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetTrack = parseTrackId(overId);
    if (targetTrack) {
      const trackClips = getTrackClips(targetTrack);
      moveClip(activeId, targetTrack, trackClips.length);
    } else {
      const overClip = clips.find((clip) => clip.id === overId);
      const activeClip = clips.find((clip) => clip.id === activeId);
      if (overClip && activeClip) {
        if (overClip.track === activeClip.track) {
          const trackClips = getTrackClips(activeClip.track);
          const targetIndex = trackClips.findIndex((clip) => clip.id === overClip.id);
          reorderClip(activeClip.id, targetIndex);
        } else {
          const targetTrackClips = getTrackClips(overClip.track);
          const targetIndex = targetTrackClips.findIndex((clip) => clip.id === overClip.id);
          moveClip(activeClip.id, overClip.track, targetIndex);
        }
      }
    }

    setActiveClipId(null);
  };

  useEffect(() => {
    if (!clips.length) {
      setPlayhead(0);
    }
  }, [clips, setPlayhead]);

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
        <div className="timeline__tracks" ref={tracksRef}>
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
                      isSelected={clip.id === activeClipId}
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
    </div>
  );
};

const parseTrackId = (id: string): TimelineTrack | null => {
  if (id === 'track:main') return 'main';
  if (id === 'track:overlay') return 'overlay';
  return null;
};
