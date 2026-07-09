import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanStoryCard from './KanbanStoryCard';

interface SortableStoryCardProps {
    story: any;
    projectDetails: any;
    memberFilter: string | null;
    expanded: boolean;
    handlers: {
        onStoryStatusChange: (storyId: string, status: string) => void;
        onTaskStatusChange: (taskId: string, status: string) => void;
        onTaskAssign: (taskId: string, usuarioId: string) => void;
        onOpenTaskModal: (storyId: string) => void;
        onToggleExpand: (storyId: string) => void;
        onOpenPageSelector: (id: string, type: 'historia' | 'tarea') => void;
        onOpenAttachmentModal: (id: string, type: 'historia' | 'tarea') => void;
        onOpenPageViewer: (pageId: string) => void;
        storyErrors?: Record<string, string>;
    };
}

const SortableStoryCard = ({
    story,
    projectDetails,
    memberFilter,
    expanded,
    handlers
}: SortableStoryCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: story.id,
        data: {
            type: 'Story',
            story
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <KanbanStoryCard 
            story={story}
            projectDetails={projectDetails}
            memberFilter={memberFilter}
            expanded={expanded}
            setNodeRef={setNodeRef}
            style={style}
            isDragging={isDragging}
            dragHandleProps={{ ...attributes, ...listeners }}
            {...handlers}
            statusErrorExt={handlers.storyErrors ? handlers.storyErrors[story.id] : undefined}
        />
    );
};

export default SortableStoryCard;
