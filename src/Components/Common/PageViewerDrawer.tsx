import React, { useEffect, useState } from 'react';
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button, Spinner } from 'reactstrap';
import { useQuery } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { MathExtensions } from '../../pages/Pages/MathExtension';
import { ColumnExtensions } from '../../pages/Pages/ColumnExtension';
import CalloutExtension from '../../pages/Pages/CalloutExtension';
import CustomImage from '../../pages/Pages/CustomImageExtension';
import AttachmentExtension from '../../pages/Pages/AttachmentExtension';
import VideoExtension from '../../pages/Pages/VideoExtension';
import Link from '@tiptap/extension-link';
import { UniqueId } from '../../pages/Pages/UniqueIdExtension';
import { CommentMark } from '../../pages/Pages/CommentMark';
import * as Y from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';

const api = APIClient;

interface PageViewerDrawerProps {
    isOpen: boolean;
    toggle: () => void;
    pageId: string | null;
    projectId: string;
}

const PageViewerDrawer = ({ isOpen, toggle, pageId, projectId }: PageViewerDrawerProps) => {
    const { data: rawPageContent, isLoading } = useQuery({
        queryKey: ['page', pageId],
        queryFn: () => api.get(`/projects/${projectId}/pages/${pageId}`),
        enabled: isOpen && !!pageId && !!projectId
    });
    const pageContent: any = rawPageContent;

    const [ydoc] = useState(() => new Y.Doc());

    const editor = useEditor({
        editable: false,
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({ document: ydoc }),
            TaskList,
            TaskItem.configure({ nested: true }),
            CustomImage.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: true }),
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
        ],
    });

    useEffect(() => {
        if (pageContent && editor) {
            if (pageContent.contenido) {
                try {
                    const parsed = JSON.parse(pageContent.contenido);
                    if (parsed.crdt_b64) {
                        const binaryString = atob(parsed.crdt_b64);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        Y.applyUpdate(ydoc, bytes);
                    } else if (parsed.text_fallback) {
                        editor.commands.setContent(parsed.text_fallback);
                    } else {
                        editor.commands.setContent(parsed);
                    }
                } catch (e) {
                    editor.commands.setContent(pageContent.contenido);
                }
            } else {
                editor.commands.setContent('');
            }
        }
    }, [pageContent, editor, ydoc]);

    return (
        <Offcanvas isOpen={isOpen} toggle={toggle} direction="end" style={{ width: '800px', maxWidth: '100vw' }}>
            <OffcanvasHeader toggle={toggle} className="border-bottom bg-light">
                <div className="d-flex align-items-center gap-2">
                    <h4 className="mb-0">{pageContent?.titulo || 'Cargando...'}</h4>
                </div>
            </OffcanvasHeader>
            <OffcanvasBody className="bg-white p-0">
                {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                        <Spinner color="primary" />
                    </div>
                ) : (
                    (!pageContent?.contenido || pageContent.contenido.trim() === '' || pageContent.contenido === '{"type":"doc","content":[{"type":"paragraph"}]}') ? (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-4 text-center">
                            <i className="ri-file-text-line display-4 mb-3 text-light"></i>
                            <h5>Esta página está vacía</h5>
                            <p className="mb-4">No hay contenido escrito en esta página todavía.</p>
                            <Button color="primary" onClick={() => window.open(`/pages?pageId=${pageId}`, '_blank')}>
                                <i className="ri-edit-line me-1"></i> Empezar a escribir
                            </Button>
                        </div>
                    ) : (
                        <div className="tiptap-plane-theme p-4" style={{ backgroundColor: 'var(--vz-body-bg)' }}>
                            <div className="editor-content-wrapper mx-auto" style={{ maxWidth: '100%' }}>
                                <EditorContent editor={editor} />
                            </div>
                        </div>
                    )
                )}
            </OffcanvasBody>
            <div className="p-3 border-top bg-light d-flex justify-content-end">
                <Button color="primary" onClick={() => window.open(`/pages?pageId=${pageId}`, '_blank')}>
                    Abrir en editor completo <i className="ri-external-link-line ms-1"></i>
                </Button>
            </div>
        </Offcanvas>
    );
};

export default PageViewerDrawer;
