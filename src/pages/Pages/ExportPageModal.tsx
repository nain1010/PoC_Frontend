import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from 'reactstrap';
import TurndownService from 'turndown';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const ExportPageModal = ({ isOpen, toggle, editor, pageTitle }: { isOpen: boolean, toggle: () => void, editor: any, pageTitle: string }) => {
    const [exportFormat, setExportFormat] = useState('PDF');
    const [includeContent, setIncludeContent] = useState('Everything');
    const [pageFormat, setPageFormat] = useState('a4');

    const handleExport = () => {
        if (!editor) return;
        
        let htmlContent = editor.getHTML();
        if (includeContent === 'No images') {
            // Remove images
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const images = tempDiv.getElementsByTagName('img');
            while(images.length > 0){
                images[0].parentNode?.removeChild(images[0]);
            }
            htmlContent = tempDiv.innerHTML;
        }

        const title = pageTitle || 'Documento';

        if (exportFormat === 'Markdown') {
            const turndownService = new TurndownService({ headingStyle: 'atx' });
            const markdown = turndownService.turndown(htmlContent);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (exportFormat === 'HTML') {
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: auto; line-height: 1.6; color: #333; } img { max-width: 100%; height: auto; border-radius: 8px; } blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 1rem; color: #666; } pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }</style></head><body><h1>${title}</h1>${htmlContent}</body></html>`;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.html`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // PDF
            const printElement = document.createElement('div');
            printElement.innerHTML = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1>${title}</h1>
                    ${htmlContent}
                </div>
            `;
            
            const opt = {
                margin:       10,
                filename:     `${title}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: pageFormat.toLowerCase(), orientation: 'portrait' }
            };

            html2pdf().from(printElement).set(opt).save();
        }

        toggle();
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered modalClassName="zoomIn" contentClassName="bg-dark text-light border border-secondary" backdropClassName="modal-backdrop-dark">
            <ModalHeader toggle={toggle} className="border-bottom-0 pb-0 fs-16 fw-semibold">
                Exportar página
            </ModalHeader>
            <ModalBody>
                <div className="mb-3 d-flex justify-content-between align-items-center px-1">
                    <label className="form-label fs-13 text-muted mb-0">Formato de exportación</label>
                    <Input type="select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="form-select-sm w-auto bg-dark text-light border-secondary">
                        <option value="PDF">PDF</option>
                        <option value="HTML">HTML</option>
                        <option value="Markdown">Markdown</option>
                    </Input>
                </div>
                
                <div className="border border-secondary rounded p-3" style={{ backgroundColor: '#1a1a1a' }}>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <label className="form-label fs-13 mb-0">Incluir contenido</label>
                        <Input type="select" value={includeContent} onChange={(e) => setIncludeContent(e.target.value)} className="form-select-sm w-auto border-0 text-end shadow-none" style={{ backgroundColor: '#1a1a1a', color: '#e9ecef', cursor: 'pointer' }}>
                            <option value="Everything">Todo</option>
                            <option value="No images">Sin imágenes</option>
                        </Input>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                        <label className="form-label fs-13 mb-0">Formato de página</label>
                        {exportFormat === 'PDF' ? (
                            <Input type="select" value={pageFormat} onChange={(e) => setPageFormat(e.target.value)} className="form-select-sm w-auto border-0 text-end shadow-none" style={{ backgroundColor: '#1a1a1a', color: '#e9ecef', cursor: 'pointer' }}>
                                <option value="a4">A4</option>
                                <option value="a3">A3</option>
                                <option value="a2">A2</option>
                                <option value="letter">Carta (Letter)</option>
                                <option value="legal">Oficio (Legal)</option>
                                <option value="tabloid">Tabloide</option>
                            </Input>
                        ) : (
                            <div className="text-muted fs-13">{exportFormat}</div>
                        )}
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className="border-top-0 pt-0">
                <Button color="light" outline onClick={toggle} size="sm" className="border-secondary text-light">Cerrar</Button>
                <Button color="info" onClick={handleExport} size="sm" className="px-3">Exportar</Button>
            </ModalFooter>
            <style>{`
                .modal-backdrop-dark { opacity: 0.8 !important; }
            `}</style>
        </Modal>
    );
};

export default ExportPageModal;
