import React from 'react';
import { Col } from 'reactstrap';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStoryCard from './SortableStoryCard';

interface KanbanColumnProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    colorClass: string;
    accentType?: 'pending' | 'progress' | 'done';
    stories: any[];
    projectDetails: any;
    memberFilter: string | null;
    expandedStories: Record<string, boolean>;
    handlers: any;
}

const KanbanColumn = ({
    id,
    title,
    icon,
    colorClass,
    accentType = 'pending',
    stories,
    projectDetails,
    memberFilter,
    expandedStories,
    handlers
}: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <Col lg={4} className="mb-4">
            <div className={`kanban-column kanban-column--${accentType} ${isOver ? 'is-over' : ''}`}>
                {/* Column Header with Count Pill */}
                <div className="kanban-column-header">
                    <h6 className="kanban-column-header__title">
                        <span className={`kanban-column-header__dot kanban-column-header__dot--${accentType}`}></span>
                        <span>{title}</span>
                        <span className={`kanban-count-pill kanban-count-pill--${accentType}`}>
                            {stories.length}
                        </span>
                    </h6>
                </div>

                {/* Column Body */}
                <div
                    ref={setNodeRef}
                    className="kanban-column-body"
                >
                    <SortableContext 
                        id={id}
                        items={stories.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {stories.length === 0 ? (
                            <div className="kanban-empty-drop">
                                <i className="ri-drag-drop-line kanban-empty-drop__icon"></i>
                                <span className="kanban-empty-drop__text">Arrastrar historia aquí</span>
                            </div>
                        ) : (
                            stories.map((story) => (
                                <SortableStoryCard 
                                    key={story.id}
                                    story={story}
                                    projectDetails={projectDetails}
                                    memberFilter={memberFilter}
                                    expanded={!!expandedStories[story.id]}
                                    handlers={handlers}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            </div>
        </Col>
    );
};

export default React.memo(KanbanColumn);
