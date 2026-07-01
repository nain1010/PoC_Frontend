import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        comment: {
            setComment: (commentId: string) => ReturnType;
            unsetComment: (commentId: string) => ReturnType;
        };
    }
}

export const CommentMark = Mark.create<CommentOptions>({
    name: 'comment',
    
    addOptions() {
        return {
            HTMLAttributes: {
                class: 'inline-comment-mark bg-warning bg-opacity-25',
                style: 'cursor: pointer; border-bottom: 2px solid var(--vz-warning);',
            },
        };
    },

    addAttributes() {
        return {
            commentId: {
                default: null,
                parseHTML: element => element.getAttribute('data-comment-id'),
                renderHTML: attributes => {
                    if (!attributes.commentId) {
                        return {};
                    }
                    return {
                        'data-comment-id': attributes.commentId,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-comment-id]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setComment: (commentId: string) => ({ commands }) => {
                return commands.setMark(this.name, { commentId });
            },
            unsetComment: (commentId: string) => ({ tr, dispatch }) => {
                return true;
            },
        };
    },
});
