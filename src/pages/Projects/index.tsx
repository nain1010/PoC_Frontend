import React, { useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Button, Spinner, Alert } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = APIClient;

interface IntegrantesAvatarsProps {
  integrantes: any[];
}

const IntegrantesAvatars = React.memo<IntegrantesAvatarsProps>(({ integrantes }) => {
  if (!integrantes || integrantes.length === 0) {
    return <span className="text-muted fs-12 d-block italic text-muted">Sin integrantes asignados</span>;
  }
  return (
    <div className="d-flex align-items-center justify-content-between">
      <div className="avatar-group">
        {integrantes.map((member: any) => {
          const names = member.nombre_completo.split(" ");
          const initials = names.map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
          let avatarColor = "bg-primary";
          if (member.rol === "Product Owner") avatarColor = "bg-danger";
          else if (member.rol === "Scrum Master") avatarColor = "bg-success";
          else if (member.rol === "Developer") avatarColor = "bg-info";
          return (
            <div
              key={member.usuario_id}
              className="avatar-group-item"
              title={`${member.nombre_completo} - ${member.rol}`}
            >
              <div className="avatar-xs">
                <div className={`avatar-title rounded-circle ${avatarColor} text-white fs-12 fw-semibold`}>
                  {initials}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <span className="text-muted fs-12 fw-medium bg-light px-2 py-1 rounded">
        {integrantes.length} {integrantes.length === 1 ? 'miembro' : 'miembros'}
      </span>
    </div>
  );
});

interface ProjectCardProps {
  project: any;
  selectedProjectId: string | null;
  onSelect: (project: any) => void;
  onDelete: (project: any) => void;
}

const ProjectCard = React.memo<ProjectCardProps>(({ project, selectedProjectId, onSelect, onDelete }) => {
  const roleBadgeClass = project.mi_rol === 'Product Owner' ? 'bg-soft-primary text-primary' :
    project.mi_rol === 'Scrum Master' ? 'bg-soft-success text-success' :
    project.mi_rol === 'Developer' ? 'bg-soft-info text-info' :
    'bg-soft-secondary text-secondary';

  return (
    <Col lg={4} md={6} className="mb-4">
      <Card className="h-100 shadow-sm border-0 card-animate">
        <CardBody className="d-flex flex-column justify-content-between p-4">
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="avatar-sm">
                <div className="avatar-title bg-soft-success text-success rounded fs-18">
                  <i className="ri-folder-3-line"></i>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${roleBadgeClass} fs-12`}>
                  <span>{project.mi_rol || 'Sin rol'}</span>
                </span>
                <button
                  className="btn btn-sm btn-soft-danger px-1.5 py-0.5 fs-12"
                  onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                  title="Eliminar proyecto"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <h5 className="fs-16 text-mute fw-bold mb-2">{project.nombre}</h5>
            <p className="text-muted text-truncate-two-lines fs-14 mb-3" style={{ minHeight: "42px" }}>
              {project.descripcion || "Sin descripción proporcionada."}
            </p>
            <div className="mb-3">
              <span className="text-muted fs-13 fw-semibold d-block mb-2">Equipo del Proyecto</span>
              <IntegrantesAvatars integrantes={project.integrantes} />
            </div>
          </div>
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center border-top pt-3 fs-13 text-muted mb-3">
              <span>Fecha de inicio:</span>
              <span className="fw-semibold text-muted">{project.fecha_inicio}</span>
            </div>
            <Button
              color="primary"
              className="w-100 btn-soft-primary"
              onClick={() => onSelect(project)}
              disabled={selectedProjectId !== null}
            >
              {selectedProjectId === project.id ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Entrando...
                </>
              ) : (
                "Seleccionar Proyecto"
              )}
            </Button>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
});

const Projects = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [modal, setModal] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);

    const { data: projects = [], isLoading, error } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get("/projects"),
        select: (data: any) => data || [],
    });

    const createMutation = useMutation({
        mutationFn: (values: any) => api.create("/projects", values),
        onSuccess: () => {
            toggleModal();
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (err: any) => {
            toast.error(err || "Error al crear el proyecto.", { position: "top-right" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/projects/${id}`),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ['projects'] });
            const previous = queryClient.getQueryData(['projects']);
            queryClient.setQueryData(['projects'], (old: any) =>
                Array.isArray(old) ? old.filter((p: any) => p.id !== id) : []
            );
            return { previous };
        },
        onError: (err: any, id: string, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(['projects'], context.previous);
            }
            toast.error(err || "Error al eliminar el proyecto. Solo el Product Owner puede hacerlo.", { position: "top-right" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const validation = useFormik({
        initialValues: {
            nombre: '',
            descripcion: '',
            fecha_inicio: new Date().toISOString().split('T')[0]
        },
        validationSchema: Yup.object({
            nombre: Yup.string().required("Por favor ingresa el nombre del proyecto"),
            descripcion: Yup.string(),
            fecha_inicio: Yup.string().required("Por favor selecciona la fecha de inicio")
        }),
        onSubmit: async (values) => {
            setSubmitting(true);
            createMutation.mutate(values, {
                onSettled: () => setSubmitting(false),
            });
        }
    });

    const toggleModal = useCallback(() => {
        setModal(prev => !prev);
        validation.resetForm();
    }, []);

    const toggleDeleteModal = useCallback(() => {
        setDeleteModal(prev => !prev);
    }, []);

    const handleSelectProject = useCallback((project: any) => {
        if (selectedProjectId) return;
        setSelectedProjectId(project.id);
        localStorage.setItem("activeProjectId", project.id);
        localStorage.setItem("activeProjectName", project.nombre);
        localStorage.setItem("activeProjectRole", project.mi_rol || "Sin rol");
        window.dispatchEvent(new Event("activeProjectUpdated"));
        navigate("/planning");
    }, [selectedProjectId, navigate]);

    const handleDeleteProject = useCallback((project: any) => {
        setProjectToDelete(project);
        toggleDeleteModal();
    }, [toggleDeleteModal]);

    const confirmDeleteProject = useCallback(async () => {
        if (!projectToDelete) return;
        toggleDeleteModal();
        if (localStorage.getItem("activeProjectId") === projectToDelete.id) {
            localStorage.removeItem("activeProjectId");
            localStorage.removeItem("activeProjectName");
            localStorage.removeItem("activeProjectRole");
            window.dispatchEvent(new Event("activeProjectUpdated"));
        }
        deleteMutation.mutate(projectToDelete.id);
    }, [projectToDelete, toggleDeleteModal, deleteMutation]);

    const emptyState = useMemo(() => (
        <div className="text-center py-5 my-5">
            <div className="avatar-xl mx-auto mb-4">
                <div className="avatar-title bg-light text-primary rounded-circle display-4">
                    <i className="ri-folder-open-line"></i>
                </div>
            </div>
            <h4>No tienes proyectos activos</h4>
            <p className="text-muted col-lg-6 mx-auto">
                Comienza creando tu primer proyecto ágil para planificar sprints, gestionar tareas y hacer seguimiento de tu equipo de desarrollo.
            </p>
            <Button color="success" className="btn btn-success mt-3" onClick={toggleModal}>
                <i className="ri-add-line align-bottom me-1"></i> Crear Primer Proyecto
            </Button>
        </div>
    ), [toggleModal]);

    document.title = "Proyectos | Luma - Gestión de Proyectos";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Proyectos" />

                    <div className="d-flex align-items-center justify-content-between mb-4 mt-3">
                        <div>
                            <h5 className="fs-16 mb-0">Tus Proyectos</h5>
                            <p className="text-muted mb-0">Listado de proyectos y equipos activos.</p>
                        </div>
                        <Button color="success" className="btn btn-success" onClick={toggleModal}>
                            <i className="ri-add-line align-bottom me-1"></i> Crear Proyecto
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="text-center my-5">
                            <Spinner color="primary" />
                            <p className="text-muted mt-2">Cargando proyectos...</p>
                        </div>
                    ) : error ? (
                        <Alert color="danger" className="text-center">{error?.message || String(error)}</Alert>
                    ) : projects.length === 0 ? (
                        emptyState
                    ) : (
                        <Row>
                            {projects.map((project: any) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    selectedProjectId={selectedProjectId}
                                    onSelect={handleSelectProject}
                                    onDelete={handleDeleteProject}
                                />
                            ))}
                        </Row>
                    )}
                </Container>
            </div>

            {/* Modal de Creación */}
            <Modal isOpen={modal} toggle={toggleModal} centered>
                <ModalHeader toggle={toggleModal} className="bg-light p-3">
                    Crear Nuevo Proyecto
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                }}>
                    <ModalBody className="p-4">
                        <div className="mb-3">
                            <Label htmlFor="projectName" className="form-label">Nombre del Proyecto <span className="text-danger">*</span></Label>
                            <Input
                                id="projectName"
                                name="nombre"
                                className="form-control"
                                placeholder="Ingresa el nombre del proyecto"
                                type="text"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.nombre}
                                invalid={validation.touched.nombre && validation.errors.nombre ? true : false}
                            />
                            {validation.touched.nombre && validation.errors.nombre ? (
                                <FormFeedback type="invalid">{validation.errors.nombre}</FormFeedback>
                            ) : null}
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="projectDesc" className="form-label">Descripción</Label>
                            <Input
                                id="projectDesc"
                                name="descripcion"
                                className="form-control"
                                placeholder="Describe el objetivo del proyecto..."
                                type="textarea"
                                rows="3"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.descripcion}
                            />
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="startDate" className="form-label">Fecha de Inicio <span className="text-danger">*</span></Label>
                            <Input
                                id="startDate"
                                name="fecha_inicio"
                                className="form-control"
                                type="date"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.fecha_inicio}
                                invalid={validation.touched.fecha_inicio && validation.errors.fecha_inicio ? true : false}
                            />
                            {validation.touched.fecha_inicio && validation.errors.fecha_inicio ? (
                                <FormFeedback type="invalid">{validation.errors.fecha_inicio}</FormFeedback>
                            ) : null}
                        </div>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button type="button" color="light" onClick={toggleModal} disabled={submitting}>Cancelar</Button>
                        <Button type="submit" color="success" disabled={submitting}>
                            <span className="d-flex align-items-center gap-1">
                                {submitting && <Spinner size="sm" />}
                                <span>Crear Proyecto</span>
                            </span>
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Modal de Confirmación de Eliminación */}
            <Modal isOpen={deleteModal} toggle={toggleDeleteModal} centered>
                <ModalHeader toggle={toggleDeleteModal} className="bg-light p-3">
                    Confirmar Eliminación
                </ModalHeader>
                <ModalBody className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <i className="ri-delete-bin-5-line display-4"></i>
                    </div>
                    <h5>¿Estás seguro de que deseas eliminar el proyecto "{projectToDelete?.nombre}"?</h5>
                    <p className="text-muted mb-0">Esta acción es irreversible y eliminará todos los sprints, historias y tareas asociadas.</p>
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={toggleDeleteModal}>Cancelar</Button>
                    <Button color="danger" onClick={confirmDeleteProject}>Eliminar</Button>
                </ModalFooter>
            </Modal>

            <ToastContainer />
        </React.Fragment>
    );
};

export default Projects;
