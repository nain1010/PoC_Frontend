import React, { useState, useCallback, useEffect } from 'react';
import { Button, Spinner } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { APIClient } from '../../helpers/api_helper';
import config from '../../config';
import PageEditorWrapper from './PageEditor';

const api = APIClient;

const PageTreeNode = ({ page, allPages, selectedPageId, onSelect, onCreateSubpage }: any) => {
    const [expanded, setExpanded] = useState(true);
    const children = allPages.filter((p: any) => p.padre_id === page.id).sort((a: any, b: any) => a.orden - b.orden);
    const hasChildren = children.length > 0;
    const isSelected = selectedPageId === page.id;

    return (
        <div className="w-100">
            <div
                className={`d-flex align-items-center gap-1 border-0 px-1 py-1 mb-1 rounded ${
                    isSelected ? 'bg-soft-primary text-primary fw-semibold' : 'bg-transparent text-body hover-bg-soft-light'
                }`}
                style={{ cursor: 'pointer', paddingLeft: '4px' }}
            >
                <div 
                    className="d-flex align-items-center justify-content-center text-muted" 
                    style={{ width: '16px', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren ? (
                        <i className={expanded ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line"}></i>
                    ) : <span style={{ width: '16px' }}></span>}
                </div>
                <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden" onClick={() => onSelect(page.id)}>
                    <span className="fs-14 opacity-75">{page.icono || "📄"}</span>
                    <span className="flex-grow-1 text-truncate fs-13">{page.titulo}</span>
                </div>
                <div className="page-actions d-flex align-items-center opacity-50 hover-opacity-100">
                    <button className="btn btn-sm btn-link p-0 text-muted hover-text-primary" onClick={(e) => { e.stopPropagation(); setExpanded(true); onCreateSubpage(page.id); }} title="Añadir subpágina">
                        <i className="ri-add-line fs-14"></i>
                    </button>
                </div>
            </div>
            {expanded && hasChildren && (
                <div className="ms-3 border-start border-1 ps-1 border-light">
                    {children.map((child: any) => (
                        <PageTreeNode 
                            key={child.id} 
                            page={child} 
                            allPages={allPages} 
                            selectedPageId={selectedPageId} 
                            onSelect={onSelect} 
                            onCreateSubpage={onCreateSubpage} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Pages = () => {
    const queryClient = useQueryClient();
    const activeProjectId = localStorage.getItem('activeProjectId');
    const activeProjectName = localStorage.getItem('activeProjectName');
    const [searchParams] = useSearchParams();
    const urlPageId = searchParams.get('pageId');

    const [selectedPageId, setSelectedPageId] = useState<string | null>(urlPageId || null);
    const [titleValue, setTitleValue] = useState("");
    const [isFullWidth, setIsFullWidth] = useState(() => localStorage.getItem('pages_full_width') === 'true');
    
    useEffect(() => {
        if (urlPageId && urlPageId !== selectedPageId) {
            setSelectedPageId(urlPageId);
        }
    }, [urlPageId]);

    const toggleFullWidth = () => {
        setIsFullWidth(prev => {
            const next = !prev;
            localStorage.setItem('pages_full_width', String(next));
            return next;
        });
    };

    // ---- Queries ----
    const { data: pages = [], isLoading } = useQuery({
        queryKey: ['pages', activeProjectId],
        queryFn: () => api.get(`/projects/${activeProjectId}/pages`),
        select: (data: any) => data || [],
        enabled: !!activeProjectId,
    });

    const { data: pageContent, isLoading: isLoadingContent } = useQuery({
        queryKey: ['page', selectedPageId],
        queryFn: () => api.get(`/projects/${activeProjectId}/pages/${selectedPageId}`),
        select: (data: any) => data || {},
        enabled: !!selectedPageId && !!activeProjectId,
    });

    useEffect(() => {
        if (pageContent && pageContent.titulo) {
            setTitleValue(pageContent.titulo);
        } else {
            setTitleValue("");
        }
    }, [pageContent, selectedPageId]);


    // ---- Mutations ----
    const createPageMutation = useMutation({
        mutationFn: (payload: any) => api.create(`/projects/${activeProjectId}/pages`, payload),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
            setSelectedPageId(res.id);
            toast.success("Página creada.", { position: "top-right" });
        },
        onError: (err: any) => toast.error(err || "Error al crear.", { position: "top-right" }),
    });

    const updatePageMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/projects/${activeProjectId}/pages/${payload.id}`, payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: ['page', payload.id] });
            const previousPage = queryClient.getQueryData(['page', payload.id]);
            
            // Optimistic update
            queryClient.setQueryData(['page', payload.id], (old: any) => {
                if (!old) return old;
                return { ...old, ...payload };
            });
            
            return { previousPage };
        },
        onError: (err, payload, context: any) => {
            if (context?.previousPage) {
                queryClient.setQueryData(['page', payload.id], context.previousPage);
            }
            toast.error("Error al actualizar la página.");
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
            if (variables.id === selectedPageId) {
                queryClient.invalidateQueries({ queryKey: ['page', selectedPageId] });
            }
        },
    });

    const deletePageMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/projects/${activeProjectId}/pages/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
            setSelectedPageId(null);
        },
        onError: () => toast.error("Error al eliminar la página.")
    });

    // ---- Image Upload Handler ----
    const uploadImage = async (file: File): Promise<string | null> => {
        if (!activeProjectId || !selectedPageId) return null;
        const formData = new FormData();
        formData.append('data', file);
        
        try {
            const token = JSON.parse(sessionStorage.getItem('authUser') || localStorage.getItem('authUser') || '{}').token;
            const res = await fetch(
                `${config.api.API_URL}/api/upload/${activeProjectId}?entity_type=pagina&entity_id=${selectedPageId}`,
                { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData }
            );
            if (res.ok) {
                const data = await res.json();
                queryClient.invalidateQueries({ queryKey: ['attachments', activeProjectId, 'pagina', selectedPageId] });
                return data.url_publica;
            }
        } catch (e: any) {
            toast.error(`Error subiendo imagen: ${e.message}`);
        }
        return null;
    };

    // El editor y la lógica de bloques ahora se manejan en PageEditorWrapper

    // ---- Handlers ----
    const handleCreatePage = useCallback((parentId: string | null | any = null) => {
        const id = typeof parentId === 'string' ? parentId : null;
        createPageMutation.mutate({ titulo: "Nueva página", icono: "📄", padre_id: id });
    }, [createPageMutation]);

    const handleTitleSave = useCallback(() => {
        if (selectedPageId && titleValue.trim() !== pageContent.titulo) {
            updatePageMutation.mutate({ id: selectedPageId, titulo: titleValue.trim() });
        }
    }, [selectedPageId, titleValue, pageContent, updatePageMutation]);

    const handleDownloadPage = useCallback((htmlContent?: string) => {
        if (!pageContent) return;
        const bodyHtml = htmlContent || "Contenido no disponible.";
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${pageContent.titulo}</title><style>body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: auto; line-height: 1.6; color: #333; } img { max-width: 100%; height: auto; border-radius: 8px; } blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 1rem; color: #666; } pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }</style></head><body><h1>${pageContent.titulo}</h1>${bodyHtml}</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageContent.titulo || 'documento'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }, [pageContent]);

    const confirmDeletePage = useCallback(() => {
        import('sweetalert2').then((SwalModule) => {
            const Swal = SwalModule.default;
            Swal.fire({
                title: "¿Estás seguro?",
                text: "Se eliminará esta página y todo su contenido irreversiblemente.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed && selectedPageId) {
                    deletePageMutation.mutate(selectedPageId);
                }
            });
        });
    }, [selectedPageId, deletePageMutation]);

    document.title = `Documentación | Luma - ${activeProjectName || 'Scrum'}`;
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (!activeProjectId) {
        return (
            <div className="page-content d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
                <div className="text-center text-muted">
                    <i className="ri-error-warning-line display-4 mb-3"></i>
                    <h5>No hay proyecto activo</h5>
                    <p>Por favor selecciona un proyecto primero.</p>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content d-flex overflow-hidden" style={{ height: '100vh', padding: '70px 0 0 0', backgroundColor: 'var(--vz-body-bg)' }}>
                
                {/* ======= Sidebar (Left): Pages Tree ======= */}
                {isSidebarOpen && (
                <div className="border-end" style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--vz-card-bg-custom)' }}>
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                        <span className="fw-semibold text-uppercase fs-11 text-muted">
                            {activeProjectName}
                        </span>
                        <div className="d-flex gap-1">
                            <Button color="light" size="sm" className="btn-icon p-0 bg-transparent border-0 text-muted hover-bg-soft-primary rounded" onClick={() => handleCreatePage()}>
                                <i className="ri-add-line fs-18"></i>
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex-grow-1 overflow-auto py-2 px-2">
                        {isLoading ? (
                            <div className="text-center py-4"><Spinner size="sm" color="primary" /></div>
                        ) : pages.length === 0 ? (
                            <div className="px-3 py-2 text-muted fs-13">
                                No hay páginas.
                            </div>
                        ) : (
                            <div className="list-group list-group-flush border-0">
                                {pages.filter((p: any) => !p.padre_id).sort((a: any, b: any) => a.orden - b.orden).map((page: any) => (
                                    <PageTreeNode 
                                        key={page.id}
                                        page={page}
                                        allPages={pages}
                                        selectedPageId={selectedPageId}
                                        onSelect={setSelectedPageId}
                                        onCreateSubpage={handleCreatePage}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* ======= Main: Editor ======= */}
                <div className="flex-grow-1 d-flex flex-column position-relative editor-scroll-container" style={{ backgroundColor: 'var(--vz-body-bg)' }}>
                    {!selectedPageId ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted position-relative">
                            {!isSidebarOpen && (
                                <div className="position-absolute" style={{ top: '15px', left: '15px', zIndex: 1000 }}>
                                    <Button color="light" size="sm" className="btn-icon rounded shadow-sm border" onClick={() => setIsSidebarOpen(true)} title="Mostrar menú lateral">
                                        <i className="ri-menu-unfold-line fs-16 text-muted"></i>
                                    </Button>
                                </div>
                            )}
                            <i className="ri-draft-line display-1 mb-3 opacity-50"></i>
                            <h5 className="text-muted fw-normal">Selecciona o crea una página para comenzar</h5>
                            <Button color="primary" className="mt-3 rounded-pill px-4" onClick={() => handleCreatePage()}>
                                Crear página
                            </Button>
                        </div>
                    ) : isLoadingContent ? (
                        <div className="d-flex align-items-center justify-content-center h-100">
                            <Spinner color="primary" />
                        </div>
                    ) : (
                        <>
                        <PageEditorWrapper 
                            key={selectedPageId}
                            pageId={selectedPageId}
                            pageContent={pageContent}
                            titleValue={titleValue}
                            setTitleValue={setTitleValue}
                            updatePageMutation={updatePageMutation}
                            isFullWidth={isFullWidth}
                            setIsFullWidth={setIsFullWidth}
                            activeProjectId={activeProjectId}
                            uploadImage={uploadImage}
                            handleTitleSave={handleTitleSave}
                            onDeletePage={confirmDeletePage}
                            onDownloadPage={handleDownloadPage}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            isSidebarOpen={isSidebarOpen}
                        />
                        </>
                    )}
                </div>
            </div>

            {/* TipTap Plane/Notion Styles */}
            <style>{`
                .title-input-plane::placeholder { color: var(--vz-text-muted) !important; opacity: 0.5; }
                .tiptap-plane-theme .tiptap { outline: none; min-height: 50vh; font-size: 1.05rem; line-height: 1.7; color: var(--vz-body-color); font-family: 'Inter', sans-serif; padding-bottom: 20vh; }
                .tiptap-plane-theme .tiptap p { margin-bottom: 0.8em; }
                .tiptap-plane-theme .tiptap h1 { font-size: 2.2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: var(--vz-heading-color); }
                .tiptap-plane-theme .tiptap h2 { font-size: 1.7em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: var(--vz-heading-color); }
                .tiptap-plane-theme .tiptap h3 { font-size: 1.3em; font-weight: 600; margin-top: 1em; color: var(--vz-heading-color); }
                .tiptap-plane-theme .tiptap ul, .tiptap-plane-theme .tiptap ol { padding-left: 1.5em; margin-bottom: 1em; }
                
                /* Code */
                .tiptap-plane-theme .tiptap code { background: var(--vz-light); color: var(--vz-danger); border-radius: 4px; padding: 0.2em 0.4em; font-size: 0.85em; }
                .tiptap-plane-theme .tiptap pre { background: var(--vz-dark); color: #fff; border-radius: 6px; padding: 1.2em; overflow-x: auto; font-size: 0.9em; }
                .tiptap-plane-theme .tiptap pre code { background: none; color: inherit; padding: 0; }
                
                /* Blockquote */
                .tiptap-plane-theme .tiptap blockquote { border-left: 3px solid var(--vz-primary); padding-left: 1.2em; color: var(--vz-text-muted); font-style: italic; margin-left: 0; margin-right: 0; padding-top: 0.5em; padding-bottom: 0.5em; }
                
                /* Images */
                .tiptap-plane-theme .tiptap img { max-width: 100%; border-radius: 8px; display: block; margin: 2em auto; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .tiptap-plane-theme .tiptap img.ProseMirror-selectednode { outline: 3px solid var(--vz-primary); }
                
                /* Task List */
                .tiptap-plane-theme .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
                .tiptap-plane-theme .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; margin-bottom: 0.2em; }
                
                /* Tables */
                .tiptap-plane-theme .tiptap table { border-collapse: collapse; margin: 0; overflow: hidden; table-layout: fixed; width: 100%; margin-bottom: 1em; }
                .tiptap-plane-theme .tiptap table td, .tiptap-plane-theme .tiptap table th { border: 1px solid var(--vz-border-color); box-sizing: border-box; min-width: 1em; padding: 8px 12px; position: relative; vertical-align: top; }
                .tiptap-plane-theme .tiptap table th { background-color: var(--vz-light); font-weight: bold; text-align: left; }
                .tiptap-plane-theme .tiptap table .selectedCell:after { background: var(--vz-primary); content: ""; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; position: absolute; z-index: 2; opacity: 0.1; }
                .tiptap-plane-theme .tiptap table .column-resize-handle { background-color: var(--vz-primary); bottom: -2px; pointer-events: none; position: absolute; right: -1px; top: 0; width: 2px; z-index: 5; }

                /* Horizontal Rule */
                .tiptap-plane-theme .tiptap hr { border: none; border-top: 1px solid var(--vz-border-color); margin: 2rem 0; }

                /* Placeholder */
                .tiptap-plane-theme .tiptap p.is-editor-empty:first-child::before { color: var(--vz-text-muted); content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
                
                /* Hover Utilities */
                .hover-bg-soft-danger:hover { background-color: var(--vz-danger-bg-subtle) !important; }
                .hover-bg-soft-primary:hover { background-color: var(--vz-primary-bg-subtle) !important; color: var(--vz-primary) !important; }
                .hover-bg-soft-light:hover { background-color: var(--vz-light) !important; }
                
                /* Bubble Menu */
                .bubble-menu { display: flex; background-color: var(--vz-card-bg-custom); padding: 0.2rem; }
                .bubble-menu button { background: none; border: none; padding: 0.25rem 0.6rem; border-radius: 20px; color: var(--vz-body-color); font-size: 14px; cursor: pointer; transition: all 0.2s; }
                .bubble-menu button:hover, .bubble-menu button.is-active { background-color: var(--vz-light); color: var(--vz-primary); }
                
                /* Utilities */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </React.Fragment>
    );
};

export default Pages;
