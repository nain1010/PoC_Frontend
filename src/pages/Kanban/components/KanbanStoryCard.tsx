import React, { useMemo, useState, useCallback } from 'react';
import { Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Input, Label, UncontrolledDropdown } from 'reactstrap';
import InlineAttachments from '../../../Components/Common/InlineAttachments';

/** Map story estado to CSS modifier for status pill */
const getStatusPillClass = (estado: string) => {
    switch (estado) {
        case 'Comprometida': return 'kanban-status-pill--comprometida';
        case 'En Progreso': return 'kanban-status-pill--en-progreso';
        case 'Lista para Pruebas': return 'kanban-status-pill--lista-pruebas';
        case 'Hecha': return 'kanban-status-pill--hecha';
        case 'Nueva': return 'kanban-status-pill--nueva';
        case 'Refinada': return 'kanban-status-pill--refinada';
        default: return 'kanban-status-pill--nueva';
    }
};

const KanbanStoryCard = React.memo(({ story, projectDetails, memberFilter, onStoryStatusChange, onTaskStatusChange, onTaskAssign, onOpenTaskModal, expanded, onToggleExpand, onOpenPageSelector, onOpenAttachmentModal, onOpenPageViewer, dragHandleProps, setNodeRef, style, isDragging, statusErrorExt }: {
    story: any;
    projectDetails: any;
    memberFilter: string | null;
    onStoryStatusChange: (storyId: string, status: string) => void;
    onTaskStatusChange: (taskId: string, status: string) => void;
    onTaskAssign: (taskId: string, usuarioId: string) => void;
    onOpenTaskModal: (storyId: string) => void;
    expanded: boolean;
    onToggleExpand: (storyId: string) => void;
    onOpenPageSelector: (id: string, type: 'historia' | 'tarea') => void;
    onOpenAttachmentModal: (id: string, type: 'historia' | 'tarea') => void;
    onOpenPageViewer: (pageId: string) => void;
    dragHandleProps?: any;
    setNodeRef?: any;
    style?: any;
    isDragging?: boolean;
    statusErrorExt?: string;
}) => {
    // Filter tasks for this story
    const storyTasks = useMemo(
        () => projectDetails?.tareas?.filter((t: any) => t.historia_id === story.id) || [],
        [projectDetails?.tareas, story.id]
    );

    // Filter tasks by member if active
    const memberTasksCount = useMemo(() => 
        memberFilter ? storyTasks.filter((t: any) => t.asignado_a_id === memberFilter).length : storyTasks.length,
        [storyTasks, memberFilter]
    );

    const doneTasksCount = useMemo(() => 
        storyTasks.filter((t: any) => t.estado === 'Terminada' && (!memberFilter || t.asignado_a_id === memberFilter)).length,
        [storyTasks, memberFilter]
    );

    const totalTasksCount = useMemo(() => 
        storyTasks.filter((t: any) => !memberFilter || t.asignado_a_id === memberFilter).length,
        [storyTasks, memberFilter]
    );

    // Filter tasks inside the story card by selected member
    const displayedTasks = useMemo(
        () => storyTasks.filter((t: any) => {
            if (memberFilter === null) return true;
            if (memberFilter === "unassigned") return !t.asignado_a_id;
            return t.asignado_a_id === memberFilter;
        }),
        [storyTasks, memberFilter]
    );

    // Progress percentage
    const progressPercent = useMemo(
        () => totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0,
        [doneTasksCount, totalTasksCount]
    );

    // Find primary assignee (first assigned developer across tasks)
    const primaryAssignee = useMemo(() => {
        const assignedTask = storyTasks.find((t: any) => t.asignado_a_id);
        if (!assignedTask) return null;
        const member = projectDetails?.memberships?.find((m: any) => m.usuario_id === assignedTask.asignado_a_id);
        return member ? {
            initials: member.nombre_completo.substring(0, 2).toUpperCase(),
            name: member.nombre_completo
        } : null;
    }, [storyTasks, projectDetails?.memberships]);

    // Stable handlers
    const handleToggleExpand = useCallback(() => { onToggleExpand(story.id); }, [story.id, onToggleExpand]);
    const handleOpenTaskModal = useCallback(() => { onOpenTaskModal(story.id); }, [story.id, onOpenTaskModal]);

    // Handle dropdown select
    const [storyDropdownOpen, setStoryDropdownOpen] = useState(false);
    const toggleStoryDropdown = useCallback(() => setStoryDropdownOpen(prevState => !prevState), []);

    const [statusError, setStatusError] = useState<string | null>(null);

    const handleStatusClick = useCallback((newState: string) => {
        if (newState === "Hecha" && totalTasksCount > 0 && progressPercent < 100) {
            setStatusError("Termina todas las tareas técnicas primero.");
            setTimeout(() => setStatusError(null), 4000);
            return;
        }
        onStoryStatusChange(story.id, newState);
    }, [totalTasksCount, progressPercent, onStoryStatusChange, story.id]);

    const states = useMemo(() => [
        { label: "Comprometida (Pendiente)", value: "Comprometida" },
        { label: "En Progreso (En curso)", value: "En Progreso" },
        { label: "Lista para Pruebas (En curso)", value: "Lista para Pruebas" },
        { label: "Hecha (Terminada)", value: "Hecha" }
    ], []);

    const currentError = statusError || statusErrorExt;
    const points = story.esfuerzo_estimado || story.puntos_esfuerzo || 0;

    return (
        <div 
            id={`story-${story.id}`}
            ref={setNodeRef}
            style={{ ...style }}
            className={`kanban-story-card mb-3 ${isDragging ? 'is-dragging' : ''}`}
            {...dragHandleProps}
        >
            <div className="card-body">
                {/* Card Header: Correlativo + Status Pill */}
                <div className="kanban-card-header">
                    <span className="kanban-card-correlativo">
                        <i className="ri-drag-move-2-fill"></i>
                        {story.correlativo}
                    </span>
                    
                    {/* Status pill — top-right corner */}
                    <Dropdown isOpen={storyDropdownOpen} toggle={toggleStoryDropdown} size="sm" strategy="fixed">
                        <DropdownToggle tag="button" className={`kanban-status-pill ${getStatusPillClass(story.estado)}`} style={{ cursor: 'pointer' }}>
                            {story.estado}
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-sm dropdown-menu-end">
                            <DropdownItem header><span>Cambiar Estado de Historia</span></DropdownItem>
                            {states.map(state => (
                                <DropdownItem 
                                    key={state.value} 
                                    onClick={() => handleStatusClick(state.value)}
                                    active={story.estado === state.value}
                                    className="fs-12"
                                >
                                    <span>{state.label}</span>
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                {/* Title */}
                <div className="kanban-card-title">{story.titulo}</div>

                {/* Error Alert */}
                {currentError && (
                    <div className="alert alert-danger py-1 px-2 mb-2 fs-11 animate-fade-in-up" role="alert" style={{ borderRadius: '6px' }}>
                        <i className="ri-error-warning-line me-1 align-middle"></i>
                        {currentError}
                    </div>
                )}

                {/* Description — 2-line truncation */}
                <p className="kanban-card-desc" title={story.narrativa}>
                    {story.narrativa}
                </p>

                {/* Progress bar of tasks */}
                <div className="kanban-card-progress">
                    <div className="kanban-card-progress__header">
                        <span className="kanban-card-progress__label">Tareas ({doneTasksCount}/{totalTasksCount})</span>
                        <span className="kanban-card-progress__percent">{progressPercent}%</span>
                    </div>
                    <div className="progress" style={{ height: "4px" }}>
                        <div 
                            className={`progress-bar ${progressPercent === 100 ? 'bg-success' : 'bg-primary'}`} 
                            role="progressbar" 
                            style={{ width: `${progressPercent}%` }} 
                            aria-valuenow={progressPercent} 
                            aria-valuemin={0} 
                            aria-valuemax={100}
                        ></div>
                    </div>
                </div>

                <InlineAttachments projectId={projectDetails.id} entityType="historia" entityId={story.id} onOpenPageViewer={onOpenPageViewer} />

                {/* Compact Footer: attachments + avatar + points */}
                <div className="kanban-card-footer">
                    <div className="kanban-card-footer__actions">
                        <button 
                            className="kanban-card-footer__btn" 
                            onClick={(e) => { e.stopPropagation(); onOpenAttachmentModal(story.id, 'historia'); }} 
                            title="Archivos adjuntos"
                        >
                            <i className="ri-attachment-2"></i>
                        </button>
                        <button 
                            className="kanban-card-footer__btn" 
                            onClick={(e) => { e.stopPropagation(); onOpenPageSelector(story.id, 'historia'); }} 
                            title="Documentos Adjuntos"
                        >
                            <i className="ri-file-text-line"></i>
                        </button>
                    </div>
                    <div className="kanban-card-footer__right">
                        {primaryAssignee && (
                            <span className="kanban-card-footer__avatar" title={primaryAssignee.name}>
                                {primaryAssignee.initials}
                            </span>
                        )}
                        <span className="kanban-card-footer__points">
                            <i className="ri-fire-line"></i>
                            {points} Pts
                        </span>
                    </div>
                </div>

                {/* Actions — Expand toggle + Create Task */}
                <div className="kanban-card-actions">
                    <button 
                        className="kanban-card-actions__toggle"
                        onClick={handleToggleExpand}
                    >
                        <i className={`${expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                        <span>{expanded ? 'Ocultar Tareas' : `Ver Tareas (${displayedTasks.length})`}</span>
                    </button>
                    
                    <button 
                        className="kanban-card-actions__create"
                        onClick={handleOpenTaskModal}
                    >
                        <i className="ri-add-line"></i>
                        <span>Crear Tarea</span>
                    </button>
                </div>

                {/* Expanded Tasks List */}
                {expanded && (
                    <div className="kanban-tasks-panel">
                        <div className="kanban-tasks-panel__title">Desglose Técnico</div>
                        <div>
                            {displayedTasks.length === 0 ? (
                                <div className="kanban-tasks-empty">
                                    <span>{memberFilter ? "No hay tareas que coincidan con el filtro." : "Sin tareas creadas aún. Presiona \"+ Tarea\" para crear una."}</span>
                                </div>
                            ) : (
                                displayedTasks.map((task: any) => (
                                    <div key={task.id} id={`task-${task.id}`} className="kanban-task-row">
                                        <div className="d-flex align-items-start gap-2">
                                            <Input
                                                type="checkbox"
                                                id={`task-check-${task.id}`}
                                                className="mt-1 flex-shrink-0 cursor-pointer"
                                                checked={task.estado === "Terminada"}
                                                onChange={(e) => onTaskStatusChange(task.id, e.target.checked ? "Terminada" : "Pendiente")}
                                            />
                                            <div>
                                                <Label htmlFor={`task-check-${task.id}`} className={`mb-0 fs-13 cursor-pointer ${task.estado === "Terminada" ? "text-decoration-line-through text-muted" : "fw-medium"}`} style={{ color: task.estado === "Terminada" ? 'var(--kanban-text-muted)' : 'var(--kanban-text-title)' }}>
                                                    {task.titulo}
                                                </Label>
                                                <div className="fs-11 mt-1" style={{ color: 'var(--kanban-text-muted)' }}>{task.descripcion}</div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <button className="kanban-card-footer__btn" onClick={(e) => { e.stopPropagation(); onOpenAttachmentModal(task.id, 'tarea'); }} title="Archivos adjuntos">
                                                <i className="ri-attachment-2 fs-14"></i>
                                            </button>
                                            <button className="kanban-card-footer__btn" onClick={(e) => { e.stopPropagation(); onOpenPageSelector(task.id, 'tarea'); }} title="Documentos Adjuntos">
                                                <i className="ri-file-text-line fs-14"></i>
                                            </button>
                                            <UncontrolledDropdown size="sm" strategy="fixed">
                                                <DropdownToggle tag="button" className="kanban-card-footer__btn">
                                                    {task.asignado_a_id ? (
                                                        <span className="kanban-card-footer__avatar" style={{ width: 22, height: 22, fontSize: '8px' }}>
                                                            {projectDetails.memberships?.find((m:any) => m.usuario_id === task.asignado_a_id)?.nombre_completo.substring(0, 2).toUpperCase() || "US"}
                                                        </span>
                                                    ) : (
                                                        <i className="ri-user-add-line fs-14" style={{ color: 'var(--kanban-text-muted)' }}></i>
                                                    )}
                                                </DropdownToggle>
                                                <DropdownMenu className="dropdown-menu-end" container="body">
                                                    <DropdownItem header>Asignar Tarea</DropdownItem>
                                                    <DropdownItem onClick={() => onTaskAssign(task.id, "")} className="fs-12 text-danger">Desasignar</DropdownItem>
                                                    <DropdownItem divider />
                                                    {projectDetails.memberships?.filter((m:any) => m.rol === 'Developer').map((m:any) => (
                                                        <DropdownItem 
                                                            key={m.usuario_id} 
                                                            onClick={() => onTaskAssign(task.id, m.usuario_id)}
                                                            active={task.asignado_a_id === m.usuario_id}
                                                            className="fs-12"
                                                        >
                                                            {m.nombre_completo}
                                                        </DropdownItem>
                                                    ))}
                                                </DropdownMenu>
                                            </UncontrolledDropdown>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default KanbanStoryCard;
