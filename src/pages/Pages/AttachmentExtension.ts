import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AttachmentNodeView from './AttachmentNodeView';

export interface AttachmentOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        attachment: {
            setAttachment: (options: { src: string; filename: string; filesize?: number }) => ReturnType;
        };
    }
}

export const AttachmentExtension = Node.create<AttachmentOptions>({
    name: 'attachment',

    group: 'block',

    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            src: {
                default: null,
            },
            filename: {
                default: 'Archivo adjunto',
            },
            filesize: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="attachment"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'attachment' }, this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setAttachment:
                options =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: options,
                    });
                },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(AttachmentNodeView);
    },
});

export default AttachmentExtension;
