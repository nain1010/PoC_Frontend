import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Input, Spinner } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
// @ts-ignore
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

// Nuevas extensiones avanzadas
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import CalloutExtension from './CalloutExtension';

import SlashCommands, { getSuggestionItems, renderItems } from './SlashCommands';
import TopToolbar from './TopToolbar';
import TableBubbleMenu from './TableBubbleMenu';
import { APIClient } from '../../helpers/api_helper';
import config from '../../config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const api = APIClient;

const Pages = () => {
    const queryClient = useQueryClient();
    const activeProjectId = localStorage.getItem('activeProjectId');
    const activeProjectName = localStorage.getItem('activeProjectName');

    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
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
        onError: (err: any) => toast.error(err || "Error al crear.", { position: "top-right" }),
    });

    const updatePageMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/projects/${activeProjectId}/pages/${payload.id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
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
            Link.configure({ openOnClick: true, linkOnPaste: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            CalloutExtension,
            SlashCommands.configure({
                suggestion: {
                    items: ({ query }) => {
                        return getSuggestionItems().filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
                    },
                    render: renderItems,
                },
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            // Debounced auto-save storing JSON
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                if (selectedPageId) {
                    updatePageMutation.mutate({
                        id: selectedPageId,
                        contenido: JSON.stringify(editor.getJSON()),
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
            setTitleValue(pageContent.titulo || "Sin título");
            
            if (pageContent.contenido) {
                try {
                    const jsonContent = JSON.parse(pageContent.contenido);
                    editor.commands.setContent(jsonContent);
                } catch (e) {
                    // Fallback para HTML (retrocompatibilidad)
                    editor.commands.setContent(pageContent.contenido);
                }
            } else {
                editor.commands.setContent('');
            }
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
            <div className="page-content d-flex flex-column align-items-center justify-content-center" style={{ height: '100vh', padding: '70px 0 0 0', backgroundColor: 'var(--vz-body-bg)' }}>
                <div className="text-center text-muted">
                    <i className="ri-file-text-line display-1 mb-3 d-inline-block"></i>
                    <h4>Selecciona un proyecto para ver sus documentos</h4>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="page-content d-flex overflow-hidden" style={{ height: '100vh', padding: '70px 0 0 0', backgroundColor: 'var(--vz-body-bg)' }}>
                
                {/* ======= Sidebar (Left): Pages Tree ======= */}
                <div className="border-end" style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--vz-card-bg-custom)' }}>
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                        <span className="fw-semibold text-uppercase fs-11 text-muted">
                            {activeProjectName}
                        </span>
                        <div className="d-flex gap-1">
                            <Button color="light" size="sm" className="btn-icon p-0 bg-transparent border-0 text-muted hover-bg-soft-primary rounded" onClick={handleCreatePage}>
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
                                {pages.map((page: any) => (
                                    <div
                                        key={page.id}
                                        className={`list-group-item list-group-item-action d-flex align-items-center gap-2 border-0 px-2 py-1 mb-1 rounded ${
                                            selectedPageId === page.id ? 'bg-soft-primary text-primary fw-semibold' : 'bg-transparent text-body hover-bg-soft-light'
                                        }`}
                                        onClick={() => setSelectedPageId(page.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="fs-14 opacity-75">{page.icono || "📝"}</span>
                                        <span className="flex-grow-1 text-truncate fs-13">
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
                            <i className="ri-draft-line display-1 mb-3 opacity-50"></i>
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
                            {/* Plane-like Top Toolbar */}
                            <TopToolbar editor={editor} />
                            
                            <div className="d-flex flex-grow-1 w-100 h-100 overflow-hidden">
                                {/* Editor Central Area */}
                                <div className="flex-grow-1 d-flex justify-content-center overflow-auto" style={{ scrollBehavior: 'smooth' }}>
                                    <div className="editor-content-wrapper px-4 py-5" style={{ width: '100%', maxWidth: '850px' }}>
                                        
                                        {/* Título Gigante */}
                                        <Input
                                            type="text"
                                            value={titleValue}
                                            onChange={(e) => setTitleValue(e.target.value)}
                                            onBlur={handleTitleSave}
                                            placeholder="Page Title"
                                            className="fw-bold bg-transparent border-0 p-0 mb-4 text-body title-input-plane"
                                            style={{ fontSize: '2.8rem', boxShadow: 'none', lineHeight: '1.2' }}
                                        />

                                        {/* Editor Principal */}
                                        <div className="tiptap-plane-theme">
                                            {editor && (
                                                <>
                                                    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bubble-menu shadow-sm rounded-pill overflow-hidden border">
                                                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><i className="ri-bold"></i></button>
                                                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><i className="ri-italic"></i></button>
                                                        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}><i className="ri-underline"></i></button>
                                                        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}><i className="ri-strikethrough"></i></button>
                                                        <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''}><i className="ri-code-line"></i></button>
                                                    </BubbleMenu>
                                                    <TableBubbleMenu editor={editor} />
                                                </>
                                            )}
                                            <EditorContent editor={editor} />
                                        </div>
                                        
                                        {/* Hidden File Input for Image Upload */}
                                        <input
                                            type="file"
                                            id="tiptap-image-upload"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    uploadImage(file).then(url => {
                                                        if (url && editor) {
                                                            editor.chain().focus().setImage({ src: url }).run();
                                                        }
                                                        e.target.value = '';
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
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
            `}</style>
        </React.Fragment>
    );
};

export default Pages;
