import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Button, Input, Spinner, Offcanvas, OffcanvasHeader, OffcanvasBody } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import AttachmentPanel from '../../Components/Common/AttachmentPanel';
import { APIClient } from '../../helpers/api_helper';
import config from '../../config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = APIClient;

// ========== TipTap Editor Toolbar ==========
const MenuBar = ({ editor, onOpenAssets }: { editor: any, onOpenAssets: () => void }) => {
    if (!editor) return null;

    const btnClass = (active: boolean) =>
        `btn btn-sm ${active ? 'btn-soft-primary text-primary' : 'btn-ghost-secondary'} rounded-2`;

    const addImage = () => {
        const url = window.prompt('URL de la imagen:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="d-flex align-items-center gap-1 p-2 sticky-top border-bottom z-1" style={{ top: 0, marginTop: '-1px', backgroundColor: 'var(--vz-card-bg-custom)' }}>
            <div className="d-flex rounded p-1">
                <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
                    <i className="ri-bold"></i>
                </button>
                <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
                    <i className="ri-italic"></i>
                </button>
                <button className={btnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
                    <i className="ri-strikethrough"></i>
                </button>
                <button className={btnClass(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de Código">
                    <i className="ri-code-box-line"></i>
                </button>
            </div>
            
            <div className="d-flex rounded p-1 ms-2 border-start border-end px-2">
                <button className={btnClass(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">
                    <i className="ri-h-1"></i>
                </button>
                <button className={btnClass(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
                    <i className="ri-h-2"></i>
                </button>
            </div>

            <div className="d-flex rounded p-1 ms-2">
                <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
                    <i className="ri-list-unordered"></i>
                </button>
                <button className={btnClass(editor.isActive('taskList'))} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
                    <i className="ri-checkbox-line"></i>
                </button>
                <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">
                    <i className="ri-double-quotes-l"></i>
                </button>
            </div>

            <div className="d-flex rounded p-1 ms-2 border-start px-2">
                <button className="btn btn-sm btn-ghost-secondary rounded-2" onClick={addImage} title="Insertar imagen por URL">
                    <i className="ri-image-add-line"></i>
                </button>
                <button className="btn btn-sm btn-ghost-secondary rounded-2" onClick={onOpenAssets} title="Abrir Recursos (Archivos adjuntos)">
                    <i className="ri-attachment-2"></i>
                </button>
            </div>
            
            <div className="ms-auto d-flex rounded p-1">
                <button className="btn btn-sm btn-ghost-secondary rounded-2" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <i className="ri-arrow-go-back-line"></i>
                </button>
                <button className="btn btn-sm btn-ghost-secondary rounded-2" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <i className="ri-arrow-go-forward-line"></i>
                </button>
            </div>
        </div>
    );
};

// ========== Page Component ==========
const Pages = () => {
    const queryClient = useQueryClient();
    const activeProjectId = localStorage.getItem('activeProjectId');
    const activeProjectName = localStorage.getItem('activeProjectName');

    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [titleValue, setTitleValue] = useState("");
    const [isAssetsOpen, setIsAssetsOpen] = useState(false);
    const saveTimerRef = useRef<any>(null);

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
        },
    });

    const deletePageMutation = useMutation({
        mutationFn: (pageId: string) => api.delete(`/projects/${activeProjectId}/pages/${pageId}`),
        onSuccess: (_, pageId) => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
            if (selectedPageId === pageId) setSelectedPageId(null);
            toast.success("Página eliminada.", { position: "top-right" });
        },
    });

    // ---- Image Upload Handler ----
    const uploadImage = async (file: File): Promise<string | null> => {
        if (!activeProjectId || !selectedPageId) return null;
        const formData = new FormData();
        formData.append('data', file);
        
        try {
            const token = JSON.parse(sessionStorage.getItem('authUser') || localStorage.getItem('authUser') || '{}').token;
            const res = await fetch(
                `${config.api.API_URL}/projects/${activeProjectId}/attachments/?entity_type=pagina&entity_id=${selectedPageId}`,
                { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData }
            );
            if (res.ok) {
                const data = await res.json();
                queryClient.invalidateQueries({ queryKey: ['attachments', activeProjectId, 'pagina', selectedPageId] });
                return data.url_publica;
            } else {
                toast.error("Error del servidor al subir la imagen.");
            }
        } catch (e: any) {
            toast.error(`Error subiendo imagen: ${e.message}`);
        }
        return null;
    };

    // ---- TipTap Editor ----
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Escribe '/' para comandos, o simplemente empieza a escribir..." }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Image.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: true }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            // Debounced auto-save
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                if (selectedPageId) {
                    updatePageMutation.mutate({
                        id: selectedPageId,
                        contenido: editor.getHTML(),
                    });
                }
            }, 1500);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg focus:outline-none w-100 max-w-none text-body',
            },
            handleDrop: function(view, event, slice, moved) {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const { schema } = view.state;
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        
                        uploadImage(file).then(url => {
                            if (url && coordinates) {
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.insert(coordinates.pos, node);
                                view.dispatch(transaction);
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
            handlePaste: function(view, event, slice) {
                if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
                    const file = event.clipboardData.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const { schema } = view.state;
                        uploadImage(file).then(url => {
                            if (url) {
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                            }
                        });
                        return true;
                    }
                }
                return false;
            }
        }
    });

    // Set editor content when page changes
    useEffect(() => {
        if (pageContent && editor && pageContent.id === selectedPageId) {
            editor.commands.setContent(pageContent.contenido || '');
            setTitleValue(pageContent.titulo || "Sin título");
        }
    }, [pageContent, editor, selectedPageId]);

    // ---- Handlers ----
    const handleCreatePage = useCallback(() => {
        createPageMutation.mutate({ titulo: "Nueva página", icono: "📝" });
    }, [createPageMutation]);

    const handleTitleSave = useCallback(() => {
        if (selectedPageId && titleValue.trim() !== pageContent.titulo) {
            updatePageMutation.mutate({ id: selectedPageId, titulo: titleValue.trim() });
        }
    }, [selectedPageId, titleValue, pageContent, updatePageMutation]);

    document.title = `Documentación | Luma - ${activeProjectName || 'Scrum'}`;

    if (!activeProjectId) {
        return (
            <div className="page-content d-flex align-items-center justify-content-center" style={{ height: 'calc(100vh - 70px)', backgroundColor: 'var(--vz-body-bg)' }}>
                <div className="text-center text-muted">
                    <i className="ri-file-text-line display-1 mb-3 d-inline-block"></i>
                    <h4>Selecciona un proyecto para ver sus documentos</h4>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content p-0 d-flex overflow-hidden" style={{ height: 'calc(100vh - 70px)', backgroundColor: 'var(--vz-body-bg)' }}>
                
                {/* ======= Sidebar: Pages Tree ======= */}
                <div className="border-end" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--vz-card-bg-custom)' }}>
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                        <span className="fw-semibold text-uppercase fs-12 text-muted">
                            {activeProjectName}
                        </span>
                        <Button color="light" size="sm" className="btn-icon p-0 bg-transparent border-0 text-muted" onClick={handleCreatePage}>
                            <i className="ri-add-box-line fs-18"></i>
                        </Button>
                    </div>
                    
                    <div className="flex-grow-1 overflow-auto py-2">
                        {isLoading ? (
                            <div className="text-center py-4"><Spinner size="sm" color="primary" /></div>
                        ) : pages.length === 0 ? (
                            <div className="px-3 py-2 text-muted fs-13">
                                No hay páginas.
                            </div>
                        ) : (
                            <div className="list-group list-group-flush border-0">
                                {pages.map((page: any) => (
                                    <div
                                        key={page.id}
                                        className={`list-group-item list-group-item-action d-flex align-items-center gap-2 border-0 px-3 py-2 ${
                                            selectedPageId === page.id ? 'bg-soft-primary text-primary fw-medium' : 'bg-transparent text-body'
                                        }`}
                                        onClick={() => setSelectedPageId(page.id)}
                                        style={{ cursor: 'pointer', borderRadius: '4px', margin: '0 8px', marginBottom: '2px' }}
                                    >
                                        <span className="fs-14">{page.icono || "📝"}</span>
                                        <span className="flex-grow-1 text-truncate fs-14">
                                            {page.titulo}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ======= Main: Editor ======= */}
                <div className="flex-grow-1 d-flex flex-column position-relative" style={{ overflowY: 'auto', overflowX: 'hidden', backgroundColor: 'var(--vz-body-bg)' }}>
                    {!selectedPageId ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                            <i className="ri-draft-line display-1 mb-3"></i>
                            <h5 className="text-muted fw-normal">Selecciona o crea una página para comenzar</h5>
                            <Button color="primary" className="mt-3 rounded-pill px-4" onClick={handleCreatePage}>
                                Crear página
                            </Button>
                        </div>
                    ) : isLoadingContent ? (
                        <div className="d-flex align-items-center justify-content-center h-100">
                            <Spinner color="primary" />
                        </div>
                    ) : (
                        <>
                            <MenuBar editor={editor} onOpenAssets={() => setIsAssetsOpen(true)} />
                            
                            <div className="d-flex justify-content-center w-100 flex-grow-1">
                                <div className="editor-content-wrapper px-4 py-5" style={{ width: '100%', maxWidth: '850px' }}>
                                    
                                    {/* Indicador de guardado flotante */}
                                    <div className="position-absolute top-0 end-0 p-3 mt-5">
                                        <span className="text-muted fs-12 fw-medium px-2 py-1 rounded-pill" style={{backgroundColor: 'var(--vz-light)'}}>
                                            {updatePageMutation.isPending ? (
                                                <><Spinner size="sm" className="me-1" style={{width: 10, height: 10}}/> Guardando...</>
                                            ) : (
                                                <><i className="ri-cloud-line me-1"></i> Sincronizado</>
                                            )}
                                        </span>
                                    </div>

                                    {/* Título Gigante */}
                                    <Input
                                        type="text"
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onBlur={handleTitleSave}
                                        placeholder="Sin título"
                                        className="fw-bold bg-transparent border-0 p-0 mb-4 text-body"
                                        style={{ fontSize: '3rem', boxShadow: 'none', lineHeight: '1.2' }}
                                    />

                                    {/* Editor Principal */}
                                    <div className="tiptap-plane-theme">
                                        <EditorContent editor={editor} />
                                    </div>

                                    {/* Botón flotante para eliminar página al fondo */}
                                    <div className="mt-5 pt-5 border-top border-dashed">
                                        <Button color="danger" outline size="sm" className="rounded-pill border-0 mt-4 hover-bg-soft-danger" onClick={() => {
                                            if (window.confirm("¿Estás seguro de eliminar esta página permanentemente?")) {
                                                deletePageMutation.mutate(selectedPageId);
                                            }
                                        }}>
                                            <i className="ri-delete-bin-line me-1"></i> Eliminar página
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ======= Offcanvas: Assets (Archivos) ======= */}
            {selectedPageId && (
                <Offcanvas
                    isOpen={isAssetsOpen}
                    direction="end"
                    toggle={() => setIsAssetsOpen(!isAssetsOpen)}
                    style={{ width: '400px', backgroundColor: 'var(--vz-card-bg-custom)' }}
                >
                    <OffcanvasHeader toggle={() => setIsAssetsOpen(!isAssetsOpen)} className="border-bottom">
                        <i className="ri-folder-2-line me-2"></i> Recursos y Adjuntos
                    </OffcanvasHeader>
                    <OffcanvasBody className="p-0">
                        <div className="p-3 border-bottom text-muted fs-13" style={{ backgroundColor: 'var(--vz-light)'}}>
                            Sube PDFs, archivos ZIP o documentos. Las imágenes pegadas directamente en el editor se incrustan en el texto y no necesitan subirse aquí.
                        </div>
                        <div className="p-3">
                            <AttachmentPanel
                                projectId={activeProjectId}
                                entityType="pagina"
                                entityId={selectedPageId}
                            />
                        </div>
                    </OffcanvasBody>
                </Offcanvas>
            )}

            {/* TipTap Plane/Notion Styles */}
            <style>{`
                .tiptap-plane-theme .tiptap {
                    outline: none;
                    min-height: 50vh;
                    font-size: 1.15rem;
                    line-height: 1.8;
                    color: var(--vz-body-color);
                    font-family: 'Inter', sans-serif;
                }
                .tiptap-plane-theme .tiptap p {
                    margin-bottom: 1.2em;
                }
                .tiptap-plane-theme .tiptap > * + * {
                    margin-top: 0.5em;
                }
                .tiptap-plane-theme .tiptap h1 { font-size: 2.2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: var(--vz-heading-color); }
                .tiptap-plane-theme .tiptap h2 { font-size: 1.6em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: var(--vz-heading-color); }
                .tiptap-plane-theme .tiptap h3 { font-size: 1.3em; font-weight: 600; margin-top: 1em; color: var(--vz-heading-color); }
                .tiptap-plane-theme .tiptap ul,
                .tiptap-plane-theme .tiptap ol { padding-left: 1.5em; margin-bottom: 1em; }
                .tiptap-plane-theme .tiptap code {
                    background: var(--vz-light);
                    color: var(--vz-danger);
                    border-radius: 4px;
                    padding: 0.2em 0.4em;
                    font-size: 0.85em;
                }
                .tiptap-plane-theme .tiptap pre {
                    background: var(--vz-light);
                    color: var(--vz-body-color);
                    border-radius: 6px;
                    padding: 1.2em;
                    overflow-x: auto;
                    font-size: 0.9em;
                }
                .tiptap-plane-theme .tiptap pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                }
                .tiptap-plane-theme .tiptap blockquote {
                    border-left: 3px solid var(--vz-primary);
                    padding-left: 1.2em;
                    color: var(--vz-text-muted);
                    font-style: italic;
                    margin-left: 0;
                    margin-right: 0;
                    background: var(--vz-light);
                    padding-top: 0.5em;
                    padding-bottom: 0.5em;
                    border-radius: 0 4px 4px 0;
                }
                .tiptap-plane-theme .tiptap img {
                    max-width: 100%;
                    border-radius: 8px;
                    display: block;
                    margin: 2em auto;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .tiptap-plane-theme .tiptap img.ProseMirror-selectednode {
                    outline: 3px solid var(--vz-primary);
                }
                .tiptap-plane-theme .tiptap ul[data-type="taskList"] {
                    list-style: none;
                    padding-left: 0;
                }
                .tiptap-plane-theme .tiptap ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5em;
                    margin-bottom: 0.2em;
                }
                .tiptap-plane-theme .tiptap ul[data-type="taskList"] li label {
                    margin-top: 0.2em;
                }
                .tiptap-plane-theme .tiptap p.is-editor-empty:first-child::before {
                    color: var(--vz-text-muted);
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .hover-bg-soft-danger:hover {
                    background-color: var(--vz-danger-bg-subtle) !important;
                }
            `}</style>
        </React.Fragment>
    );
};

export default Pages;
