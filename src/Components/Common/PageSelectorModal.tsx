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
    const { data: pages = [], isLoading } = useQuery({
        queryKey: ['pages', projectId],
        queryFn: () => api.get(`/projects/${projectId}/pages`),
        enabled: isOpen && !!projectId
    });

    // Fetch already linked pages
    const { data: linkedPages = [], isLoading: isLoadingLinked } = useQuery({
        queryKey: ['entity_pages', entityType, entityId],
        queryFn: () => api.get(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`),
        enabled: isOpen && !!projectId && !!entityId
    });

    const linkMutation = useMutation({
        mutationFn: (pageId: string) => api.post(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`, { pagina_id: pageId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entity_pages', entityType, entityId] });
            toast.success("Página vinculada con éxito.");
        },
        onError: () => toast.error("Error al vincular página.")
    });

    const unlinkMutation = useMutation({
        mutationFn: (pageId: string) => api.delete(`/projects/${projectId}/entities/${entityType}/${entityId}/pages/${pageId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entity_pages', entityType, entityId] });
            toast.success("Página desvinculada.");
        },
        onError: () => toast.error("Error al desvincular página.")
    });

    const createAndLinkMutation = useMutation({
        mutationFn: async (titulo: string) => {
            const newPage = await api.create(`/projects/${projectId}/pages`, { titulo, icono: "📄" });
            await api.post(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`, { pagina_id: newPage.id });
            return newPage;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', projectId] });
            queryClient.invalidateQueries({ queryKey: ['entity_pages', entityType, entityId] });
            toast.success("Página creada y vinculada.");
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
                    <i className="ri-file-list-3-line text-primary fs-4"></i>
                    Documentación Adjunta
                </div>
            </ModalHeader>
            <ModalBody className="p-0 bg-light">
                <div className="p-3 border-bottom bg-white sticky-top">
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
                        <div className="text-center py-4"><Spinner color="primary" /></div>
                    ) : (
                        <div className="list-group">
                            {searchTerm && filteredPages.length === 0 && (
                                <button 
                                    className="list-group-item list-group-item-action d-flex align-items-center gap-3 text-primary border-primary bg-primary bg-opacity-10"
                                    onClick={() => createAndLinkMutation.mutate(searchTerm)}
                                    disabled={createAndLinkMutation.isPending}
                                >
                                    <i className="ri-add-circle-line fs-4"></i>
                                    <div>
                                        <h6 className="mb-0 text-primary">Crear nueva página: "{searchTerm}"</h6>
                                        <small>Se creará y adjuntará automáticamente</small>
                                    </div>
                                </button>
                            )}
                            
                            {filteredPages.map((page: any) => (
                                <div key={page.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="fs-3">{page.icono || '📄'}</span>
                                        <div>
                                            <h6 
                                                className={`mb-0 ${isLinked(page.id) && onOpenPageViewer ? 'text-primary cursor-pointer text-decoration-underline' : ''}`}
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
                                                color="primary" 
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
