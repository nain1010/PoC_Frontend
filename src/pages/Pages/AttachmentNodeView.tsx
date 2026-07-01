import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const AttachmentNodeView = (props: any) => {
    const { node, selected, deleteNode } = props;
    const { src, filename, filesize } = node.attrs;

    // Obtener la extensión del archivo para cambiar el icono si se desea
    const extension = filename ? filename.split('.').pop()?.toLowerCase() : '';
    let iconClass = 'ri-file-text-line';
    if (['pdf'].includes(extension)) iconClass = 'ri-file-pdf-line text-danger';
    else if (['doc', 'docx'].includes(extension)) iconClass = 'ri-file-word-line text-primary';
    else if (['xls', 'xlsx'].includes(extension)) iconClass = 'ri-file-excel-line text-success';
    else if (['zip', 'rar', '7z'].includes(extension)) iconClass = 'ri-file-zip-line text-warning';

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <NodeViewWrapper className={`react-component-attachment-node my-3 ${selected ? 'ProseMirror-selectednode' : ''}`}>
            <div className="card border shadow-none mb-0" style={{ maxWidth: '400px', backgroundColor: 'var(--vz-card-bg-custom)' }}>
                <div className="card-body p-3 d-flex align-items-center gap-3">
                    <div className="avatar-sm flex-shrink-0">
                        <div className="avatar-title bg-light text-body rounded fs-24">
                            <i className={iconClass}></i>
                        </div>
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                        <h5 className="fs-14 mb-1 text-truncate">
                            <a href={src} target="_blank" rel="noreferrer" className="text-body text-decoration-none">
                                {filename}
                            </a>
                        </h5>
                        {filesize && <p className="text-muted mb-0 fs-12">{formatBytes(filesize)}</p>}
                    </div>
                    <div className="flex-shrink-0 ms-2 d-flex gap-1">
                        <a href={src} download={filename} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost-secondary" title="Descargar">
                            <i className="ri-download-2-line fs-16"></i>
                        </a>
                        {selected && (
                            <button className="btn btn-sm btn-ghost-danger" onClick={deleteNode} title="Eliminar">
                                <i className="ri-delete-bin-line fs-16"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export default AttachmentNodeView;
