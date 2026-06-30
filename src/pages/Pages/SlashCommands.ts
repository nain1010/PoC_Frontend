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
            title: 'Texto',
            description: 'Empezar a escribir texto plano.',
            icon: 'ri-paragraph',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('paragraph').run();
            },
        },
        {
            title: 'Encabezado 1',
            description: 'Título de sección principal.',
            icon: 'ri-h-1',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: 'Encabezado 2',
            description: 'Subtítulo.',
            icon: 'ri-h-2',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: 'Lista con viñetas',
            description: 'Crear una lista simple.',
            icon: 'ri-list-unordered',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: 'Lista de tareas',
            description: 'Rastrear tareas con checkboxes.',
            icon: 'ri-checkbox-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
        },
        {
            title: 'Bloque de código',
            description: 'Capturar un bloque de código.',
            icon: 'ri-code-box-line',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
        {
            title: 'Cita',
            description: 'Bloque de cita enfatizado.',
            icon: 'ri-double-quotes-l',
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: 'Imagen',
            description: 'Insertar una imagen por URL.',
            icon: 'ri-image-line',
            command: ({ editor, range }) => {
                const url = window.prompt('URL de la imagen:');
                if (url) {
                    editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
                } else {
                    editor.chain().focus().deleteRange(range).run();
                }
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
