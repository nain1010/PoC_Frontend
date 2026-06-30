import React, { useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, FormFeedback, Button, Spinner, Alert, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { APIClient } from '../../helpers/api_helper';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from "react-select";
import TableContainer from '../../Components/Common/TableContainer';

const api = APIClient;

const getProjectPrefix = (name: string) => {
    if (!name) return "US";
    if (name.toLowerCase().includes("mcp")) {
        return "UMP";
    }
    const upper = name.replace(/[^A-Z]/g, "");
    if (upper.length >= 2 && upper.length <= 4) return upper;
    
    const words = name.split(/\s+/).filter(w => {
        const lower = w.toLowerCase();
        return w.length > 2 && !["del", "con", "por", "para"].includes(lower);
    });
    if (words.length >= 2) {
        return words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
    }
    return name.substring(0, 3).toUpperCase();
};

const Planning = () => {
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

    // Modals
    const [storyModal, setStoryModal] = useState<boolean>(false);
    const [sprintModal, setSprintModal] = useState<boolean>(false);
    const [memberModal, setMemberModal] = useState<boolean>(false);

    const { data: autocompleteUsers = [] } = useQuery({
        queryKey: ['usersAutocomplete'],
        queryFn: () => api.get("/users/autocomplete") as any,
        enabled: memberModal,
    });

    const memberOptions = useMemo(() => {
        return (autocompleteUsers || []).map((u: any) => ({
            value: u.email,
            label: `${u.nombre_completo} (${u.email})`
        }));
    }, [autocompleteUsers]);

    // Edit states
    const [editStory, setEditStory] = useState<any>(null);
    const [editSprint, setEditSprint] = useState<any>(null);

    const nextCorrelativo = useMemo(() => {
        if (editStory) return editStory.correlativo;
        if (!activeProjectName) return "";
        
        const prefix = getProjectPrefix(activeProjectName);
        const existing = projectDetails?.historias_usuario || [];
        const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
        let maxNum = 0;
        existing.forEach((h: any) => {
            const match = h.correlativo.match(regex);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        
        if (maxNum === 0) {
            existing.forEach((h: any) => {
                const match = h.correlativo.match(/(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
        }
        
        return `${prefix}-${maxNum + 1}`;
    }, [editStory, activeProjectName, projectDetails?.historias_usuario]);

    // Submitting indicators
    const [storySubmitting, setStorySubmitting] = useState<boolean>(false);
    const [sprintSubmitting, setSprintSubmitting] = useState<boolean>(false);
    const [memberSubmitting, setMemberSubmitting] = useState<boolean>(false);

    // Delete confirmation modals
    const [deleteStoryModal, setDeleteStoryModal] = useState<boolean>(false);
    const [storyToDelete, setStoryToDelete] = useState<any>(null);
    const [deleteSprintModal, setDeleteSprintModal] = useState<boolean>(false);
    const [sprintToDelete, setSprintToDelete] = useState<any>(null);
    const [deleteMemberModalState, setDeleteMemberModalState] = useState<boolean>(false);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);

    // View modes
    const [backlogViewMode, setBacklogViewMode] = useState<'grid' | 'table'>(
        (localStorage.getItem("backlogViewMode") as 'grid' | 'table') || 'grid'
    );
    const [sprintViewMode, setSprintViewMode] = useState<'grid' | 'table'>(
        (localStorage.getItem("sprintViewMode") as 'grid' | 'table') || 'grid'
    );

    const [backlogSearchQuery, setBacklogSearchQuery] = useState("");
    const [sprintSearchQuery, setSprintSearchQuery] = useState("");

    const handleBacklogViewModeChange = (mode: 'grid' | 'table') => {
        setBacklogViewMode(mode);
        localStorage.setItem("backlogViewMode", mode);
    };

    const handleSprintViewModeChange = (mode: 'grid' | 'table') => {
        setSprintViewMode(mode);
        localStorage.setItem("sprintViewMode", mode);
    };

    const toggleStoryModal = useCallback(() => {
        if (storyModal) {
            setEditStory(null);
        }
        setStoryModal(!storyModal);
        storyValidation.resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storyModal]);

    const toggleSprintModal = useCallback(() => {
        if (sprintModal) {
            setEditSprint(null);
        }
        setSprintModal(!sprintModal);
        sprintValidation.resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sprintModal]);

    const toggleMemberModal = useCallback(() => {
        setMemberModal(!memberModal);
        memberValidation.resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memberModal]);

    // Refs para optimistic updates
    const getProjectSnapshot = () => queryClient.getQueryData(['project', activeProjectId]) as any;
    const setProjectSnapshot = (data: any) => queryClient.setQueryData(['project', activeProjectId], data);
    const invalidateProject = () => queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] });

    const getLoggedUser = () => {
        const authUserStr = (sessionStorage.getItem("authUser") || localStorage.getItem("authUser"));
        if (authUserStr) {
            try {
                return JSON.parse(authUserStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const getLoggedUserId = () => {
        const user = getLoggedUser();
        return user ? (user.id || user.usuario_id || "") : "";
    };

    // Validation schemas
    const storyValidation = useFormik({
        enableReinitialize: true,
        initialValues: {
            correlativo: editStory?.correlativo || nextCorrelativo,
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
            const previous = getProjectSnapshot();
            const criteria = values.criterios_aceptacion_raw
                .split('\n')
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0);

            if (editStory) {
                const storyMutation = editStoryMutation;
                storyMutation.mutate({ id: editStory.id, titulo: values.titulo, narrativa: values.narrativa, criteria, previous }, {
                    onSettled: () => { toggleStoryModal(); setStorySubmitting(false); }
                });
            } else {
                const storyMutation = createStoryMutation;
                storyMutation.mutate({ correlativo: values.correlativo, titulo: values.titulo, narrativa: values.narrativa, criteria, previous }, {
                    onSettled: () => { toggleStoryModal(); setStorySubmitting(false); }
                });
            }
        }
    });

    const createStoryMutation = useMutation({
        mutationFn: (payload: any) => api.create(`/projects/${activeProjectId}/stories`, {
            correlativo: payload.correlativo, titulo: payload.titulo, narrativa: payload.narrativa, criterios_aceptacion: payload.criteria
        }),
        onMutate: async (payload: any) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            return { previous: payload.previous };
        },
        onSuccess: (res: any, payload: any) => {
            const current = getProjectSnapshot();
            if (current && res?.id) {
                setProjectSnapshot({
                    ...current,
                    historias_usuario: [...(current.historias_usuario || []), {
                        id: res.id, correlativo: payload.correlativo, titulo: payload.titulo,
                        narrativa: payload.narrativa, criterios_aceptacion: payload.criteria,
                        esfuerzo_estimado: 0, estado: res.estado || "Nueva", sprint_id: null
                    }]
                });
            }
        },
        onError: (err: any, _payload: any, context: any) => {
            if (context?.previous) setProjectSnapshot(context.previous);
            toast.error(err || "Error al guardar la historia de usuario.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const editStoryMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/projects/${activeProjectId}/stories/${payload.id}`, {
            titulo: payload.titulo, narrativa: payload.narrativa, criterios_aceptacion: payload.criteria
        }),
        onMutate: async (payload: any) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    historias_usuario: (current.historias_usuario || []).map((h: any) =>
                        h.id === payload.id ? { ...h, titulo: payload.titulo, narrativa: payload.narrativa, criterios_aceptacion: payload.criteria } : h
                    )
                });
            }
            return { previous: payload.previous };
        },
        onError: (err: any, _payload: any, context: any) => {
            if (context?.previous) setProjectSnapshot(context.previous);
            toast.error(err || "Error al guardar la historia de usuario.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
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
            const previous = getProjectSnapshot();

            if (editSprint) {
                editSprintMutation.mutate({ id: editSprint.id, ...values, previous }, {
                    onSettled: () => { toggleSprintModal(); setSprintSubmitting(false); }
                });
            } else {
                const nextNum = (projectDetails?.sprints?.length || 0) + 1;
                const fullNombre = `Sprint ${nextNum} - ${values.nombre}`;
                createSprintMutation.mutate({ ...values, nombre: fullNombre, previous }, {
                    onSettled: () => { toggleSprintModal(); setSprintSubmitting(false); }
                });
            }
        }
    });

    const createSprintMutation = useMutation({
        mutationFn: (payload: any) => api.create(`/projects/${activeProjectId}/sprints`, {
            nombre: payload.nombre, fecha_inicio: payload.fecha_inicio, fecha_fin: payload.fecha_fin, objetivo: payload.objetivo
        }),
        onMutate: async (payload: any) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            return { previous: payload.previous };
        },
        onSuccess: (res: any, payload: any) => {
            const current = getProjectSnapshot();
            if (current && res?.id) {
                setProjectSnapshot({
                    ...current,
                    sprints: [...(current.sprints || []), {
                        id: res.id, nombre: payload.nombre, fecha_inicio: payload.fecha_inicio,
                        fecha_fin: payload.fecha_fin, estado: res.estado || "Planificacion",
                        velocidad_comprometida: 0, velocidad_realizada: 0, objetivo: payload.objetivo || ""
                    }]
                });
            }
        },
        onError: (err: any, _payload: any, context: any) => {
            if (context?.previous) setProjectSnapshot(context.previous);
            toast.error(err || "Error al guardar el Sprint.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const editSprintMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/projects/${activeProjectId}/sprints/${payload.id}`, {
            nombre: payload.nombre, fecha_inicio: payload.fecha_inicio, fecha_fin: payload.fecha_fin, objetivo: payload.objetivo
        }),
        onMutate: async (payload: any) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    sprints: (current.sprints || []).map((s: any) =>
                        s.id === payload.id ? { ...s, nombre: payload.nombre, fecha_inicio: payload.fecha_inicio, fecha_fin: payload.fecha_fin, objetivo: payload.objetivo } : s
                    )
                });
            }
            return { previous: payload.previous };
        },
        onError: (err: any, _payload: any, context: any) => {
            if (context?.previous) setProjectSnapshot(context.previous);
            toast.error(err || "Error al guardar el Sprint.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
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
            addMemberMutation.mutate({ email: values.email.trim(), rol: values.rol }, {
                onSettled: () => { toggleMemberModal(); setMemberSubmitting(false); }
            });
        }
    });

    const addMemberMutation = useMutation({
        mutationFn: (payload: any) => api.create(`/projects/${activeProjectId}/members`, payload),
        onError: (err: any) => {
            toast.error(err || "Error al asignar el miembro.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const deleteMemberMutation = useMutation({
        mutationFn: (userId: string) => api.delete(`/projects/${activeProjectId}/members/${userId}`),
        onError: (err: any) => {
            toast.error(err || "Error al remover el miembro.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const toggleDeleteMemberModal = useCallback(() => {
        setDeleteMemberModalState(!deleteMemberModalState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deleteMemberModalState]);

    const confirmDeleteMember = useCallback(() => {
        if (!memberToDelete) return;
        toggleDeleteMemberModal();
        deleteMemberMutation.mutate(memberToDelete.usuario_id);
    }, [memberToDelete, toggleDeleteMemberModal, deleteMemberMutation]);

    const handleRemoveMember = useCallback((member: any) => {
        setMemberToDelete(member);
        toggleDeleteMemberModal();
    }, [toggleDeleteMemberModal]);

    const estimateMutation = useMutation({
        mutationFn: ({ storyId, puntos }: { storyId: string; puntos: number }) =>
            api.create(`/projects/${activeProjectId}/stories/${storyId}/estimate`, { puntos }),
        onMutate: async ({ storyId, puntos }) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    historias_usuario: (current.historias_usuario || []).map((h: any) =>
                        h.id === storyId ? { ...h, esfuerzo_estimado: puntos, estado: h.estado === "Nueva" ? "Refinada" : h.estado } : h
                    )
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al estimar la historia.", { position: "top-right" });
        },
    });

    const handleEstimateStory = useCallback((storyId: string, puntos: number) => {
        estimateMutation.mutate({ storyId, puntos });
    }, [estimateMutation]);

    const planStoryMutation = useMutation({
        mutationFn: ({ storyId, sprintId }: { storyId: string; sprintId: string }) =>
            api.create(`/projects/${activeProjectId}/stories/${storyId}/sprint`, { sprint_id: sprintId }),
        onMutate: async ({ storyId, sprintId }) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    historias_usuario: (current.historias_usuario || []).map((h: any) =>
                        h.id === storyId ? { ...h, sprint_id: sprintId, estado: "Comprometida" } : h
                    )
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al planificar la historia.", { position: "top-right" });
        },
    });

    const handlePlanStory = useCallback((storyId: string, sprintId: string) => {
        planStoryMutation.mutate({ storyId, sprintId });
    }, [planStoryMutation]);

    const activateSprintMutation = useMutation({
        mutationFn: (sprintId: string) =>
            api.create(`/projects/${activeProjectId}/sprints/${sprintId}/activate`, {}),
        onMutate: async (sprintId) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    sprints: (current.sprints || []).map((s: any) =>
                        s.id === sprintId ? { ...s, estado: "Activo" } : s
                    )
                });
            }
        },
        onSuccess: (res: any, sprintId) => {
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    sprints: (current.sprints || []).map((s: any) =>
                        s.id === sprintId ? { ...s, velocidad_comprometida: res?.velocidad_comprometida || 0 } : s
                    )
                });
            }
            toast.success("Sprint activado correctamente.", { position: "top-right" });
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al activar el Sprint.", { position: "top-right" });
        },
    });

    const handleActivateSprint = useCallback((sprintId: string) => {
        activateSprintMutation.mutate(sprintId);
    }, [activateSprintMutation]);

    const closeSprintMutation = useMutation({
        mutationFn: (sprintId: string) =>
            api.create(`/projects/${activeProjectId}/sprints/${sprintId}/close`, {}),
        onMutate: async (sprintId) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    sprints: (current.sprints || []).map((s: any) =>
                        s.id === sprintId ? { ...s, estado: "Cerrado" } : s
                    ),
                    historias_usuario: (current.historias_usuario || []).map((h: any) => {
                        if (h.sprint_id === sprintId && h.estado !== "Hecha") {
                            return { ...h, sprint_id: null, estado: h.esfuerzo_estimado > 0 ? "Refinada" : "Nueva" };
                        }
                        return h;
                    })
                });
            }
        },
        onSuccess: (res: any, sprintId) => {
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    sprints: (current.sprints || []).map((s: any) =>
                        s.id === sprintId ? { ...s, velocidad_realizada: res?.velocidad_realizada || 0 } : s
                    )
                });
            }
            toast.success("Sprint cerrado correctamente.", { position: "top-right" });
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al cerrar el Sprint.", { position: "top-right" });
        },
    });

    const handleCloseSprint = useCallback((sprintId: string) => {
        closeSprintMutation.mutate(sprintId);
    }, [closeSprintMutation]);

    const handleOpenCreateStory = useCallback(() => {
        setEditStory(null);
        setStoryModal(true);
    }, []);

    const handleOpenEditStory = useCallback((story: any) => {
        setEditStory(story);
        setStoryModal(true);
    }, []);

    const toggleDeleteStoryModal = useCallback(() => {
        setDeleteStoryModal(!deleteStoryModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deleteStoryModal]);

    const deleteStoryMutation = useMutation({
        mutationFn: (storyId: string) => api.delete(`/projects/${activeProjectId}/stories/${storyId}`),
        onMutate: async (storyId) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    historias_usuario: (current.historias_usuario || []).filter((h: any) => h.id !== storyId),
                    tareas: (current.tareas || []).filter((t: any) => t.historia_id !== storyId)
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al eliminar la historia de usuario.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const confirmDeleteStory = useCallback(() => {
        if (!storyToDelete) return;
        toggleDeleteStoryModal();
        deleteStoryMutation.mutate(storyToDelete.id);
    }, [storyToDelete, toggleDeleteStoryModal, deleteStoryMutation]);

    const handleDeleteStory = useCallback((storyId: string) => {
        const story = projectDetails?.historias_usuario?.find((h: any) => h.id === storyId);
        if (story) {
            setStoryToDelete(story);
            toggleDeleteStoryModal();
        }
    }, [projectDetails?.historias_usuario, toggleDeleteStoryModal]);

    const handleOpenCreateSprint = useCallback(() => {
        setEditSprint(null);
        setSprintModal(true);
    }, []);

    const handleOpenEditSprint = useCallback((sprint: any) => {
        setEditSprint(sprint);
        setSprintModal(true);
    }, []);

    const toggleDeleteSprintModal = useCallback(() => {
        setDeleteSprintModal(!deleteSprintModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deleteSprintModal]);

    const deleteSprintMutation = useMutation({
        mutationFn: (sprintId: string) => api.delete(`/projects/${activeProjectId}/sprints/${sprintId}`),
        onMutate: async (sprintId) => {
            await queryClient.cancelQueries({ queryKey: ['project', activeProjectId] });
            const current = getProjectSnapshot();
            if (current) {
                setProjectSnapshot({
                    ...current,
                    sprints: (current.sprints || []).filter((s: any) => s.id !== sprintId),
                    historias_usuario: (current.historias_usuario || []).map((h: any) =>
                        h.sprint_id === sprintId ? { ...h, sprint_id: null, estado: h.esfuerzo_estimado > 0 ? "Refinada" : "Nueva" } : h
                    )
                });
            }
        },
        onError: (err: any) => {
            invalidateProject();
            toast.error(err || "Error al eliminar el Sprint.", { position: "top-right" });
        },
        onSettled: () => invalidateProject(),
    });

    const confirmDeleteSprint = useCallback(() => {
        if (!sprintToDelete) return;
        toggleDeleteSprintModal();
        deleteSprintMutation.mutate(sprintToDelete.id);
    }, [sprintToDelete, toggleDeleteSprintModal, deleteSprintMutation]);

    const handleDeleteSprint = useCallback((sprintId: string) => {
        const sprint = projectDetails?.sprints?.find((s: any) => s.id === sprintId);
        if (sprint) {
            setSprintToDelete(sprint);
            toggleDeleteSprintModal();
        }
    }, [projectDetails?.sprints, toggleDeleteSprintModal]);

    const backlogStories = useMemo(
        () => projectDetails?.historias_usuario?.filter((s: any) => !s.sprint_id) || [],
        [projectDetails?.historias_usuario]
    );
    const planningSprints = useMemo(
        () => projectDetails?.sprints || [],
        [projectDetails?.sprints]
    );

    const filteredBacklogStories = useMemo(() => {
        if (!backlogSearchQuery) return backlogStories;
        const q = backlogSearchQuery.toLowerCase();
        return backlogStories.filter((s: any) => 
            s.correlativo?.toLowerCase().includes(q) || 
            s.titulo?.toLowerCase().includes(q) ||
            s.estado?.toLowerCase().includes(q)
        );
    }, [backlogStories, backlogSearchQuery]);

    const filteredSprints = useMemo(() => {
        if (!sprintSearchQuery) return planningSprints;
        const q = sprintSearchQuery.toLowerCase();
        return planningSprints.filter((s: any) => 
            s.nombre?.toLowerCase().includes(q) ||
            s.estado?.toLowerCase().includes(q)
        );
    }, [planningSprints, sprintSearchQuery]);

    const backlogColumns = useMemo(() => [
        {
            header: 'Código',
            accessorKey: 'correlativo',
            enableColumnFilter: false,
            cell: (cell: any) => <span className="badge bg-soft-info text-info fs-11">{cell.getValue()}</span>
        },
        {
            header: 'Historia',
            accessorKey: 'titulo',
            enableColumnFilter: false,
            cell: (cell: any) => <div className="fw-semibold text-body text-truncate" style={{maxWidth: '150px'}}>{cell.getValue()}</div>
        },
        {
            header: 'Pts',
            accessorKey: 'esfuerzo_estimado',
            enableColumnFilter: false,
            cell: (cell: any) => <span className="fw-bold">{cell.getValue() || '-'}</span>
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            enableColumnFilter: false,
            cell: (cell: any) => <span className="badge bg-light text-muted border">{cell.getValue()}</span>
        },
        {
            header: 'Acciones',
            accessorKey: 'acciones',
            enableColumnFilter: false,
            cell: (cell: any) => {
                const story = cell.row.original;
                return (
                    <div className="d-flex gap-1">
                        <Button color="light" size="sm" onClick={() => handleOpenEditStory(story)} title="Editar"><i className="ri-pencil-line"></i></Button>
                        <Button color="danger" outline size="sm" onClick={() => handleDeleteStory(story.id)} title="Eliminar"><i className="ri-delete-bin-line"></i></Button>
                    </div>
                );
            }
        }
    ], [handleOpenEditStory, handleDeleteStory]);

    const sprintColumns = useMemo(() => [
        {
            header: 'Sprint',
            accessorKey: 'nombre',
            enableColumnFilter: false,
            cell: (cell: any) => <div className="fw-semibold text-body text-truncate" style={{maxWidth: '200px'}}>{cell.getValue()}</div>
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            enableColumnFilter: false,
            cell: (cell: any) => {
                const estado = cell.getValue();
                const color = estado === 'Planificacion' ? 'warning' : estado === 'Activo' ? 'success' : 'secondary';
                return <span className={`badge bg-${color}`}>{estado}</span>;
            }
        },
        {
            header: 'Progreso',
            accessorKey: 'velocidad_realizada',
            enableColumnFilter: false,
            cell: (cell: any) => {
                const sprint = cell.row.original;
                const sprintStories = projectDetails?.historias_usuario?.filter((s:any) => s.sprint_id === sprint.id) || [];
                const totalPoints = sprintStories.reduce((acc: number, item: any) => acc + (item.esfuerzo_estimado || 0), 0);
                return <span className="fw-medium">{sprint.velocidad_realizada || 0} / {totalPoints} pts</span>;
            }
        },
        {
            header: 'Acciones',
            accessorKey: 'acciones',
            enableColumnFilter: false,
            cell: (cell: any) => {
                const sprint = cell.row.original;
                return (
                    <div className="d-flex gap-1">
                        <Button color="light" size="sm" onClick={() => handleOpenEditSprint(sprint)} title="Editar"><i className="ri-pencil-line"></i></Button>
                        <Button color="danger" outline size="sm" onClick={() => handleDeleteSprint(sprint.id)} title="Eliminar"><i className="ri-delete-bin-line"></i></Button>
                    </div>
                );
            }
        }
    ], [handleOpenEditSprint, handleDeleteSprint, projectDetails]);

    document.title = `Planificación | Luma - ${activeProjectName || 'Scrum'}`;

    if (!activeProjectId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Planificación" />
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

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={`Planificación - ${activeProjectName}`} />

                    {isLoading ? (
                        <div className="text-center my-5">
                            <Spinner color="primary" />
                            <p className="text-muted mt-2">Cargando tablero de planificación...</p>
                        </div>
                    ) : error ? (
                        <Alert color="danger" className="text-center">{error?.message || String(error)}</Alert>
                    ) : (
                        <Row>
                            {/* Columna Izquierda: Backlog (Ancho: 5) */}
                            <Col lg={5} className="mb-4">
                                <Card className="shadow-sm border-0 h-100">
                                    <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center p-3">
                                        <h6 className="card-title mb-0 fw-bold text-muted">
                                            Product Backlog ({backlogStories.length})
                                        </h6>
                                        <div className="d-flex gap-2 align-items-center">
                                            <div className="search-box me-1 d-none d-xl-block" style={{width: '150px'}}>
                                                <input type="text" className="form-control form-control-sm" placeholder="Buscar..." value={backlogSearchQuery} onChange={(e) => setBacklogSearchQuery(e.target.value)} />
                                                <i className="ri-search-line search-icon mt-n1"></i>
                                            </div>
                                            <div className="btn-group" role="group">
                                                <Button color={backlogViewMode === 'grid' ? "primary" : "light"} size="sm" onClick={() => handleBacklogViewModeChange('grid')}><i className="ri-grid-fill"></i></Button>
                                                <Button color={backlogViewMode === 'table' ? "primary" : "light"} size="sm" onClick={() => handleBacklogViewModeChange('table')}><i className="ri-list-unordered"></i></Button>
                                            </div>
                                            <Button color="success" size="sm" className="btn-sm" onClick={handleOpenCreateStory}>
                                                <i className="ri-add-line align-middle me-1"></i> Crear
                                            </Button>
                                        </div>
                                    </div>
                                    <CardBody className="p-3" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                                        {filteredBacklogStories.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                <i className="ri-inbox-line display-4 mb-2 d-inline-block"></i>
                                                <p className="mb-0">El backlog está vacío.</p>
                                                <small>Crea historias de usuario para comenzar.</small>
                                            </div>
                                        ) : backlogViewMode === 'table' ? (
                                            <TableContainer
                                                columns={backlogColumns}
                                                data={filteredBacklogStories || []}
                                                isGlobalFilter={false}
                                                customPageSize={10}
                                                divClass="table-responsive table-card mb-0"
                                                tableClass="align-middle table-nowrap mb-0"
                                                theadClass="table-light text-muted"
                                            />
                                        ) : (
                                            filteredBacklogStories.map((story: any) => (
                                                <BacklogStoryCard
                                                    key={story.id}
                                                    story={story}
                                                    planningSprints={planningSprints}
                                                    onEstimate={handleEstimateStory}
                                                    onPlan={handlePlanStory}
                                                    onEdit={handleOpenEditStory}
                                                    onDelete={handleDeleteStory}
                                                />
                                            ))
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>

                            {/* Columna Derecha: Sprints (Ancho: 7) */}
                            <Col lg={7} className="mb-4">
                                <Card className="shadow-sm border-0 h-100">
                                    <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center p-3">
                                        <h6 className="card-title mb-0 fw-bold text-muted">Planificación de Sprints</h6>
                                        <div className="d-flex gap-2 align-items-center">
                                            <div className="search-box me-1 d-none d-md-block" style={{width: '150px'}}>
                                                <input type="text" className="form-control form-control-sm" placeholder="Buscar sprint..." value={sprintSearchQuery} onChange={(e) => setSprintSearchQuery(e.target.value)} />
                                                <i className="ri-search-line search-icon mt-n1"></i>
                                            </div>
                                            <div className="btn-group" role="group">
                                                <Button color={sprintViewMode === 'grid' ? "primary" : "light"} size="sm" onClick={() => handleSprintViewModeChange('grid')}><i className="ri-grid-fill"></i></Button>
                                                <Button color={sprintViewMode === 'table' ? "primary" : "light"} size="sm" onClick={() => handleSprintViewModeChange('table')}><i className="ri-list-unordered"></i></Button>
                                            </div>
                                            <Button color="soft-primary" size="sm" className="btn-sm" onClick={toggleMemberModal}>
                                                <i className="ri-group-line align-middle me-1"></i> Miembros
                                            </Button>
                                            <Button color="success" size="sm" className="btn-sm" onClick={handleOpenCreateSprint}>
                                                <i className="ri-add-line align-middle me-1"></i> Crear Sprint
                                            </Button>
                                        </div>
                                    </div>
                                    <CardBody className="p-3" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                                        {filteredSprints.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                <i className="ri-compass-line display-4 mb-2 d-inline-block"></i>
                                                <p className="mb-0">No hay Sprints planificados.</p>
                                                <small>Crea un Sprint para asignar historias de usuario.</small>
                                            </div>
                                        ) : sprintViewMode === 'table' ? (
                                            <TableContainer
                                                columns={sprintColumns}
                                                data={filteredSprints || []}
                                                isGlobalFilter={false}
                                                customPageSize={5}
                                                divClass="table-responsive table-card mb-0"
                                                tableClass="align-middle table-nowrap mb-0"
                                                theadClass="table-light text-muted"
                                            />
                                        ) : (
                                            filteredSprints.map((sprint: any) => {
                                                const sprintStories = projectDetails?.historias_usuario?.filter((s: any) => s.sprint_id === sprint.id) || [];
                                                const totalPoints = sprintStories.reduce((acc: number, item: any) => acc + (item.esfuerzo_estimado || 0), 0);

                                                return (
                                                    <SprintCard
                                                        key={sprint.id}
                                                        sprint={sprint}
                                                        sprintStories={sprintStories}
                                                        totalPoints={totalPoints}
                                                        planningSprints={planningSprints}
                                                        onEstimate={handleEstimateStory}
                                                        onPlan={handlePlanStory}
                                                        onActivate={handleActivateSprint}
                                                        onClose={handleCloseSprint}
                                                        onEditSprint={handleOpenEditSprint}
                                                        onDeleteSprint={handleDeleteSprint}
                                                        onEditStory={handleOpenEditStory}
                                                        onDeleteStory={handleDeleteStory}
                                                    />
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
                            {editSprint ? (
                                <Input
                                    id="sprintName"
                                    name="nombre"
                                    className="form-control"
                                    placeholder="Ej. Sprint 1 - Nombre"
                                    type="text"
                                    onChange={sprintValidation.handleChange}
                                    onBlur={sprintValidation.handleBlur}
                                    value={sprintValidation.values.nombre}
                                    invalid={sprintValidation.touched.nombre && sprintValidation.errors.nombre ? true : false}
                                />
                            ) : (
                                <div className="input-group">
                                    <span className="input-group-text bg-light text-muted">
                                        {`Sprint ${(projectDetails?.sprints?.length || 0) + 1} -`}
                                    </span>
                                    <Input
                                        id="sprintName"
                                        name="nombre"
                                        className="form-control"
                                        placeholder="Planificación, Desarrollo, etc."
                                        type="text"
                                        onChange={sprintValidation.handleChange}
                                        onBlur={sprintValidation.handleBlur}
                                        value={sprintValidation.values.nombre}
                                        invalid={sprintValidation.touched.nombre && sprintValidation.errors.nombre ? true : false}
                                    />
                                </div>
                            )}
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
                        <h6 className="fw-bold text-body mb-3">Asignar Miembro o Cambiar Rol</h6>
                        <Form onSubmit={(e) => {
                            e.preventDefault();
                            memberValidation.handleSubmit();
                            return false;
                        }}>
                            <div className="mb-3">
                                <Label htmlFor="memberEmail" className="form-label">Miembro del Equipo <span className="text-danger">*</span></Label>
                                <Select
                                    id="memberEmail"
                                    name="email"
                                    placeholder="Buscar por nombre o correo..."
                                    options={memberOptions}
                                    onChange={(option: any) => {
                                        memberValidation.setFieldValue("email", option ? option.value : "");
                                    }}
                                    onBlur={() => memberValidation.setFieldTouched("email", true)}
                                    value={memberOptions.find((opt: any) => opt.value === memberValidation.values.email) || null}
                                    isClearable
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                        control: (provided: any) => ({
                                            ...provided,
                                            borderColor: memberValidation.touched.email && memberValidation.errors.email ? "#f06548" : provided.borderColor,
                                            "&:hover": {
                                                borderColor: memberValidation.touched.email && memberValidation.errors.email ? "#f06548" : provided.borderColor,
                                            }
                                        })
                                    }}
                                    classNamePrefix="react-select"
                                />
                                {memberValidation.touched.email && memberValidation.errors.email ? (
                                    <div className="text-danger fs-12 mt-1">{memberValidation.errors.email?.toString()}</div>
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
                        <h6 className="fw-bold text-body mb-3">Integrantes del Proyecto ({projectDetails?.memberships?.length || 0})</h6>
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                            {projectDetails?.memberships?.map((member: any, idx: number) => (
                                <div className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light" key={idx}>
                                    <div>
                                        <div className="fw-semibold text-body fs-13">{member.nombre_completo}</div>
                                        <small className="text-muted">{member.usuario_id === getLoggedUserId() ? 'Tú' : 'Miembro'}</small>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-soft-primary text-primary fs-12">{member.rol}</span>
                                        {(getLoggedUser()?.rol_global === "Administrador" || projectDetails?.memberships?.some((m: any) => m.usuario_id === getLoggedUserId() && m.rol === "Product Owner")) && (
                                            <Button color="danger" size="sm" className="btn-icon rounded-circle" onClick={() => handleRemoveMember(member)} title="Eliminar miembro">
                                                <i className="ri-delete-bin-line"></i>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            {/* Modal de Confirmación de Eliminación de Historia */}
            <Modal isOpen={deleteStoryModal} toggle={toggleDeleteStoryModal} centered>
                <ModalHeader toggle={toggleDeleteStoryModal} className="bg-light p-3">
                    Confirmar Eliminación de Historia
                </ModalHeader>
                <ModalBody className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <i className="ri-delete-bin-5-line display-4"></i>
                    </div>
                    <h5>¿Estás seguro de que deseas eliminar la historia "{storyToDelete?.titulo}"?</h5>
                    <p className="text-muted mb-0">Esta acción también eliminará todas sus tareas técnicas asociadas de forma definitiva.</p>
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={toggleDeleteStoryModal}>Cancelar</Button>
                    <Button color="danger" onClick={confirmDeleteStory}>Eliminar</Button>
                </ModalFooter>
            </Modal>

            {/* Modal de Confirmación de Eliminación de Miembro */}
            <Modal isOpen={deleteMemberModalState} toggle={toggleDeleteMemberModal} centered>
                <ModalHeader toggle={toggleDeleteMemberModal} className="bg-light p-3">
                    Confirmar Eliminación de Miembro
                </ModalHeader>
                <ModalBody className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <i className="ri-delete-bin-5-line display-4"></i>
                    </div>
                    <h5>¿Estás seguro de que deseas eliminar a {memberToDelete?.nombre_completo}?</h5>
                    <p className="text-muted mb-0">Este usuario perderá acceso al proyecto inmediatamente.</p>
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={toggleDeleteMemberModal}>Cancelar</Button>
                    <Button color="danger" onClick={confirmDeleteMember}>Eliminar</Button>
                </ModalFooter>
            </Modal>

            {/* Modal de Confirmación de Eliminación de Sprint */}
            <Modal isOpen={deleteSprintModal} toggle={toggleDeleteSprintModal} centered>
                <ModalHeader toggle={toggleDeleteSprintModal} className="bg-light p-3">
                    Confirmar Eliminación de Sprint
                </ModalHeader>
                <ModalBody className="p-4 text-center">
                    <div className="text-danger mb-3">
                        <i className="ri-delete-bin-5-line display-4"></i>
                    </div>
                    <h5>¿Estás seguro de que deseas eliminar el sprint "{sprintToDelete?.nombre}"?</h5>
                    <p className="text-muted mb-0">Las historias asociadas volverán automáticamente al backlog del proyecto.</p>
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={toggleDeleteSprintModal}>Cancelar</Button>
                    <Button color="danger" onClick={confirmDeleteSprint}>Eliminar</Button>
                </ModalFooter>
            </Modal>

            <ToastContainer />
        </React.Fragment>
    );
};

// Backlog story card
const BacklogStoryCard = React.memo(({ story, planningSprints, onEstimate, onPlan, onEdit, onDelete }: {
    story: any; planningSprints: any[];
    onEstimate: (storyId: string, puntos: number) => void;
    onPlan: (storyId: string, sprintId: string) => void;
    onEdit: (story: any) => void;
    onDelete: (storyId: string) => void;
}) => {
    const handleEstimate = useCallback((puntos: number) => onEstimate(story.id, puntos), [story.id, onEstimate]);
    const handlePlan = useCallback((sprintId: string) => onPlan(story.id, sprintId), [story.id, onPlan]);
    const handleEdit = useCallback(() => onEdit(story), [story, onEdit]);
    const handleDelete = useCallback(() => onDelete(story.id), [story.id, onDelete]);

    return (
        <Card className="border mb-3 shadow-none card-animate">
            <CardBody className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-soft-info text-info fs-11">{story.correlativo}</span>
                    <div className="d-flex gap-1 align-items-center">
                        <DropdownEstimate onSelect={handleEstimate} currentPoints={story.esfuerzo_estimado} />
                        <DropdownPlan sprints={planningSprints} onSelect={handlePlan} />
                        <StoryActionsDropdown onEdit={handleEdit} onDelete={handleDelete} />
                    </div>
                </div>
                <h6 className="fw-bold text-body mb-2">{story.titulo}</h6>
                <p className="text-muted fs-13 mb-0 text-truncate-three-lines">{story.narrativa}</p>
                {story.criterios_aceptacion?.length > 0 && (
                    <div className="mt-2 pt-2 border-top">
                        <small className="fw-semibold text-body d-block mb-1">Criterios de Aceptación:</small>
                        <ul className="ps-3 mb-0 text-muted fs-12">
                            {story.criterios_aceptacion.map((crit: string, idx: number) => (
                                <li key={idx}>{crit}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardBody>
        </Card>
    );
});

// Sprint card in planning column
const SprintCard = React.memo(({ sprint, sprintStories, totalPoints, planningSprints, onEstimate, onPlan, onActivate, onClose, onEditSprint, onDeleteSprint, onEditStory, onDeleteStory }: {
    sprint: any; sprintStories: any[]; totalPoints: number; planningSprints: any[];
    onEstimate: (storyId: string, puntos: number) => void;
    onPlan: (storyId: string, sprintId: string) => void;
    onActivate: (sprintId: string) => void;
    onClose: (sprintId: string) => void;
    onEditSprint: (sprint: any) => void;
    onDeleteSprint: (sprintId: string) => void;
    onEditStory: (story: any) => void;
    onDeleteStory: (storyId: string) => void;
}) => {
    const handleActivate = useCallback(() => onActivate(sprint.id), [sprint.id, onActivate]);
    const handleClose = useCallback(() => onClose(sprint.id), [sprint.id, onClose]);
    const handleEditSprintFn = useCallback(() => onEditSprint(sprint), [sprint, onEditSprint]);
    const handleDeleteSprintFn = useCallback(() => onDeleteSprint(sprint.id), [sprint.id, onDeleteSprint]);

    const [isCollapsed, setIsCollapsed] = useState<boolean>(sprint.estado === 'Cerrado');
    const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);

    return (
        <Card className="border mb-4 shadow-none">
            <CardBody className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h6 className="fw-bold text-muted mb-1 d-flex align-items-center gap-2">
                            <button 
                                type="button" 
                                className="btn btn-link p-0 text-muted fs-16 d-flex align-items-center" 
                                onClick={toggleCollapse}
                                style={{ textDecoration: "none" }}
                            >
                                <i className={isCollapsed ? "ri-arrow-right-s-line" : "ri-arrow-down-s-line"}></i>
                            </button>
                            <span onClick={toggleCollapse} style={{ cursor: "pointer" }}>{sprint.nombre}</span>
                            {isCollapsed && (
                                <span className="fs-12 fw-normal text-muted ms-2 italic">
                                    ({sprintStories.length} {sprintStories.length === 1 ? 'historia' : 'historias'}, {totalPoints} pts)
                                </span>
                            )}
                            <span className="d-flex gap-2 ms-1 align-items-center">
                                <button className="btn btn-link p-0 text-muted fs-14" onClick={handleEditSprintFn} title="Editar Sprint">
                                    <i className="ri-pencil-line"></i>
                                </button>
                                {sprint.estado !== 'Activo' && (
                                    <button className="btn btn-link p-0 text-danger fs-14" onClick={handleDeleteSprintFn} title="Eliminar Sprint">
                                        <i className="ri-delete-bin-line"></i>
                                    </button>
                                )}
                            </span>
                        </h6>
                        <small className="text-muted">{sprint.fecha_inicio} al {sprint.fecha_fin}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${
                            sprint.estado === 'Planificacion' ? 'bg-soft-warning text-warning' :
                            sprint.estado === 'Activo' ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'
                        } fs-12`}>{sprint.estado}</span>
                        {sprint.estado === 'Planificacion' && (
                            <Button color="success" size="sm" className="btn-sm px-3" onClick={handleActivate}>Activar</Button>
                        )}
                        {sprint.estado === 'Activo' && (
                            <Button color="danger" size="sm" className="btn-sm px-3" onClick={handleClose}>Cerrar</Button>
                        )}
                    </div>
                </div>
                {!isCollapsed && (
                    <>
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
                                    <SprintStoryRow
                                        key={story.id}
                                        story={story}
                                        sprintId={sprint.id}
                                        planningSprints={planningSprints}
                                        onEstimate={onEstimate}
                                        onPlan={onPlan}
                                        onEdit={onEditStory}
                                        onDelete={onDeleteStory}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
});

// Sprint story row
const SprintStoryRow = React.memo(({ story, sprintId, planningSprints, onEstimate, onPlan, onEdit, onDelete }: {
    story: any; sprintId: string; planningSprints: any[];
    onEstimate: (storyId: string, puntos: number) => void;
    onPlan: (storyId: string, sprintId: string) => void;
    onEdit: (story: any) => void;
    onDelete: (storyId: string) => void;
}) => {
    const handleEstimate = useCallback((puntos: number) => onEstimate(story.id, puntos), [story.id, onEstimate]);
    const handlePlan = useCallback((targetSprintId: string) => onPlan(story.id, targetSprintId), [story.id, onPlan]);
    const handleEdit = useCallback(() => onEdit(story), [story, onEdit]);
    const handleDelete = useCallback(() => onDelete(story.id), [story.id, onDelete]);

    return (
        <div className="d-flex justify-content-between align-items-center p-2 border rounded mb-2 bg-light">
            <div>
                <span className="badge bg-soft-muted text-muted me-2">{story.correlativo}</span>
                <span className="text-muted fw-medium fs-13">{story.titulo}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
                <DropdownEstimate onSelect={handleEstimate} currentPoints={story.esfuerzo_estimado} />
                <DropdownPlan sprints={planningSprints} currentSprintId={sprintId} onSelect={handlePlan} />
                <StoryActionsDropdown onEdit={handleEdit} onDelete={handleDelete} />
            </div>
        </div>
    );
});

// Sub-component estimates dropdown
const DropdownEstimate = React.memo(({ onSelect, currentPoints }: { onSelect: (pts: number) => void, currentPoints?: number }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = useCallback(() => setDropdownOpen((prevState) => !prevState), []);

    const fibs = useMemo(() => [1, 2, 3, 5, 8, 13, 21], []);

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm" strategy="fixed">
            <DropdownToggle tag="button" className="btn btn-sm btn-outline-secondary py-0 px-2 fs-12">
                <span>{currentPoints !== undefined && currentPoints !== null ? `${currentPoints} pts` : "Estimar"}</span>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-sm" container="body">
                <DropdownItem header><span>Puntos de Esfuerzo</span></DropdownItem>
                {fibs.map((fib) => (
                    <DropdownItem key={fib} onClick={() => onSelect(fib)}>
                        <span>{fib} {fib === 1 ? 'punto' : 'puntos'}</span>
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
});

// Sub-component plan dropdown
const DropdownPlan = React.memo(({ sprints, onSelect, currentSprintId }: { sprints: any[], onSelect: (sprintId: string) => void, currentSprintId?: string }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = useCallback(() => setDropdownOpen((prevState) => !prevState), []);

    const activeSprints = useMemo(() => sprints.filter(s => s.estado !== 'Cerrado'), [sprints]);

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm" strategy="fixed">
            <DropdownToggle tag="button" className="btn btn-sm btn-outline-primary py-0 px-2 fs-12">
                <i className="ri-calendar-event-line"></i>
            </DropdownToggle>
            <DropdownMenu container="body">
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
});

// Sub-component story actions dropdown (three vertical dots menu)
const StoryActionsDropdown = React.memo(({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = useCallback(() => setDropdownOpen((prevState) => !prevState), []);

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm" className="d-inline-block" strategy="fixed">
            <DropdownToggle tag="button" className="btn btn-sm btn-link p-0 text-muted fs-14 lh-1">
                <i className="ri-more-2-fill fs-16"></i>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end" container="body">
                <DropdownItem onClick={onEdit}>
                    <i className="ri-pencil-line align-middle me-2 text-muted"></i> <span>Editar</span>
                </DropdownItem>
                <DropdownItem onClick={onDelete} className="text-danger">
                    <i className="ri-delete-bin-line align-middle me-2"></i> <span>Eliminar</span>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
});

export default Planning;
