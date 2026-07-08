import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Button, Spinner, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { useProjectStore } from '../../Components/Hooks/useProjectStore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../config';

const api = APIClient;
const SSE_URL = `${config.api.API_URL}/events`;

interface ActivityLog {
    id: string;
    text: string;
    time: string;
    icon: string;
    color: string;
}

const getLoggedUserId = () => {
    const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
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


const TaskRow = React.memo(({ task, onStatusChange, getStoryCorrelativo }: {
    task: any;
    onStatusChange: (taskId: string, status: string) => void;
    getStoryCorrelativo: (storyId: string) => string;
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
    const taskStates = ["Pendiente", "En Curso", "Bloqueada", "Terminada"];

    const getBadgeColor = (status: string) => {
        switch (status) {
            case "Pendiente": return "secondary";
            case "En Curso": return "primary";
            case "Bloqueada": return "danger";
            case "Terminada": return "success";
            default: return "dark";
        }
    };

    return (
        <div className="p-3 border rounded bg-body-secondary mb-3 shadow-none border-light-subtle">
            <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1 me-3">
                    <div className="d-flex align-items-center gap-2 mb-1.5">
                        <span className="badge bg-soft-info text-info fs-10">{getStoryCorrelativo(task.historia_id)}</span>
                        <h6 className="fw-semibold text-body fs-14 mb-0">{task.titulo}</h6>
                    </div>
                    {task.descripcion && (
                        <p className="text-muted fs-12 mb-0 mt-1">{task.descripcion}</p>
                    )}
                </div>
                
                <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} size="sm">
                    <DropdownToggle tag="button" className={`badge bg-soft-${getBadgeColor(task.estado)} text-${getBadgeColor(task.estado)} border-0 py-1.5 px-2.5 fs-11`}>
                        <span className="d-flex align-items-center gap-1">
                            <span>{task.estado}</span>
                            <i className="ri-arrow-down-s-line align-middle"></i>
                        </span>
                    </DropdownToggle>
                    <DropdownMenu className="dropdown-menu-sm dropdown-menu-end">
                        {taskStates.map(state => (
                            <DropdownItem 
                                key={state} 
                                onClick={() => onStatusChange(task.id, state)}
                                active={task.estado === state}
                                className="fs-11 px-3 py-1.5"
                            >
                                <span>{state}</span>
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
});

const Starter = () => {
    const queryClient = useQueryClient();

    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    const activeProjectName = localStorage.getItem("activeProjectName");

    // SSE Activities Feed state
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    document.title = "Home | Luma - Scrum Dashboard";

    // 1. Fetch current profile
    const { data: profileData } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get('/me') as any,
        staleTime: 30000,
    });

    // 2. Fetch all projects
    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects') as any,
        staleTime: 30000,
    });

    // 3. Fetch active project details
    const { data: projectDetails, isLoading: projectLoading } = useQuery({
        queryKey: ['project', activeProjectId],
        queryFn: () => api.get(`/projects/${activeProjectId}`) as any,
        enabled: !!activeProjectId,
        staleTime: 30000,
    });

    const loggedInUserId = getLoggedUserId();

    // 4. Mutation to update task status
    const updateTaskStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            api.put(`/projects/${activeProjectId}/tasks/${taskId}/status`, { estado: status }),
        onMutate: async ({ taskId, status }) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current: any = queryClient.getQueryData(['project', activeProjectId]);
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
            queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] });
            toast.error(err || "Error al actualizar el estado de la tarea.", { position: "top-right" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] });
        }
    });

    const handleTaskStatusChange = useCallback((taskId: string, status: string) => {
        updateTaskStatusMutation.mutate({ taskId, status });
    }, [updateTaskStatusMutation]);

    // Derived User Info
    const userName = profileData?.nombre_completo || "Usuario";
    const userRole = profileData?.rol_global || "Miembro";
    const initials = useMemo(() => {
        const names = userName.split(" ");
        return names.map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
    }, [userName]);

    // Derived Task & Sprint Info
    const myPendingTasks = useMemo(() => {
        if (!projectDetails?.tareas || !loggedInUserId) return [];
        return projectDetails.tareas.filter((t: any) => t.asignado_a === loggedInUserId && t.estado !== 'Terminada');
    }, [projectDetails?.tareas, loggedInUserId]);

    const activeSprint = useMemo(() => {
        return projectDetails?.sprints?.find((s: any) => s.estado === 'Activo');
    }, [projectDetails?.sprints]);

    const activeSprintStories = useMemo(() => {
        if (!activeSprint || !projectDetails?.historias_usuario) return [];
        return projectDetails.historias_usuario.filter((h: any) => h.sprint_id === activeSprint.id);
    }, [activeSprint, projectDetails?.historias_usuario]);

    const sprintProgress = useMemo(() => {
        if (activeSprintStories.length === 0) return { totalPoints: 0, donePoints: 0, percent: 0 };
        const totalPoints = activeSprintStories.reduce((acc: number, curr: any) => acc + (curr.esfuerzo_estimado || 0), 0);
        const donePoints = activeSprintStories
            .filter((h: any) => h.estado === 'Hecha')
            .reduce((acc: number, curr: any) => acc + (curr.esfuerzo_estimado || 0), 0);
        const percent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
        return { totalPoints, donePoints, percent };
    }, [activeSprintStories]);

    const getStoryCorrelativo = useCallback((storyId: string) => {
        const story = projectDetails?.historias_usuario?.find((h: any) => h.id === storyId);
        return story ? story.correlativo : "";
    }, [projectDetails?.historias_usuario]);

    // SSE Event Listener for real-time activities log
    useEffect(() => {
        const initialLogs: ActivityLog[] = [
            {
                id: 'init-1',
                text: 'Dashboard sincronizado y listo para trabajar.',
                time: 'Ahora mismo',
                icon: 'ri-checkbox-circle-line',
                color: 'success'
            },
            {
                id: 'init-2',
                text: 'Conexión a eventos del servidor (SSE) establecida.',
                time: 'Ahora mismo',
                icon: 'ri-wifi-line',
                color: 'primary'
            }
        ];
        setActivities(initialLogs);

        const es = new EventSource(SSE_URL);

        const addActivity = (text: string, icon: string, color: string) => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newAct: ActivityLog = {
                id: String(Math.random()),
                text,
                time: timeStr,
                icon,
                color
            };
            setActivities(prev => [newAct, ...prev.slice(0, 5)]);
        };

        es.addEventListener('project_created', () => {
            addActivity('Se ha creado un nuevo proyecto en la plataforma.', 'ri-folder-add-line', 'success');
        });

        es.addEventListener('project_deleted', () => {
            addActivity('Se ha eliminado un proyecto de la plataforma.', 'ri-delete-bin-line', 'danger');
        });

        es.addEventListener('project_updated', () => {
            addActivity('Se ha actualizado información en un proyecto.', 'ri-edit-line', 'info');
        });

        es.addEventListener('member_updated', () => {
            addActivity('Se han modificado los miembros de un proyecto.', 'ri-user-shared-line', 'warning');
        });

        es.addEventListener('user_created', () => {
            addActivity('Un nuevo usuario se ha registrado en la plataforma.', 'ri-user-add-line', 'primary');
        });

        es.addEventListener('user_updated', () => {
            addActivity('Se ha actualizado el perfil de un usuario.', 'ri-user-settings-line', 'info');
        });

        return () => {
            es.close();
        };
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Dashboard Principal" />
                    
                    {/* Welcome banner */}
                    <div className="bg-soft-primary p-4 rounded-3 position-relative overflow-hidden mb-4 border border-primary border-opacity-10 shadow-sm">
                        <div className="position-absolute end-0 bottom-0 opacity-10" style={{ transform: "scale(2.5)", transformOrigin: "bottom right" }}>
                            <i className="ri-shield-user-line display-1 text-primary"></i>
                        </div>
                        <div className="d-flex align-items-center gap-3 position-relative">
                            {profileData?.avatar_url ? (
                                <img
                                    className="rounded-circle avatar-md shadow"
                                    src={profileData.avatar_url}
                                    alt="User Avatar"
                                    style={{ width: "60px", height: "60px", minWidth: "60px", objectFit: "cover" }}
                                />
                            ) : (
                                <div className="avatar-md bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-20" style={{ minWidth: "60px", height: "60px" }}>
                                    {initials}
                                </div>
                            )}
                            <div>
                                <h4 className="fw-bold text-primary mb-1">¡Bienvenido a Luma, {userName}!</h4>
                                <p className="text-muted mb-0 fs-13">
                                    Rol: <strong className="text-body">{userRole}</strong> | Proyecto Activo: <strong className="text-body">{activeProjectName || "Ninguno seleccionado"}</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <Row className="mb-4">
                        {/* Stat 1: Total Projects */}
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100 card-animate">
                                <CardBody className="p-3.5 d-flex align-items-center justify-content-between">
                                    <div>
                                        <span className="text-muted text-uppercase fs-12 fw-semibold d-block mb-1">Tus Proyectos</span>
                                        <h3 className="fw-bold mb-0 text-body">{projects.length}</h3>
                                    </div>
                                    <div className="avatar-sm">
                                        <span className="avatar-title bg-soft-primary text-primary rounded fs-18">
                                            <i className="ri-folder-3-line"></i>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Stat 2: Active Sprint */}
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100 card-animate">
                                <CardBody className="p-3.5 d-flex align-items-center justify-content-between">
                                    <div>
                                        <span className="text-muted text-uppercase fs-12 fw-semibold d-block mb-1">Sprint Activo</span>
                                        <h4 className="fw-bold mb-0 text-body text-truncate" style={{ maxWidth: "160px" }}>
                                            {activeSprint ? activeSprint.nombre : "Ninguno"}
                                        </h4>
                                    </div>
                                    <div className="avatar-sm">
                                        <span className="avatar-title bg-soft-success text-success rounded fs-18">
                                            <i className="ri-calendar-event-line"></i>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Stat 3: My Pending Tasks */}
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100 card-animate">
                                <CardBody className="p-3.5 d-flex align-items-center justify-content-between">
                                    <div>
                                        <span className="text-muted text-uppercase fs-12 fw-semibold d-block mb-1">Mis Tareas Pendientes</span>
                                        <h3 className="fw-bold mb-0 text-body">{activeProjectId ? myPendingTasks.length : "-"}</h3>
                                    </div>
                                    <div className="avatar-sm">
                                        <span className="avatar-title bg-soft-warning text-warning rounded fs-18">
                                            <i className="ri-task-line"></i>
                                        </span>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* Stat 4: Sprint Progress */}
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100 card-animate">
                                <CardBody className="p-3.5 d-flex align-items-center justify-content-between">
                                    <div className="w-100">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-muted text-uppercase fs-12 fw-semibold">Avance del Sprint</span>
                                            <span className="fw-bold text-body fs-12">{activeSprint ? `${sprintProgress.percent}%` : "0%"}</span>
                                        </div>
                                        <div className="progress progress-sm" style={{ height: "6px" }}>
                                            <div 
                                                className="progress-bar bg-success" 
                                                role="progressbar" 
                                                style={{ width: `${activeSprint ? sprintProgress.percent : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        {/* Col Left: My Tasks & Project Status */}
                        <Col lg={8} className="mb-4">
                            {/* Card: My Tasks */}
                            <Card className="border-0 shadow-sm mb-4">
                                <div className="p-3.5 border-bottom d-flex align-items-center gap-2 bg-light-subtle">
                                    <i className="ri-checkbox-list-line fs-18 text-primary"></i>
                                    <h6 className="card-title mb-0 fw-bold text-body">Mis Tareas Técnicas Asignadas</h6>
                                </div>
                                <CardBody className="p-3.5" style={{ minHeight: "220px" }}>
                                    {!activeProjectId ? (
                                        <div className="text-center py-5 text-muted">
                                            <i className="ri-alert-line display-6 text-warning mb-3"></i>
                                            <h5>Ningún proyecto activo seleccionado</h5>
                                            <p className="fs-13 mb-0">Selecciona un proyecto desde el menú superior para ver tus tareas.</p>
                                        </div>
                                    ) : projectLoading ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <p className="text-muted mt-2 mb-0">Cargando tus tareas...</p>
                                        </div>
                                    ) : myPendingTasks.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <i className="ri-check-double-line display-6 text-success mb-3"></i>
                                            <h5>¡Todo al día!</h5>
                                            <p className="fs-13 mb-0">No tienes tareas técnicas pendientes asignadas en este proyecto.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {myPendingTasks.map((task: any) => (
                                                <TaskRow 
                                                    key={task.id} 
                                                    task={task} 
                                                    onStatusChange={handleTaskStatusChange} 
                                                    getStoryCorrelativo={getStoryCorrelativo} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Card: Sprint Progress Detailed */}
                            {activeProjectId && activeSprint && (
                                <Card className="border-0 shadow-sm">
                                    <div className="p-3.5 border-bottom d-flex align-items-center gap-2 bg-light-subtle">
                                        <i className="ri-calendar-todo-line fs-18 text-success"></i>
                                        <h6 className="card-title mb-0 fw-bold text-body">Progreso del Sprint Activo</h6>
                                    </div>
                                    <CardBody className="p-4">
                                        <h5 className="fw-semibold text-body mb-2">{activeSprint.nombre}</h5>
                                        <p className="text-muted fs-13 mb-4">{activeSprint.objetivo || "Sin objetivo de sprint definido."}</p>
                                        
                                        <Row className="g-3 align-items-center">
                                            <Col md={6}>
                                                <div className="border rounded p-3 bg-light-subtle">
                                                    <span className="text-muted fs-12 text-uppercase d-block mb-1">Puntos de Historia</span>
                                                    <h4 className="fw-bold mb-0 text-body">
                                                        {sprintProgress.donePoints} de {sprintProgress.totalPoints} SP hechos
                                                    </h4>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="border rounded p-3 bg-light-subtle">
                                                    <span className="text-muted fs-12 text-uppercase d-block mb-1">Duración</span>
                                                    <h5 className="fw-semibold mb-0 text-body">
                                                        {activeSprint.fecha_inicio} al {activeSprint.fecha_fin}
                                                    </h5>
                                                </div>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            )}
                        </Col>

                        {/* Col Right: Quick Actions & Live Feed */}
                        <Col lg={4} className="mb-4">
                            {/* Card: Quick Actions */}
                            <Card className="border-0 shadow-sm mb-4">
                                <div className="p-3.5 border-bottom d-flex align-items-center gap-2 bg-light-subtle">
                                    <i className="ri-flashlight-line fs-18 text-warning"></i>
                                    <h6 className="card-title mb-0 fw-bold text-body">Acciones Rápidas</h6>
                                </div>
                                <CardBody className="p-3.5">
                                    <div className="d-grid gap-2">
                                        <Link to="/projects" className="btn btn-soft-primary d-flex align-items-center justify-content-between p-2.5 rounded text-decoration-none border border-primary border-opacity-10">
                                            <span className="d-flex align-items-center gap-2">
                                                <i className="ri-folder-3-line fs-16"></i>
                                                <span className="fw-semibold">Gestionar Proyectos</span>
                                            </span>
                                            <i className="ri-arrow-right-line"></i>
                                        </Link>
                                        <Link to="/planning" className="btn btn-soft-success d-flex align-items-center justify-content-between p-2.5 rounded text-decoration-none border border-success border-opacity-10">
                                            <span className="d-flex align-items-center gap-2">
                                                <i className="ri-settings-3-line fs-16"></i>
                                                <span className="fw-semibold">Planificación de Sprints</span>
                                            </span>
                                            <i className="ri-arrow-right-line"></i>
                                        </Link>
                                        <Link to="/kanban" className="btn btn-soft-info d-flex align-items-center justify-content-between p-2.5 rounded text-decoration-none border border-info border-opacity-10">
                                            <span className="d-flex align-items-center gap-2">
                                                <i className="ri-record-circle-line fs-16"></i>
                                                <span className="fw-semibold">Ver Tablero Kanban</span>
                                            </span>
                                            <i className="ri-arrow-right-line"></i>
                                        </Link>
                                        <Link to="/profile" className="btn btn-soft-secondary d-flex align-items-center justify-content-between p-2.5 rounded text-decoration-none border border-secondary border-opacity-10">
                                            <span className="d-flex align-items-center gap-2">
                                                <i className="ri-user-settings-line fs-16"></i>
                                                <span className="fw-semibold">Mi Perfil</span>
                                            </span>
                                            <i className="ri-arrow-right-line"></i>
                                        </Link>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Card: Project Team Members */}
                            <Card className="border-0 shadow-sm">
                                <div className="p-3.5 border-bottom d-flex align-items-center gap-2 bg-light-subtle">
                                    <i className="ri-group-line fs-18 text-info"></i>
                                    <h6 className="card-title mb-0 fw-bold text-body">Miembros del Proyecto</h6>
                                </div>
                                <CardBody className="p-3.5">
                                    {!activeProjectId ? (
                                        <div className="text-center py-4 text-muted fs-13">
                                            No hay proyecto activo seleccionado.
                                        </div>
                                    ) : projectDetails?.memberships?.length === 0 ? (
                                        <div className="text-center py-4 text-muted fs-13">
                                            Sin miembros asignados a este proyecto.
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {projectDetails?.memberships?.map((member: any) => {
                                                const memberNames = member.nombre_completo.split(" ");
                                                const memberInitials = memberNames.map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                                                let badgeColor = "soft-primary text-primary";
                                                if (member.rol === "Product Owner") badgeColor = "soft-danger text-danger";
                                                else if (member.rol === "Scrum Master") badgeColor = "soft-success text-success";
                                                else if (member.rol === "Developer") badgeColor = "soft-info text-info";

                                                return (
                                                    <div className="d-flex align-items-center justify-content-between border-bottom pb-2.5 last:border-0 last:mb-0 last:pb-0" key={member.usuario_id}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {member.avatar_url ? (
                                                                <img
                                                                    src={member.avatar_url}
                                                                    alt={member.nombre_completo}
                                                                    className="rounded-circle avatar-xs"
                                                                    style={{ width: "30px", height: "30px", objectFit: "cover" }}
                                                                />
                                                            ) : (
                                                                <div className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-semibold fs-11" style={{ width: "30px", height: "30px" }}>
                                                                    {memberInitials}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="fs-13 fw-semibold text-body d-block">{member.nombre_completo}</span>
                                                                <small className="text-muted fs-11">{member.usuario_id === loggedInUserId ? 'Tú' : 'Miembro'}</small>
                                                            </div>
                                                        </div>
                                                        <span className={`badge bg-${badgeColor} fs-11`}>{member.rol}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            <ToastContainer />
        </React.Fragment>
    );
};

export default Starter;
