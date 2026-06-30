import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from './ImageNodeView';

export interface ImageOptions {
    inline: boolean;
    allowBase64: boolean;
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        customImage: {
            setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
        };
    }
}

export const CustomImage = Node.create<ImageOptions>({
    name: 'image',

    addOptions() {
        return {
            inline: false,
            allowBase64: false,
            HTMLAttributes: {},
        };
    },

    inline() {
        return this.options.inline;
    },

    group() {
        return this.options.inline ? 'inline' : 'block';
    },

    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            width: {
                default: '100%',
            },
            align: {
                default: 'center',
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: this.options.allowBase64
                    ? 'img[src]'
                    : 'img[src]:not([src^="data:"])',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setImage:
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
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

export default CustomImage;
