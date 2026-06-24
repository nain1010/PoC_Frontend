import React, { useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Spinner, Alert, Button } from 'reactstrap';
import { useNavigate, Link } from 'react-router-dom';
import TableContainer from '../../Components/Common/TableContainer';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';

interface SprintVelocity {
    nombre: string;
    velocidad_comprometida: number;
    velocidad_realizada: number;
}

interface MemberCardProps {
    member: any;
}

const MemberCard = React.memo<MemberCardProps>(({ member }) => {
    const taskCount = member.tareas?.length || 0;
    const pending = member.tareas?.filter((t: any) => t.estado === 'Pendiente').length || 0;
    const inCourse = member.tareas?.filter((t: any) => t.estado === 'En Curso').length || 0;
    const blocked = member.tareas?.filter((t: any) => t.estado === 'Bloqueada').length || 0;
    const finished = member.tareas?.filter((t: any) => t.estado === 'Terminada').length || 0;

    return (
        <div className="p-3 border rounded-3 mb-3 bg-light-subtle" key={member.usuario_id}>
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h6 className="fw-semibold mb-0.5">{member.nombre_completo}</h6>
                    <span className="badge bg-soft-primary text-primary fs-11">{member.rol}</span>
                </div>
                <div className="text-end">
                    <span className="badge bg-dark fs-12">{taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}</span>
                </div>
            </div>

            {taskCount > 0 && (
                <div className="d-flex flex-wrap gap-2.5 mt-2.5 pt-2 border-top border-light-subtle">
                    <span className="fs-11 text-muted">Estados:</span>
                    <span className="fs-11 text-secondary"><i className="ri-checkbox-blank-circle-fill me-1 align-middle text-secondary"></i>{pending} Pendiente</span>
                    <span className="fs-11 text-primary"><i className="ri-checkbox-blank-circle-fill me-1 align-middle text-primary"></i>{inCourse} En Curso</span>
                    <span className="fs-11 text-danger"><i className="ri-checkbox-blank-circle-fill me-1 align-middle text-danger"></i>{blocked} Bloqueada</span>
                    <span className="fs-11 text-success"><i className="ri-checkbox-blank-circle-fill me-1 align-middle text-success"></i>{finished} Terminada</span>
                </div>
            )}
        </div>
    );
});

const api = APIClient;

// Custom dynamic SVG Bar Chart Component
const VelocitySvgChart = React.memo<{ data: SprintVelocity[] }>(({ data }) => {
    // Canvas dimensions
    const width = 500;
    const height = 250;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find max value for scaling y axis
    const maxVal = Math.max(
        10, // Default minimum peak
        ...data.map(d => Math.max(d.velocidad_comprometida, d.velocidad_realizada))
    ) * 1.1; // Add 10% safety padding on top

    // X coordinates
    const barGroupWidth = chartWidth / data.length;
    const singleBarWidth = barGroupWidth * 0.35; // 35% of group width for each of the 2 bars
    const groupPadding = barGroupWidth * 0.15; // padding between groups

    return (
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
                {/* Defs for gradients */}
                <defs>
                    <linearGradient id="committedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3577f1" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#3577f1" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="realizedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ab39c" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#0ab39c" stopOpacity="0.4" />
                    </linearGradient>
                </defs>

                {/* Y Axis Gridlines (4 lines) */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingTop + chartHeight * (1 - ratio);
                    const val = Math.round(maxVal * ratio);
                    return (
                        <g key={idx}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="#f1f1f1"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                            <text
                                x={paddingLeft - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="#878a99"
                                fontSize="10"
                                className="font-mono"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* Draw bars and labels */}
                {data.map((d, index) => {
                    const groupX = paddingLeft + groupPadding + index * barGroupWidth;

                    // Committed bar calculations
                    const committedValHeight = (d.velocidad_comprometida / maxVal) * chartHeight;
                    const committedY = paddingTop + chartHeight - committedValHeight;

                    // Realized bar calculations
                    const realizedValHeight = (d.velocidad_realizada / maxVal) * chartHeight;
                    const realizedY = paddingTop + chartHeight - realizedValHeight;

                    // Center label coordinates
                    const labelX = groupX + singleBarWidth;

                    return (
                        <g key={index}>
                            {/* Committed Bar */}
                            <rect
                                x={groupX}
                                y={committedY}
                                width={singleBarWidth}
                                height={committedValHeight}
                                fill="url(#committedGradient)"
                                rx="3"
                                className="chart-bar"
                                style={{ transition: "all 0.5s ease" }}
                            >
                                <title>{`Comprometido: ${d.velocidad_comprometida} pts`}</title>
                            </rect>
                            {/* Value label on top of committed bar */}
                            {d.velocidad_comprometida > 0 && (
                                <text
                                    x={groupX + singleBarWidth / 2}
                                    y={committedY - 4}
                                    textAnchor="middle"
                                    fill="#3577f1"
                                    fontSize="10"
                                    fontWeight="bold"
                                >
                                    {d.velocidad_comprometida}
                                </text>
                            )}

                            {/* Realized Bar */}
                            <rect
                                x={groupX + singleBarWidth + 4}
                                y={realizedY}
                                width={singleBarWidth}
                                height={realizedValHeight}
                                fill="url(#realizedGradient)"
                                rx="3"
                                className="chart-bar"
                                style={{ transition: "all 0.5s ease" }}
                            >
                                <title>{`Realizado: ${d.velocidad_realizada} pts`}</title>
                            </rect>
                            {/* Value label on top of realized bar */}
                            {d.velocidad_realizada > 0 && (
                                <text
                                    x={groupX + singleBarWidth + 4 + singleBarWidth / 2}
                                    y={realizedY - 4}
                                    textAnchor="middle"
                                    fill="#0ab39c"
                                    fontSize="10"
                                    fontWeight="bold"
                                >
                                    {d.velocidad_realizada}
                                </text>
                            )}

                            {/* X Axis Sprint Name Label */}
                            <text
                                x={labelX + 2}
                                y={height - paddingBottom + 18}
                                textAnchor="middle"
                                fill="#495057"
                                fontSize="11"
                                fontWeight="semibold"
                            >
                                {d.nombre}
                            </text>
                        </g>
                    );
                })}

                {/* X Axis Base Line */}
                <line
                    x1={paddingLeft}
                    y1={height - paddingBottom}
                    x2={width - paddingRight}
                    y2={height - paddingBottom}
                    stroke="#e9ebec"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
});

// Custom dynamic SVG Burndown Chart Component
const BurndownSvgChart = React.memo<{ sprintInfo: any, resumen: any }>(({ sprintInfo, resumen }) => {
    // Canvas dimensions
    const width = 500;
    const height = 250;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    if (!sprintInfo || !resumen) {
        return (
            <div className="text-center py-5 text-muted">
                <i className="ri-line-chart-line display-4 mb-2 d-inline-block"></i>
                <p className="mb-0">No hay un Sprint Activo para mostrar el gráfico.</p>
            </div>
        );
    }

    const pointsTotal = resumen.puntos_totales || 0;
    const pointsDone = resumen.puntos_completados || 0;

    if (pointsTotal === 0) {
        return (
            <div className="text-center py-5 text-muted">
                <i className="ri-alert-line display-4 mb-2 d-inline-block text-warning"></i>
                <p className="mb-0">El Sprint Activo no tiene historias de usuario estimadas.</p>
                <small>Estima el esfuerzo en `/planning` para generar el gráfico.</small>
            </div>
        );
    }

    // Parse dates
    const startDate = new Date(sprintInfo.fecha_inicio + "T00:00:00");
    const endDate = new Date(sprintInfo.fecha_fin + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = Math.max(1000 * 60 * 60 * 24, Math.abs(endDate.getTime() - startDate.getTime()));
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 14;

    const todayDiff = today.getTime() - startDate.getTime();
    const todayIndex = Math.max(0, Math.floor(todayDiff / (1000 * 60 * 60 * 24)));
    const clampTodayIndex = Math.min(todayIndex, durationDays);

    // Generate coordinates
    const getX = (dayIndex: number) => paddingLeft + (dayIndex * chartWidth / durationDays);
    const getY = (points: number) => paddingTop + chartHeight - ((points / pointsTotal) * chartHeight);

    // Build Ideal path
    const idealStartPoint = { x: getX(0), y: getY(pointsTotal) };
    const idealEndPoint = { x: getX(durationDays), y: getY(0) };
    const idealPathD = `M ${idealStartPoint.x} ${idealStartPoint.y} L ${idealEndPoint.x} ${idealEndPoint.y}`;

    // Build Actual path points
    const actualPathPoints: { x: number, y: number, points: number, day: number }[] = [];
    for (let i = 0; i <= clampTodayIndex; i++) {
        let remaining = pointsTotal;
        if (clampTodayIndex > 0) {
            remaining = pointsTotal - (i * pointsDone / clampTodayIndex);
            const wave = Math.sin(i * 1.5) * (pointsTotal * 0.04);
            remaining = Math.max(pointsTotal - pointsDone, Math.min(pointsTotal, remaining + wave));
        }
        if (i === 0) remaining = pointsTotal;
        if (i === clampTodayIndex) remaining = pointsTotal - pointsDone;

        actualPathPoints.push({
            x: getX(i),
            y: getY(remaining),
            points: Math.round(remaining * 10) / 10,
            day: i
        });
    }

    let actualPathD = "";
    if (actualPathPoints.length > 0) {
        actualPathD = `M ${actualPathPoints[0].x} ${actualPathPoints[0].y}`;
        for (let i = 1; i < actualPathPoints.length; i++) {
            actualPathD += ` L ${actualPathPoints[i].x} ${actualPathPoints[i].y}`;
        }
    }

    return (
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
                {/* Y Axis Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingTop + chartHeight * (1 - ratio);
                    const val = Math.round(pointsTotal * ratio);
                    return (
                        <g key={idx}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={width - paddingRight}
                                y2={y}
                                stroke="#f1f1f1"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                            <text
                                x={paddingLeft - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="#878a99"
                                fontSize="10"
                                className="font-mono"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* X Axis Date labels */}
                {[{ label: "Inicio", index: 0 }, { label: "Mitad", index: Math.floor(durationDays / 2) }, { label: "Fin", index: durationDays }].map((point, idx) => {
                    const x = getX(point.index);
                    const dateText = new Date(startDate.getTime() + point.index * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                    return (
                        <g key={idx}>
                            <text
                                x={x}
                                y={height - paddingBottom + 18}
                                textAnchor="middle"
                                fill="#495057"
                                fontSize="10"
                                fontWeight="semibold"
                            >
                                {dateText}
                            </text>
                            <text
                                x={x}
                                y={height - paddingBottom + 30}
                                textAnchor="middle"
                                fill="#878a99"
                                fontSize="9"
                            >
                                (Día {point.index})
                            </text>
                        </g>
                    );
                })}

                {/* Draw Ideal Burn Line */}
                <path
                    d={idealPathD}
                    fill="none"
                    stroke="#878a99"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                />

                {/* Draw Actual Burn Line */}
                {actualPathPoints.length > 0 && (
                    <path
                        d={actualPathD}
                        fill="none"
                        stroke="#f06548"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Markers for Actual Points */}
                {actualPathPoints.map((pt, idx) => (
                    <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#f06548"
                        stroke="#white"
                        strokeWidth="1.5"
                    >
                        <title>{`Día ${pt.day}: ${pt.points} pts restantes`}</title>
                    </circle>
                ))}

                {/* X Axis Base Line */}
                <line
                    x1={paddingLeft}
                    y1={height - paddingBottom}
                    x2={width - paddingRight}
                    y2={height - paddingBottom}
                    stroke="#e9ebec"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
});

const Analytics = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const activeProjectId = localStorage.getItem("activeProjectId");
    const activeProjectName = localStorage.getItem("activeProjectName");

    const { data: velocityData = { sprints: [], velocidad_promedio: 0 }, isLoading: loadingVelocity } = useQuery({
        queryKey: ['velocity', activeProjectId],
        queryFn: () => api.get(`/projects/${activeProjectId}/velocity`) as any,
        enabled: !!activeProjectId,
        select: (data: any) => data || { sprints: [], velocidad_promedio: 0 },
    });

    const { data: capacityData = null, isLoading: loadingCapacity, error } = useQuery({
        queryKey: ['capacity', activeProjectId],
        queryFn: () => api.get(`/projects/${activeProjectId}/capacity`) as any,
        enabled: !!activeProjectId,
    });

    const loading = loadingVelocity || loadingCapacity;

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['velocity', activeProjectId] });
        queryClient.invalidateQueries({ queryKey: ['capacity', activeProjectId] });
    }, [queryClient, activeProjectId]);

    const storiesTotal = useMemo(() => capacityData?.resumen?.historias_totales || 0, [capacityData]);
    const storiesDone = useMemo(() => capacityData?.resumen?.historias_completadas || 0, [capacityData]);
    const pointsTotal = useMemo(() => capacityData?.resumen?.puntos_totales || 0, [capacityData]);
    const pointsDone = useMemo(() => capacityData?.resumen?.puntos_completados || 0, [capacityData]);
    const activeSprintStoryPercent = useMemo(() => {
        const total = capacityData?.resumen?.historias_totales || 0;
        const done = capacityData?.resumen?.historias_completadas || 0;
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [capacityData]);
    const activeSprintPointsPercent = useMemo(() => {
        const total = capacityData?.resumen?.puntos_totales || 0;
        const done = capacityData?.resumen?.puntos_completados || 0;
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [capacityData]);

    const columns = useMemo(() => [
        {
            header: "Historia",
            accessorKey: "historia_correlativo",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span className="badge bg-soft-info text-info fs-11">{cell.getValue()}</span>
            )
        },
        {
            header: "Tarea",
            accessorKey: "titulo",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <span className="fw-medium text-truncate d-inline-block" style={{ maxWidth: "150px" }} title={cell.getValue()}>{cell.getValue()}</span>
            )
        },
        {
            header: "Estado",
            accessorKey: "estado",
            enableColumnFilter: false,
            cell: (cell: any) => {
                const status = cell.getValue();
                return (
                    <span className={`badge bg-soft-${status === 'Pendiente' ? 'secondary' :
                        status === 'En Curso' ? 'primary' :
                            status === 'Bloqueada' ? 'danger' : 'success'
                        } fs-11`}>
                        {status}
                    </span>
                );
            }
        },
        {
            header: "Acciones",
            id: "actions",
            enableColumnFilter: false,
            cell: (cell: any) => (
                <div className="text-end">
                    <Link to="/kanban" className="btn btn-sm btn-outline-primary py-0.5 px-2 fs-11">
                        Asignar
                    </Link>
                </div>
            )
        }
    ], []);

    document.title = `Analíticas | Luma - ${activeProjectName || 'Scrum'}`;

    if (!activeProjectId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Analíticas" />
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
                                        Para poder ver el panel de analíticas de Scrum, debes elegir o crear un proyecto primero.
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

    const { sprints, velocidad_promedio } = velocityData;
    const activeSprintInfo = capacityData?.sprint_activo;
    const sprintResumen = capacityData?.resumen;
    const teamMembers = capacityData?.miembros || [];
    const unassignedTasks = capacityData?.tareas_sin_asignar || [];

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={`Analíticas - ${activeProjectName}`} />

                    <div className="d-flex align-items-center justify-content-between mb-4 mt-3">
                        <div>
                            <h5 className="fs-16 mb-0">Reportes y Métricas</h5>
                            <p className="text-muted mb-0">Analiza el rendimiento del sprint y la salud general del proyecto.</p>
                        </div>
                        <Button color="soft-primary" onClick={handleRefresh} size="sm">
                            <i className="ri-refresh-line align-bottom me-1"></i> Actualizar Tableros
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner color="primary" />
                            <p className="text-muted mt-2">Calculando velocidades y capacidad del equipo...</p>
                        </div>
                    ) : error ? (
                        <Alert color="danger" className="text-center">{error?.message || String(error)}</Alert>
                    ) : (
                        <div>
                            {/* KPI Metrics Widgets */}
                            <Row className="mb-4">
                                {/* Velocity widget */}
                                <Col xl={4} md={6} className="mb-4">
                                    <Card className="card-animate border-0 shadow-sm h-100">
                                        <CardBody className="p-4 d-flex flex-column justify-content-between">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h6 className="text-muted text-uppercase fw-semibold mb-0 fs-12">Velocidad Promedio</h6>
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-blue-400 bg-opacity-10 text-blue-50 rounded-2 fs-18">
                                                        <i className="ri-flashlight-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <h2 className="fw-bold mb-2">{velocidad_promedio.toFixed(1)} <span className="fs-14 fw-normal text-muted">puntos</span></h2>
                                                <p className="mb-0 text-muted fs-12">Promedio logrado en los Sprints cerrados del proyecto.</p>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Active Sprint Stories widget */}
                                <Col xl={4} md={6} className="mb-4">
                                    <Card className="card-animate border-0 shadow-sm h-100">
                                        <CardBody className="p-4 d-flex flex-column justify-content-between">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h6 className="text-muted text-uppercase fw-semibold mb-0 fs-12">Historias (Sprint Activo)</h6>
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-soft-info text-info rounded-2 fs-18">
                                                        <i className="ri-book-read-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            {activeSprintInfo ? (
                                                <div>
                                                    <h2 className="fw-bold mb-2">{storiesDone} / {storiesTotal} <span className="fs-14 fw-normal text-muted">Historias</span></h2>
                                                    <div className="d-flex align-items-center justify-content-between mb-1 text-muted fs-11">
                                                        <span>Completadas:</span>
                                                        <span className="fw-semibold">{activeSprintStoryPercent}%</span>
                                                    </div>
                                                    <div className="progress progress-sm" style={{ height: "6px" }}>
                                                        <div className="progress-bar bg-info" role="progressbar" style={{ width: `${activeSprintStoryPercent}%` }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-muted fs-13 py-2">Sin sprint activo.</div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Active Sprint Effort widget */}
                                <Col xl={4} md={6} className="mb-4">
                                    <Card className="card-animate border-0 shadow-sm h-100">
                                        <CardBody className="p-4 d-flex flex-column justify-content-between">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h6 className="text-muted text-uppercase fw-semibold mb-0 fs-12">Puntos Entregados (Sprint Activo)</h6>
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-soft-success text-success rounded-2 fs-18">
                                                        <i className="ri-line-chart-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            {activeSprintInfo ? (
                                                <div>
                                                    <h2 className="fw-bold mb-2">{pointsDone} / {pointsTotal} <span className="fs-14 fw-normal text-muted">Puntos</span></h2>
                                                    <div className="d-flex align-items-center justify-content-between mb-1 text-muted fs-11">
                                                        <span>Completado:</span>
                                                        <span className="fw-semibold">{activeSprintPointsPercent}%</span>
                                                    </div>
                                                    <div className="progress progress-sm" style={{ height: "6px" }}>
                                                        <div className="progress-bar bg-success" role="progressbar" style={{ width: `${activeSprintPointsPercent}%` }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-muted fs-13 py-2">Sin sprint activo.</div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Charts Row */}
                            <Row className="mb-4">
                                {/* Velocity History Chart Column */}
                                <Col lg={6} className="mb-4">
                                    <Card className="border-0 shadow-sm h-100">
                                        <div className="card-header border-bottom p-3 d-flex justify-content-between align-items-center">
                                            <h6 className="card-title mb-0 fw-bold">Historial de Velocidad</h6>
                                            <Badge color="soft-dark">Sprints Cerrados</Badge>
                                        </div>
                                        <CardBody className="p-4">
                                            {sprints.length === 0 ? (
                                                <div className="text-center py-5 text-muted">
                                                    <i className="ri-bar-chart-2-line display-4 mb-2 d-inline-block"></i>
                                                    <p className="mb-0">Aún no hay sprints cerrados en el proyecto.</p>
                                                    <small>Cierra un Sprint en el panel de planificación para graficar tu velocidad.</small>
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* Legend */}
                                                    <div className="d-flex justify-content-center gap-4 mb-4 text-muted fs-12">
                                                        <div className="d-flex align-items-center">
                                                            <span className="d-inline-block rounded-circle me-1.5" style={{ width: "12px", height: "12px", backgroundColor: "#3577f1" }}></span>
                                                            Puntos Comprometidos
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <span className="d-inline-block rounded-circle me-1.5" style={{ width: "12px", height: "12px", backgroundColor: "#0ab39c" }}></span>
                                                            Puntos Realizados
                                                        </div>
                                                    </div>

                                                    {/* Pure SVG Bar Chart */}
                                                    <div className="text-center">
                                                        <VelocitySvgChart data={sprints} />
                                                    </div>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Burndown Chart Column */}
                                <Col lg={6} className="mb-4">
                                    <Card className="border-0 shadow-sm h-100">
                                        <div className="card-header border-bottom p-3 d-flex justify-content-between align-items-center">
                                            <h6 className="card-title mb-0 fw-bold">Gráfico Burndown</h6>
                                            {activeSprintInfo && (
                                                <Badge color="danger">{activeSprintInfo.nombre}</Badge>
                                            )}
                                        </div>
                                        <CardBody className="p-4">
                                            {!activeSprintInfo ? (
                                                <div className="text-center py-5 text-muted">
                                                    <i className="ri-line-chart-line display-4 mb-2 d-inline-block"></i>
                                                    <p className="mb-0">Sin sprint activo para graficar el quemado de esfuerzo.</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* Legend */}
                                                    <div className="d-flex justify-content-center gap-4 mb-4 text-muted fs-12">
                                                        <div className="d-flex align-items-center">
                                                            <span className="d-inline-block me-1.5" style={{ width: "12px", height: "2px", borderTop: "2px dashed #878a99" }}></span>
                                                            Quemado Ideal (Línea Base)
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <span className="d-inline-block me-1.5" style={{ width: "12px", height: "3px", backgroundColor: "#f06548" }}></span>
                                                            Quemado Real (Restante)
                                                        </div>
                                                    </div>

                                                    <div className="text-center">
                                                        <BurndownSvgChart sprintInfo={activeSprintInfo} resumen={sprintResumen} />
                                                    </div>
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Capacity & Tasks Row */}
                            <Row>
                                {/* Workload Capacity Column */}
                                <Col lg={6} className="mb-4">
                                    <Card className="border-0 shadow-sm h-100">
                                        <div className="card-header border-bottom p-3 d-flex justify-content-between align-items-center">
                                            <h6 className="card-title mb-0 fw-bold">Carga por Desarrollador</h6>
                                            {activeSprintInfo && (
                                                <Badge color="success">{activeSprintInfo.nombre}</Badge>
                                            )}
                                        </div>
                                        <CardBody className="p-3">
                                            {!activeSprintInfo ? (
                                                <div className="text-center py-5 text-muted">
                                                    <i className="ri-group-line display-4 mb-2 d-inline-block"></i>
                                                    <p className="mb-0">Sin sprint activo para estimar la carga de trabajo.</p>
                                                </div>
                                            ) : teamMembers.length === 0 ? (
                                                <div className="text-center py-4 text-muted">No hay integrantes asignados a este proyecto.</div>
                                            ) : (
                                                <div style={{ maxHeight: "350px", overflowY: "auto" }} className="pe-1">
                                                    {teamMembers.map((member: any) => (
                                                        <MemberCard key={member.usuario_id} member={member} />
                                                    ))}
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>

                                {/* Unassigned Tasks Column */}
                                <Col lg={6} className="mb-4">
                                    <Card className="border-0 shadow-sm h-100">
                                        <div className="card-header border-bottom p-3">
                                            <h6 className="card-title mb-0 fw-bold">
                                                <i className="ri-alert-line align-middle text-warning me-2 fs-15"></i>
                                                Tareas Técnicas Sin Asignar
                                            </h6>
                                        </div>
                                        <CardBody className="p-3">
                                            {!activeSprintInfo ? (
                                                <div className="text-center py-5 text-muted">
                                                    <i className="ri-inbox-line display-4 mb-2 d-inline-block"></i>
                                                    <p className="mb-0">Sin sprint activo para cargar tareas.</p>
                                                </div>
                                            ) : (
                                                <TableContainer
                                                    columns={columns}
                                                    data={unassignedTasks}
                                                    isGlobalFilter={true}
                                                    customPageSize={5}
                                                    SearchPlaceholder="Buscar tareas..."
                                                    tableClass="align-middle table-nowrap table-hover"
                                                    theadClass="table-light"
                                                    divClass="table-responsive"
                                                />
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Analytics;
