import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Spinner, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { useProjectStore } from '../../Components/Hooks/useProjectStore';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageSelectorModal from '../../Components/Common/PageSelectorModal';
import SkeletonLoader from '../../Components/Common/SkeletonLoader';
import AttachmentModal from '../../Components/Common/AttachmentModal';
import PageViewerDrawer from '../../Components/Common/PageViewerDrawer';
import InlineAttachments from '../../Components/Common/InlineAttachments';
import KanbanColumn from './components/KanbanColumn';
import KanbanStoryCard from './components/KanbanStoryCard';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
const api = APIClient;

const Kanban = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    const activeProjectName = localStorage.getItem("activeProjectName");

    const { data: projectDetails, isLoading, error } = useQuery({
        queryKey: ['project', activeProjectId],
        queryFn: () => api.get(`/projects/${activeProjectId}`) as any,
        enabled: !!activeProjectId,
        select: (data: any) => {
            if (data?.memberships) {
                const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
                if (authUserStr) {
                    try {
                        const authUser = JSON.parse(authUserStr);
                        const userId = authUser.id || authUser.usuario_id || "";
                        const myMembership = data.memberships.find((m: any) => m.usuario_id === userId);
                        if (myMembership) {
                            localStorage.setItem("activeProjectRole", myMembership.rol);
                            window.dispatchEvent(new Event("activeProjectUpdated"));
                        }
                    } catch (e) { /* ignore */ }
                }
            }
            return data;
        },
    });

    // Filters & UI State
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [pointsFilter, setPointsFilter] = useState<number | null>(null);
    const [memberFilter, setMemberFilter] = useState<string | null>(null);
    const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});

    // Task Creation Modal
    const [taskModal, setTaskModal] = useState<boolean>(false);
    const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
    const [taskSubmitting, setTaskSubmitting] = useState<boolean>(false);

    const toggleTaskModal = () => {
        setTaskModal(!taskModal);
        taskValidation.resetForm();
    };

    // Pages Modals
    const [pageSelector, setPageSelector] = useState<{ isOpen: boolean, type: 'historia'|'tarea', id: string }>({ isOpen: false, type: 'historia', id: '' });
    const [attachmentModal, setAttachmentModal] = useState<{isOpen: boolean, type: 'historia'|'tarea', id: string}>({isOpen: false, type: 'historia', id: ''});
    const [pageViewer, setPageViewer] = useState<{ isOpen: boolean, pageId: string | null }>({ isOpen: false, pageId: null });

    const openPageSelector = useCallback((id: string, type: 'historia'|'tarea') => setPageSelector({ isOpen: true, type, id }), []);
    const openPageViewer = useCallback((pageId: string) => setPageViewer({ isOpen: true, pageId }), []);

    const openTaskModal = useCallback((storyId: string) => {
        setSelectedStoryId(storyId);
        setTaskModal(true);
    }, []);

    const toggleStoryExpand = useCallback((storyId: string) => {
        setExpandedStories(prev => ({
            ...prev,
            [storyId]: !prev[storyId]
        }));
    }, []);

    const applyHighlight = (type: string, id: string, storyId?: string) => {
        if (storyId) {
            setExpandedStories(prev => ({ ...prev, [storyId]: true }));
        } else if (type === 'task') {
            // Need to figure out the story id somehow if we only have task id?
            // Not always possible immediately, but the DOM element might exist if the sprint is rendered.
        }
        
        setTimeout(() => {
            const el = document.getElementById(`${type}-${id}`);
            if (el) {
                // If it's a task, highlight the row, otherwise highlight the element itself
                const target = type === 'task' ? (el.closest('.mb-2.border.rounded') as HTMLElement || el) : el;
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.classList.add('highlight-pulse');
                setTimeout(() => target.classList.remove('highlight-pulse'), 2500);
            }
        }, 800); // Increased timeout to wait for React Query fetch and render
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const highlight = searchParams.get('highlight');
        if (highlight) {
            const [type, ...idParts] = highlight.split('-');
            applyHighlight(type, idParts.join('-'));
        }
    }, [location.search, projectDetails]); // Depend on projectDetails so it runs when data is ready

    useEffect(() => {
        const handleScrollTo = (e: any) => {
            const { taskId, storyId } = e.detail;
            applyHighlight('task', taskId, storyId);
        };
        
        window.addEventListener('open-task-modal', handleScrollTo);
        return () => window.removeEventListener('open-task-modal', handleScrollTo);
    }, []);

    const invalidateProject = useCallback(() => queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] }), [activeProjectId, queryClient]);

    // Formik for new task
    const taskValidation = useFormik({
        initialValues: {
            titulo: '',
            descripcion: ''
        },
        validationSchema: Yup.object({
            titulo: Yup.string().required("Ingresa el título de la tarea técnica"),
            descripcion: Yup.string().required("Ingresa la descripción de la tarea")
        }),
        onSubmit: async (values) => {
            if (!activeProjectId || !selectedStoryId) return;
            setTaskSubmitting(true);
            createTaskMutation.mutate({ storyId: selectedStoryId, titulo: values.titulo, descripcion: values.descripcion }, {
                onSettled: () => { toggleTaskModal(); setTaskSubmitting(false); }
            });
        }
    });

    const getProjectSnapshot = () => queryClient.getQueryData(['project', activeProjectId]) as any;

    const createTaskMutation = useMutation({
        mutationFn: (payload: any) => api.create(`/projects/${activeProjectId}/stories/${payload.storyId}/tasks`, {
            titulo: payload.titulo, descripcion: payload.descripcion
        }),
        onSuccess: (res: any, payload: any) => {
            const current = getProjectSnapshot();
            if (current && res?.id) {
                queryClient.setQueryData(['project', activeProjectId], {
                    ...current,
                    tareas: [...(current.tareas || []), {
                        id: res.id, historia_id: payload.storyId, titulo: payload.titulo,
                        descripcion: payload.descripcion, estado: res.estado || "Pendiente", asignado_a: null
                    }]
                });
            }
        },
        onError: (err: any) => {
            toast.error(err || "Error al crear la tarea técnica. Verifica tus permisos (Developer).", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const updateStoryStatusMutation = useMutation({
        mutationFn: ({ storyId, status }: { storyId: string; status: string }) =>
            api.put(`/projects/${activeProjectId}/stories/${storyId}/status`, { estado: status }),
        onMutate: async ({ storyId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                queryClient.setQueryData(['project', activeProjectId], {
                    ...current,
                    historias_usuario: (current.historias_usuario || []).map((h: any) =>
                        h.id === storyId ? { ...h, estado: status } : h
                    )
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al actualizar el estado de la historia (¿Eres el Product Owner?).", { position: "top-right" });
        },
    });

    const updateTaskStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            api.put(`/projects/${activeProjectId}/tasks/${taskId}/status`, { estado: status }),
        onMutate: async ({ taskId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                queryClient.setQueryData(['project', activeProjectId], {
                    ...current,
                    tareas: (current.tareas || []).map((t: any) =>
                        t.id === taskId ? { ...t, estado: status } : t
                    )
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al actualizar el estado de la tarea (Se requiere rol Developer).", { position: "top-right" });
        },
    });

    const assignTaskMutation = useMutation({
        mutationFn: ({ taskId, usuarioId }: { taskId: string; usuarioId: string }) =>
            api.put(`/projects/${activeProjectId}/tasks/${taskId}/assign`, { usuario_id: usuarioId }),
        onMutate: async ({ taskId, usuarioId }) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                queryClient.setQueryData(['project', activeProjectId], {
                    ...current,
                    tareas: (current.tareas || []).map((t: any) =>
                        t.id === taskId ? { ...t, asignado_a: usuarioId } : t
                    )
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al asignar la tarea.", { position: "top-right" });
        },
    });

    const handleStoryStatusChange = useCallback((storyId: string, newStatus: string) => {
        updateStoryStatusMutation.mutate({ storyId, status: newStatus });
    }, [updateStoryStatusMutation]);

    const handleTaskStatusChange = useCallback((taskId: string, newStatus: string) => {
        updateTaskStatusMutation.mutate({ taskId, status: newStatus });
    }, [updateTaskStatusMutation]);

    const handleTaskAssign = useCallback((taskId: string, usuarioId: string) => {
        assignTaskMutation.mutate({ taskId, usuarioId });
    }, [assignTaskMutation]);

    const activeSprint = useMemo(
        () => projectDetails?.sprints?.find((s: any) => s.estado === 'Activo'),
        [projectDetails?.sprints]
    );
    const activeSprintStories = useMemo(
        () => activeSprint
            ? (projectDetails?.historias_usuario?.filter((h: any) => h.sprint_id === activeSprint.id) || [])
            : [],
        [activeSprint, projectDetails?.historias_usuario]
    );
    const filteredStories = useMemo(
        () => activeSprintStories.filter((story: any) => {
            const matchesSearch = story.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 story.correlativo.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPoints = pointsFilter === null || story.esfuerzo_estimado === pointsFilter;
            let matchesMember = true;
            if (memberFilter !== null) {
                const storyTasks = projectDetails?.tareas?.filter((t: any) => t.historia_id === story.id) || [];
                if (memberFilter === "unassigned") {
                    matchesMember = storyTasks.some((t: any) => !t.asignado_a);
                } else {
                    matchesMember = storyTasks.some((t: any) => t.asignado_a === memberFilter);
                }
            }
            return matchesSearch && matchesPoints && matchesMember;
        }),
        [activeSprintStories, searchQuery, pointsFilter, memberFilter, projectDetails?.tareas]
    );
    const pendingStories = useMemo(
        () => filteredStories.filter((story: any) => 
            ["Nueva", "Refinada", "Comprometida"].includes(story.estado)
        ),
        [filteredStories]
    );
    const inProgressStories = useMemo(
        () => filteredStories.filter((story: any) => 
            ["En Progreso", "Lista para Pruebas"].includes(story.estado)
        ),
        [filteredStories]
    );
    const doneStories = useMemo(
        () => filteredStories.filter((story: any) => 
            story.estado === "Hecha"
        ),
        [filteredStories]
    );

    // Dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [activeDragStory, setActiveDragStory] = useState<any | null>(null);
    const [storyErrors, setStoryErrors] = useState<Record<string, string>>({});

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'Story') {
            setActiveDragStory(active.data.current.story);
        }
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragStory(null);
        
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // The over.id will be either a Column ID ("Comprometida", "En Progreso", "Hecha")
        // OR another Story ID. If it's a story ID, we need to find which column it belongs to.
        let newStatus = overId as string;
        
        if (newStatus !== "Comprometida" && newStatus !== "En Progreso" && newStatus !== "Hecha") {
            // It's a story ID. Find its state.
            const targetStory = filteredStories.find((s: any) => s.id === overId);
            if (targetStory) {
                // Map the story's actual state to the primary state of that column
                if (["Nueva", "Refinada", "Comprometida"].includes(targetStory.estado)) newStatus = "Comprometida";
                else if (["En Progreso", "Lista para Pruebas"].includes(targetStory.estado)) newStatus = "En Progreso";
                else if (targetStory.estado === "Hecha") newStatus = "Hecha";
            }
        }

        const story = filteredStories.find((s: any) => s.id === activeId);
        
        if (story) {
            // Check validation before moving to Hecha
            if (newStatus === "Hecha") {
                const tasks = projectDetails?.tareas?.filter((t: any) => t.historia_id === story.id) || [];
                const total = tasks.length;
                const done = tasks.filter((t: any) => t.estado === 'Terminada').length;
                if (total > 0 && done < total) {
                    setStoryErrors(prev => ({ ...prev, [story.id]: "Termina todas las tareas técnicas primero." }));
                    setTimeout(() => setStoryErrors(prev => ({ ...prev, [story.id]: "" })), 4000);
                    return; // Abort move
                }
            }

            // Map target column to the new state for the story
            let targetState = newStatus;
            // If dragging from "Lista para Pruebas" inside the same "En Progreso" column, it just stays.
            // But if we're actually changing columns, we map to the default state of the column.
            
            // Only update if it actually changed column categories
            let currentColumn = "";
            if (["Nueva", "Refinada", "Comprometida"].includes(story.estado)) currentColumn = "Comprometida";
            if (["En Progreso", "Lista para Pruebas"].includes(story.estado)) currentColumn = "En Progreso";
            if (story.estado === "Hecha") currentColumn = "Hecha";

            if (currentColumn !== newStatus) {
                handleStoryStatusChange(story.id, targetState);
            }
        }
    }, [filteredStories, projectDetails, handleStoryStatusChange]);

    const storyHandlers = useMemo(() => ({
        onStoryStatusChange: handleStoryStatusChange,
        onTaskStatusChange: handleTaskStatusChange,
        onTaskAssign: handleTaskAssign,
        onOpenTaskModal: openTaskModal,
        onToggleExpand: toggleStoryExpand,
        onOpenPageSelector: openPageSelector,
        onOpenAttachmentModal: (id: string, type: 'historia'|'tarea') => setAttachmentModal({isOpen: true, id, type}),
        onOpenPageViewer: (id: string) => setPageViewer({isOpen: true, pageId: id}),
        storyErrors
    }), [handleStoryStatusChange, handleTaskStatusChange, handleTaskAssign, openTaskModal, toggleStoryExpand, openPageSelector, storyErrors]);

    document.title = `Sprint Activo | Luma - ${activeProjectName || 'Scrum'}`;

    if (!activeProjectId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Sprint Activo" />
                    <Row className="justify-content-center my-5">
                        <Col lg={6}>
                            <Card className="text-center p-5 border-0 shadow-sm">
                                <CardBody>
                                    <div className="avatar-lg mx-auto mb-4">
                                        <div className="avatar-title bg-soft-warning text-warning rounded-circle display-4">
                                            <i className="ri-alert-line"></i>
                                        </div>
                                    </div>
                                    <h4>No hay ningún proyecto activo seleccionado</h4>
                                    <p className="text-muted mb-4">
                                        Para poder ver el tablero Kanban, debes elegir o crear un proyecto primero.
                                    </p>
                                    <Link to="/projects" className="btn btn-primary">
                                        Ir a Proyectos
                                    </Link>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={`Sprint Activo - ${activeProjectName}`} />

                    <div className="d-flex align-items-center justify-content-between mb-4 mt-3">
                        <div>
                            <h5 className="fs-16 mb-0">Tablero Kanban</h5>
                            <p className="text-muted mb-0">Visualiza y actualiza el estado de las tareas de tu equipo.</p>
                        </div>
                        {activeSprint && (
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-soft-success text-success fs-13 py-1.5 px-3 border border-success border-opacity-25 rounded-pill">
                                    <i className="ri-record-circle-line align-middle me-1"></i> <span>{activeSprint.nombre} Activo</span>
                                </span>
                                <Link to="/planning" className="btn btn-sm btn-soft-secondary">
                                    <i className="ri-settings-3-line align-bottom"></i> <span>Gestionar</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <Row>
                            {[1, 2, 3].map((col) => (
                                <Col lg={4} key={col} className="mb-4">
                                    <div className="bg-light-subtle rounded p-3 h-100">
                                        <SkeletonLoader width="60%" height="20px" className="mb-3" />
                                        <div className="d-flex flex-column gap-3">
                                            <SkeletonLoader height="100px" borderRadius="8px" />
                                            <SkeletonLoader height="120px" borderRadius="8px" />
                                            <SkeletonLoader height="90px" borderRadius="8px" />
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    ) : error ? (
                        <Alert color="danger" className="text-center">{error?.message || String(error)}</Alert>
                    ) : !activeSprint ? (
                        <Row className="justify-content-center my-5">
                            <Col lg={7}>
                                <Card className="text-center p-5 border-0 shadow-sm bg-light-subtle">
                                    <CardBody>
                                        <div className="avatar-lg mx-auto mb-4">
                                            <div className="avatar-title bg-soft-info text-info rounded-circle display-4">
                                                <i className="ri-time-line"></i>
                                            </div>
                                        </div>
                                        <h4>No hay un Sprint Activo actualmente</h4>
                                        <p className="text-muted mb-4 max-w-md mx-auto">
                                            Para usar el tablero Kanban de ejecución diaria, debes ir a la sección de planificación, planificar historias en un sprint y activar el sprint.
                                        </p>
                                        <Link to="/planning" className="btn btn-success">
                                            Ir a Planificación de Sprints
                                        </Link>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <div>
                            {/* Goals banner */}
                            <div className="p-3 bg-soft-primary border border-primary border-opacity-10 rounded-3 mb-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <span className="fw-semibold text-primary d-block mb-0.5">Objetivo del Sprint:</span>
                                    <span className="text-muted fs-13 italic">{activeSprint.objetivo || "Sin objetivo de sprint definido."}</span>
                                </div>
                                <div className="text-end text-muted fs-12">
                                    <span>Duración: </span>
                                    <strong className="text-muted">{activeSprint.fecha_inicio} al {activeSprint.fecha_fin}</strong>
                                </div>
                            </div>
                            {/* Search and point filters */}
                            <Row className="mb-4 align-items-center">
                                <Col md={4} className="mb-2 mb-md-0">
                                    <div className="search-box">
                                        <Input
                                            type="text"
                                            placeholder="Buscar por código o título..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>
                                </Col>
                                <Col md={3} className="mb-2 mb-md-0">
                                    <Input
                                        type="select"
                                        value={memberFilter || ''}
                                        onChange={(e) => setMemberFilter(e.target.value || null)}
                                        className="form-select"
                                    >
                                        <option value="">Todos los integrantes</option>
                                        <option value="unassigned">Tareas sin asignar</option>
                                        {projectDetails?.memberships?.filter((m: any) => m.rol === 'Developer').map((m: any) => (
                                            <option key={m.usuario_id} value={m.usuario_id}>
                                                {m.nombre_completo} ({m.rol})
                                            </option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={5} className="d-flex flex-wrap gap-2 justify-content-md-end align-items-center">
                                    <span className="text-muted fs-13">Filtrar Puntos:</span>
                                    <Button 
                                        color={pointsFilter === null ? "primary" : "light"} 
                                        size="sm" 
                                        onClick={() => setPointsFilter(null)}
                                        className="px-3"
                                    >
                                        Todos
                                    </Button>
                                    {[1, 2, 3, 5, 8, 13, 21].map(pts => (
                                        <Button 
                                            key={pts}
                                            color={pointsFilter === pts ? "primary" : "light"} 
                                            size="sm" 
                                            onClick={() => setPointsFilter(pointsFilter === pts ? null : pts)}
                                            className="px-2.5"
                                        >
                                            {pts} pts
                                        </Button>
                                    ))}
                                </Col>
                            </Row>

                            {/* Board Columns */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCorners}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <Row>
                                    <KanbanColumn 
                                        id="Comprometida"
                                        title="Pendiente"
                                        icon={<i className="ri-checkbox-blank-circle-fill text-muted me-2 align-middle fs-10"></i>}
                                        colorClass="border-secondary border-opacity-50"
                                        stories={pendingStories}
                                        projectDetails={projectDetails}
                                        memberFilter={memberFilter}
                                        expandedStories={expandedStories}
                                        handlers={storyHandlers}
                                    />
                                    
                                    <KanbanColumn 
                                        id="En Progreso"
                                        title="En Progreso"
                                        icon={<i className="ri-checkbox-blank-circle-fill text-primary me-2 align-middle fs-10"></i>}
                                        colorClass="border-primary"
                                        stories={inProgressStories}
                                        projectDetails={projectDetails}
                                        memberFilter={memberFilter}
                                        expandedStories={expandedStories}
                                        handlers={storyHandlers}
                                    />

                                    <KanbanColumn 
                                        id="Hecha"
                                        title="Terminada"
                                        icon={<i className="ri-checkbox-blank-circle-fill text-success me-2 align-middle fs-10"></i>}
                                        colorClass="border-success"
                                        stories={doneStories}
                                        projectDetails={projectDetails}
                                        memberFilter={memberFilter}
                                        expandedStories={expandedStories}
                                        handlers={storyHandlers}
                                    />
                                </Row>

                                <DragOverlay dropAnimation={null}>
                                    {activeDragStory ? (
                                        <KanbanStoryCard 
                                            story={activeDragStory} 
                                            projectDetails={projectDetails} 
                                            memberFilter={memberFilter}
                                            onStoryStatusChange={storyHandlers.onStoryStatusChange}
                                            onTaskStatusChange={storyHandlers.onTaskStatusChange}
                                            onTaskAssign={storyHandlers.onTaskAssign}
                                            onOpenTaskModal={storyHandlers.onOpenTaskModal}
                                            expanded={false}
                                            onToggleExpand={storyHandlers.onToggleExpand}
                                            onOpenPageSelector={storyHandlers.onOpenPageSelector}
                                            onOpenAttachmentModal={storyHandlers.onOpenAttachmentModal}
                                            onOpenPageViewer={storyHandlers.onOpenPageViewer}
                                            statusErrorExt={storyErrors[activeDragStory.id]}
                                        />
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    )}
                </Container>
            </div>

            {/* Modal Crear Tarea Técnica */}
            <Modal isOpen={taskModal} toggle={toggleTaskModal} centered>
                <ModalHeader toggle={toggleTaskModal} className="bg-light p-3">
                    Agregar Tarea Técnica
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    taskValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody className="p-4">
                        <div className="mb-3">
                            <Label htmlFor="taskTitle" className="form-label">Título de la Tarea <span className="text-danger">*</span></Label>
                            <Input
                                id="taskTitle"
                                name="titulo"
                                className="form-control"
                                placeholder="Ej. Crear script de migración SQL"
                                type="text"
                                onChange={taskValidation.handleChange}
                                onBlur={taskValidation.handleBlur}
                                value={taskValidation.values.titulo}
                                invalid={taskValidation.touched.titulo && taskValidation.errors.titulo ? true : false}
                            />
                            {taskValidation.touched.titulo && taskValidation.errors.titulo ? (
                                <FormFeedback type="invalid">{taskValidation.errors.titulo}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="taskDesc" className="form-label">Descripción de la Tarea <span className="text-danger">*</span></Label>
                            <Input
                                id="taskDesc"
                                name="descripcion"
                                className="form-control"
                                placeholder="Detalla los pasos técnicos o criterios de la tarea..."
                                type="textarea"
                                rows="3"
                                onChange={taskValidation.handleChange}
                                onBlur={taskValidation.handleBlur}
                                value={taskValidation.values.descripcion}
                                invalid={taskValidation.touched.descripcion && taskValidation.errors.descripcion ? true : false}
                            />
                            {taskValidation.touched.descripcion && taskValidation.errors.descripcion ? (
                                <FormFeedback type="invalid">{taskValidation.errors.descripcion}</FormFeedback>
                            ) : null}
                        </div>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button type="button" color="light" onClick={toggleTaskModal} disabled={taskSubmitting}>Cancelar</Button>
                        <Button type="submit" color="success" disabled={taskSubmitting}>
                            <span className="d-flex align-items-center gap-1">
                                {taskSubmitting && <Spinner size="sm" />}
                                <span>Guardar Tarea</span>
                            </span>
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modales de Páginas */}
            {activeProjectId && (
                <>
                    <PageSelectorModal 
                        isOpen={pageSelector.isOpen} 
                        toggle={() => setPageSelector(prev => ({ ...prev, isOpen: false }))} 
                        projectId={activeProjectId} 
                        entityType={pageSelector.type} 
                        entityId={pageSelector.id}
                        onOpenPageViewer={(pageId) => setPageViewer({ isOpen: true, pageId })}
                    />
                    <AttachmentModal 
                        isOpen={attachmentModal.isOpen} 
                        toggle={() => setAttachmentModal(prev => ({ ...prev, isOpen: false }))} 
                        projectId={activeProjectId} 
                        entityType={attachmentModal.type} 
                        entityId={attachmentModal.id}
                    />
                    <PageViewerDrawer 
                        key={pageViewer.pageId || 'empty'}
                        isOpen={pageViewer.isOpen} 
                        toggle={() => setPageViewer(prev => ({ ...prev, isOpen: false }))} 
                        pageId={pageViewer.pageId} 
                        projectId={activeProjectId} 
                    />
                </>
            )}

            
        </React.Fragment>
    );
};


export default Kanban;
