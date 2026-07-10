import React, { useState } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Row, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import SimpleBar from "simplebar-react";
import classnames from 'classnames';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    if (!isoStr) return '';
    const now = new Date();
    const then = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Hace ${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `Hace ${diffDay}d`;
    return then.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const NotificationDropdown = () => {
    const [isNotificationDropdown, setIsNotificationDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('2');
    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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

    const { data: notificationsLog = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            return (await api.get(`/notifications`)) as any;
        },
        staleTime: 10000,
    });

    const unreadNotifications = notificationsLog.filter((n: any) => !n.leida);

    const markAsRead = async (id: string, link?: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            if (link) navigate(link);
            setIsNotificationDropdown(false);
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all', {});
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (error) {
            console.error("Error marking all as read", error);
        }
    };

    return (
        <React.Fragment>
            <Dropdown isOpen={isNotificationDropdown} toggle={toggleNotificationDropdown} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-bell fs-22'></i>
                    {unreadNotifications.length > 0 ? (
                        <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                            {unreadNotifications.length}
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
                                {unreadNotifications.length > 0 && (
                                    <Col className="col-auto">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); markAllAsRead(); }} 
                                            className="btn btn-sm btn-ghost-light fw-medium fs-12 text-white text-decoration-underline"
                                            style={{ padding: 0 }}
                                        >
                                            Marcar todo como leído
                                        </button>
                                    </Col>
                                )}
                            </Row>
                        </div>
                        <div className="px-2 pt-2">
                            <Nav className="nav-tabs dropdown-tabs nav-tabs-custom">
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '2' })}
                                        onClick={() => { toggleTab('2'); }}
                                    >
                                        Para Ti ({unreadNotifications.length})
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '1' })}
                                        onClick={() => { toggleTab('1'); }}
                                    >
                                        General ({activityLog.length})
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>
                    </div>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="2" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {unreadNotifications.length === 0 ? (
                                    <div className="text-center pb-4 pt-2">
                                        <h6 className="fs-14 fw-semibold mt-4 text-muted">No tienes alertas pendientes</h6>
                                    </div>
                                ) : (
                                    unreadNotifications.map((item: any) => {
                                        return (
                                            <div key={item.id} className="text-reset notification-item d-block dropdown-item position-relative">
                                                <div className="d-flex">
                                                    <div className="avatar-xs me-3 flex-shrink-0">
                                                        <span className={`avatar-title bg-danger-subtle text-danger rounded-circle fs-16`}>
                                                            <i className="ri-alert-line"></i>
                                                        </span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <a href="#!" onClick={(e) => { e.preventDefault(); markAsRead(item.id, item.link); }} className="stretched-link">
                                                            <h6 className="mt-0 mb-1 fs-13 fw-semibold">{item.titulo}</h6>
                                                        </a>
                                                        <div className="fs-13 text-muted">
                                                            <p className="mb-1 fw-medium text-body">{item.mensaje}</p>
                                                        </div>
                                                        <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                                                            <span><i className="mdi mdi-clock-outline"></i> {formatTimeAgo(item.created_at)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </SimpleBar>
                        </TabPane>
                        <TabPane tabId="1" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {!activeProjectId ? (
                                    <div className="text-center pb-4 pt-2">
                                        <h6 className="fs-14 fw-semibold mt-4 text-muted">Abre un proyecto para ver su historial</h6>
                                    </div>
                                ) : activityLog.length === 0 ? (
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
                                                        <a href="#!" className="stretched-link">
                                                            <h6 className="mt-0 mb-1 fs-13 fw-semibold">{meta.label}</h6>
                                                        </a>
                                                        <div className="fs-13 text-muted">
                                                            <p className="mb-1 text-body">{item.descripcion}</p>
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
                    </TabContent>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default NotificationDropdown;