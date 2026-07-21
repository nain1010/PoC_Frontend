import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Spinner } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';

const api = APIClient;
interface PageSelectorModalProps {
    isOpen: boolean;
    toggle: () => void;
    projectId: string;
    entityType: 'historia' | 'tarea';
    entityId: string;
    onOpenPageViewer?: (pageId: string) => void;
}

const PageSelectorModal = ({ isOpen, toggle, projectId, entityType, entityId, onOpenPageViewer }: PageSelectorModalProps) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch all project pages
    const { data: rawPages, isLoading } = useQuery({
        queryKey: ['pages', projectId],
        queryFn: () => api.get(`/projects/${projectId}/pages`),
        enabled: isOpen && !!projectId,
        staleTime: 60000, // 1 min — reuse cached sidebar data
    });
    const pages: any[] = (rawPages as any) || [];

    // Fetch already linked pages
    const { data: rawLinkedPages, isLoading: isLoadingLinked } = useQuery({
        queryKey: ['entity_pages', entityType, entityId],
        queryFn: () => api.get(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`),
        enabled: isOpen && !!projectId && !!entityId,
        staleTime: 60000 // 1 minute to prevent immediate refetch after optimistic update
    });
    const linkedPages: any[] = (rawLinkedPages as any) || [];

    const linkMutation = useMutation({
        mutationFn: (pageId: string) => api.post(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`, { pagina_id: pageId }),
        onMutate: async (pageId: string) => {
            const previousPages = queryClient.getQueryData(['entity_pages', entityType, entityId]);
            const pageToLink = pages.find((p: any) => p.id === pageId);
            
            if (pageToLink) {
                queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => {
                    if (old?.some((p: any) => p.id === pageId)) return old;
                    return [...(old || []), pageToLink];
                });
            }
            return { previousPages };
        },
        onError: (err, newPage, context: any) => {
            if (context?.previousPages) {
                queryClient.setQueryData(['entity_pages', entityType, entityId], context.previousPages);
            }
            toast.error("Error al vincular página.");
        },
        onSuccess: (data, pageId) => {
            const pageToLink = pages.find((p: any) => p.id === pageId);
            if (pageToLink) {
                queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => {
                    if (old?.some((p: any) => p.id === pageId)) return old;
                    return [...(old || []), pageToLink];
                });
            }
            // toast.success("Página vinculada con éxito.");
        },
        onSettled: (data, error, pageId) => {
            if (!error) {
                const pageToLink = pages.find((p: any) => p.id === pageId);
                if (pageToLink) {
                    queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => {
                        if (old?.some((p: any) => p.id === pageId)) return old;
                        return [...(old || []), pageToLink];
                    });
                }
            }
        }
    });

    const unlinkMutation = useMutation({
        mutationFn: (pageId: string) => api.delete(`/projects/${projectId}/entities/${entityType}/${entityId}/pages/${pageId}`),
        onMutate: async (pageId: string) => {
            const previousPages = queryClient.getQueryData(['entity_pages', entityType, entityId]);
            
            queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => (old || []).filter((p: any) => p.id !== pageId));
            
            return { previousPages };
        },
        onError: (err, variables, context: any) => {
            if (context?.previousPages) {
                queryClient.setQueryData(['entity_pages', entityType, entityId], context.previousPages);
            }
            toast.error("Error al desvincular página.");
        },
        onSuccess: (data, pageId) => {
            queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => (old || []).filter((p: any) => p.id !== pageId));
            // toast.success("Página desvinculada.");
        },
        onSettled: (data, error, pageId) => {
            if (!error) {
                queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => (old || []).filter((p: any) => p.id !== pageId));
            }
        }
    });

    const createAndLinkMutation = useMutation({
        mutationFn: async (titulo: string) => {
            const newPage: any = await api.create(`/projects/${projectId}/pages`, { titulo, icono: "📄" });
            await api.post(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`, { pagina_id: newPage.id });
            return newPage;
        },
        onSuccess: (newPage) => {
            queryClient.setQueryData(['pages', projectId], (old: any) => [...(old || []), newPage]);
            queryClient.setQueryData(['entity_pages', entityType, entityId], (old: any) => [...(old || []), newPage]);
            // toast.success("Página creada y vinculada.");
            setSearchTerm("");
        },
        onError: () => toast.error("Error creando la página.")
    });

    const isLinked = (pageId: string) => linkedPages.some((p: any) => p.id === pageId);

    const filteredPages = pages.filter((p: any) => p.titulo.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered scrollable size="lg">
            <ModalHeader toggle={toggle} className="border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <i className="ri-file-list-3-line text-secondary fs-4"></i>
                    Documentación Adjunta
                </div>
            </ModalHeader>
            <ModalBody className="p-0">
                <div className="p-3 border-bottom sticky-top bg-light">
                    <div className="search-box">
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Buscar páginas existentes o escribir para crear una nueva..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                    </div>
                </div>

                <div className="p-3">
                    {isLoading || isLoadingLinked ? (
                        <div className="text-center py-4"><Spinner color="secondary" /></div>
                    ) : (
                        <div className="list-group">
                            {searchTerm && filteredPages.length === 0 && (
                                <button 
                                    className="list-group-item list-group-item-action d-flex align-items-center gap-3 text-secondary border-secondary bg-secondary bg-opacity-10"
                                    onClick={() => createAndLinkMutation.mutate(searchTerm)}
                                    disabled={createAndLinkMutation.isPending}
                                >
                                    <i className="ri-add-circle-line fs-4"></i>
                                    <div>
                                        <h6 className="mb-0 text-secondary">Crear nueva página: "{searchTerm}"</h6>
                                        <small>Se creará y adjuntará automáticamente</small>
                                    </div>
                                </button>
                            )}
                            
                            {filteredPages.map((page: any) => (
                                <div key={page.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        {page.icono && page.icono !== "📝" && page.icono !== "📄" && <span className="fs-3">{page.icono}</span>}
                                        <div>
                                            <h6 
                                                className={`mb-0 ${isLinked(page.id) && onOpenPageViewer ? 'text-secondary cursor-pointer text-decoration-underline' : ''}`}
                                                onClick={() => {
                                                    if (isLinked(page.id) && onOpenPageViewer) {
                                                        onOpenPageViewer(page.id);
                                                        toggle();
                                                    }
                                                }}
                                                style={{ cursor: isLinked(page.id) && onOpenPageViewer ? 'pointer' : 'default' }}
                                            >
                                                {page.titulo}
                                            </h6>
                                            <small className="text-muted">
                                                {page.padre_id ? "Subpágina" : "Página Principal"} 
                                                {page.is_locked && <span> • <i className="ri-lock-line text-warning"></i> Solo lectura</span>}
                                            </small>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex gap-2">
                                        {isLinked(page.id) ? (
                                            <>
                                                {onOpenPageViewer && (
                                                    <Button 
                                                        size="sm" 
                                                        color="info" 
                                                        className="d-flex align-items-center gap-1"
                                                        onClick={() => {
                                                            onOpenPageViewer(page.id);
                                                            toggle();
                                                        }}
                                                    >
                                                        <i className="ri-external-link-line"></i>
                                                        <span className="d-none d-sm-inline">Abrir</span>
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    color="danger" 
                                                    outline 
                                                    onClick={() => unlinkMutation.mutate(page.id)}
                                                    disabled={unlinkMutation.isPending}
                                                >
                                                    Desvincular
                                                </Button>
                                            </>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                color="secondary" 
                                                outline 
                                                onClick={() => linkMutation.mutate(page.id)}
                                                disabled={linkMutation.isPending}
                                            >
                                                Vincular
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
};

export default PageSelectorModal;
