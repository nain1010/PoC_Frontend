import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardBody, Badge, Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Input, Label, UncontrolledDropdown } from 'reactstrap';
import InlineAttachments from '../../../Components/Common/InlineAttachments';

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
        memberFilter ? storyTasks.filter((t: any) => t.asignado_a === memberFilter).length : storyTasks.length,
        [storyTasks, memberFilter]
    );

    const doneTasksCount = useMemo(() => 
        storyTasks.filter((t: any) => t.estado === 'Terminada' && (!memberFilter || t.asignado_a === memberFilter)).length,
        [storyTasks, memberFilter]
    );

    const totalTasksCount = useMemo(() => 
        storyTasks.filter((t: any) => !memberFilter || t.asignado_a === memberFilter).length,
        [storyTasks, memberFilter]
    );

    // Filter tasks inside the story card by selected member
    const displayedTasks = useMemo(
        () => storyTasks.filter((t: any) => {
            if (memberFilter === null) return true;
            if (memberFilter === "unassigned") return !t.asignado_a;
            return t.asignado_a === memberFilter;
        }),
        [storyTasks, memberFilter]
    );

    // Progress percentage
    const progressPercent = useMemo(
        () => totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0,
        [doneTasksCount, totalTasksCount]
    );

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

    return (
        <Card 
            innerRef={setNodeRef}
            style={{ ...style, cursor: isDragging ? 'grabbing' : 'grab' }}
            className={`border mb-3 shadow-sm ${isDragging ? 'opacity-0' : ''}`}
            {...dragHandleProps}
        >
            <CardBody className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-soft-info text-info fs-11">
                        <i className="ri-drag-move-2-fill me-1"></i>
                        {story.correlativo}
                    </span>
                    
                    {/* Story status dropdown selector */}
                    <Dropdown isOpen={storyDropdownOpen} toggle={toggleStoryDropdown} size="sm" strategy="fixed">
                        <DropdownToggle tag="button" className="btn btn-sm btn-outline-light text-muted border-0 py-0 px-2 fs-12">
                            <span className="d-flex align-items-center gap-1">
                                <span>{story.estado}</span>
                                <i className="ri-arrow-down-s-line align-middle"></i>
                            </span>
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

                <h6 className="fw-semibold text-body mb-2">{story.titulo}</h6>
                {currentError && (
                    <div className="alert alert-danger py-1 px-2 mb-2 fs-11 animate-fade-in-up" role="alert" style={{ borderRadius: '6px' }}>
                        <i className="ri-error-warning-line me-1 align-middle"></i>
                        {currentError}
                    </div>
                )}
                <p className="text-muted fs-13 mb-3 text-truncate-two-lines" title={story.narrativa}>
                    {story.narrativa}
                </p>

                {/* Effort points and Actions */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <span className="text-muted fs-12 me-2">Esfuerzo:</span>
                        <Badge color="soft-primary" className="text-primary rounded-pill">
                            {story.esfuerzo_estimado || story.puntos_esfuerzo || 0} Pts
                        </Badge>
                    </div>
                    <div className="d-flex gap-1">
                        <Button size="sm" color="light" className="text-muted p-1 border-0" onClick={(e) => { e.stopPropagation(); onOpenAttachmentModal(story.id, 'historia'); }} title="Archivos adjuntos">
                            <i className="ri-attachment-2 fs-16 align-middle"></i>
                        </Button>
                        <Button size="sm" color="light" className="text-muted p-1 border-0" onClick={(e) => { e.stopPropagation(); onOpenPageSelector(story.id, 'historia'); }} title="Documentos Adjuntos">
                            <i className="ri-file-text-line fs-16 align-middle"></i>
                        </Button>
                    </div>
                </div>

                {/* Progress bar of tasks */}
                <div className="mb-3 pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted fs-12">Tareas Técnicas ({doneTasksCount}/{totalTasksCount})</span>
                        <span className="fw-semibold text-body fs-12">{progressPercent}%</span>
                    </div>
                    <div className="progress progress-sm" style={{ height: "6px" }}>
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

                {/* Actions */}
                <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                    <Button 
                        color="link" 
                        size="sm" 
                        className="p-0 text-decoration-none fs-12 text-secondary"
                        onClick={handleToggleExpand}
                    >
                        <span className="d-flex align-items-center gap-1">
                            <i className={`${expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} align-middle`}></i>
                            <span>{expanded ? 'Ocultar Tareas' : `Ver Tareas (${displayedTasks.length})`}</span>
                        </span>
                    </Button>
                    
                    <Button 
                        color="soft-success" 
                        size="sm" 
                        className="btn-sm py-0.5 px-2 fs-11"
                        onClick={handleOpenTaskModal}
                    >
                        <span className="d-flex align-items-center gap-1">
                            <i className="ri-add-line align-middle"></i>
                            <span>Crear Tarea</span>
                        </span>
                    </Button>
                </div>

                {/* Expanded Tasks List */}
                {expanded && (
                    <div className="mt-3 pt-3 border-top bg-light-subtle rounded p-2 border border-dashed">
                        <h6 className="fs-12 fw-bold text-body mb-2"><span>Desglose Técnico:</span></h6>
                        <div>
                            {displayedTasks.length === 0 ? (
                                <div className="text-center py-2 text-muted fs-11">
                                    <span>{memberFilter ? "No hay tareas que coincidan con el filtro." : "Sin tareas creadas aún. Presiona \"+ Tarea\" para crear una."}</span>
                                </div>
                            ) : (
                                displayedTasks.map((task: any) => (
                                    <div key={task.id} className="p-2 mb-2 border rounded bg-body shadow-sm d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-start gap-2">
                                            <Input
                                                type="checkbox"
                                                id={`task-${task.id}`}
                                                className="mt-1 flex-shrink-0 cursor-pointer"
                                                checked={task.estado === "Terminada"}
                                                onChange={(e) => onTaskStatusChange(task.id, e.target.checked ? "Terminada" : "Pendiente")}
                                            />
                                            <div>
                                                <Label htmlFor={`task-${task.id}`} className={`mb-0 fs-13 cursor-pointer ${task.estado === "Terminada" ? "text-decoration-line-through text-muted" : "fw-medium"}`}>
                                                    {task.titulo}
                                                </Label>
                                                <div className="text-muted fs-11 mt-1">{task.descripcion}</div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Button size="sm" color="light" className="text-muted p-1 border-0" onClick={(e) => { e.stopPropagation(); onOpenAttachmentModal(task.id, 'tarea'); }} title="Archivos adjuntos">
                                                <i className="ri-attachment-2 fs-14 align-middle"></i>
                                            </Button>
                                            <Button size="sm" color="light" className="text-muted p-1 border-0" onClick={(e) => { e.stopPropagation(); onOpenPageSelector(task.id, 'tarea'); }} title="Documentos Adjuntos">
                                                <i className="ri-file-text-line fs-14 align-middle"></i>
                                            </Button>
                                            <UncontrolledDropdown size="sm">
                                                <DropdownToggle tag="button" className="btn btn-sm btn-ghost-primary rounded-circle p-1">
                                                    {task.asignado_a ? (
                                                        <div className="avatar-xs">
                                                            <div className="avatar-title rounded-circle bg-primary text-white fs-10" title="Asignado">
                                                                {projectDetails.memberships?.find((m:any) => m.usuario_id === task.asignado_a)?.nombre_completo.substring(0, 2).toUpperCase() || "US"}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <i className="ri-user-add-line fs-14 text-muted"></i>
                                                    )}
                                                </DropdownToggle>
                                                <DropdownMenu className="dropdown-menu-end">
                                                    <DropdownItem header>Asignar Tarea</DropdownItem>
                                                    <DropdownItem onClick={() => onTaskAssign(task.id, "")} className="fs-12 text-danger">Desasignar</DropdownItem>
                                                    <DropdownItem divider />
                                                    {projectDetails.memberships?.filter((m:any) => m.rol === 'Developer').map((m:any) => (
                                                        <DropdownItem 
                                                            key={m.usuario_id} 
                                                            onClick={() => onTaskAssign(task.id, m.usuario_id)}
                                                            active={task.asignado_a === m.usuario_id}
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
            </CardBody>
        </Card>
    );
});

export default KanbanStoryCard;
