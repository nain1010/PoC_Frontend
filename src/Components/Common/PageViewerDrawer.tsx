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

    const editor = useEditor({
        editable: false,
        extensions: [
            StarterKit,
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
                    const jsonContent = JSON.parse(pageContent.contenido);
                    editor.commands.setContent(jsonContent);
                } catch (e) {
                    editor.commands.setContent(pageContent.contenido);
                }
            } else {
                editor.commands.setContent('');
            }
        }
    }, [pageContent, editor]);

    return (
        <Offcanvas isOpen={isOpen} toggle={toggle} direction="end" style={{ width: '800px', maxWidth: '100vw' }}>
            <OffcanvasHeader toggle={toggle} className="border-bottom bg-light">
                <div className="d-flex align-items-center gap-2">
                    <span className="fs-3">{pageContent?.icono || '📄'}</span>
                    <h4 className="mb-0">{pageContent?.titulo || 'Cargando...'}</h4>
                </div>
            </OffcanvasHeader>
            <OffcanvasBody className="bg-white p-0">
                {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                        <Spinner color="primary" />
                    </div>
                ) : (
                    <div className="tiptap-plane-theme p-4" style={{ backgroundColor: 'var(--vz-body-bg)' }}>
                        <div className="editor-content-wrapper mx-auto" style={{ maxWidth: '100%' }}>
                            <EditorContent editor={editor} />
                        </div>
                    </div>
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
