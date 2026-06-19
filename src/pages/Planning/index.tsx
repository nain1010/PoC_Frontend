import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Button, Spinner, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Planning = () => {
    const navigate = useNavigate();
    const api = new APIClient();

    const activeProjectId = localStorage.getItem("activeProjectId");
    const activeProjectName = localStorage.getItem("activeProjectName");

    const [projectDetails, setProjectDetails] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [storyModal, setStoryModal] = useState<boolean>(false);
    const [sprintModal, setSprintModal] = useState<boolean>(false);
    const [memberModal, setMemberModal] = useState<boolean>(false);

    // Edit states
    const [editStory, setEditStory] = useState<any>(null);
    const [editSprint, setEditSprint] = useState<any>(null);

    // Submitting indicators
    const [storySubmitting, setStorySubmitting] = useState<boolean>(false);
    const [sprintSubmitting, setSprintSubmitting] = useState<boolean>(false);
    const [memberSubmitting, setMemberSubmitting] = useState<boolean>(false);

    const toggleStoryModal = () => {
        if (storyModal) {
            setEditStory(null);
        }
        setStoryModal(!storyModal);
        storyValidation.resetForm();
    };

    const toggleSprintModal = () => {
        if (sprintModal) {
            setEditSprint(null);
        }
        setSprintModal(!sprintModal);
        sprintValidation.resetForm();
    };

    const toggleMemberModal = () => {
        setMemberModal(!memberModal);
        memberValidation.resetForm();
    };

    const getLoggedUserId = () => {
        const authUserStr = sessionStorage.getItem("authUser");
        if (authUserStr) {
            try {
                const authUser = JSON.parse(authUserStr);
                return authUser.id || authUser.usuario_id || "";
            } catch (e) {
                return "";
            }
        }
        return "";
    };

    const fetchProjectDetails = async () => {
        if (!activeProjectId) return;
        setLoading(true);
        setError(null);
        try {
            const data: any = await api.get(`/projects/${activeProjectId}`);
            setProjectDetails(data || null);
            if (data?.memberships) {
                const myId = getLoggedUserId();
                const myMembership = data.memberships.find((m: any) => m.usuario_id === myId);
                if (myMembership) {
                    localStorage.setItem("activeProjectRole", myMembership.rol);
                    window.dispatchEvent(new Event("activeProjectUpdated"));
                }
            }
        } catch (err: any) {
            setError(err || "Error al cargar los detalles del proyecto.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeProjectId) {
            fetchProjectDetails();
        }
    }, [activeProjectId]);

    // Validation schemas
    const storyValidation = useFormik({
        enableReinitialize: true,
        initialValues: {
            correlativo: editStory?.correlativo || '',
            titulo: editStory?.titulo || '',
            narrativa: editStory?.narrativa || '',
            criterios_aceptacion_raw: editStory?.criterios_aceptacion?.join('\n') || ''
        },
        validationSchema: Yup.object({
            correlativo: Yup.string().required("Requerido (ej. US-01)"),
            titulo: Yup.string().required("Por favor ingresa el título de la historia"),
            narrativa: Yup.string().required("Ingresa la narrativa de usuario"),
            criterios_aceptacion_raw: Yup.string().required("Ingresa al menos un criterio de aceptación")
        }),
        onSubmit: async (values) => {
            setStorySubmitting(true);
            try {
                const criteria = values.criterios_aceptacion_raw
                    .split('\n')
                    .map((item: string) => item.trim())
                    .filter((item: string) => item.length > 0);

                if (editStory) {
                    await api.put(`/projects/${activeProjectId}/stories/${editStory.id}`, {
                        titulo: values.titulo,
                        narrativa: values.narrativa,
                        criterios_aceptacion: criteria
                    });
                    toast.success("¡Historia de usuario actualizada!", { position: "top-right" });
                } else {
                    await api.create(`/projects/${activeProjectId}/stories`, {
                        correlativo: values.correlativo,
                        titulo: values.titulo,
                        narrativa: values.narrativa,
                        criterios_aceptacion: criteria
                    });
                    toast.success("¡Historia de usuario creada!", { position: "top-right" });
                }
                toggleStoryModal();
                fetchProjectDetails();
            } catch (err: any) {
                toast.error(err || "Error al guardar la historia de usuario.", { position: "top-right" });
            } finally {
                setStorySubmitting(false);
            }
        }
    });

    const sprintValidation = useFormik({
        enableReinitialize: true,
        initialValues: {
            nombre: editSprint?.nombre || '',
            fecha_inicio: editSprint?.fecha_inicio || new Date().toISOString().split('T')[0],
            fecha_fin: editSprint?.fecha_fin || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // + 2 weeks
            objetivo: editSprint?.objetivo || ''
        },
        validationSchema: Yup.object({
            nombre: Yup.string().required("Ingresa el nombre del Sprint"),
            fecha_inicio: Yup.string().required("Selecciona la fecha de inicio"),
            fecha_fin: Yup.string().required("Selecciona la fecha de fin"),
            objetivo: Yup.string()
        }),
        onSubmit: async (values) => {
            setSprintSubmitting(true);
            try {
                if (editSprint) {
                    await api.put(`/projects/${activeProjectId}/sprints/${editSprint.id}`, values);
                    toast.success("¡Sprint actualizado con éxito!", { position: "top-right" });
                } else {
                    await api.create(`/projects/${activeProjectId}/sprints`, values);
                    toast.success("¡Sprint planificado con éxito!", { position: "top-right" });
                }
                toggleSprintModal();
                fetchProjectDetails();
            } catch (err: any) {
                toast.error(err || "Error al guardar el Sprint.", { position: "top-right" });
            } finally {
                setSprintSubmitting(false);
            }
        }
    });

    const memberValidation = useFormik({
        initialValues: {
            email: '',
            rol: 'Developer'
        },
        validationSchema: Yup.object({
            email: Yup.string().email("Ingresa un correo válido").required("Por favor ingresa el correo del miembro"),
            rol: Yup.string().required("Selecciona el rol Scrum")
        }),
        onSubmit: async (values) => {
            setMemberSubmitting(true);
            try {
                const payload = {
                    email: values.email.trim(),
                    rol: values.rol
                };
                await api.create(`/projects/${activeProjectId}/members`, payload);
                toast.success(`¡Rol asignado correctamente a ${values.email.trim()}!`, { position: "top-right" });
                toggleMemberModal();
                fetchProjectDetails();
            } catch (err: any) {
                toast.error(err || "Error al asignar el miembro.", { position: "top-right" });
            } finally {
                setMemberSubmitting(false);
            }
        }
    });

    const handleEstimateStory = async (storyId: string, puntos: number) => {
        try {
            await api.create(`/projects/${activeProjectId}/stories/${storyId}/estimate`, { puntos });
            toast.success("Historia estimada con éxito.", { position: "top-right" });
            fetchProjectDetails();
        } catch (err: any) {
            toast.error(err || "Error al estimar la historia.", { position: "top-right" });
        }
    };

    const handlePlanStory = async (storyId: string, sprintId: string) => {
        try {
            await api.create(`/projects/${activeProjectId}/stories/${storyId}/sprint`, { sprint_id: sprintId });
            toast.success("Historia planificada en el Sprint.", { position: "top-right" });
            fetchProjectDetails();
        } catch (err: any) {
            toast.error(err || "Error al planificar la historia.", { position: "top-right" });
        }
    };

    const handleActivateSprint = async (sprintId: string) => {
        try {
            await api.create(`/projects/${activeProjectId}/sprints/${sprintId}/activate`, {});
            toast.success("Sprint activado con éxito. ¡A trabajar!", { position: "top-right" });
            fetchProjectDetails();
        } catch (err: any) {
            toast.error(err || "Error al activar el Sprint.", { position: "top-right" });
        }
    };

    const handleCloseSprint = async (sprintId: string) => {
        try {
            await api.create(`/projects/${activeProjectId}/sprints/${sprintId}/close`, {});
            toast.success("Sprint cerrado exitosamente.", { position: "top-right" });
            fetchProjectDetails();
        } catch (err: any) {
            toast.error(err || "Error al cerrar el Sprint.", { position: "top-right" });
        }
    };

    const handleOpenCreateStory = () => {
        setEditStory(null);
        setStoryModal(true);
    };

    const handleOpenEditStory = (story: any) => {
        setEditStory(story);
        setStoryModal(true);
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta historia de usuario? Esta acción también eliminará todas sus tareas asociadas.")) {
            return;
        }
        try {
            await api.delete(`/projects/${activeProjectId}/stories/${storyId}`);
            toast.success("Historia de usuario eliminada correctamente.", { position: "top-right" });
            fetchProjectDetails();
        } catch (err: any) {
            toast.error(err || "Error al eliminar la historia de usuario.", { position: "top-right" });
        }
    };

    const handleOpenCreateSprint = () => {
        setEditSprint(null);
        setSprintModal(true);
    };

    const handleOpenEditSprint = (sprint: any) => {
        setEditSprint(sprint);
        setSprintModal(true);
    };

    const handleDeleteSprint = async (sprintId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este Sprint? Las historias asociadas volverán al backlog.")) {
            return;
        }
        try {
            await api.delete(`/projects/${activeProjectId}/sprints/${sprintId}`);
            toast.success("Sprint eliminado correctamente.", { position: "top-right" });
            fetchProjectDetails();
        } catch (err: any) {
            toast.error(err || "Error al eliminar el Sprint.", { position: "top-right" });
        }
    };

    document.title = `Planificación | Luma - ${activeProjectName || 'Scrum'}`;

    if (!activeProjectId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Planificación" pageTitle="Luma" />
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
                                        Para poder planificar un sprint y estructurar tu product backlog, debes elegir o crear un proyecto primero.
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

    const backlogStories = projectDetails?.historias_usuario?.filter((s: any) => !s.sprint_id) || [];
    const planningSprints = projectDetails?.sprints || [];

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
                        <BreadCrumb title={`Planificación - ${activeProjectName}`} pageTitle="Proyectos" />
                        <div>
                            <Button color="soft-primary" className="me-2" onClick={toggleMemberModal}>
                                <i className="ri-group-line align-bottom me-1"></i> Miembros
                            </Button>
                            <Button color="success" onClick={handleOpenCreateSprint}>
                                <i className="ri-add-line align-bottom me-1"></i> Nuevo Sprint
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner color="primary" />
                            <p className="text-muted mt-2">Cargando tablero de planificación...</p>
                        </div>
                    ) : error ? (
                        <Alert color="danger" className="text-center">{error}</Alert>
                    ) : (
                        <Row>
                            {/* Columna Izquierda: Backlog (Ancho: 5) */}
                            <Col lg={5} className="mb-4">
                                <Card className="shadow-sm border-0 h-100">
                                    <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center p-3">
                                        <h6 className="card-title mb-0 fw-bold text-muted">
                                            Product Backlog ({backlogStories.length})
                                        </h6>
                                        <Button color="success" size="sm" className="btn-sm" onClick={handleOpenCreateStory}>
                                            <i className="ri-add-line align-middle me-1"></i> Crear Historia
                                        </Button>
                                    </div>
                                    <CardBody className="p-3" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                                        {backlogStories.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                <i className="ri-inbox-line display-4 mb-2 d-inline-block"></i>
                                                <p className="mb-0">El backlog está vacío.</p>
                                                <small>Crea historias de usuario para comenzar.</small>
                                            </div>
                                        ) : (
                                            backlogStories.map((story: any) => (
                                                <Card className="border mb-3 shadow-none card-animate" key={story.id}>
                                                    <CardBody className="p-3">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="badge bg-soft-info text-info fs-11">{story.correlativo}</span>
                                                            <div className="d-flex gap-1 align-items-center">
                                                                {/* Dropdown de Estimación Fibonacci */}
                                                                <DropdownEstimate onSelect={(puntos) => handleEstimateStory(story.id, puntos)} currentPoints={story.esfuerzo_estimado} />

                                                                {/* Dropdown para Planificar en Sprint */}
                                                                <DropdownPlan sprints={planningSprints} onSelect={(sprintId) => handlePlanStory(story.id, sprintId)} />

                                                                {/* Acciones de Edición/Eliminación */}
                                                                <StoryActionsDropdown onEdit={() => handleOpenEditStory(story)} onDelete={() => handleDeleteStory(story.id)} />
                                                            </div>
                                                        </div>
                                                        <h6 className="fw-bold text-dark mb-2">{story.titulo}</h6>
                                                        <p className="text-muted fs-13 mb-0 text-truncate-three-lines">
                                                            {story.narrativa}
                                                        </p>
                                                        {story.criterios_aceptacion?.length > 0 && (
                                                            <div className="mt-2 pt-2 border-top">
                                                                <small className="fw-semibold text-dark d-block mb-1">Criterios de Aceptación:</small>
                                                                <ul className="ps-3 mb-0 text-muted fs-12">
                                                                    {story.criterios_aceptacion.map((crit: string, idx: number) => (
                                                                        <li key={idx}>{crit}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            ))
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* Columna Derecha: Sprints (Ancho: 7) */}
                            <Col lg={7} className="mb-4">
                                <Card className="shadow-sm border-0 h-100">
                                    <div className="card-header bg-light border-0 p-3">
                                        <h6 className="card-title mb-0 fw-bold text-muted">Planificación de Sprints</h6>
                                    </div>
                                    <CardBody className="p-3" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                                        {planningSprints.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                <i className="ri-compass-line display-4 mb-2 d-inline-block"></i>
                                                <p className="mb-0">No hay Sprints planificados.</p>
                                                <small>Crea un Sprint para asignar historias de usuario.</small>
                                            </div>
                                        ) : (
                                            planningSprints.map((sprint: any) => {
                                                const sprintStories = projectDetails?.historias_usuario?.filter((s: any) => s.sprint_id === sprint.id) || [];
                                                const totalPoints = sprintStories.reduce((acc: number, item: any) => acc + (item.esfuerzo_estimado || 0), 0);

                                                return (
                                                    <Card className="border mb-4 shadow-none" key={sprint.id}>
                                                        <CardBody className="p-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <div>
                                                                    <h6 className="fw-bold text-muted mb-1 d-flex align-items-center gap-2">
                                                                        {sprint.nombre}
                                                                        <span className="d-flex gap-2 ms-1 align-items-center">
                                                                            <button className="btn btn-link p-0 text-muted fs-14" onClick={() => handleOpenEditSprint(sprint)} title="Editar Sprint">
                                                                                <i className="ri-pencil-line"></i>
                                                                            </button>
                                                                            {sprint.estado !== 'Activo' && (
                                                                                <button className="btn btn-link p-0 text-danger fs-14" onClick={() => handleDeleteSprint(sprint.id)} title="Eliminar Sprint">
                                                                                    <i className="ri-delete-bin-line"></i>
                                                                                </button>
                                                                            )}
                                                                        </span>
                                                                    </h6>
                                                                    <small className="text-muted">
                                                                        {sprint.fecha_inicio} al {sprint.fecha_fin}
                                                                    </small>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className={`badge ${
                                                                        sprint.estado === 'Planificacion' ? 'bg-soft-warning text-warning' :
                                                                        sprint.estado === 'Activo' ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'
                                                                    } fs-12`}>
                                                                        {sprint.estado}
                                                                    </span>
                                                                    
                                                                    {sprint.estado === 'Planificacion' && (
                                                                        <Button color="success" size="sm" className="btn-sm px-3" onClick={() => handleActivateSprint(sprint.id)}>
                                                                            Activar
                                                                        </Button>
                                                                    )}

                                                                    {sprint.estado === 'Activo' && (
                                                                        <Button color="danger" size="sm" className="btn-sm px-3" onClick={() => handleCloseSprint(sprint.id)}>
                                                                            Cerrar
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-muted fs-13 mb-3 fst-italic">
                                                                <strong>Objetivo:</strong> {sprint.objetivo || "Sin objetivo definido."}
                                                            </p>

                                                            <div className="border-top pt-3">
                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                    <span className="fw-bold text-muted fs-14">Historias en el Sprint ({sprintStories.length})</span>
                                                                    <span className="badge bg-soft-info text-info fs-13">{totalPoints} Puntos Comprometidos</span>
                                                                </div>

                                                                {sprintStories.length === 0 ? (
                                                                    <div className="text-center py-3 border border-dashed text-muted fs-13 rounded">
                                                                        Arrastra o planifica historias del backlog aquí.
                                                                    </div>
                                                                ) : (
                                                                    sprintStories.map((story: any) => (
                                                                        <div className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light" key={story.id}>
                                                                            <div>
                                                                                <span className="badge bg-soft-muted text-muted me-2">{story.correlativo}</span>
                                                                                <span className="text-muted fw-medium fs-13">{story.titulo}</span>
                                                                            </div>
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <DropdownEstimate onSelect={(puntos) => handleEstimateStory(story.id, puntos)} currentPoints={story.esfuerzo_estimado} />
                                                                                <DropdownPlan sprints={planningSprints} currentSprintId={sprint.id} onSelect={(targetSprintId) => handlePlanStory(story.id, targetSprintId)} />
                                                                                <StoryActionsDropdown onEdit={() => handleOpenEditStory(story)} onDelete={() => handleDeleteStory(story.id)} />
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                );
                                            })
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>

            {/* Modal Crear Historia */}
            <Modal isOpen={storyModal} toggle={toggleStoryModal} centered>
                <ModalHeader toggle={toggleStoryModal} className="bg-light p-3">
                    {editStory ? "Editar Historia de Usuario" : "Crear Historia de Usuario"}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    storyValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody className="p-4">
                        <div className="mb-3">
                            <Label htmlFor="storyCorrelativo" className="form-label">Código / Correlativo <span className="text-danger">*</span></Label>
                            <Input
                                id="storyCorrelativo"
                                name="correlativo"
                                className="form-control"
                                placeholder="Ej. US-01"
                                type="text"
                                onChange={storyValidation.handleChange}
                                onBlur={storyValidation.handleBlur}
                                value={storyValidation.values.correlativo}
                                invalid={storyValidation.touched.correlativo && storyValidation.errors.correlativo ? true : false}
                                disabled={!!editStory}
                            />
                            {storyValidation.touched.correlativo && storyValidation.errors.correlativo ? (
                                <FormFeedback type="invalid">{storyValidation.errors.correlativo?.toString()}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="storyTitle" className="form-label">Título de la Historia <span className="text-danger">*</span></Label>
                            <Input
                                id="storyTitle"
                                name="titulo"
                                className="form-control"
                                placeholder="Ej. Implementar pasarela de pagos"
                                type="text"
                                onChange={storyValidation.handleChange}
                                onBlur={storyValidation.handleBlur}
                                value={storyValidation.values.titulo}
                                invalid={storyValidation.touched.titulo && storyValidation.errors.titulo ? true : false}
                            />
                            {storyValidation.touched.titulo && storyValidation.errors.titulo ? (
                                <FormFeedback type="invalid">{storyValidation.errors.titulo?.toString()}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="storyNarrative" className="form-label">Narrativa de Usuario <span className="text-danger">*</span></Label>
                            <Input
                                id="storyNarrative"
                                name="narrativa"
                                className="form-control"
                                placeholder="Como usuario, quiero... para..."
                                type="textarea"
                                rows="3"
                                onChange={storyValidation.handleChange}
                                onBlur={storyValidation.handleBlur}
                                value={storyValidation.values.narrativa}
                                invalid={storyValidation.touched.narrativa && storyValidation.errors.narrativa ? true : false}
                            />
                            {storyValidation.touched.narrativa && storyValidation.errors.narrativa ? (
                                <FormFeedback type="invalid">{storyValidation.errors.narrativa?.toString()}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="storyCriteria" className="form-label">Criterios de Aceptación <span className="text-danger">*</span></Label>
                            <Input
                                id="storyCriteria"
                                name="criterios_aceptacion_raw"
                                className="form-control"
                                placeholder="Ingresa un criterio por cada línea..."
                                type="textarea"
                                rows="3"
                                onChange={storyValidation.handleChange}
                                onBlur={storyValidation.handleBlur}
                                value={storyValidation.values.criterios_aceptacion_raw}
                                invalid={storyValidation.touched.criterios_aceptacion_raw && storyValidation.errors.criterios_aceptacion_raw ? true : false}
                            />
                            <small className="text-muted">Presiona Enter para agregar múltiples criterios.</small>
                            {storyValidation.touched.criterios_aceptacion_raw && storyValidation.errors.criterios_aceptacion_raw ? (
                                <FormFeedback type="invalid">{storyValidation.errors.criterios_aceptacion_raw?.toString()}</FormFeedback>
                            ) : null}
                        </div>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button type="button" color="light" onClick={toggleStoryModal} disabled={storySubmitting}>Cancelar</Button>
                        <Button type="submit" color="success" disabled={storySubmitting}>
                            <span className="d-flex align-items-center gap-1">
                                {storySubmitting && <Spinner size="sm" />}
                                <span>{editStory ? "Guardar Cambios" : "Crear Historia"}</span>
                            </span>
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modal Crear Sprint */}
            <Modal isOpen={sprintModal} toggle={toggleSprintModal} centered>
                <ModalHeader toggle={toggleSprintModal} className="bg-light p-3">
                    {editSprint ? "Editar Sprint" : "Planificar Nuevo Sprint"}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    sprintValidation.handleSubmit();
                    return false;
                }}>
                    <ModalBody className="p-4">
                        <div className="mb-3">
                            <Label htmlFor="sprintName" className="form-label">Nombre del Sprint <span className="text-danger">*</span></Label>
                            <Input
                                id="sprintName"
                                name="nombre"
                                className="form-control"
                                placeholder="Ej. Sprint 1"
                                type="text"
                                onChange={sprintValidation.handleChange}
                                onBlur={sprintValidation.handleBlur}
                                value={sprintValidation.values.nombre}
                                invalid={sprintValidation.touched.nombre && sprintValidation.errors.nombre ? true : false}
                            />
                            {sprintValidation.touched.nombre && sprintValidation.errors.nombre ? (
                                <FormFeedback type="invalid">{sprintValidation.errors.nombre?.toString()}</FormFeedback>
                            ) : null}
                        </div>

                        <Row>
                            <Col md={6} className="mb-3">
                                <Label htmlFor="sprintStart" className="form-label">Fecha de Inicio <span className="text-danger">*</span></Label>
                                <Input
                                    id="sprintStart"
                                    name="fecha_inicio"
                                    className="form-control"
                                    type="date"
                                    onChange={sprintValidation.handleChange}
                                    onBlur={sprintValidation.handleBlur}
                                    value={sprintValidation.values.fecha_inicio}
                                    invalid={sprintValidation.touched.fecha_inicio && sprintValidation.errors.fecha_inicio ? true : false}
                                    disabled={editSprint?.estado === 'Activo'}
                                />
                                {sprintValidation.touched.fecha_inicio && sprintValidation.errors.fecha_inicio ? (
                                    <FormFeedback type="invalid">{sprintValidation.errors.fecha_inicio?.toString()}</FormFeedback>
                                ) : null}
                            </Col>

                            <Col md={6} className="mb-3">
                                <Label htmlFor="sprintEnd" className="form-label">Fecha de Fin <span className="text-danger">*</span></Label>
                                <Input
                                    id="sprintEnd"
                                    name="fecha_fin"
                                    className="form-control"
                                    type="date"
                                    onChange={sprintValidation.handleChange}
                                    onBlur={sprintValidation.handleBlur}
                                    value={sprintValidation.values.fecha_fin}
                                    invalid={sprintValidation.touched.fecha_fin && sprintValidation.errors.fecha_fin ? true : false}
                                    disabled={editSprint?.estado === 'Activo'}
                                />
                                {sprintValidation.touched.fecha_fin && sprintValidation.errors.fecha_fin ? (
                                    <FormFeedback type="invalid">{sprintValidation.errors.fecha_fin?.toString()}</FormFeedback>
                                ) : null}
                            </Col>
                        </Row>

                        <div className="mb-3">
                            <Label htmlFor="sprintGoal" className="form-label">Objetivo del Sprint</Label>
                            <Input
                                id="sprintGoal"
                                name="objetivo"
                                className="form-control"
                                placeholder="Define la meta del Sprint..."
                                type="textarea"
                                rows="3"
                                onChange={sprintValidation.handleChange}
                                onBlur={sprintValidation.handleBlur}
                                value={sprintValidation.values.objetivo}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button type="button" color="light" onClick={toggleSprintModal} disabled={sprintSubmitting}>Cancelar</Button>
                        <Button type="submit" color="success" disabled={sprintSubmitting}>
                            <span className="d-flex align-items-center gap-1">
                                {sprintSubmitting && <Spinner size="sm" />}
                                <span>{editSprint ? "Guardar Cambios" : "Planificar Sprint"}</span>
                            </span>
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modal Miembros */}
            <Modal isOpen={memberModal} toggle={toggleMemberModal} centered>
                <ModalHeader toggle={toggleMemberModal} className="bg-light p-3">
                    Gestionar Miembros del Equipo
                </ModalHeader>
                <ModalBody className="p-4">
                    <div className="mb-4">
                        <h6 className="fw-bold text-dark mb-3">Asignar Miembro o Cambiar Rol</h6>
                        <Form onSubmit={(e) => {
                            e.preventDefault();
                            memberValidation.handleSubmit();
                            return false;
                        }}>
                            <div className="mb-3">
                                <Label htmlFor="memberEmail" className="form-label">Email del Usuario <span className="text-danger">*</span></Label>
                                <Input
                                    id="memberEmail"
                                    name="email"
                                    className="form-control"
                                    placeholder="ejemplo@correo.com"
                                    type="email"
                                    onChange={memberValidation.handleChange}
                                    onBlur={memberValidation.handleBlur}
                                    value={memberValidation.values.email}
                                    invalid={memberValidation.touched.email && memberValidation.errors.email ? true : false}
                                />
                                {memberValidation.touched.email && memberValidation.errors.email ? (
                                    <FormFeedback type="invalid">{memberValidation.errors.email?.toString()}</FormFeedback>
                                ) : null}
                            </div>

                            <div className="mb-3">
                                <Label htmlFor="memberRole" className="form-label">Rol Scrum <span className="text-danger">*</span></Label>
                                <Input
                                    id="memberRole"
                                    name="rol"
                                    className="form-select"
                                    type="select"
                                    onChange={memberValidation.handleChange}
                                    onBlur={memberValidation.handleBlur}
                                    value={memberValidation.values.rol}
                                >
                                    <option value="Product Owner">Product Owner</option>
                                    <option value="Scrum Master">Scrum Master</option>
                                    <option value="Developer">Developer</option>
                                </Input>
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <Button type="button" color="light" onClick={toggleMemberModal} disabled={memberSubmitting}>Cerrar</Button>
                                <Button type="submit" color="primary" disabled={memberSubmitting}>
                                    <span className="d-flex align-items-center gap-1">
                                        {memberSubmitting && <Spinner size="sm" />}
                                        <span>Asignar Miembro</span>
                                    </span>
                                </Button>
                            </div>
                        </Form>
                    </div>

                    <div className="border-top pt-3">
                        <h6 className="fw-bold text-dark mb-3">Integrantes del Proyecto ({projectDetails?.memberships?.length || 0})</h6>
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                            {projectDetails?.memberships?.map((member: any, idx: number) => (
                                <div className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light" key={idx}>
                                    <div>
                                        <div className="fw-semibold text-dark fs-13">{member.nombre_completo}</div>
                                        <small className="text-muted">{member.usuario_id === getLoggedUserId() ? 'Tú' : 'Miembro'}</small>
                                    </div>
                                    <span className="badge bg-soft-primary text-primary fs-12">{member.rol}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            <ToastContainer />
        </React.Fragment>
    );
};

// Sub-component estimates dropdown
const DropdownEstimate = ({ onSelect, currentPoints }: { onSelect: (pts: number) => void, currentPoints?: number }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const fibs = [1, 2, 3, 5, 8, 13, 21];

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm">
            <DropdownToggle tag="button" className="btn btn-sm btn-outline-secondary py-0 px-2 fs-12">
                <span>{currentPoints !== undefined && currentPoints !== null ? `${currentPoints} pts` : "Estimar"}</span>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-sm">
                <DropdownItem header><span>Puntos de Esfuerzo</span></DropdownItem>
                {fibs.map((fib) => (
                    <DropdownItem key={fib} onClick={() => onSelect(fib)}>
                        <span>{fib} {fib === 1 ? 'punto' : 'puntos'}</span>
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
};

// Sub-component plan dropdown
const DropdownPlan = ({ sprints, onSelect, currentSprintId }: { sprints: any[], onSelect: (sprintId: string) => void, currentSprintId?: string }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const activeSprints = sprints.filter(s => s.estado !== 'Cerrado');

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm">
            <DropdownToggle tag="button" className="btn btn-sm btn-outline-primary py-0 px-2 fs-12">
                <i className="ri-calendar-event-line"></i>
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem header><span>Planificar en Sprint</span></DropdownItem>
                {activeSprints.length === 0 ? (
                    <DropdownItem disabled><span>Crea un sprint primero</span></DropdownItem>
                ) : (
                    activeSprints.map((sprint) => (
                        <DropdownItem 
                            key={sprint.id} 
                            onClick={() => onSelect(sprint.id)}
                            active={currentSprintId === sprint.id}
                        >
                            <span>{sprint.nombre} ({sprint.estado})</span>
                        </DropdownItem>
                    ))
                )}
            </DropdownMenu>
        </Dropdown>
    );
};

// Sub-component story actions dropdown (three vertical dots menu)
const StoryActionsDropdown = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm" className="d-inline-block">
            <DropdownToggle tag="button" className="btn btn-sm btn-link p-0 text-muted fs-14 lh-1">
                <i className="ri-more-2-fill fs-16"></i>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end">
                <DropdownItem onClick={onEdit}>
                    <i className="ri-pencil-line align-middle me-2 text-muted"></i> <span>Editar</span>
                </DropdownItem>
                <DropdownItem onClick={onDelete} className="text-danger">
                    <i className="ri-delete-bin-line align-middle me-2"></i> <span>Eliminar</span>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default Planning;
