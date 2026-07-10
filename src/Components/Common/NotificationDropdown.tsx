import React, { useState, useMemo } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Row, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { Link } from 'react-router-dom';
import SimpleBar from "simplebar-react";
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { useProjectStore } from '../Hooks/useProjectStore';

const api = APIClient;

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
    project_created:      { icon: 'ri-folder-add-line',       color: 'success',   label: 'Proyecto creado' },
    project_deleted:      { icon: 'ri-delete-bin-line',       color: 'danger',    label: 'Proyecto eliminado' },
    member_assigned:      { icon: 'ri-user-shared-line',      color: 'warning',   label: 'Miembro asignado' },
    sprint_created:       { icon: 'ri-calendar-event-line',   color: 'primary',   label: 'Sprint creado' },
    sprint_activated:     { icon: 'ri-play-circle-line',      color: 'success',   label: 'Sprint activado' },
    sprint_closed:        { icon: 'ri-stop-circle-line',      color: 'secondary', label: 'Sprint cerrado' },
    story_created:        { icon: 'ri-bookmark-line',         color: 'info',      label: 'Historia creada' },
    story_estimated:      { icon: 'ri-scales-3-line',         color: 'primary',   label: 'Historia estimada' },
    story_planned:        { icon: 'ri-git-merge-line',        color: 'warning',   label: 'Historia planificada' },
    story_status_changed: { icon: 'ri-exchange-line',         color: 'info',      label: 'Estado de historia' },
    task_created:         { icon: 'ri-checkbox-circle-line',  color: 'success',   label: 'Tarea creada' },
    task_status_changed:  { icon: 'ri-refresh-line',          color: 'primary',   label: 'Estado de tarea' },
    task_assigned:        { icon: 'ri-user-follow-line',      color: 'warning',   label: 'Tarea asignada' },
};

const getActionMeta = (accion: string) => ACTION_META[accion] || { icon: 'ri-information-line', color: 'secondary', label: accion };

const formatTimeAgo = (isoStr: string) => {
    const now = new Date();
    const then = new Date(isoStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Hace ${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `Hace ${diffDay}d`;
    return then.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getForYouMessage = (item: any, meta: any, role: string | null) => {
    if (item.accion === 'member_assigned') return "¡Te han asignado a este proyecto!";
    if (item.accion === 'task_assigned') return "¡Se te ha asignado una nueva tarea!";
    if (item.accion === 'sprint_activated') return "¡El Sprint acaba de iniciar! Es hora de revisar tus tareas.";
    if (item.accion === 'task_status_changed' && (meta.new_status === 'Completada' || meta.new_status === 'Validando')) {
        return `El Developer ha terminado una tarea. ¡Lista para tu revisión!`;
    }
    if (item.accion === 'story_status_changed' && meta.new_status === 'Entregada') {
        return `Se ha entregado una Historia de Usuario. ¡Revisa los criterios de aceptación!`;
    }
    return item.descripcion;
};

const NotificationDropdown = () => {
    const [isNotificationDropdown, setIsNotificationDropdown] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('1');
    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    
    const currentUserRole = localStorage.getItem("activeProjectRole");
    const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    const currentUserId = authUser ? (authUser.id || authUser.usuario_id) : null;

    const toggleNotificationDropdown = () => {
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    const toggleTab = (tab: any) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    const { data: activityLog = [] } = useQuery({
        queryKey: ['activity', activeProjectId],
        queryFn: async () => {
            if (!activeProjectId) return [];
            return (await api.get(`/projects/${activeProjectId}/activity?limit=30&offset=0`)) as any;
        },
        enabled: !!activeProjectId,
        staleTime: 10000,
    });

    const forYouLog = useMemo(() => {
        return activityLog.filter((item: any) => {
            if (item.usuario_id === currentUserId) return false;
            let meta: any = {};
            try {
                if (item.metadata_json) meta = JSON.parse(item.metadata_json);
            } catch (e) { }

            if (item.accion === 'member_assigned' && meta.assigned_user_id === currentUserId) return true;
            if (item.accion === 'task_assigned' && meta.assigned_user_id === currentUserId) return true;
            
            if (currentUserRole === 'Developer') {
                if (item.accion === 'sprint_activated') return true;
            }
            
            if (currentUserRole === 'Product Owner' || currentUserRole === 'Scrum Master') {
                if (item.accion === 'task_status_changed' && (meta.new_status === 'Completada' || meta.new_status === 'Validando')) return true;
                if (item.accion === 'story_status_changed' && meta.new_status === 'Entregada') return true;
            }
            
            return false;
        });
    }, [activityLog, currentUserRole, currentUserId]);

    return (
        <React.Fragment>
            <Dropdown isOpen={isNotificationDropdown} toggle={toggleNotificationDropdown} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-bell fs-22'></i>
                    {forYouLog.length > 0 ? (
                        <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                            {forYouLog.length}
                            <span className="visually-hidden">unread messages</span>
                        </span>
                    ) : (
                        activityLog.length > 0 && (
                            <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-info">
                                {activityLog.length}
                                <span className="visually-hidden">unread messages</span>
                            </span>
                        )
                    )}
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0">
                    <div className="dropdown-head bg-primary bg-pattern rounded-top">
                        <div className="p-3">
                            <Row className="align-items-center">
                                <Col>
                                    <h6 className="m-0 fs-16 fw-semibold text-white"> Notificaciones </h6>
                                </Col>
                            </Row>
                        </div>
                        <div className="px-2 pt-2">
                            <Nav className="nav-tabs dropdown-tabs nav-tabs-custom">
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '1' })}
                                        onClick={() => { toggleTab('1'); }}
                                    >
                                        General ({activityLog.length})
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '2' })}
                                        onClick={() => { toggleTab('2'); }}
                                    >
                                        Para Ti {forYouLog.length > 0 && <span className="badge bg-danger ms-1">{forYouLog.length}</span>}
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>
                    </div>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {activityLog.length === 0 ? (
                                    <div className="text-center pb-4 pt-2">
                                        <h6 className="fs-14 fw-semibold mt-4 text-muted">No hay actividad general</h6>
                                    </div>
                                ) : (
                                    activityLog.map((item: any) => {
                                        const meta = getActionMeta(item.accion);
                                        return (
                                            <div key={item.id} className="text-reset notification-item d-block dropdown-item position-relative">
                                                <div className="d-flex">
                                                    <div className="avatar-xs me-3 flex-shrink-0">
                                                        <span className={`avatar-title bg-${meta.color}-subtle text-${meta.color} rounded-circle fs-16`}>
                                                            <i className={meta.icon}></i>
                                                        </span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <Link to="/activity" className="stretched-link">
                                                            <h6 className="mt-0 mb-1 fs-13 fw-semibold">{meta.label}</h6>
                                                        </Link>
                                                        <div className="fs-13 text-muted">
                                                            <p className="mb-1">{item.descripcion}</p>
                                                        </div>
                                                        <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                                            <span><i className="mdi mdi-clock-outline"></i> {formatTimeAgo(item.created_at)}</span>
                                                            <span className="mx-1">•</span>
                                                            <span>{item.usuario_nombre}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="2" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {forYouLog.length === 0 ? (
                                    <div className="text-center pb-4 pt-2">
                                        <h6 className="fs-14 fw-semibold mt-4 text-muted">Todo al día 🎉</h6>
                                        <p className="text-muted fs-12 mb-0">No tienes acciones pendientes urgentes.</p>
                                    </div>
                                ) : (
                                    forYouLog.map((item: any) => {
                                        let metaJson: any = {};
                                        try {
                                            if (item.metadata_json) metaJson = JSON.parse(item.metadata_json);
                                        } catch (e) { }
                                        
                                        const customMessage = getForYouMessage(item, metaJson, currentUserRole);
                                        
                                        return (
                                            <div key={item.id} className="text-reset notification-item d-block dropdown-item position-relative active">
                                                <div className="d-flex">
                                                    <div className="avatar-xs me-3 flex-shrink-0">
                                                        <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-16">
                                                            <i className="ri-flashlight-fill"></i>
                                                        </span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <Link to="/kanban" className="stretched-link">
                                                            <h6 className="mt-0 mb-1 fs-13 fw-bold text-body">¡Llamado a la acción!</h6>
                                                        </Link>
                                                        <div className="fs-13 text-muted">
                                                            <p className="mb-1 fw-medium">{customMessage}</p>
                                                        </div>
                                                        <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                                            <span><i className="mdi mdi-clock-outline"></i> {formatTimeAgo(item.created_at)}</span>
                                                            <span className="mx-1">•</span>
                                                            <span>Por: {item.usuario_nombre}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </SimpleBar>
                        </TabPane>
                    </TabContent>
                    
                    <div className="p-3 border-top border-top-dashed">
                        <Link to="/activity" className="btn btn-soft-primary w-100 fw-semibold">
                            Ver Historial Completo <i className="ri-arrow-right-line align-middle ms-1"></i>
                        </Link>
                    </div>

                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default NotificationDropdown;