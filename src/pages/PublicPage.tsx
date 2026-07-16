import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CustomImage from './Pages/CustomImageExtension';
import Link from '@tiptap/extension-link';
import { UniqueId } from './Pages/UniqueIdExtension';
import { CommentMark } from './Pages/CommentMark';
import CalloutExtension from './Pages/CalloutExtension';
import AttachmentExtension from './Pages/AttachmentExtension';
import { ColumnExtensions } from './Pages/ColumnExtension';
import VideoExtension from './Pages/VideoExtension';
import { MathExtensions } from './Pages/MathExtension';
import { APIClient } from '../helpers/api_helper';

import * as Y from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';

const api = APIClient;

const PublicPage = () => {
    const { token } = useParams<{ token: string }>();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const response: any = await api.get(`/public/pages/${token}`);
                if (response.error) {
                    setError(true);
                } else {
                    setPage(response);
                    document.title = `${response.titulo} | Wiki`;
                }
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [token]);

    const ydoc = useMemo(() => new Y.Doc(), []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({
                document: ydoc,
            }),
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
        ],
        content: '',
        editable: false,
        editorProps: {
            attributes: { class: 'prose prose-lg focus:outline-none w-100 max-w-none text-body' },
        }
    });

    useEffect(() => {
        if (editor && page && page.contenido) {
            try {
                const jsonContent = JSON.parse(page.contenido);
                if (jsonContent.crdt_b64) {
                    // Handle Yjs CRDT state
                    const binaryString = atob(jsonContent.crdt_b64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    Y.applyUpdate(ydoc, bytes);
                } else {
                    // Fallback to normal JSON
                    editor.commands.setContent(jsonContent);
                }
            } catch (e) {
                // Fallback to normal HTML/Text
                editor.commands.setContent(page.contenido);
            }
            
            // Scroll to hash
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
            }, 100);
        }
    }, [editor, page]);

    if (loading) return <div className="p-5 text-center min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--vz-body-bg)' }}><div className="spinner-border text-primary"></div></div>;
    if (error || !page) return <div className="p-5 text-center min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--vz-body-bg)' }}><h3 className="text-muted">Página no encontrada o no disponible públicamente</h3></div>;

    return (
        <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--vz-body-bg)', color: 'var(--vz-body-color)' }}>
            <div className="flex-grow-1 d-flex justify-content-center overflow-auto py-5">
                <div className="px-4" style={{ width: '100%', maxWidth: '850px' }}>
                    <h1 className="mb-4 fw-bold" style={{ fontSize: '2.8rem', lineHeight: '1.2' }}>
                        {page.icono && page.icono !== "📝" && page.icono !== "📄" ? `${page.icono} ` : ''}{page.titulo}
                    </h1>
                    <div className="tiptap-plane-theme">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicPage;

