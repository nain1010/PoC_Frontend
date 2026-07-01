import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MathNodeView from './MathNodeView';

export interface MathOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        blockEquation: {
            setBlockEquation: () => ReturnType;
        };
        inlineEquation: {
            setInlineEquation: () => ReturnType;
        };
    }
}

export const BlockEquation = Node.create<MathOptions>({
    name: 'blockEquation',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            latex: {
                default: '',
            },
            isInline: {
                default: false,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="block-equation"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'block-equation' }, HTMLAttributes)];
    },

    addCommands() {
        return {
            setBlockEquation:
                () =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: { isInline: false },
                    });
                },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathNodeView);
    },
});

export const InlineEquation = Node.create<MathOptions>({
    name: 'inlineEquation',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            latex: {
                default: '',
            },
            isInline: {
                default: true,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="inline-equation"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes({ 'data-type': 'inline-equation' }, HTMLAttributes)];
    },

    addCommands() {
        return {
            setInlineEquation:
                () =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: { isInline: true },
                    });
                },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathNodeView);
    },
});

export const MathExtensions = [BlockEquation, InlineEquation];
