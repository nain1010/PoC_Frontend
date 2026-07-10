import React, { useState, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, CardBody, Spinner, Badge, Button, Input } from 'reactstrap';
import { useQuery } from '@tanstack/react-query';
import { useProjectStore } from '../../Components/Hooks/useProjectStore';
import BreadCrumb from '../../Components/Common/BreadCrumb';
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

const ActivityItem = React.memo(({ item }: { item: any }) => {
    const meta = getActionMeta(item.accion);
    return (
        <div className="d-flex align-items-start gap-3 p-3 border-bottom activity-item" style={{ transition: 'background-color 0.2s' }}>
            <div className={`avatar-xs flex-shrink-0`}>
                <span className={`avatar-title bg-soft-${meta.color} text-${meta.color} rounded-circle fs-16`}>
                    <i className={meta.icon}></i>
                </span>
            </div>
            <div className="flex-grow-1 min-width-0">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="mb-0 fs-13 fw-semibold text-body">{item.descripcion}</h6>
                    <span className="text-muted fs-11 flex-shrink-0 ms-2">{formatTimeAgo(item.created_at)}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <Badge color={`soft-${meta.color}`} className={`text-${meta.color} fs-10`}>{meta.label}</Badge>
                    {item.usuario_nombre && (
                        <span className="text-muted fs-11">
                            <i className="ri-user-line me-1"></i>{item.usuario_nombre}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});
ActivityItem.displayName = 'ActivityItem';

const Activity = () => {
    const activeProjectId = useProjectStore((state) => state.activeProjectId);
    const activeProjectName = localStorage.getItem("activeProjectName");
    const [filterAction, setFilterAction] = useState<string>('all');
    const [limit, setLimit] = useState(50);

    document.title = "Historial de Actividad | Luma";

    const { data: activityData = [], isLoading, isFetching } = useQuery({
        queryKey: ['activity', activeProjectId, limit],
        queryFn: () => api.get(`/projects/${activeProjectId}/activity?limit=${limit}&offset=0`) as any,
        enabled: !!activeProjectId,
        staleTime: 10000,
    });

    const filteredActivity = useMemo(() => {
        if (filterAction === 'all') return activityData;
        return activityData.filter((item: any) => item.accion === filterAction);
    }, [activityData, filterAction]);

    const uniqueActions = useMemo(() => {
        const actions = new Set(activityData.map((item: any) => item.accion));
        return Array.from(actions) as string[];
    }, [activityData]);

    const handleLoadMore = useCallback(() => {
        setLimit(prev => prev + 50);
    }, []);

    if (!activeProjectId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Historial de Actividad" />
                    <Card className="border-0 shadow-sm">
                        <CardBody className="text-center py-5">
                            <i className="ri-history-line display-4 text-muted mb-3"></i>
                            <h5 className="text-body">Selecciona un proyecto</h5>
                            <p className="text-muted fs-13">Para ver el historial de actividad, selecciona primero un proyecto desde la barra superior.</p>
                        </CardBody>
                    </Card>
                </Container>
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Historial de Actividad" />
                
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold text-body mb-1">
                            <i className="ri-history-line text-primary me-2"></i>
                            Historial de Actividad
                        </h4>
                        <p className="text-muted fs-13 mb-0">
                            Todas las acciones realizadas en <strong>{activeProjectName || 'este proyecto'}</strong>
                        </p>
                    </div>
                    {isFetching && !isLoading && (
                        <Spinner size="sm" color="primary" />
                    )}
                </div>

                <Row>
                    {/* Filters sidebar */}
                    <Col lg={3} className="mb-4">
                        <Card className="border-0 shadow-sm sticky-top" style={{ top: '80px', zIndex: 10 }}>
                            <CardBody className="p-3">
                                <h6 className="fw-bold text-body mb-3">
                                    <i className="ri-filter-3-line me-1"></i> Filtrar por acción
                                </h6>
                                <div className="d-grid gap-1">
                                    <Button 
                                        color={filterAction === 'all' ? 'primary' : 'light'}
                                        size="sm"
                                        className="text-start d-flex align-items-center gap-2"
                                        onClick={() => setFilterAction('all')}
                                    >
                                        <i className="ri-list-check"></i>
                                        Todas ({activityData.length})
                                    </Button>
                                    {uniqueActions.map(action => {
                                        const meta = getActionMeta(action);
                                        const count = activityData.filter((i: any) => i.accion === action).length;
                                        return (
                                            <Button
                                                key={action}
                                                color={filterAction === action ? meta.color : 'light'}
                                                size="sm"
                                                className="text-start d-flex align-items-center gap-2"
                                                onClick={() => setFilterAction(action)}
                                            >
                                                <i className={meta.icon}></i>
                                                {meta.label} ({count})
                                            </Button>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Activity timeline */}
                    <Col lg={9}>
                        <Card className="border-0 shadow-sm">
                            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light-subtle">
                                <h6 className="card-title mb-0 fw-bold text-body">
                                    <i className="ri-time-line text-primary me-2"></i>
                                    Timeline ({filteredActivity.length} registros)
                                </h6>
                            </div>
                            <CardBody className="p-0">
                                {isLoading ? (
                                    <div className="text-center py-5">
                                        <Spinner color="primary" />
                                        <p className="text-muted mt-2 mb-0">Cargando historial...</p>
                                    </div>
                                ) : filteredActivity.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="ri-inbox-line display-5 mb-3"></i>
                                        <h5 className="text-body">Sin actividad registrada</h5>
                                        <p className="fs-13 mb-0">Las acciones que se realicen en este proyecto aparecerán aquí.</p>
                                    </div>
                                ) : (
                                    <>
                                        {filteredActivity.map((item: any) => (
                                            <ActivityItem key={item.id} item={item} />
                                        ))}
                                        {activityData.length >= limit && (
                                            <div className="text-center p-3">
                                                <Button color="soft-primary" size="sm" onClick={handleLoadMore} disabled={isFetching}>
                                                    {isFetching ? <Spinner size="sm" /> : <><i className="ri-arrow-down-line me-1"></i>Cargar más</>}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Activity;
