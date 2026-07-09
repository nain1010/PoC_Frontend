import React from 'react';
import { Card, CardBody, Col } from 'reactstrap';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStoryCard from './SortableStoryCard';

interface KanbanColumnProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    colorClass: string;
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
    stories,
    projectDetails,
    memberFilter,
    expandedStories,
    handlers
}: KanbanColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    const isOverClass = isOver ? 'bg-secondary bg-opacity-10' : '';

    return (
        <Col lg={4} className="mb-4">
            <Card className={`bg-light border-top border-3 ${colorClass} shadow-none h-100 transition-all ${isOverClass}`}>
                <div className="p-3 bg-light-subtle d-flex justify-content-between align-items-center rounded-top border-bottom">
                    <h6 className="card-title mb-0 fw-bold text-body flex-grow-1">
                        {icon}
                        <span>{title} ({stories.length})</span>
                    </h6>
                </div>
                <CardBody 
                    innerRef={setNodeRef}
                    className="p-3 overflow-y-auto" 
                    style={{ maxHeight: "calc(100vh - 300px)", minHeight: "350px" }}
                >
                    <SortableContext 
                        id={id}
                        items={stories.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {stories.length === 0 ? (
                            <div className="text-center py-5 text-muted fs-13">Ninguna historia.</div>
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
                </CardBody>
            </Card>
        </Col>
    );
};

export default React.memo(KanbanColumn);
