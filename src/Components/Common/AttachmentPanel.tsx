import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Progress, Spinner } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import config from '../../config';

const api = APIClient;

const FILE_ICONS: Record<string, string> = {
    'image': 'ri-image-line text-success',
    'video': 'ri-video-line text-primary',
    'audio': 'ri-music-line text-warning',
    'application/pdf': 'ri-file-pdf-line text-danger',
    'application/zip': 'ri-file-zip-line text-info',
    'default': 'ri-file-line text-muted',
};

function getFileIcon(mime: string): string {
    if (mime.startsWith('image')) return FILE_ICONS.image;
    if (mime.startsWith('video')) return FILE_ICONS.video;
    if (mime.startsWith('audio')) return FILE_ICONS.audio;
    return FILE_ICONS[mime] || FILE_ICONS.default;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface AttachmentPanelProps {
    projectId: string;
    entityType: string;
    entityId: string;
    readOnly?: boolean;
}

const AttachmentPanel: React.FC<AttachmentPanelProps> = ({ projectId, entityType, entityId, readOnly = false }) => {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const queryKey = ['attachments', projectId, entityType, entityId];

    const { data: attachments = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => api.get(`/projects/${projectId}/attachments?entity_type=${entityType}&entity_id=${entityId}`),
        select: (data: any) => data || [],
    });

    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => api.delete(`/projects/${projectId}/attachments/${attachmentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
        },
        onError: (err: any) => {
            toast.error(err || "Error al eliminar el archivo.", { position: "top-right" });
        },
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return;
        setUploading(true);
        setUploadProgress(0);

        for (let i = 0; i < acceptedFiles.length; i++) {
            const file = acceptedFiles[i];
            const formData = new FormData();
            formData.append('data', file);

            try {
                const response = await fetch(
                    `${config.api.API_URL}/api/upload/${projectId}?entity_type=${entityType}&entity_id=${entityId}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${JSON.parse(sessionStorage.getItem('authUser') || localStorage.getItem('authUser') || '{}').token}`,
                        },
                        body: formData,
                    }
                );
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Upload error response:", response.status, errorText);
                    throw new Error(`Error ${response.status}: ${errorText}`);
                }
                
                setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100));
            } catch (err: any) {
                console.error("Upload exception:", err);
                toast.error(`Error subiendo ${file.name}: ${err.message}`, { position: "top-right" });
            }
        }

        setUploading(false);
        setUploadProgress(0);
        queryClient.invalidateQueries({ queryKey });
        // toast.success(`${acceptedFiles.length} archivo(s) subido(s) correctamente.`, { position: "top-right" });
    }, [projectId, entityType, entityId, queryClient, queryKey]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: readOnly || uploading,
    });

    return (
        <div className="attachment-panel">
            {/* Drop Zone */}
            {!readOnly && (
                <div
                    {...getRootProps()}
                    className={`border border-2 border-dashed rounded-3 p-4 text-center mb-3 ${
                        isDragActive ? 'border-secondary bg-soft-secondary' : 'border-light'
                    }`}
                    style={{ cursor: uploading ? 'wait' : 'pointer', transition: 'all 0.2s ease' }}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div>
                            <Spinner size="sm" color="secondary" className="me-2" />
                            <span className="text-muted">Subiendo archivos...</span>
                            <Progress value={uploadProgress} className="mt-2" style={{ height: '6px' }} animated />
                        </div>
                    ) : isDragActive ? (
                        <div>
                            <i className="ri-download-cloud-line fs-24 text-secondary d-block mb-1"></i>
                            <span className="text-secondary fw-semibold">Suelta los archivos aquí</span>
                        </div>
                    ) : (
                        <div>
                            <i className="ri-upload-cloud-2-line fs-24 text-muted d-block mb-1"></i>
                            <span className="text-muted">Arrastra archivos aquí o <span className="text-secondary fw-semibold">haz clic para buscar</span></span>
                            <p className="text-muted fs-12 mb-0 mt-1">Imágenes, PDFs, videos, documentos...</p>
                        </div>
                    )}
                </div>
            )}

            {/* File List */}
            {isLoading ? (
                <div className="text-center py-3">
                    <Spinner size="sm" color="secondary" />
                </div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-3 text-muted">
                    <i className="ri-attachment-line fs-20 d-block mb-1"></i>
                    <small>Sin archivos adjuntos</small>
                </div>
            ) : (
                <div className="vstack gap-2">
                    {attachments.map((att: any) => {
                        const getFileUrl = (url: string) => url?.startsWith('http') ? url : `${config.api.API_URL}${url}`;
                        const absoluteUrl = getFileUrl(att.url_publica);
                        return (
                        <div key={att.id} className="d-flex align-items-center gap-2 p-2 rounded-2 border bg-light">
                            {att.tipo_mime?.startsWith('image') ? (
                                <img
                                    src={absoluteUrl}
                                    alt={att.nombre_archivo}
                                    className="rounded-1"
                                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="avatar-xs flex-shrink-0">
                                    <div className="avatar-title bg-white rounded-1 fs-18">
                                        <i className={getFileIcon(att.tipo_mime)}></i>
                                    </div>
                                </div>
                            )}
                            <div className="flex-grow-1 overflow-hidden">
                                <a
                                    href={absoluteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-body fw-medium text-truncate d-block fs-13"
                                    title={att.nombre_archivo}
                                >
                                    {att.nombre_archivo}
                                </a>
                                <span className="text-muted fs-11">{formatSize(att.tamano_bytes)}</span>
                            </div>
                            {!readOnly && (
                                <Button
                                    color="danger"
                                    outline
                                    size="sm"
                                    className="flex-shrink-0"
                                    onClick={() => deleteMutation.mutate(att.id)}
                                    disabled={deleteMutation.isPending}
                                    title="Eliminar"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                </Button>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AttachmentPanel;
