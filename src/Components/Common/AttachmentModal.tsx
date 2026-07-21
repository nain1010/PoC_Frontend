import React, { useState, useRef, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Spinner, Progress } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';
import config from '../../config';

const api = APIClient;

interface AttachmentModalProps {
    isOpen: boolean;
    toggle: () => void;
    projectId: string;
    entityType: 'historia' | 'tarea' | 'proyecto';
    entityId: string;
}

interface AttachmentFile {
    id: string;
    entidad_tipo: string;
    entidad_id: string;
    nombre_archivo: string;
    tipo_mime: string;
    tamano_bytes: number;
    url_publica: string;
    subido_por: string | null;
    fecha_subida: string | null;
}

const AttachmentModal = ({ isOpen, toggle, projectId, entityType, entityId }: AttachmentModalProps) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null);

    // Fetch attachments
    const { data: rawData, isLoading } = useQuery({
        queryKey: ['attachments', entityType, entityId],
        queryFn: () => api.get(`/projects/${projectId}/attachments?entity_type=${entityType}&entity_id=${entityId}`),
        enabled: isOpen && !!projectId && !!entityId
    });
    const attachments: AttachmentFile[] = (rawData as any) || [];

    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => api.delete(`/projects/${projectId}/attachments/${attachmentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
        },
        onError: () => toast.error("Error al eliminar el archivo.")
    });

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('data', file);

        try {
            const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
            const token = authUser ? JSON.parse(authUser).token : null;

            // Use XMLHttpRequest for progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${config.api.API_URL}/api/upload/${projectId}?entity_type=${entityType}&entity_id=${entityId}`);
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        try {
                            const err = JSON.parse(xhr.responseText);
                            reject(new Error(err.detail || `Error ${xhr.status}`));
                        } catch {
                            reject(new Error(`Error ${xhr.status}`));
                        }
                    }
                };
                xhr.onerror = () => reject(new Error("Error de red"));
                xhr.send(formData);
            });

            queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
            // toast.success(`"${file.name}" subido exitosamente.`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al subir el archivo.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [projectId, entityType, entityId, queryClient]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        for (let i = 0; i < files.length; i++) {
            await uploadFile(files[i]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [uploadFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            (async () => {
                for (let i = 0; i < files.length; i++) {
                    await uploadFile(files[i]);
                }
            })();
        }
    }, [uploadFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragOver(false), []);

    const formatBytes = (bytes: number, decimals = 1) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    };

    const isImage = (mime: string) => mime?.startsWith('image/');
    const isPdf = (mime: string) => mime?.includes('pdf');

    const getFileIcon = (mime: string) => {
        if (isImage(mime)) return 'ri-image-2-line';
        if (isPdf(mime)) return 'ri-file-pdf-2-line';
        if (mime?.includes('word') || mime?.includes('document')) return 'ri-file-word-2-line';
        if (mime?.includes('excel') || mime?.includes('spreadsheet')) return 'ri-file-excel-2-line';
        if (mime?.includes('zip') || mime?.includes('rar') || mime?.includes('compressed')) return 'ri-folder-zip-line';
        if (mime?.includes('video')) return 'ri-video-line';
        if (mime?.includes('audio')) return 'ri-music-2-line';
        if (mime?.includes('text') || mime?.includes('json') || mime?.includes('xml')) return 'ri-file-code-line';
        return 'ri-file-text-line';
    };

    const getFileColor = (mime: string) => {
        if (isImage(mime)) return '#10b981';
        if (isPdf(mime)) return '#ef4444';
        if (mime?.includes('word') || mime?.includes('document')) return '#3b82f6';
        if (mime?.includes('excel') || mime?.includes('spreadsheet')) return '#22c55e';
        if (mime?.includes('zip')) return '#f59e0b';
        if (mime?.includes('video')) return '#8b5cf6';
        return '#6b7280';
    };

    const getFileUrl = (file: AttachmentFile) => file.url_publica.startsWith('http') ? file.url_publica : `${config.api.API_URL}${file.url_publica}`;

    const handleDownload = (file: AttachmentFile) => {
        const a = document.createElement('a');
        a.href = getFileUrl(file);
        a.download = file.nombre_archivo;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const imageFiles = attachments.filter(f => isImage(f.tipo_mime));
    const docFiles = attachments.filter(f => !isImage(f.tipo_mime));

    return (
        <>
            <Modal isOpen={isOpen} toggle={toggle} centered scrollable size="lg" style={{ maxWidth: '680px' }}>
                <ModalHeader toggle={toggle} className="border-0 pb-0" style={{ background: 'var(--vz-card-bg)' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ 
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--vz-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="ri-attachment-2 text-white fs-5"></i>
                        </div>
                        <div>
                            <h5 className="mb-0 fw-semibold" style={{ fontSize: '1.05rem' }}>Archivos Adjuntos</h5>
                            <small className="text-muted">{attachments.length} archivo{attachments.length !== 1 ? 's' : ''}</small>
                        </div>
                    </div>
                </ModalHeader>
                <ModalBody className="pt-3" style={{ background: 'var(--vz-card-bg)' }}>
                    {/* Drop Zone + Upload */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragOver ? 'var(--vz-secondary)' : 'var(--vz-border-color)'}`,
                            borderRadius: 12,
                            padding: uploading ? '16px 20px' : '24px 20px',
                            textAlign: 'center',
                            cursor: uploading ? 'default' : 'pointer',
                            background: dragOver ? 'rgba(var(--vz-secondary-rgb), 0.08)' : 'var(--vz-input-bg)',
                            transition: 'all 0.2s ease',
                            marginBottom: 20,
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="d-none"
                            multiple
                        />
                        {uploading ? (
                            <div>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <small className="text-muted fw-medium">Subiendo archivo...</small>
                                    <small className="fw-semibold" style={{ color: 'var(--vz-secondary)' }}>{uploadProgress}%</small>
                                </div>
                                <Progress
                                    value={uploadProgress}
                                    style={{ height: 6, borderRadius: 3, background: 'var(--vz-border-color)' }}
                                    barStyle={{ background: 'var(--vz-secondary)', borderRadius: 3 }}
                                />
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
                                    background: 'rgba(var(--vz-secondary-rgb), 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <i className="ri-upload-cloud-2-line fs-2" style={{ color: 'var(--vz-secondary)' }}></i>
                                </div>
                                <p className="mb-1 fw-medium" style={{ fontSize: '0.9rem' }}>
                                    Arrastra archivos aquí o <span style={{ color: 'var(--vz-secondary)', fontWeight: 600 }}>haz clic para buscar</span>
                                </p>
                                <small className="text-muted">PDFs, Imágenes, Word, Excel, Diagramas — hasta 50 MB</small>
                            </>
                        )}
                    </div>

                    {/* Loading state */}
                    {isLoading ? (
                        <div className="text-center py-4"><Spinner color="secondary" /></div>
                    ) : attachments.length === 0 ? (
                        <div className="text-center py-4">
                            <div style={{
                                width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
                                background: 'var(--vz-input-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <i className="ri-folder-open-line" style={{ fontSize: 28, color: 'var(--vz-text-muted)' }}></i>
                            </div>
                            <p className="text-muted mb-0">No hay archivos adjuntos aún</p>
                        </div>
                    ) : (
                        <>
                            {/* Image Gallery */}
                            {imageFiles.length > 0 && (
                                <div className="mb-3">
                                    <small className="text-muted text-uppercase fw-semibold d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                        <i className="ri-image-2-line me-1"></i> Imágenes ({imageFiles.length})
                                    </small>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(auto-fill, minmax(${imageFiles.length === 1 ? '280px' : '130px'}, 1fr))`,
                                        gap: 8,
                                    }}>
                                        {imageFiles.map(file => (
                                            <div key={file.id} style={{
                                                position: 'relative',
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                background: '#000',
                                                aspectRatio: imageFiles.length === 1 ? '16/9' : '1',
                                                cursor: 'pointer',
                                                border: '1px solid var(--vz-border-color)',
                                            }}>
                                                <img
                                                    src={getFileUrl(file)}
                                                    alt={file.nombre_archivo}
                                                    onClick={() => setPreviewFile(file)}
                                                    style={{
                                                        width: '100%', height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.2s ease',
                                                    }}
                                                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                                                    onError={e => {
                                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280"><i class="ri-image-2-line" style="font-size:2rem"></i></div>';
                                                    }}
                                                />
                                                {/* Overlay with actions */}
                                                <div style={{
                                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                                    padding: '24px 8px 6px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                }}>
                                                    <span style={{ color: '#fff', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                                                        {file.nombre_archivo}
                                                    </span>
                                                    <div className="d-flex gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', color: '#fff', fontSize: '0.75rem' }}
                                                            title="Descargar">
                                                            <i className="ri-download-2-line"></i>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }}
                                                            style={{ background: 'rgba(239,68,68,0.5)', border: 'none', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', color: '#fff', fontSize: '0.75rem' }}
                                                            title="Eliminar">
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Document Files */}
                            {docFiles.length > 0 && (
                                <div>
                                    {imageFiles.length > 0 && (
                                        <small className="text-muted text-uppercase fw-semibold d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                            <i className="ri-file-text-line me-1"></i> Documentos ({docFiles.length})
                                        </small>
                                    )}
                                    <div className="d-flex flex-column gap-2">
                                        {docFiles.map(file => (
                                            <div key={file.id} className="d-flex align-items-center gap-3" style={{
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                background: 'var(--vz-input-bg)',
                                                border: '1px solid var(--vz-border-color)',
                                                transition: 'border-color 0.2s',
                                            }}
                                            onMouseOver={e => (e.currentTarget.style.borderColor = '#6366f1')}
                                            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--vz-border-color)')}
                                            >
                                                {/* File icon */}
                                                <div style={{
                                                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                                                    background: `${getFileColor(file.tipo_mime)}15`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <i className={getFileIcon(file.tipo_mime)} style={{ fontSize: '1.25rem', color: getFileColor(file.tipo_mime) }}></i>
                                                </div>
                                                {/* File info */}
                                                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                                                    <div className="fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>
                                                        {file.nombre_archivo}
                                                    </div>
                                                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                        {formatBytes(file.tamano_bytes)}
                                                        {file.fecha_subida && ` · ${new Date(file.fecha_subida).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`}
                                                    </small>
                                                </div>
                                                {/* Actions */}
                                                <div className="d-flex gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => window.open(getFileUrl(file), '_blank')}
                                                        className="btn btn-sm btn-soft-primary btn-icon rounded-circle"
                                                        style={{ width: 32, height: 32 }}
                                                        title="Abrir en nueva pestaña"
                                                    >
                                                        <i className="ri-external-link-line" style={{ fontSize: '0.85rem' }}></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(file)}
                                                        className="btn btn-sm btn-soft-success btn-icon rounded-circle"
                                                        style={{ width: 32, height: 32 }}
                                                        title="Descargar"
                                                    >
                                                        <i className="ri-download-2-line" style={{ fontSize: '0.85rem' }}></i>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMutation.mutate(file.id)}
                                                        className="btn btn-sm btn-soft-danger btn-icon rounded-circle"
                                                        style={{ width: 32, height: 32 }}
                                                        disabled={deleteMutation.isPending}
                                                        title="Eliminar"
                                                    >
                                                        <i className="ri-delete-bin-line" style={{ fontSize: '0.85rem' }}></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </ModalBody>
            </Modal>

            {/* Image Preview Lightbox */}
            {previewFile && (
                <div
                    onClick={() => setPreviewFile(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1060,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <div style={{
                        position: 'absolute', top: 16, right: 16,
                        display: 'flex', gap: 8, zIndex: 1061,
                    }}>
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(previewFile); }}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', backdropFilter: 'blur(8px)' }}>
                            <i className="ri-download-2-line me-1"></i> Descargar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(previewFile), '_blank'); }}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', backdropFilter: 'blur(8px)' }}>
                            <i className="ri-external-link-line me-1"></i> Abrir
                        </button>
                        <button onClick={() => setPreviewFile(null)}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(8px)' }}>
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                    <img
                        src={getFileUrl(previewFile)}
                        alt={previewFile.nombre_archivo}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw', maxHeight: '85vh',
                            objectFit: 'contain',
                            borderRadius: 8,
                            cursor: 'default',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        }}
                    />
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: '0.85rem' }}>
                        {previewFile.nombre_archivo} · {formatBytes(previewFile.tamano_bytes)}
                    </p>
                </div>
            )}
        </>
    );
};

export default AttachmentModal;
