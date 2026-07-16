import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { APIClient as api } from '../../helpers/api_helper';
import { useProjectStore } from '../Hooks/useProjectStore';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const activeProjectId = useProjectStore((state) => state.activeProjectId);

    // Get active project data from cache if available
    const activeProject = activeProjectId ? (queryClient.getQueryData(['project', activeProjectId]) as any) : null;
    const stories = activeProject?.historias_usuario || [];
    const sprints = activeProject?.sprints || [];
    const tasks = stories.flatMap((s: any) => (s.tareas || []).map((t: any) => ({ ...t, historia_id: s.id, correlativo_historia: s.correlativo })));

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Global listeners for a custom event so other components (like Header) can open it
    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener('open-cmdk', handleOpen);
        return () => window.removeEventListener('open-cmdk', handleOpen);
    }, []);

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get("/projects"),
        select: (data: any) => data || [],
        enabled: open && !activeProjectId // Only fetch if NO active project
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get("/idp/users"),
        select: (data: any) => data || [],
        enabled: open && !activeProjectId // Only fetch if NO active project
    });

    const { data: pages = [] } = useQuery({
        queryKey: ['pages', activeProjectId],
        queryFn: () => api.get(`/projects/${activeProjectId}/pages`),
        select: (data: any) => data || [],
        enabled: open && !!activeProjectId,
        staleTime: 60000
    });

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    const navigateAndDispatch = (path: string, eventName?: string, detail?: any) => {
        runCommand(() => {
            navigate(path);
            if (eventName) {
                setTimeout(() => window.dispatchEvent(new CustomEvent(eventName, { detail })), 300);
            }
        });
    };

    const isSprintActive = (sprintId: string) => {
        const sprint = sprints.find((s: any) => s.id === sprintId);
        return sprint?.estado === 'activo';
    };

    if (!open) return null;

    return (
        <div className="luma-cmdk-dialog" onClick={() => setOpen(false)}>
            <div onClick={(e) => e.stopPropagation()}>
                <Command>
                    <Command.Input placeholder="Busca proyectos, historias, tareas o comandos..." autoFocus />
                    
                    <Command.List>
                        <Command.Empty>No se encontraron resultados.</Command.Empty>

                        {activeProjectId && (
                            <Command.Group heading="Navegación del Proyecto Actual">
                                <Command.Item onSelect={() => runCommand(() => navigate('/planning'))}>
                                    <i className="ri-layout-3-line text-primary"></i> Planning (Backlog)
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate('/kanban'))}>
                                    <i className="ri-kanban-view text-success"></i> Sprint Activo (Tablero)
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate('/analytics'))}>
                                    <i className="ri-pie-chart-line text-info"></i> Analíticas
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate('/pages'))}>
                                    <i className="ri-pages-line text-warning"></i> Documentos
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate('/activity'))}>
                                    <i className="ri-history-line text-secondary"></i> Historial de Actividad
                                </Command.Item>
                            </Command.Group>
                        )}
                        
                        {sprints.length > 0 && (
                            <Command.Group heading="Sprints (Proyecto Actual)">
                                {sprints.map((sprint: any) => (
                                    <Command.Item 
                                        key={`sprint-${sprint.id}`}
                                        value={`sprint ${sprint.nombre}`}
                                        onSelect={() => {
                                            const path = sprint.estado === 'activo' ? `/kanban?highlight=sprint-${sprint.id}` : `/planning?highlight=sprint-${sprint.id}`;
                                            navigateAndDispatch(path, 'open-sprint-modal', sprint.id);
                                        }}
                                    >
                                        <i className="ri-run-line text-primary"></i> {sprint.nombre}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {pages.length > 0 && (
                            <Command.Group heading="Documentos (Pages)">
                                {pages.map((page: any) => (
                                    <Command.Item 
                                        key={`page-${page.id}`}
                                        value={`page pagina documento ${page.titulo}`}
                                        onSelect={() => navigateAndDispatch(`/pages?pageId=${page.id}`)}
                                    >
                                        <i className="ri-file-text-line text-warning"></i> {page.icono && page.icono !== "📝" && page.icono !== "📄" ? page.icono + " " : ""}{page.titulo}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        
                        {stories.length > 0 && (
                            <Command.Group heading="Historias de Usuario (Proyecto Actual)">
                                {stories.map((story: any) => (
                                    <Command.Item 
                                        key={`story-${story.id}`}
                                        value={`historia story hu ${story.correlativo} ${story.titulo}`}
                                        onSelect={() => {
                                            const path = isSprintActive(story.sprint_id) ? `/kanban?highlight=story-${story.id}` : `/planning?highlight=story-${story.id}`;
                                            navigateAndDispatch(path, 'open-story-modal', story.id);
                                        }}
                                    >
                                        <i className="ri-bookmark-line text-secondary"></i> {story.correlativo} - {story.titulo}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {tasks.length > 0 && (
                            <Command.Group heading="Tareas Técnicas (Proyecto Actual)">
                                {tasks.map((task: any) => (
                                    <Command.Item 
                                        key={`task-${task.id}`}
                                        value={`tarea task tecnica ${task.correlativo_historia} ${task.titulo}`}
                                        onSelect={() => {
                                            const story = stories.find((s: any) => s.id === task.historia_id);
                                            const path = story && isSprintActive(story.sprint_id) ? `/kanban?highlight=task-${task.id}` : `/planning?highlight=task-${task.id}`;
                                            navigateAndDispatch(path, 'open-task-modal', { taskId: task.id, storyId: task.historia_id });
                                        }}
                                    >
                                        <i className="ri-checkbox-circle-line text-success"></i> [{task.correlativo_historia}] {task.titulo}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        
                        {projects.length > 0 && (
                            <Command.Group heading="Otros Proyectos">
                                {projects.map((project: any) => (
                                    <Command.Item 
                                        key={`proj-${project.id}`} 
                                        onSelect={() => runCommand(() => {
                                            useProjectStore.getState().setActiveProjectId(project.id);
                                            localStorage.setItem("activeProjectName", project.nombre);
                                            window.dispatchEvent(new Event("activeProjectUpdated"));
                                            navigate(`/planning?highlight=project-${project.id}`);
                                        })}
                                    >
                                        <i className="ri-folder-2-line"></i> {project.nombre}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        
                        {users.length > 0 && (
                            <Command.Group heading="Usuarios del Sistema">
                                {users.map((user: any) => (
                                    <Command.Item 
                                        key={`user-${user.id}`}
                                        onSelect={() => runCommand(() => navigate(`/users`))}
                                    >
                                        <i className="ri-user-line"></i> {user.nombre_completo || user.email}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        <Command.Group heading="Navegación General">
                            <Command.Item onSelect={() => runCommand(() => navigate('/projects'))}>
                                <i className="ri-apps-2-line"></i> Ver todos los Proyectos
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => navigate('/users'))}>
                                <i className="ri-team-line"></i> Gestionar Usuarios
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => navigate('/profile'))}>
                                <i className="ri-account-circle-line"></i> Mi Perfil
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
};

export default CommandPalette;
