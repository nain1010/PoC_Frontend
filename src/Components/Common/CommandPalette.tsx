import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { APIClient as api } from '../../helpers/api_helper';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

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
                    <Command.Input placeholder="Busca proyectos, usuarios o comandos..." autoFocus />
                    
                    <Command.List>
                        <Command.Empty>No se encontraron resultados.</Command.Empty>
                        
                        {projects.length > 0 && (
                            <Command.Group heading="Proyectos">
                                {projects.map((project: any) => (
                                    <Command.Item 
                                        key={`proj-${project.id}`} 
                                        onSelect={() => runCommand(() => navigate(`/planning/${project.id}`))}
                                    >
                                        <i className="ri-folder-2-line"></i>
                                        {project.nombre}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                        
                        {users.length > 0 && (
                            <Command.Group heading="Usuarios">
                                {users.map((user: any) => (
                                    <Command.Item 
                                        key={`user-${user.id}`}
                                        onSelect={() => runCommand(() => navigate(`/users`))}
                                    >
                                        <i className="ri-user-line"></i>
                                        {user.nombre_completo || user.email}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        <Command.Group heading="Navegación General">
                            <Command.Item onSelect={() => runCommand(() => navigate('/projects'))}>
                                <i className="ri-apps-2-line"></i>
                                Ver todos los Proyectos
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => navigate('/users'))}>
                                <i className="ri-team-line"></i>
                                Gestionar Usuarios
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => navigate('/profile'))}>
                                <i className="ri-account-circle-line"></i>
                                Mi Perfil
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
};

export default CommandPalette;
