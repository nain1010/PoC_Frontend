import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        columnGroup: {
            setColumns: (cols: number) => ReturnType;
        };
    }
}

export const ColumnGroup = Node.create({
    name: 'columnGroup',

    group: 'block',

    content: 'column{2,4}',

    parseHTML() {
        return [
            {
                tag: 'div[data-type="column-group"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column-group', style: 'display: flex; gap: 1rem; margin-top: 1rem; margin-bottom: 1rem;' }), 0];
    },

    addCommands() {
        return {
            setColumns:
                (cols: number) =>
                ({ commands }) => {
                    const columns = Array.from({ length: cols }).map(() => ({
                        type: 'column',
                        content: [{ type: 'paragraph' }],
                    }));
                    return commands.insertContent({
                        type: this.name,
                        content: columns,
                    });
                },
        };
    },
});

export const Column = Node.create({
    name: 'column',

    content: 'block+',

    isolating: true,

    parseHTML() {
        return [
            {
                tag: 'div[data-type="column"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', style: 'flex: 1 1 0%; min-width: 0;' }), 0];
    },
});

export const ColumnExtensions = [ColumnGroup, Column];
