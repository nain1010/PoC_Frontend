import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { CommandList } from './CommandList';

export default Extension.create({
    name: 'slashCommands',
    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }) => {
                    props.command({ editor, range });
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const getSuggestionItems = () => {
    return [
        {
            title: 'Text',
            description: 'Escribir texto plano.',
            icon: 'ri-text',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('paragraph').run();
            },
        },
        {
            title: 'Heading 1',
            description: 'Título de sección principal.',
            icon: 'ri-h-1',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: 'Heading 2',
            description: 'Subtítulo.',
            icon: 'ri-h-2',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: 'Heading 3',
            description: 'Título de subsección.',
            icon: 'ri-h-3',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
            },
        },
        {
            title: 'Heading 4',
            description: 'Título menor 4.',
            icon: 'ri-h-4',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run();
            },
        },
        {
            title: 'Heading 5',
            description: 'Título menor 5.',
            icon: 'ri-h-5',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 5 }).run();
            },
        },
        {
            title: 'Heading 6',
            description: 'Título menor 6.',
            icon: 'ri-h-6',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 6 }).run();
            },
        },
        {
            title: 'Bullet List',
            description: 'Lista desordenada.',
            icon: 'ri-list-unordered',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: 'Numbered List',
            description: 'Lista ordenada.',
            icon: 'ri-list-ordered',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: 'To-do List',
            description: 'Casillas de verificación.',
            icon: 'ri-list-check-2',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
        },
        {
            title: 'Code Block',
            description: 'Caja para código fuente.',
            icon: 'ri-code-box-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
        {
            title: 'Quote',
            description: 'Cita enfatizada.',
            icon: 'ri-double-quotes-l',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: 'Divider',
            description: 'Línea horizontal divisoria.',
            icon: 'ri-separator',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
        {
            title: 'Table',
            description: 'Insertar tabla 3x3.',
            icon: 'ri-table-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            },
        },
        {
            title: 'Callout',
            description: 'Bloque de alerta con icono.',
            icon: 'ri-information-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertContent({ type: 'callout', content: [{ type: 'text', text: ' ' }] }).run();
            },
        },
        {
            title: 'Imagen',
            description: 'Insertar imagen (JPG, PNG).',
            icon: 'ri-image-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                document.getElementById('tiptap-image-upload')?.click();
            },
        },
        {
            title: 'Archivo Adjunto',
            description: 'Subir archivo (PDF, DOCX, ZIP).',
            icon: 'ri-attachment-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                document.getElementById('tiptap-file-upload')?.click();
            },
        },
        {
            title: 'Video',
            description: 'Subir video o enlazar.',
            icon: 'ri-video-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                document.getElementById('tiptap-video-upload')?.click();
            },
        },
        {
            title: '2 Columnas',
            description: 'Layout en 2 columnas.',
            icon: 'ri-layout-column-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setColumns(2).run();
            },
        },
        {
            title: '3 Columnas',
            description: 'Layout en 3 columnas.',
            icon: 'ri-layout-column-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setColumns(3).run();
            },
        },
        {
            title: '4 Columnas',
            description: 'Layout en 4 columnas.',
            icon: 'ri-layout-column-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setColumns(4).run();
            },
        },
        {
            title: 'Ecuación Matemática',
            description: 'Insertar bloque LaTeX.',
            icon: 'ri-functions',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setBlockEquation().run();
            },
        },
    ];
};

export const renderItems = () => {
    let component;
    let popup;

    return {
        onStart: props => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            });
        },
        onUpdate(props) {
            component.updateProps(props);
            if (!props.clientRect) {
                return;
            }
            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown(props) {
            if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
            }
            return component.ref?.onKeyDown(props);
        },
        onExit() {
            popup[0].destroy();
            component.destroy();
        },
    };
};
