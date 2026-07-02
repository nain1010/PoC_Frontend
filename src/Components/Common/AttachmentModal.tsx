import React, { useState, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Spinner } from 'reactstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';
import axios from 'axios';
import config from '../../config';

const api = APIClient;

interface AttachmentModalProps {
    isOpen: boolean;
    toggle: () => void;
    projectId: string;
    entityType: 'historia' | 'tarea' | 'proyecto';
    entityId: string;
}

const AttachmentModal = ({ isOpen, toggle, projectId, entityType, entityId }: AttachmentModalProps) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Fetch attachments
    const { data: rawData, isLoading } = useQuery({
        queryKey: ['attachments', entityType, entityId],
        queryFn: () => api.get(`/projects/${projectId}/attachments?entity_type=${entityType}&entity_id=${entityId}`),
        enabled: isOpen && !!projectId && !!entityId
    });
    const attachments: any[] = (rawData as any) || [];

    const deleteMutation = useMutation({
        mutationFn: (attachmentId: string) => api.delete(`/projects/${projectId}/attachments/${attachmentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
            toast.success("Archivo eliminado.");
        },
        onError: () => toast.error("Error al eliminar el archivo.")
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('data', file);

        try {
            const authUser = sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
            const token = authUser ? JSON.parse(authUser).token : null;

            const response = await fetch(`${config.api.API_URL}/api/upload/${projectId}?entity_type=${entityType}&entity_id=${entityId}`, {
                method: 'POST',
                body: formData,
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Error interno del servidor");
            }

            queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
            toast.success("Archivo subido exitosamente.");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al subir el archivo.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('image')) return 'ri-image-2-line text-success';
        if (mimeType.includes('pdf')) return 'ri-file-pdf-line text-danger';
        if (mimeType.includes('word')) return 'ri-file-word-2-line text-primary';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'ri-file-excel-2-line text-success';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'ri-folder-zip-line text-warning';
        return 'ri-file-text-line text-secondary';
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered scrollable size="md">
            <ModalHeader toggle={toggle} className="border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <i className="ri-attachment-2 text-primary fs-4"></i>
                    Archivos Adjuntos
                </div>
            </ModalHeader>
            <ModalBody className="p-0 bg-light">
                <div className="p-3 border-bottom bg-white sticky-top text-center">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="d-none"
                    />
                    <Button 
                        color="primary" 
                        className="w-100" 
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <><Spinner size="sm" className="me-2"/> Subiendo archivo...</>
                        ) : (
                            <><i className="ri-upload-cloud-2-line align-middle me-1"></i> Subir Nuevo Archivo</>
                        )}
                    </Button>
                    <small className="text-muted d-block mt-2">Sube PDFs, Imágenes, Word, Excel o Diagramas.</small>
                </div>

                <div className="p-3">
                    {isLoading ? (
                        <div className="text-center py-4"><Spinner color="primary" /></div>
                    ) : attachments.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="ri-file-copy-2-line display-4 text-muted opacity-50 mb-3"></i>
                            <h5 className="text-muted fw-normal">No hay archivos adjuntos</h5>
                        </div>
                    ) : (
                        <div className="list-group">
                            {attachments.map((file: any) => (
                                <div key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3 overflow-hidden">
                                        <div className="avatar-sm flex-shrink-0">
                                            <div className="avatar-title bg-light rounded text-body fs-3">
                                                <i className={getFileIcon(file.tipo_mime)}></i>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden">
                                            <a href={file.url_publica} target="_blank" rel="noopener noreferrer" className="text-body fw-medium text-truncate d-block">
                                                {file.nombre_archivo}
                                            </a>
                                            <small className="text-muted">
                                                {formatBytes(file.tamano_bytes)}
                                            </small>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        color="ghost-danger" 
                                        className="btn-icon rounded-circle"
                                        onClick={() => deleteMutation.mutate(file.id)}
                                        disabled={deleteMutation.isPending}
                                        title="Eliminar archivo"
                                    >
                                        <i className="ri-delete-bin-line fs-14"></i>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
};

export default AttachmentModal;
