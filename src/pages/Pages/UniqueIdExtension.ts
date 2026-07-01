import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { v4 as uuidv4 } from 'uuid';

export const UniqueId = Extension.create({
    name: 'uniqueId',

    addGlobalAttributes() {
        return [
            {
                types: ['heading', 'paragraph', 'table', 'blockquote', 'taskList', 'bulletList', 'orderedList', 'codeBlock', 'callout', 'image', 'video', 'mathBlock'],
                attributes: {
                    id: {
                        default: null,
                        parseHTML: element => element.getAttribute('id'),
                        renderHTML: attributes => {
                            if (!attributes.id) return {};
                            return { id: attributes.id };
                        },
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('uniqueId'),
                appendTransaction: (transactions, oldState, newState) => {
                    if (!transactions.some(tr => tr.docChanged)) return;

                    let tr = newState.tr;
                    let modified = false;

                    const typesToTrack = ['heading', 'paragraph', 'table', 'blockquote', 'taskList', 'bulletList', 'orderedList', 'codeBlock', 'callout', 'image', 'video', 'mathBlock'];

                    newState.doc.descendants((node, pos) => {
                        if (node.isBlock && typesToTrack.includes(node.type.name)) {
                            if (!node.attrs.id) {
                                tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: `block-${uuidv4().substring(0, 8)}` });
                                modified = true;
                            }
                        }
                    });

                    if (modified) return tr;
                },
            }),
        ];
    },
});
