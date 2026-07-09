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
    const stories = activeProject?.historias || [];
    const sprints = activeProject?.sprints || [];
    const tasks = stories.flatMap((s: any) => s.tareas || []);

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
        enabled: open // Only fetch when palette is open
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get("/idp/users"),
        select: (data: any) => data || [],
        enabled: open
    });

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
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
                                <Command.Item onSelect={() => runCommand(() => navigate(`/planning/${activeProjectId}`))}>
                                    <i className="ri-layout-3-line text-primary"></i> Planning (Backlog)
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate(`/kanban/${activeProjectId}`))}>
                                    <i className="ri-kanban-view text-success"></i> Sprint Activo (Tablero)
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate(`/analytics/${activeProjectId}`))}>
                                    <i className="ri-pie-chart-line text-info"></i> Analíticas
                                </Command.Item>
                                <Command.Item onSelect={() => runCommand(() => navigate(`/pages/${activeProjectId}`))}>
                                    <i className="ri-pages-line text-warning"></i> Documentos
                                </Command.Item>
                            </Command.Group>
                        )}
                        
                        {stories.length > 0 && (
                            <Command.Group heading="Historias de Usuario (Proyecto Actual)">
                                {stories.map((story: any) => (
                                    <Command.Item 
                                        key={`story-${story.id}`}
                                        onSelect={() => runCommand(() => navigate(`/planning/${activeProjectId}`))}
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
                                        onSelect={() => runCommand(() => navigate(`/kanban/${activeProjectId}`))}
                                    >
                                        <i className="ri-checkbox-circle-line text-success"></i> {task.titulo}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {sprints.length > 0 && (
                            <Command.Group heading="Sprints (Proyecto Actual)">
                                {sprints.map((sprint: any) => (
                                    <Command.Item 
                                        key={`sprint-${sprint.id}`}
                                        onSelect={() => runCommand(() => navigate(`/planning/${activeProjectId}`))}
                                    >
                                        <i className="ri-run-line text-primary"></i> {sprint.nombre}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        
                        {projects.length > 0 && (
                            <Command.Group heading="Otros Proyectos">
                                {projects.map((project: any) => (
                                    <Command.Item 
                                        key={`proj-${project.id}`} 
                                        onSelect={() => runCommand(() => navigate(`/planning/${project.id}`))}
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
