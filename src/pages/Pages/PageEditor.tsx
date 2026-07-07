import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Input } from 'reactstrap';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CustomImage from './CustomImageExtension';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { TableCell } from '@tiptap/extension-table-cell';
import { UniqueId } from './UniqueIdExtension';
import { CommentMark } from './CommentMark';
import CalloutExtension from './CalloutExtension';
import Highlight from '@tiptap/extension-highlight';
import AttachmentExtension from './AttachmentExtension';
import { ColumnExtensions } from './ColumnExtension';
import VideoExtension from './VideoExtension';
import { MathExtensions } from './MathExtension';
import EmojiCommands, { getEmojiSuggestionItems, renderEmojiItems } from './EmojiCommands';
import Mention from '@tiptap/extension-mention';
import { getSuggestionConfig } from './suggestion';
import SlashCommands, { getSuggestionItems, renderItems } from './SlashCommands';

import TextBubbleMenu from './TextBubbleMenu';
import TableBubbleMenu from './TableBubbleMenu';
import TopToolbar from './TopToolbar';
import RightSidebar from './RightSidebar';
import { toast } from 'react-toastify';
import config from '../../config';

// Yjs imports
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

const PageEditorWrapper = ({
    pageId,
    pageContent,
    titleValue,
    setTitleValue,
    updatePageMutation,
    isFullWidth,
    setIsFullWidth,
    activeProjectId,
    uploadImage,
    handleTitleSave,
    onDeletePage,
    onDownloadPage
}: any) => {
    const saveTimerRef = useRef<any>(null);
    const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
    const [hoveredBlockPos, setHoveredBlockPos] = useState({ top: 0, left: 0 });
    const isEditable = !pageContent?.is_locked;
    const [peersCount, setPeersCount] = useState(1);

    // Inicializar YDoc y cargar estado inicial (si existe en BD)
    const ydoc = useMemo(() => {
        const doc = new Y.Doc();
        if (pageContent?.contenido) {
            try {
                const parsed = JSON.parse(pageContent.contenido);
                if (parsed.crdt_b64) {
                    const binary = Uint8Array.from(atob(parsed.crdt_b64), c => c.charCodeAt(0));
                    Y.applyUpdate(doc, binary);
                }
            } catch(e) {}
        }
        return doc;
    }, []); // IMPORTANTE: Se ejecuta 1 sola vez porque key={pageId} en el padre fuerza el remount

    // Configurar WebSocket Provider (Backend Relay)
    const provider = useMemo(() => {
        const loggedUser = JSON.parse(sessionStorage.getItem('authUser') || localStorage.getItem('authUser') || '{}');
        const token = loggedUser?.token || '';
        
        const baseUrl = config.api.API_URL.endsWith('/') ? config.api.API_URL.slice(0, -1) : config.api.API_URL;
        const wsUrl = baseUrl.replace('http', 'ws').replace('https', 'wss') + '/api/collab';
        
        const wsProvider = new WebsocketProvider(wsUrl, pageId, ydoc, {
            params: { token: token }
        });
        
        wsProvider.awareness.on('change', () => {
            setPeersCount(wsProvider.awareness.getStates().size);
        });

        return wsProvider;
    }, [pageId, ydoc]);

    useEffect(() => {
        return () => {
            provider.destroy();
        };
    }, [provider]);

    const loggedUser = JSON.parse(sessionStorage.getItem('authUser') || localStorage.getItem('authUser') || '{}');
    const userName = loggedUser?.nombre_completo || 'Usuario';
    const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false, // Requerido por Yjs
            }),
            Collaboration.configure({
                document: ydoc,
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: {
                    name: userName,
                    color: userColor
                }
            }),
            Placeholder.configure({ placeholder: "Escribe '/' para comandos, o simplemente empieza a escribir..." }),
            TaskList,
            TaskItem.configure({ nested: true }),
            CustomImage.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: true, linkOnPaste: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            UniqueId,
            CommentMark,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            CalloutExtension,
            AttachmentExtension,
            ...ColumnExtensions,
            VideoExtension,
            ...MathExtensions,
            EmojiCommands.configure({
                suggestion: {
                    items: ({ query }: any) => {
                        return getEmojiSuggestionItems().filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
                    },
                    render: renderEmojiItems,
                },
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention bg-soft-primary text-primary px-1 rounded fw-medium text-decoration-none',
                },
                suggestion: getSuggestionConfig(activeProjectId || "") as any,
            }),
            SlashCommands.configure({
                suggestion: {
                    items: ({ query }: any) => {
                        return getSuggestionItems().filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
                    },
                    render: renderItems,
                },
            }),
        ],
        editable: isEditable,
        onUpdate: ({ editor }) => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                const b64Crdt = btoa(String.fromCharCode(...Array.from(Y.encodeStateAsUpdate(ydoc))));
                const jsonToSave = {
                    ...editor.getJSON(),
                    crdt_b64: b64Crdt
                };
                updatePageMutation.mutate({
                    id: pageId,
                    contenido: JSON.stringify(jsonToSave),
                });
            }, 1500);
        },
        editorProps: {
            attributes: { class: 'prose prose-lg focus:outline-none w-100 max-w-none text-body' },
            handleDrop: function(view, event, slice, moved) {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const { schema } = view.state;
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        uploadImage(file).then((url: any) => {
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
                        uploadImage(file).then((url: any) => {
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

    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable);
        }
    }, [isEditable, editor]);

    // Block Anchor Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!editor || editor.isDestroyed || !isEditable) return;
            const target = e.target as HTMLElement;
            const block = target.closest('[id^="block-"]') as HTMLElement;
            if (block) {
                const rect = block.getBoundingClientRect();
                setHoveredBlockId(block.id);
                setHoveredBlockPos({ top: rect.top + window.scrollY, left: rect.left - 24 });
            } else {
                setHoveredBlockId(null);
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [editor, isEditable]);

    const handleCopyAnchor = () => {
        if (hoveredBlockId) {
            const url = `${window.location.origin}${window.location.pathname}#${hoveredBlockId}`;
            navigator.clipboard.writeText(url);
            toast.success("Enlace del bloque copiado al portapapeles", { position: "top-center" });
        }
    };

    // Scroll to hash if present
    useEffect(() => {
        setTimeout(() => {
            if (window.location.hash) {
                const id = window.location.hash.substring(1);
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('bg-warning', 'bg-opacity-25');
                    setTimeout(() => {
                        element.classList.remove('bg-warning', 'bg-opacity-25');
                    }, 2000);
                }
            }
        }, 300);
    }, []);

    return (
        <>
            <TopToolbar 
                editor={editor} 
                isLocked={pageContent?.is_locked}
                toggleLock={() => updatePageMutation.mutate({ id: pageId, is_locked: !pageContent?.is_locked })}
                isFullWidth={isFullWidth}
                toggleFullWidth={() => setIsFullWidth(!isFullWidth)}
                isPublic={pageContent?.is_public}
                publicToken={pageContent?.public_token}
                togglePublish={() => updatePageMutation.mutate({ id: pageId, is_public: !pageContent?.is_public })}
                onDeletePage={onDeletePage}
                onDownloadPage={onDownloadPage}
                pageTitle={pageContent?.titulo}
            />
            
            <div className="d-flex flex-grow-1 w-100 h-100 overflow-hidden">
                <div className="flex-grow-1 d-flex justify-content-center overflow-auto" style={{ scrollBehavior: 'smooth' }}>
                    <div className="editor-content-wrapper px-4 py-5" style={{ width: '100%', maxWidth: isFullWidth ? '100%' : '850px', transition: 'max-width 0.3s ease' }}>
                        
                        <div className="d-flex align-items-center mb-4">
                            <Input
                                type="text"
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                onBlur={handleTitleSave}
                                placeholder="Page Title"
                                className="fw-bold bg-transparent border-0 p-0 text-body title-input-plane flex-grow-1"
                                style={{ fontSize: '2.8rem', boxShadow: 'none', lineHeight: '1.2' }}
                            />
                            <div className="ms-3 d-flex align-items-center">
                                {peersCount > 1 ? (
                                    <span className="badge bg-soft-success text-success d-flex align-items-center gap-1" title={`${peersCount} colaboradores conectados`}>
                                        <i className="ri-group-line"></i> {peersCount} en vivo
                                    </span>
                                ) : (
                                    <span className="badge bg-soft-secondary text-secondary d-flex align-items-center gap-1" title="Solo tú estás en esta página">
                                        <i className="ri-user-line"></i> Solo tú
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="tiptap-plane-theme">
                            {editor && (
                                <>
                                    <TextBubbleMenu editor={editor} />
                                    <TableBubbleMenu editor={editor} />
                                    <EditorContent editor={editor} />
                                    
                                    {hoveredBlockId && isEditable && (
                                        <div 
                                            className="position-absolute"
                                            style={{
                                                top: hoveredBlockPos.top,
                                                left: hoveredBlockPos.left,
                                                cursor: 'pointer',
                                                zIndex: 50,
                                                opacity: 0.5,
                                                transition: 'opacity 0.2s',
                                            }}
                                            onClick={handleCopyAnchor}
                                            title="Copiar enlace a este bloque"
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                                        >
                                            <i className="ri-links-line fs-5"></i>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        
                        <input
                            type="file"
                            id="tiptap-image-upload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    uploadImage(e.target.files[0]).then((url: any) => {
                                        if (url && editor) editor.chain().focus().setImage({ src: url }).run();
                                    });
                                }
                                e.target.value = '';
                            }}
                        />
                        <input
                            type="file"
                            id="tiptap-file-upload"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    uploadImage(e.target.files[0]).then((url: any) => {
                                        if (url && editor) editor.chain().focus().setAttachment({ src: url, filename: e.target.files![0].name, filesize: e.target.files![0].size }).run();
                                    });
                                }
                                e.target.value = '';
                            }}
                        />
                        <input
                            type="file"
                            id="tiptap-video-upload"
                            accept="video/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    uploadImage(e.target.files[0]).then((url: any) => {
                                        if (url && editor) editor.chain().focus().setVideo({ src: url, isYouTube: false }).run();
                                    });
                                }
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>

                <RightSidebar editor={editor} projectId={activeProjectId} pageId={pageId} pageContent={pageContent} />
            </div>
        </>
    );
};

export default PageEditorWrapper;
