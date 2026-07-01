import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathNodeView = (props: any) => {
    const { node, updateAttributes, selected, deleteNode } = props;
    const { latex, isInline } = node.attrs;
    const [isEditing, setIsEditing] = useState(latex === '');
    const [inputValue, setInputValue] = useState(latex);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isEditing && containerRef.current && latex) {
            try {
                katex.render(latex, containerRef.current, {
                    displayMode: !isInline,
                    throwOnError: false,
                    errorColor: '#f06548',
                });
            } catch (e) {
                console.error(e);
            }
        }
    }, [latex, isEditing, isInline]);

    const handleSave = () => {
        setIsEditing(false);
        updateAttributes({ latex: inputValue });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (isInline || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleSave();
        }
    };

    const wrapperStyle = isInline 
        ? { display: 'inline-block', verticalAlign: 'middle', margin: '0 4px', cursor: 'pointer' }
        : { display: 'block', margin: '1rem 0', textAlign: 'center' as const, cursor: 'pointer' };

    return (
        <NodeViewWrapper 
            className={`react-component-math-node ${selected ? 'ProseMirror-selectednode' : ''}`}
            style={wrapperStyle}
        >
            {isEditing ? (
                <div className={`d-flex align-items-center gap-2 ${isInline ? 'd-inline-flex' : 'justify-content-center'}`}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="form-control form-control-sm bg-dark text-light border-secondary"
                        style={{ minWidth: isInline ? '150px' : '300px', fontFamily: 'monospace' }}
                        placeholder="Escribe sintaxis LaTeX (ej: a^2 + b^2 = c^2)"
                        autoFocus
                    />
                    {!isInline && selected && (
                        <button className="btn btn-sm btn-ghost-danger p-1" onClick={deleteNode} onMouseDown={e => e.preventDefault()}>
                            <i className="ri-delete-bin-line"></i>
                        </button>
                    )}
                </div>
            ) : (
                <div 
                    onClick={() => setIsEditing(true)} 
                    className={`rounded p-1 px-2 ${selected ? 'border border-primary bg-soft-primary' : 'border border-transparent'}`}
                    style={{ minHeight: '24px', minWidth: '24px', display: 'inline-block' }}
                >
                    {latex ? (
                        <div ref={containerRef}></div>
                    ) : (
                        <span className="text-muted fst-italic">Clic para agregar ecuación...</span>
                    )}
                </div>
            )}
        </NodeViewWrapper>
    );
};

export default MathNodeView;
