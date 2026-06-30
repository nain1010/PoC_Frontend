import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ImageNodeView = (props: any) => {
    const { node, updateAttributes, selected } = props;
    const { src, alt, width, align } = node.attrs;

    const [isResizing, setIsResizing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Store initial resize state
    const resizeInitial = useRef({ x: 0, width: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        if (imageRef.current) {
            resizeInitial.current = {
                x: e.clientX,
                width: imageRef.current.offsetWidth
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            // Calculate new width
            const deltaX = e.clientX - resizeInitial.current.x;
            
            // If image is aligned left, pulling right increases width.
            // If center, pulling right increases width by 2x delta (or just let it scale naturally).
            // Let's just do a simple delta mapping.
            let newWidth = resizeInitial.current.width + deltaX;
            
            if (newWidth < 100) newWidth = 100; // Min width
            
            // Convert to percentage or pixels. Let's use pixels for precise dragging.
            updateAttributes({ width: `${newWidth}px` });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, updateAttributes]);

    const alignStyle = align === 'center' ? { margin: '0 auto' } : align === 'right' ? { marginLeft: 'auto' } : { marginRight: 'auto' };
    const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

    return (
        <NodeViewWrapper className="react-component-image-node" style={{ display: 'flex', justifyContent, padding: '1rem 0' }}>
            <div 
                ref={containerRef}
                className={`position-relative d-inline-block ${selected ? 'is-selected' : ''}`}
                style={{ width: width, ...alignStyle, maxWidth: '100%', transition: isResizing ? 'none' : 'width 0.2s' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <img 
                    ref={imageRef}
                    src={src} 
                    alt={alt || ''} 
                    className="img-fluid rounded shadow-sm"
                    style={{ 
                        width: '100%', 
                        display: 'block',
                        outline: selected ? '2px solid var(--vz-primary)' : 'none',
                        cursor: 'default'
                    }} 
                />

                {/* Toolbar */}
                {(selected || isHovered) && (
                    <div 
                        className="position-absolute d-flex gap-1 bg-dark rounded shadow-lg p-1" 
                        style={{ top: '8px', right: '8px', zIndex: 10, opacity: 0.9 }}
                    >
                        <button className="btn btn-sm btn-ghost-light p-1 text-white" onClick={() => updateAttributes({ align: 'left' })} title="Align Left">
                            <i className="ri-align-left"></i>
                        </button>
                        <button className="btn btn-sm btn-ghost-light p-1 text-white" onClick={() => updateAttributes({ align: 'center' })} title="Align Center">
                            <i className="ri-align-center"></i>
                        </button>
                        <button className="btn btn-sm btn-ghost-light p-1 text-white" onClick={() => updateAttributes({ align: 'right' })} title="Align Right">
                            <i className="ri-align-right"></i>
                        </button>
                        <div className="vr bg-white opacity-50 mx-1"></div>
                        <a href={src} download="image" target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost-light p-1 text-white" title="Download">
                            <i className="ri-download-2-line"></i>
                        </a>
                        <button className="btn btn-sm btn-ghost-light p-1 text-white" onClick={() => setIsFullscreen(true)} title="Full Screen">
                            <i className="ri-fullscreen-line"></i>
                        </button>
                    </div>
                )}

                {/* Resize Handle */}
                {selected && (
                    <div 
                        className="position-absolute bg-primary rounded-pill border border-2 border-white"
                        style={{ 
                            width: '12px', height: '36px', 
                            right: '-6px', top: '50%', transform: 'translateY(-50%)',
                            cursor: 'ew-resize', zIndex: 10
                        }}
                        onMouseDown={handleMouseDown}
                    ></div>
                )}
            </div>

            {/* Lightbox / Fullscreen Modal */}
            {isFullscreen && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 99999 }}
                    onClick={() => setIsFullscreen(false)}
                >
                    <button 
                        className="position-absolute btn btn-ghost-light text-white" 
                        style={{ top: '20px', right: '20px', fontSize: '24px' }}
                        onClick={() => setIsFullscreen(false)}
                    >
                        <i className="ri-close-line"></i>
                    </button>
                    <img 
                        src={src} 
                        alt="Fullscreen" 
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </NodeViewWrapper>
    );
};

export default ImageNodeView;
