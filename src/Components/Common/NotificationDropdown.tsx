import React, { useState } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import SimpleBar from "simplebar-react";
import { useQuery } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';

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

const NotificationDropdown = () => {
    const [isNotificationDropdown, setIsNotificationDropdown] = useState<boolean>(false);
    const activeProjectId = localStorage.getItem('activeProjectId');

    const toggleNotificationDropdown = () => {
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    const { data: activityLog = [] } = useQuery({
        queryKey: ['activity', activeProjectId],
        queryFn: async () => {
            if (!activeProjectId) return [];
            return await api.get(`/projects/${activeProjectId}/activity?limit=10&offset=0`);
        },
        enabled: !!activeProjectId && isNotificationDropdown,
        staleTime: 10000,
    });

    return (
        <React.Fragment>
            <Dropdown isOpen={isNotificationDropdown} toggle={toggleNotificationDropdown} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-bell fs-22'></i>
                    {/* <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">0<span className="visually-hidden">unread messages</span></span> */}
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0">
                    <div className="dropdown-head bg-primary bg-pattern rounded-top">
                        <div className="p-3">
                            <Row className="align-items-center">
                                <Col>
                                    <h6 className="m-0 fs-16 fw-semibold text-white"> Notificaciones </h6>
                                </Col>
                                <div className="col-auto dropdown-tabs">
                                    <span className="badge bg-light-subtle fs-13 text-body"> Recientes</span>
                                </div>
                            </Row>
                        </div>
                    </div>

                    <div className="py-2 ps-2">
                        <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                            {activityLog.length === 0 ? (
                                <div className="text-center pb-4 pt-2">
                                    <h6 className="fs-14 fw-semibold mt-4 text-muted">No hay notificaciones</h6>
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
                    </div>
                    
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