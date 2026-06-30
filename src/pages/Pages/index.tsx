import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Card, CardBody, Button, Input, Spinner, Alert } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import AttachmentPanel from '../../Components/Common/AttachmentPanel';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = APIClient;

// ========== TipTap Editor Toolbar ==========
const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const btnClass = (active: boolean) =>
        `btn btn-sm ${active ? 'btn-primary' : 'btn-light'} border-0`;

    return (
        <div className="d-flex flex-wrap gap-1 p-2 border-bottom bg-light rounded-top">
            <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
                <i className="ri-bold"></i>
            </button>
            <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
                <i className="ri-italic"></i>
            </button>
            <button className={btnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
                <i className="ri-strikethrough"></i>
            </button>
            <div className="vr mx-1"></div>
            <button className={btnClass(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">
                <i className="ri-h-1"></i>
            </button>
            <button className={btnClass(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
                <i className="ri-h-2"></i>
            </button>
            <button className={btnClass(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">
                <i className="ri-h-3"></i>
            </button>
            <div className="vr mx-1"></div>
            <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
                <i className="ri-list-unordered"></i>
            </button>
            <button className={btnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista Numerada">
                <i className="ri-list-ordered"></i>
            </button>
            <button className={btnClass(editor.isActive('taskList'))} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
                <i className="ri-checkbox-line"></i>
            </button>
            <div className="vr mx-1"></div>
            <button className={btnClass(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de Código">
                <i className="ri-code-box-line"></i>
            </button>
            <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita">
                <i className="ri-double-quotes-l"></i>
            </button>
            <button className="btn btn-sm btn-light border-0" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea horizontal">
                <i className="ri-separator"></i>
            </button>
            <div className="vr mx-1"></div>
            <button className="btn btn-sm btn-light border-0" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer">
                <i className="ri-arrow-go-back-line"></i>
            </button>
            <button className="btn btn-sm btn-light border-0" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer">
                <i className="ri-arrow-go-forward-line"></i>
            </button>
        </div>
    );
};

// ========== Page Component ==========
const Pages = () => {
    const queryClient = useQueryClient();
    const activeProjectId = localStorage.getItem('activeProjectId');
    const activeProjectName = localStorage.getItem('activeProjectName');

    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState("");
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
        onError: (err: any) => toast.error(err || "Error al crear la página.", { position: "top-right" }),
    });

    const updatePageMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/projects/${activeProjectId}/pages/${payload.id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
        },
    });

    const deletePageMutation = useMutation({
        mutationFn: (pageId: string) => api.delete(`/projects/${activeProjectId}/pages/${pageId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
            setSelectedPageId(null);
            toast.success("Página eliminada.", { position: "top-right" });
        },
        onError: (err: any) => toast.error(err || "Error al eliminar.", { position: "top-right" }),
    });

    // ---- TipTap Editor ----
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Comienza a escribir... Usa los botones de arriba para dar formato." }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Image.configure({ inline: false }),
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
    });

    // Set editor content when page changes
    useEffect(() => {
        if (pageContent && editor) {
            editor.commands.setContent(pageContent.contenido || '');
            setTitleValue(pageContent.titulo || "Sin título");
        }
    }, [pageContent, editor]);

    // ---- Handlers ----
    const handleCreatePage = useCallback(() => {
        createPageMutation.mutate({ titulo: "Nueva página", icono: "📝" });
    }, [createPageMutation]);

    const handleDeletePage = useCallback((pageId: string) => {
        if (window.confirm("¿Eliminar esta página?")) {
            deletePageMutation.mutate(pageId);
        }
    }, [deletePageMutation]);

    const handleTitleSave = useCallback(() => {
        if (selectedPageId && titleValue.trim()) {
            updatePageMutation.mutate({ id: selectedPageId, titulo: titleValue.trim() });
        }
        setEditingTitle(false);
    }, [selectedPageId, titleValue, updatePageMutation]);

    const selectedPage = useMemo(() => pages.find((p: any) => p.id === selectedPageId), [pages, selectedPageId]);

    document.title = `Documentación | Luma - ${activeProjectName || 'Scrum'}`;

    // ---- No project selected ----
    if (!activeProjectId) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Documentación" />
                    <Row>
                        <Col lg={12}>
                            <Card className="text-center shadow-sm border-0">
                                <CardBody className="py-5">
                                    <i className="ri-file-text-line display-1 text-muted mb-3 d-inline-block"></i>
                                    <h4>Selecciona un proyecto para ver sus documentos</h4>
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
                    <BreadCrumb title={`Documentación - ${activeProjectName}`} />

                    <Row>
                        {/* ======= Sidebar: Pages Tree ======= */}
                        <Col lg={3} md={4} className="mb-4">
                            <Card className="shadow-sm border-0 h-100">
                                <div className="card-header bg-light d-flex justify-content-between align-items-center p-3 border-0">
                                    <h6 className="card-title mb-0 fw-bold text-muted">
                                        <i className="ri-pages-line me-1"></i> Páginas
                                    </h6>
                                    <Button color="success" size="sm" onClick={handleCreatePage} disabled={createPageMutation.isPending}>
                                        <i className="ri-add-line"></i>
                                    </Button>
                                </div>
                                <CardBody className="p-0" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                    {isLoading ? (
                                        <div className="text-center py-4"><Spinner size="sm" color="primary" /></div>
                                    ) : pages.length === 0 ? (
                                        <div className="text-center py-5 text-muted">
                                            <i className="ri-file-add-line display-4 d-block mb-2"></i>
                                            <p className="mb-0">No hay páginas aún.</p>
                                            <small>Crea tu primera página de documentación.</small>
                                        </div>
                                    ) : (
                                        <div className="list-group list-group-flush">
                                            {pages.map((page: any) => (
                                                <div
                                                    key={page.id}
                                                    className={`list-group-item list-group-item-action d-flex align-items-center gap-2 border-0 px-3 py-2 ${
                                                        selectedPageId === page.id ? 'active' : ''
                                                    }`}
                                                    onClick={() => setSelectedPageId(page.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <span className="fs-16">{page.icono || "📝"}</span>
                                                    <span className="flex-grow-1 text-truncate fw-medium fs-13">
                                                        {page.titulo}
                                                    </span>
                                                    <Button
                                                        color="link"
                                                        size="sm"
                                                        className={`p-0 ${selectedPageId === page.id ? 'text-white' : 'text-danger'}`}
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                                                        title="Eliminar"
                                                    >
                                                        <i className="ri-delete-bin-line fs-14"></i>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>

                        {/* ======= Main: Editor ======= */}
                        <Col lg={9} md={8} className="mb-4">
                            <Card className="shadow-sm border-0 h-100">
                                {!selectedPageId ? (
                                    <CardBody className="d-flex flex-column align-items-center justify-content-center py-5">
                                        <i className="ri-file-text-line display-1 text-muted mb-3"></i>
                                        <h5 className="text-muted">Selecciona una página o crea una nueva</h5>
                                        <Button color="primary" className="mt-3" onClick={handleCreatePage}>
                                            <i className="ri-add-line me-1"></i> Nueva Página
                                        </Button>
                                    </CardBody>
                                ) : isLoadingContent ? (
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <p className="text-muted mt-2">Cargando página...</p>
                                    </CardBody>
                                ) : (
                                    <>
                                        {/* Page Title */}
                                        <div className="card-header bg-light border-0 p-3 d-flex align-items-center gap-2">
                                            <span className="fs-20">{selectedPage?.icono || "📝"}</span>
                                            {editingTitle ? (
                                                <Input
                                                    bsSize="sm"
                                                    value={titleValue}
                                                    onChange={(e) => setTitleValue(e.target.value)}
                                                    onBlur={handleTitleSave}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                                    autoFocus
                                                    className="fw-bold fs-16 border-0 bg-transparent"
                                                    style={{ maxWidth: '400px' }}
                                                />
                                            ) : (
                                                <h5
                                                    className="mb-0 fw-bold text-body flex-grow-1"
                                                    onClick={() => setEditingTitle(true)}
                                                    style={{ cursor: 'text' }}
                                                >
                                                    {titleValue || "Sin título"}
                                                </h5>
                                            )}
                                            <span className="text-muted fs-11 ms-auto">
                                                {updatePageMutation.isPending ? (
                                                    <><Spinner size="sm" className="me-1" /> Guardando...</>
                                                ) : (
                                                    <><i className="ri-check-line text-success me-1"></i> Guardado</>
                                                )}
                                            </span>
                                        </div>

                                        {/* TipTap Toolbar */}
                                        <MenuBar editor={editor} />

                                        {/* Editor Content */}
                                        <CardBody className="p-0">
                                            <div className="tiptap-editor-container" style={{ minHeight: '400px', padding: '1rem' }}>
                                                <EditorContent editor={editor} />
                                            </div>
                                        </CardBody>

                                        {/* Attachments section */}
                                        <div className="border-top p-3">
                                            <h6 className="text-muted fw-bold mb-2">
                                                <i className="ri-attachment-line me-1"></i> Archivos Adjuntos
                                            </h6>
                                            <AttachmentPanel
                                                projectId={activeProjectId}
                                                entityType="pagina"
                                                entityId={selectedPageId}
                                            />
                                        </div>
                                    </>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* TipTap Styles */}
            <style>{`
                .tiptap-editor-container .tiptap {
                    outline: none;
                    min-height: 400px;
                }
                .tiptap-editor-container .tiptap > * + * {
                    margin-top: 0.5em;
                }
                .tiptap-editor-container .tiptap h1 { font-size: 2em; font-weight: 700; }
                .tiptap-editor-container .tiptap h2 { font-size: 1.5em; font-weight: 600; }
                .tiptap-editor-container .tiptap h3 { font-size: 1.25em; font-weight: 600; }
                .tiptap-editor-container .tiptap ul,
                .tiptap-editor-container .tiptap ol { padding-left: 1.5em; }
                .tiptap-editor-container .tiptap code {
                    background: rgba(97, 97, 97, 0.1);
                    border-radius: 0.25em;
                    padding: 0.15em 0.4em;
                    font-size: 0.9em;
                }
                .tiptap-editor-container .tiptap pre {
                    background: #1e1e2e;
                    color: #cdd6f4;
                    border-radius: 0.5em;
                    padding: 1em;
                    overflow-x: auto;
                }
                .tiptap-editor-container .tiptap pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                }
                .tiptap-editor-container .tiptap blockquote {
                    border-left: 3px solid var(--vz-primary);
                    padding-left: 1em;
                    color: #666;
                    font-style: italic;
                }
                .tiptap-editor-container .tiptap hr {
                    border: none;
                    border-top: 2px solid #e5e5e5;
                    margin: 1.5em 0;
                }
                .tiptap-editor-container .tiptap img {
                    max-width: 100%;
                    border-radius: 0.5em;
                }
                .tiptap-editor-container .tiptap ul[data-type="taskList"] {
                    list-style: none;
                    padding-left: 0;
                }
                .tiptap-editor-container .tiptap ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5em;
                }
                .tiptap-editor-container .tiptap ul[data-type="taskList"] li label {
                    margin-top: 0.15em;
                }
                .tiptap-editor-container .tiptap p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </React.Fragment>
    );
};

export default Pages;
