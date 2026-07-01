import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const VideoNodeView = (props: any) => {
    const { node, selected, deleteNode } = props;
    const { src, isYouTube } = node.attrs;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <NodeViewWrapper 
            className={`react-component-video-node position-relative my-3 ${selected ? 'ProseMirror-selectednode' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className="w-100 bg-dark rounded overflow-hidden shadow-sm"
                style={{ 
                    outline: selected ? '2px solid var(--vz-primary)' : 'none',
                    aspectRatio: '16/9',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}
            >
                {isYouTube ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={src}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <video 
                        src={src} 
                        controls 
                        className="w-100 h-100" 
                        style={{ objectFit: 'contain' }}
                    ></video>
                )}
            </div>

            {/* Toolbar flotante */}
            {(selected || isHovered) && (
                <div 
                    className="position-absolute d-flex gap-1 bg-dark rounded shadow-lg p-1" 
                    style={{ top: '8px', right: '8px', zIndex: 10, opacity: 0.9 }}
                >
                    <button className="btn btn-sm btn-ghost-danger p-1 text-white" onClick={deleteNode} title="Eliminar Video">
                        <i className="ri-delete-bin-line"></i>
                    </button>
                </div>
            )}
        </NodeViewWrapper>
    );
};

export default VideoNodeView;
