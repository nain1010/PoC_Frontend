import React, { useState, useEffect } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import AttachmentPanel from '../../Components/Common/AttachmentPanel';

const RightSidebar = ({ editor, projectId, pageId, pageContent }: { editor: any, projectId: string, pageId: string, pageContent: any }) => {
    const [activeTab, setActiveTab] = useState('info');
    const [headings, setHeadings] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [stats, setStats] = useState({ words: 0, chars: 0, paragraphs: 0, readTime: 0 });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

    useEffect(() => {
        const handleOpenComment = (e: any) => {
            setActiveTab('comments');
            setIsCollapsed(false);
            if (e.detail?.commentId) {
                setActiveCommentId(e.detail.commentId);
            }
        };
        document.addEventListener('open-comment-sidebar', handleOpenComment);
        return () => document.removeEventListener('open-comment-sidebar', handleOpenComment);
    }, []);

    useEffect(() => {
        if (!editor) return;

        const updateData = () => {
            const json = editor.getJSON();
            const extractedHeadings: any[] = [];
            
            const traverse = (node: any) => {
                if (node.type === 'heading') {
                    extractedHeadings.push({
                        level: node.attrs.level,
                        text: node.content?.map((c: any) => c.text).join('') || 'Sin título',
                    });
                }
                if (node.marks) {
                    const commentMark = node.marks.find((m: any) => m.type === 'comment');
                    if (commentMark) {
                        extractedHeadings.push({ _isComment: true, id: commentMark.attrs.commentId, text: node.text || '' });
                    }
                }
                if (node.content) {
                    node.content.forEach(traverse);
                }
            };
            
            let paragraphsCount = 0;
            if (json.content) {
                json.content.forEach(traverse);
                paragraphsCount = json.content.filter((c:any) => c.type === 'paragraph' || c.type === 'heading').length;
            }
            
            const realHeadings = extractedHeadings.filter(h => !h._isComment);
            const extractedComments = extractedHeadings.filter(h => h._isComment);
            
            const uniqueComments = extractedComments.reduce((acc, curr) => {
                const existing = acc.find((c: any) => c.id === curr.id);
                if (!existing) {
                    acc.push({...curr});
                } else {
                    existing.text += curr.text;
                }
                return acc;
            }, []);
            
            setHeadings(realHeadings);
            setComments(uniqueComments);

            const text = editor.state.doc.textContent;
            const words = text.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
            const chars = text.length;
            const readTime = Math.ceil(words / 200);
            
            setStats({ words, chars, paragraphs: paragraphsCount, readTime });
        };

        editor.on('update', updateData);
        setTimeout(updateData, 500);

        return () => {
            editor.off('update', updateData);
        };
    }, [editor, pageId]);

    const scrollToHeading = (index: number) => {
        const editorDom = editor.view.dom;
        const headingElements = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headingElements[index]) {
            headingElements[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isCollapsed) {
        return (
            <div className="d-flex flex-column h-100 border-start align-items-center py-3" style={{ width: '45px', flexShrink: 0, backgroundColor: 'var(--vz-card-bg-custom)' }}>
                <button className="btn btn-sm btn-ghost-secondary px-2 py-1 text-muted" onClick={() => setIsCollapsed(false)} title="Expandir barra lateral">
                    <i className="ri-arrow-left-circle-line fs-18"></i>
                </button>
            </div>
        );
    }

    // Dummy user data for UI matching
    const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const userName = currentUser.nombre || 'Administrador';

    return (
        <div className="d-flex flex-column h-100 border-start position-relative" style={{ width: '270px', flexShrink: 0, backgroundColor: 'var(--vz-card-bg-custom)' }}>
            
            {/* Collapse Button */}
            <div className="position-absolute" style={{ top: '8px', left: '8px', zIndex: 10 }}>
                <button className="btn btn-sm btn-ghost-secondary p-0 text-muted" onClick={() => setIsCollapsed(true)} title="Ocultar">
                    <i className="ri-arrow-right-circle-line fs-16"></i>
                </button>
            </div>

            {/* Tabs Header */}
            <div className="p-2 border-bottom ps-5">
                <Nav pills className="nav-custom-pills nav-justified gap-1 bg-light p-1 rounded">
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 fw-medium ${activeTab === 'outline' ? 'active shadow-sm bg-white text-body' : 'text-muted bg-transparent'}`} onClick={() => setActiveTab('outline')} style={{ cursor: 'pointer', borderRadius: '4px' }}>
                            Índice
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 fw-medium ${activeTab === 'info' ? 'active shadow-sm bg-white text-body' : 'text-muted bg-transparent'}`} onClick={() => setActiveTab('info')} style={{ cursor: 'pointer', borderRadius: '4px' }}>
                            Info
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 fw-medium ${activeTab === 'assets' ? 'active shadow-sm bg-white text-body' : 'text-muted bg-transparent'}`} onClick={() => setActiveTab('assets')} style={{ cursor: 'pointer', borderRadius: '4px' }}>
                            Recursos
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={`px-2 py-1 fs-12 fw-medium ${activeTab === 'comments' ? 'active shadow-sm bg-white text-body' : 'text-muted bg-transparent'}`} onClick={() => setActiveTab('comments')} style={{ cursor: 'pointer', borderRadius: '4px' }}>
                            <i className="ri-chat-3-line"></i>
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            {/* Tabs Content */}
            <div className="flex-grow-1 overflow-auto no-scrollbar" style={{ backgroundColor: 'var(--vz-card-bg-custom)' }}>
                <TabContent activeTab={activeTab} className="p-3">
                    
                    {/* Outline Tab */}
                    <TabPane tabId="outline">
                        {headings.length === 0 ? (
                            <div className="text-muted fs-12 text-center mt-4">
                                No hay encabezados en este documento.
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
                        
                        {/* Metrics Grid */}
                        <div className="row g-2 mb-4">
                            <div className="col-6">
                                <div className="p-2 rounded bg-light">
                                    <div className="fs-14 fw-bold text-body">{stats.words}</div>
                                    <div className="fs-12 text-muted">Palabras</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2 rounded bg-light">
                                    <div className="fs-14 fw-bold text-body">{stats.chars}</div>
                                    <div className="fs-12 text-muted">Caracteres</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2 rounded bg-light">
                                    <div className="fs-14 fw-bold text-body">{stats.paragraphs}</div>
                                    <div className="fs-12 text-muted">Párrafos</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2 rounded bg-light">
                                    <div className="fs-14 fw-bold text-body">{stats.readTime}m</div>
                                    <div className="fs-12 text-muted">Tiempo lectura</div>
                                </div>
                            </div>
                        </div>

                        {/* Edited By */}
                        <div className="mb-3">
                            <div className="fs-12 text-muted mb-2">Editado por</div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="avatar-xxs">
                                        <div className="avatar-title rounded bg-primary-subtle text-primary fs-10">
                                            {userName.substring(0,2).toUpperCase()}
                                        </div>
                                    </div>
                                    <span className="fs-13 fw-semibold">{userName}</span>
                                </div>
                                <span className="fs-12 text-muted">Hace unos instantes</span>
                            </div>
                        </div>

                        {/* Created By */}
                        <div className="mb-4">
                            <div className="fs-12 text-muted mb-2">Creado por</div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="avatar-xxs">
                                        <div className="avatar-title rounded bg-success-subtle text-success fs-10">
                                            {userName.substring(0,2).toUpperCase()}
                                        </div>
                                    </div>
                                    <span className="fs-13 fw-semibold">{userName}</span>
                                </div>
                                <span className="fs-12 text-muted">{pageContent?.creado_en ? new Date(pageContent.creado_en).toLocaleDateString() : 'Desconocido'}</span>
                            </div>
                        </div>

                        {/* Version History UI */}
                        <div className="mb-2">
                            <div className="fs-13 text-body fw-medium mb-3">Historial de versiones</div>
                            
                            <div className="position-relative ms-2">
                                <div className="position-absolute border-start border-primary border-2 opacity-25" style={{ left: '7px', top: '14px', bottom: '14px' }}></div>
                                
                                <div className="d-flex align-items-center gap-2 mb-3 position-relative">
                                    <div className="bg-primary rounded-circle border border-2 border-white" style={{ width: '16px', height: '16px', zIndex: 1 }}></div>
                                    <div className="bg-light px-3 py-1 rounded w-100 fs-12 fw-medium text-body shadow-sm">Versión actual</div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-2 mb-3 position-relative opacity-75 hover-opacity-100" style={{ cursor: 'pointer' }}>
                                    <div className="bg-secondary rounded-circle" style={{ width: '8px', height: '8px', marginLeft: '4px', zIndex: 1 }}></div>
                                    <div className="fs-12 ms-2 text-muted">Ayer, 18:34</div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-2 mb-3 position-relative opacity-75 hover-opacity-100" style={{ cursor: 'pointer' }}>
                                    <div className="bg-secondary rounded-circle" style={{ width: '8px', height: '8px', marginLeft: '4px', zIndex: 1 }}></div>
                                    <div className="fs-12 ms-2 text-muted">Hace 3 días, 10:07</div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-2 position-relative opacity-75 hover-opacity-100" style={{ cursor: 'pointer' }}>
                                    <div className="bg-secondary rounded-circle" style={{ width: '8px', height: '8px', marginLeft: '4px', zIndex: 1 }}></div>
                                    <div className="fs-12 ms-2 text-muted">{pageContent?.creado_en ? new Date(pageContent.creado_en).toLocaleDateString() : 'Fecha inicial'}</div>
                                </div>
                            </div>
                        </div>

                    </TabPane>

                    {/* Comments Tab */}
                    <TabPane tabId="comments">
                        <div className="d-flex flex-column gap-3">
                            {comments.length === 0 ? (
                                <div className="text-muted fs-12 text-center mt-4">
                                    No hay comentarios en este documento. Selecciona un texto y usa la barra flotante para agregar uno.
                                </div>
                            ) : (
                                comments.map((comment, index) => (
                                    <div key={index} className={`p-2 rounded border ${activeCommentId === comment.id ? 'border-primary bg-primary-subtle' : 'border-light bg-light'}`}>
                                        <div className="fs-12 text-muted mb-1 fst-italic">"{comment.text}"</div>
                                        <div className="d-flex align-items-center gap-2 mt-2">
                                            <div className="avatar-xxs">
                                                <div className="avatar-title rounded-circle bg-info-subtle text-info fs-10">
                                                    AD
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fs-12 fw-medium">Administrador</div>
                                                <div className="fs-10 text-muted">Revisar este punto.</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
                .nav-custom-pills .nav-link { border: 1px solid transparent; transition: all 0.2s; }
                .hover-opacity-100:hover { opacity: 1 !important; }
            `}</style>
        </div>
    );
};

export default RightSidebar;
