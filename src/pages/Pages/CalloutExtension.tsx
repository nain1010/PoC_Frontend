import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';

const CalloutComponent = (props: any) => {
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    const updateEmoji = (emoji: string) => {
        props.updateAttributes({ emoji });
        setIsEmojiPickerOpen(false);
    };

    return (
        <NodeViewWrapper className="callout-block d-flex gap-3 p-3 my-3 rounded" style={{ backgroundColor: 'var(--vz-primary-bg-subtle)', borderLeft: '4px solid var(--vz-primary)' }}>
            <div 
                className="callout-emoji position-relative" 
                style={{ cursor: 'pointer', fontSize: '1.2rem', userSelect: 'none' }}
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            >
                {props.node.attrs.emoji}
                
                {isEmojiPickerOpen && (
                    <div className="position-absolute bg-white shadow-sm border rounded p-1 d-flex gap-1" style={{ top: '100%', left: 0, zIndex: 10, width: 'max-content' }}>
                        {['💡', '⚠️', 'ℹ️', '🔥', '✅'].map(e => (
                            <span key={e} className="p-1 rounded hover-bg-light" onClick={() => updateEmoji(e)} style={{cursor: 'pointer'}}>{e}</span>
                        ))}
                    </div>
                )}
            </div>
            <NodeViewContent className="callout-content flex-grow-1" style={{ margin: 0, color: 'var(--vz-body-color)' }} />
        </NodeViewWrapper>
    );
};

export default Node.create({
    name: 'callout',
    group: 'block',
    content: 'inline*',
    
    addAttributes() {
        return {
            emoji: {
                default: '💡',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="callout"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutComponent);
    },
});
