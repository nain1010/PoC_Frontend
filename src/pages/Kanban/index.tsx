import React, { useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Spinner, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageSelectorModal from '../../Components/Common/PageSelectorModal';
import AttachmentModal from '../../Components/Common/AttachmentModal';
import PageViewerDrawer from '../../Components/Common/PageViewerDrawer';
import InlineAttachments from '../../Components/Common/InlineAttachments';
const api = APIClient;

const Kanban = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const activeProjectId = localStorage.getItem("activeProjectId");
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
                        <div className="text-center my-5">
                            <Spinner color="primary" />
                            <p className="text-muted mt-2">Cargando tablero Kanban...</p>
                        </div>
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
                            <Row>
                                {/* Column 1: Pendiente */}
                                <Col lg={4} className="mb-4">
                                    <Card className="bg-light border-top border-3 border-secondary border-opacity-50 shadow-none h-100">
                                        <div className="p-3 bg-light-subtle d-flex justify-content-between align-items-center rounded-top border-bottom">
                                            <h6 className="card-title mb-0 fw-bold text-body flex-grow-1">
                                                <i className="ri-checkbox-blank-circle-fill text-muted me-2 align-middle fs-10"></i>
                                                <span>Pendiente ({pendingStories.length})</span>
                                            </h6>
                                        </div>
                                        <CardBody className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)", minHeight: "350px" }}>
                                            {pendingStories.length === 0 ? (
                                                <div className="text-center py-5 text-muted fs-13">No hay historias pendientes.</div>
                                            ) : (
                                                pendingStories.map((story: any) => (
                                                    <KanbanStoryCard 
                                                        key={story.id} 
                                                        story={story} 
                                                        projectDetails={projectDetails} 
                                                        memberFilter={memberFilter}
                                                        onStoryStatusChange={handleStoryStatusChange}
                                                        onTaskStatusChange={handleTaskStatusChange}
                                                        onTaskAssign={handleTaskAssign}
                                                        onOpenTaskModal={openTaskModal}
                                                        expanded={!!expandedStories[story.id]}
                                                        onToggleExpand={toggleStoryExpand}
                                                        onOpenPageSelector={openPageSelector}
                                                        onOpenAttachmentModal={(id, type) => setAttachmentModal({isOpen: true, id, type})}
                                                        onOpenPageViewer={openPageViewer}
                                                    />
                                                ))
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Column 2: En Progreso */}
                                <Col lg={4} className="mb-4">
                                    <Card className="bg-light border-top border-3 border-primary shadow-none h-100">
                                        <div className="p-3 bg-light-subtle d-flex justify-content-between align-items-center rounded-top border-bottom">
                                            <h6 className="card-title mb-0 fw-bold text-body flex-grow-1">
                                                <i className="ri-checkbox-blank-circle-fill text-primary me-2 align-middle fs-10"></i>
                                                <span>En Progreso ({inProgressStories.length})</span>
                                            </h6>
                                        </div>
                                        <CardBody className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)", minHeight: "350px" }}>
                                            {inProgressStories.length === 0 ? (
                                                <div className="text-center py-5 text-muted fs-13">Ninguna historia en curso.</div>
                                            ) : (
                                                inProgressStories.map((story: any) => (
                                                    <KanbanStoryCard 
                                                        key={story.id} 
                                                        story={story} 
                                                        projectDetails={projectDetails} 
                                                        memberFilter={memberFilter}
                                                        onStoryStatusChange={handleStoryStatusChange}
                                                        onTaskStatusChange={handleTaskStatusChange}
                                                        onTaskAssign={handleTaskAssign}
                                                        onOpenTaskModal={openTaskModal}
                                                        expanded={!!expandedStories[story.id]}
                                                        onToggleExpand={toggleStoryExpand}
                                                        onOpenPageSelector={openPageSelector}
                                                        onOpenAttachmentModal={(id, type) => setAttachmentModal({isOpen: true, id, type})}
                                                        onOpenPageViewer={openPageViewer}
                                                    />
                                                ))
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Column 3: Terminada */}
                                <Col lg={4} className="mb-4">
                                    <Card className="bg-light border-top border-3 border-success shadow-none h-100">
                                        <div className="p-3 bg-light-subtle d-flex justify-content-between align-items-center rounded-top border-bottom">
                                            <h6 className="card-title mb-0 fw-bold text-body flex-grow-1">
                                                <i className="ri-checkbox-blank-circle-fill text-success me-2 align-middle fs-10"></i>
                                                <span>Terminada ({doneStories.length})</span>
                                            </h6>
                                        </div>
                                        <CardBody className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)", minHeight: "350px" }}>
                                            {doneStories.length === 0 ? (
                                                <div className="text-center py-5 text-muted fs-13">Ninguna historia terminada.</div>
                                            ) : (
                                                doneStories.map((story: any) => (
                                                    <KanbanStoryCard 
                                                        key={story.id} 
                                                        story={story} 
                                                        projectDetails={projectDetails} 
                                                        memberFilter={memberFilter}
                                                        onStoryStatusChange={handleStoryStatusChange}
                                                        onTaskStatusChange={handleTaskStatusChange}
                                                        onTaskAssign={handleTaskAssign}
                                                        onOpenTaskModal={openTaskModal}
                                                        expanded={!!expandedStories[story.id]}
                                                        onToggleExpand={toggleStoryExpand}
                                                        onOpenPageSelector={openPageSelector}
                                                        onOpenAttachmentModal={(id, type) => setAttachmentModal({isOpen: true, id, type})}
                                                        onOpenPageViewer={openPageViewer}
                                                    />
                                                ))
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
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
                        isOpen={pageViewer.isOpen} 
                        toggle={() => setPageViewer(prev => ({ ...prev, isOpen: false }))} 
                        pageId={pageViewer.pageId} 
                        projectId={activeProjectId} 
                    />
                </>
            )}

            <ToastContainer />
        </React.Fragment>
    );
};

// Story Card sub-component
const KanbanStoryCard = React.memo(({ story, projectDetails, memberFilter, onStoryStatusChange, onTaskStatusChange, onTaskAssign, onOpenTaskModal, expanded, onToggleExpand, onOpenPageSelector, onOpenAttachmentModal, onOpenPageViewer }: {
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
}) => {
    // Filter tasks for this story
    const storyTasks = useMemo(
        () => projectDetails?.tareas?.filter((t: any) => t.historia_id === story.id) || [],
        [projectDetails?.tareas, story.id]
    );
    const doneTasksCount = useMemo(
        () => storyTasks.filter((t: any) => t.estado === 'Terminada').length,
        [storyTasks]
    );
    const totalTasksCount = storyTasks.length;

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

    const states = useMemo(() => [
        { label: "Comprometida (Pendiente)", value: "Comprometida" },
        { label: "En Progreso (En curso)", value: "En Progreso" },
        { label: "Lista para Pruebas (En curso)", value: "Lista para Pruebas" },
        { label: "Hecha (Terminada)", value: "Hecha" }
    ], []);

    return (
        <Card className="border mb-3 shadow-sm card-animate">
            <CardBody className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-soft-info text-info fs-11">{story.correlativo}</span>
                    
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
                                    onClick={() => onStoryStatusChange(story.id, state.value)}
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

                <InlineAttachments projectId={story.proyecto_id} entityType="historia" entityId={story.id} />


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
                                    <KanbanTaskRow 
                                        key={task.id} 
                                        task={task} 
                                        projectId={story.proyecto_id}
                                        onTaskStatusChange={onTaskStatusChange}
                                        onTaskAssign={onTaskAssign}
                                        developers={projectDetails?.integrantes?.filter((m: any) => m.rol === 'Desarrollador') || []}
                                        onOpenPageSelector={onOpenPageSelector}
                                        onOpenAttachmentModal={onOpenAttachmentModal}
                                        onOpenPageViewer={onOpenPageViewer}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
});

// Task Row inside story card
const KanbanTaskRow = React.memo(({ task, projectId, onTaskStatusChange, onTaskAssign, developers, onOpenPageSelector, onOpenAttachmentModal, onOpenPageViewer }: {
    task: any;
    projectId: string;
    onTaskStatusChange: (taskId: string, status: string) => void;
    onTaskAssign: (taskId: string, usuarioId: string) => void;
    developers: any[];
    onOpenPageSelector: (id: string, type: 'historia' | 'tarea') => void;
    onOpenAttachmentModal: (id: string, type: 'historia' | 'tarea') => void;
    onOpenPageViewer: (pageId: string) => void;
}) => {
    const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
    const toggleTaskDropdown = useCallback(() => setTaskDropdownOpen(prevState => !prevState), []);

    const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
    const toggleAssignDropdown = useCallback(() => setAssignDropdownOpen(prevState => !prevState), []);

    const taskStates = useMemo(() => ["Pendiente", "En Curso", "Bloqueada", "Terminada"], []);

    const getBadgeColor = useCallback((status: string) => {
        switch (status) {
            case "Pendiente": return "secondary";
            case "En Curso": return "primary";
            case "Bloqueada": return "danger";
            case "Terminada": return "success";
            default: return "dark";
        }
    }, []);

    const assignedDev = useMemo(
        () => developers.find((d: any) => d.usuario_id === task.asignado_a),
        [developers, task.asignado_a]
    );

    return (
        <div className="p-2 border rounded bg-body mb-2 shadow-none border-light-subtle">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="fw-semibold text-body fs-12 d-block text-truncate-two-lines" style={{ maxWidth: "55%" }}>
                    {task.titulo}
                </span>
                
                <div className="d-flex align-items-center gap-1">
                    <Button size="sm" color="light" className="text-muted p-0 px-1 border-0" onClick={() => onOpenAttachmentModal(task.id, 'tarea')} title="Archivos de la Tarea">
                        <i className="ri-attachment-2 fs-14 align-middle"></i>
                    </Button>
                    <Button size="sm" color="light" className="text-muted p-0 px-1 border-0" onClick={() => onOpenPageSelector(task.id, 'tarea')} title="Documentos de la Tarea">
                        <i className="ri-file-text-line fs-14 align-middle"></i>
                    </Button>
                    {/* Assign Dropdown */}
                    <Dropdown isOpen={assignDropdownOpen} toggle={toggleAssignDropdown} size="sm" strategy="fixed">
                        <DropdownToggle tag="button" className={`badge ${assignedDev ? 'bg-soft-info text-info' : 'bg-soft-warning text-warning'} border-0 py-0.5 px-1.5 fs-10`}>
                            <span className="d-flex align-items-center gap-1">
                                <span>{assignedDev ? assignedDev.nombre_completo.split(' ')[0] : 'Sin asignar'}</span>
                                <i className="ri-user-line align-middle"></i>
                            </span>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-sm dropdown-menu-end">
                            <DropdownItem header className="fs-10"><span>Asignar a Developer</span></DropdownItem>
                            {developers.length === 0 ? (
                                <DropdownItem disabled className="fs-10"><span>No hay Developers</span></DropdownItem>
                            ) : (
                                developers.map((dev: any) => (
                                    <DropdownItem
                                        key={dev.usuario_id}
                                        onClick={() => onTaskAssign(task.id, dev.usuario_id)}
                                        active={task.asignado_a === dev.usuario_id}
                                        className="fs-10 px-2 py-1"
                                    >
                                        <i className="ri-user-fill me-1"></i><span>{dev.nombre_completo}</span>
                                    </DropdownItem>
                                ))
                            )}
                        </DropdownMenu>
                    </Dropdown>

                    {/* Task Status Dropdown */}
                    <Dropdown isOpen={taskDropdownOpen} toggle={toggleTaskDropdown} size="sm" strategy="fixed">
                        <DropdownToggle tag="button" className={`badge bg-soft-${getBadgeColor(task.estado)} text-${getBadgeColor(task.estado)} border-0 py-0.5 px-1.5 fs-10`}>
                            <span className="d-flex align-items-center gap-1">
                                <span>{task.estado}</span>
                                <i className="ri-arrow-down-s-line align-middle"></i>
                            </span>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-sm dropdown-menu-end">
                            {taskStates.map(state => (
                                <DropdownItem 
                                    key={state} 
                                    onClick={() => onTaskStatusChange(task.id, state)}
                                    active={task.estado === state}
                                    className="fs-10 px-2 py-1"
                                >
                                    <span>{state}</span>
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
            {task.descripcion && (
                <p className="text-muted fs-11 mb-0 mt-1"><span>{task.descripcion}</span></p>
            )}
            <InlineAttachments projectId={projectId} entityType="tarea" entityId={task.id} />
        </div>
    );
});

export default Kanban;
