import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';
import config from '../../config';

const api = APIClient;

interface InlineAttachmentsProps {
    projectId: string;
    entityType: 'historia' | 'tarea' | 'proyecto';
    entityId: string;
    onOpenPageViewer?: (pageId: string) => void;
}

interface AttachmentFile {
    id: string;
    entidad_tipo: string;
    entidad_id: string;
    nombre_archivo: string;
    tipo_mime: string;
    tamano_bytes: number;
    url_publica: string;
}

const InlineAttachments = ({ projectId, entityType, entityId, onOpenPageViewer }: InlineAttachmentsProps) => {
    const queryClient = useQueryClient();
    const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null);

    const { data: rawData, isLoading } = useQuery({
        queryKey: ['attachments', entityType, entityId],
        queryFn: () => api.get(`/projects/${projectId}/attachments?entity_type=${entityType}&entity_id=${entityId}`),
        enabled: !!projectId && !!entityId
    });
    const attachments: AttachmentFile[] = (rawData as any) || [];

    const { data: rawPages, isLoading: isLoadingPages } = useQuery({
        queryKey: ['entity_pages', entityType, entityId],
        queryFn: () => api.get(`/projects/${projectId}/entities/${entityType}/${entityId}/pages`),
        enabled: !!projectId && !!entityId
    });
    const linkedPages: any[] = (rawPages as any) || [];

    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => api.delete(`/projects/${projectId}/attachments/${attachmentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
            toast.success("Archivo eliminado.");
        },
        onError: () => toast.error("Error al eliminar el archivo.")
    });

    const unlinkPageMutation = useMutation({
        mutationFn: (pageId: string) => api.delete(`/projects/${projectId}/entities/${entityType}/${entityId}/pages/${pageId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entity_pages', entityType, entityId] });
            toast.success("Página desvinculada.");
        },
        onError: () => toast.error("Error al desvincular página.")
    });

    if ((isLoading || attachments.length === 0) && (isLoadingPages || linkedPages.length === 0)) return null;

    const isImage = (mime: string) => mime?.startsWith('image/');
    const getFileUrl = (file: AttachmentFile) => `${config.api.API_URL}${file.url_publica}`;

    const handleDownload = (e: React.MouseEvent, file: AttachmentFile) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = getFileUrl(file);
        a.download = file.nombre_archivo;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const getFileIcon = (mime: string) => {
        if (isImage(mime)) return 'ri-image-2-line text-success';
        if (mime?.includes('pdf')) return 'ri-file-pdf-line text-danger';
        if (mime?.includes('word') || mime?.includes('document')) return 'ri-file-word-2-line text-primary';
        if (mime?.includes('excel') || mime?.includes('spreadsheet')) return 'ri-file-excel-2-line text-success';
        if (mime?.includes('zip') || mime?.includes('rar')) return 'ri-folder-zip-line text-warning';
        return 'ri-file-text-line text-secondary';
    };

    const imageFiles = attachments.filter(f => isImage(f.tipo_mime));
    const docFiles = attachments.filter(f => !isImage(f.tipo_mime));

    return (
        <div className="mt-2 pt-2 border-top" onClick={(e) => e.stopPropagation()}>
            {imageFiles.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                    {imageFiles.map(file => (
                        <div key={file.id} style={{
                            position: 'relative',
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid var(--vz-border-color)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            const actions = e.currentTarget.querySelector('.inline-actions') as HTMLElement;
                            if (actions) actions.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            const actions = e.currentTarget.querySelector('.inline-actions') as HTMLElement;
                            if (actions) actions.style.opacity = '0';
                        }}
                        >
                            <img
                                src={getFileUrl(file)}
                                alt={file.nombre_archivo}
                                onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div className="inline-actions" style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                opacity: 0,
                                transition: 'opacity 0.2s ease'
                            }}>
                                <button onClick={(e) => handleDownload(e, file)}
                                    style={{ background: 'transparent', border: 'none', color: '#fff', padding: '2px' }} title="Descargar">
                                    <i className="ri-download-2-line fs-14"></i>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', padding: '2px' }} title="Eliminar">
                                    <i className="ri-delete-bin-line fs-14"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {(docFiles.length > 0 || linkedPages.length > 0) && (
                <div className="d-flex flex-column gap-1 mt-1">
                    {docFiles.map(file => (
                        <div key={file.id} className="d-flex align-items-center justify-content-between p-1 px-2" style={{
                            background: 'var(--vz-light)',
                            borderRadius: '6px',
                            fontSize: '12px'
                        }}>
                            <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => window.open(getFileUrl(file), '_blank')}>
                                <i className={`${getFileIcon(file.tipo_mime)} fs-14`}></i>
                                <span className="text-truncate" style={{ maxWidth: '150px' }}>{file.nombre_archivo}</span>
                            </div>
                            <div className="d-flex gap-1">
                                <button onClick={(e) => handleDownload(e, file)} className="btn btn-sm btn-link text-muted p-0" title="Descargar">
                                    <i className="ri-download-2-line"></i>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }} className="btn btn-sm btn-link text-danger p-0" title="Eliminar">
                                    <i className="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {linkedPages.map((page: any) => (
                        <div key={page.id} className="d-flex align-items-center justify-content-between p-1 px-2 border border-info border-opacity-25" style={{
                            background: 'var(--vz-info-bg-subtle)',
                            borderRadius: '6px',
                            fontSize: '12px'
                        }}>
                            <div className="d-flex align-items-center gap-2 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => { if (onOpenPageViewer) onOpenPageViewer(page.id); }}>
                                <i className="ri-file-text-line fs-14 text-info"></i>
                                <span className="text-truncate text-info fw-medium" style={{ maxWidth: '150px' }}>{page.titulo}</span>
                            </div>
                            <div className="d-flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); if (onOpenPageViewer) onOpenPageViewer(page.id); }} className="btn btn-sm btn-link text-info p-0" title="Ver">
                                    <i className="ri-eye-line"></i>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); unlinkPageMutation.mutate(page.id); }} className="btn btn-sm btn-link text-danger p-0" title="Desvincular">
                                    <i className="ri-link-unlink-m"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox for images */}
            {previewFile && ReactDOM.createPortal(
                <div
                    onClick={(e) => { e.stopPropagation(); setPreviewFile(null); }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10000 }}>
                        <button onClick={(e) => handleDownload(e, previewFile)}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <i className="ri-download-2-line me-1"></i> Descargar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(previewFile), '_blank'); }}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <i className="ri-external-link-line me-1"></i> Abrir
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setPreviewFile(null); }}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                    <img
                        src={getFileUrl(previewFile)}
                        alt={previewFile.nombre_archivo}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw', maxHeight: '85vh',
                            objectFit: 'contain', borderRadius: 8, cursor: 'default',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

export default React.memo(InlineAttachments);
