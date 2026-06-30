import React, { useState, useEffect } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import AttachmentPanel from '../../Components/Common/AttachmentPanel';

const RightSidebar = ({ editor, projectId, pageId, pageContent }: { editor: any, projectId: string, pageId: string, pageContent: any }) => {
    const [activeTab, setActiveTab] = useState('outline');
    const [headings, setHeadings] = useState<any[]>([]);
    const [stats, setStats] = useState({ words: 0, chars: 0, readTime: 0 });

    useEffect(() => {
        if (!editor) return;

        const updateData = () => {
            // Extract Outline (Headings)
            const json = editor.getJSON();
            const extractedHeadings: any[] = [];
            
            const traverse = (node: any) => {
                if (node.type === 'heading') {
                    extractedHeadings.push({
                        level: node.attrs.level,
                        text: node.content?.map((c: any) => c.text).join('') || 'Sin título',
                    });
                }
                if (node.content) {
                    node.content.forEach(traverse);
                }
            };
            
            if (json.content) {
                json.content.forEach(traverse);
            }
            
            setHeadings(extractedHeadings);

            // Calculate Stats
            const text = editor.state.doc.textContent;
            const words = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
            const chars = text.length;
            const readTime = Math.ceil(words / 200); // Avg 200 words per min
            
            setStats({ words, chars, readTime });
        };

        editor.on('update', updateData);
        // Initial extraction
        setTimeout(updateData, 500);

        return () => {
            editor.off('update', updateData);
        };
    }, [editor, pageId]);

    const scrollToHeading = (index: number) => {
        // A simple heuristic to scroll to heading (since tip-tap nodes don't have ids by default in our setup)
        // We find the DOM element
        const editorDom = editor.view.dom;
        const headingElements = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headingElements[index]) {
            headingElements[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="d-flex flex-column h-100 border-start" style={{ width: '300px', flexShrink: 0, backgroundColor: 'var(--vz-card-bg-custom)' }}>
            {/* Tabs Header */}
            <div className="p-2 border-bottom">
                <Nav pills className="nav-custom-pills nav-justified gap-1">
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 ${activeTab === 'outline' ? 'active bg-soft-primary text-primary' : 'text-muted'}`} onClick={() => setActiveTab('outline')} style={{ cursor: 'pointer', borderRadius: '6px' }}>
                            Outline
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 ${activeTab === 'info' ? 'active bg-soft-primary text-primary' : 'text-muted'}`} onClick={() => setActiveTab('info')} style={{ cursor: 'pointer', borderRadius: '6px' }}>
                            Info
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 ${activeTab === 'assets' ? 'active bg-soft-primary text-primary' : 'text-muted'}`} onClick={() => setActiveTab('assets')} style={{ cursor: 'pointer', borderRadius: '6px' }}>
                            Assets
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            {/* Tabs Content */}
            <div className="flex-grow-1 overflow-auto" style={{ backgroundColor: 'var(--vz-card-bg-custom)' }}>
                <TabContent activeTab={activeTab} className="p-3">
                    
                    {/* Outline Tab */}
                    <TabPane tabId="outline">
                        <h6 className="text-uppercase text-muted fs-11 fw-semibold mb-3">Resultados:</h6>
                        {headings.length === 0 ? (
                            <div className="text-muted fs-12 text-center mt-4">
                                No hay encabezados en este documento. Escribe `/` y selecciona H1, H2 o H3.
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {headings.map((h, i) => (
                                    <div 
                                        key={i} 
                                        className="text-truncate fs-13 text-body hover-text-primary"
                                        style={{ 
                                            cursor: 'pointer', 
                                            paddingLeft: `${(h.level - 1) * 12}px`,
                                            opacity: h.level === 1 ? 1 : 0.8,
                                            fontWeight: h.level === 1 ? 500 : 400 
                                        }}
                                        onClick={() => scrollToHeading(i)}
                                    >
                                        {h.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabPane>

                    {/* Info Tab */}
                    <TabPane tabId="info">
                        <div className="mb-4">
                            <h6 className="text-uppercase text-muted fs-11 fw-semibold mb-3">Propiedades del documento</h6>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <div className="avatar-xs">
                                    <div className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                        <i className="ri-user-3-line"></i>
                                    </div>
                                </div>
                                <div>
                                    <div className="fs-13 fw-medium">Autor de la página</div>
                                    <div className="text-muted fs-11">Solo lectura</div>
                                </div>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mb-2 fs-12">
                                <span className="text-muted">Creado</span>
                                <span className="fw-medium">{pageContent?.creado_en ? new Date(pageContent.creado_en).toLocaleDateString() : 'Desconocido'}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2 fs-12">
                                <span className="text-muted">Última edición</span>
                                <span className="fw-medium">Hace unos momentos</span>
                            </div>
                        </div>

                        <div className="border-top pt-3">
                            <h6 className="text-uppercase text-muted fs-11 fw-semibold mb-3">Métricas en vivo</h6>
                            <div className="d-flex justify-content-between align-items-center mb-2 fs-12">
                                <span className="text-muted">Palabras</span>
                                <span className="fw-medium">{stats.words}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2 fs-12">
                                <span className="text-muted">Caracteres</span>
                                <span className="fw-medium">{stats.chars}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2 fs-12">
                                <span className="text-muted">Tiempo de lectura</span>
                                <span className="fw-medium">{stats.readTime} min</span>
                            </div>
                        </div>
                    </TabPane>

                    {/* Assets Tab */}
                    <TabPane tabId="assets">
                        <div className="text-muted fs-12 mb-3">
                            Archivos adjuntos y recursos de la página. (Las imágenes arrastradas se incrustan en el texto).
                        </div>
                        <AttachmentPanel projectId={projectId} entityType="pagina" entityId={pageId} />
                    </TabPane>
                </TabContent>
            </div>
            
            {/* Custom Styles inside RightSidebar */}
            <style>{`
                .hover-text-primary:hover { color: var(--vz-primary) !important; text-decoration: underline; }
                .nav-custom-pills .nav-link { border: 1px solid transparent; }
                .nav-custom-pills .nav-link.active { border-color: var(--vz-primary-border-subtle); }
            `}</style>
        </div>
    );
};

export default RightSidebar;
