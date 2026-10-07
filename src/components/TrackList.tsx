import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TrackRow from './TrackRow';
import { useSetStore } from '../store/useSetStore';
import type { Track } from '../types/track';

interface Props {
  onOpenTrack: (t: Track) => void;
}

export default function TrackList({ onOpenTrack }: Props) {
  const tracks = useSetStore((s) => s.tracks);
  const viewMode = useSetStore((s) => s.viewMode);
  const moveTrack = useSetStore((s) => s.moveTrack);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // long-press 220ms to start drag on touch, so scrolling still works
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) moveTrack(String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="border-t border-ink-border">
          {tracks.map((t) => (
            <TrackRow key={t.id} track={t} mode={viewMode} onOpen={onOpenTrack} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
