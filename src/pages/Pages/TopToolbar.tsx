import React, { useState } from 'react';
import { Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import ExportPageModal from './ExportPageModal';

const TopToolbar = ({ 
    editor, 
    isLocked, 
    toggleLock, 
    isFullWidth, 
    toggleFullWidth,
    isPublic,
    publicToken,
    togglePublish,
    onDeletePage,
    onDownloadPage,
    pageTitle,
    onToggleSidebar,
    isSidebarOpen
}: { 
    editor: any, 
    isLocked?: boolean, 
    toggleLock?: () => void, 
    isFullWidth?: boolean, 
    toggleFullWidth?: () => void,
    isPublic?: boolean,
    publicToken?: string,
    togglePublish?: () => void,
    onDeletePage?: () => void,
    onDownloadPage?: (html?: string) => void,
    pageTitle?: string,
    onToggleSidebar?: () => void,
    isSidebarOpen?: boolean
}) => {
    const [blockDropdownOpen, setBlockDropdownOpen] = React.useState(false);
    const [colorDropdownOpen, setColorDropdownOpen] = React.useState(false);
    const [alignDropdownOpen, setAlignDropdownOpen] = React.useState(false);
    const [exportModalOpen, setExportModalOpen] = React.useState(false);

    if (!editor) return null;

    if (isLocked) {
        return (
            <div className="d-flex align-items-center justify-content-between p-2 border-bottom sticky-top z-3" style={{ backgroundColor: 'var(--vz-card-bg-custom)', top: 0, marginTop: '-1px' }}>
                <div className="text-muted fs-13 d-flex align-items-center gap-2">
                    {onToggleSidebar && (
                        <Button color="light" size="sm" className="btn-icon p-0 bg-transparent border-0 text-muted hover-bg-soft-primary rounded me-2" onClick={onToggleSidebar} title={isSidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}>
                            <i className={`ri-layout-left-${isSidebarOpen ? 'close' : 'open'}-line fs-18`}></i>
                        </Button>
                    )}
                    <i className="ri-lock-2-line text-warning"></i> <span className="fw-medium text-body">Página bloqueada (Solo lectura)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    {toggleFullWidth && (
                        <button className="btn btn-sm btn-ghost-secondary px-2 py-1 d-flex align-items-center gap-1" onClick={toggleFullWidth} title={isFullWidth ? "Contraer" : "Ancho Completo"}>
                            <i className={isFullWidth ? "ri-collapse-diagonal-line" : "ri-expand-diagonal-line"}></i>
                            <span className="fs-12">{isFullWidth ? "Contraer ancho" : "Ancho completo"}</span>
                        </button>
                    )}
                    {toggleLock && (
                        <button className="btn btn-sm btn-outline-primary px-3 py-1 d-flex align-items-center gap-1" onClick={toggleLock} title="Desbloquear página">
                            <i className="ri-lock-unlock-line"></i> Desbloquear
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const getActiveBlockName = () => {
        if (editor.isActive('heading', { level: 1 })) return 'Título 1';
        if (editor.isActive('heading', { level: 2 })) return 'Título 2';
        if (editor.isActive('heading', { level: 3 })) return 'Título 3';
        if (editor.isActive('heading', { level: 4 })) return 'Título 4';
        if (editor.isActive('heading', { level: 5 })) return 'Título 5';
        if (editor.isActive('heading', { level: 6 })) return 'Título 6';
        if (editor.isActive('bulletList')) return 'Lista viñetas';
        if (editor.isActive('orderedList')) return 'Lista numerada';
        if (editor.isActive('taskList')) return 'Lista tareas';
        if (editor.isActive('codeBlock')) return 'Código';
        if (editor.isActive('blockquote')) return 'Cita';
        if (editor.isActive('table')) return 'Tabla';
        if (editor.isActive('callout')) return 'Destacado';
        return 'Texto';
    };

    const toggleBlockDropdown = () => setBlockDropdownOpen(!blockDropdownOpen);
    const toggleColorDropdown = () => setColorDropdownOpen(!colorDropdownOpen);
    const toggleAlignDropdown = () => setAlignDropdownOpen(!alignDropdownOpen);

    const btnClass = (active: boolean) => `btn btn-sm ${active ? 'bg-soft-primary text-primary' : 'btn-ghost-secondary'} px-2 py-1`;

    return (
        <>
        <div className="d-flex align-items-center justify-content-between p-2 border-bottom sticky-top z-3" style={{ backgroundColor: 'var(--vz-card-bg-custom)', top: 0, marginTop: '-1px' }}>
            
            {/* Left Zone: Editor Controls */}
            <div className="d-flex align-items-center flex-wrap gap-1">
                {onToggleSidebar && (
                    <>
                        <Button color="light" size="sm" className="btn-icon p-0 bg-transparent border-0 text-muted hover-bg-soft-primary rounded me-1" onClick={onToggleSidebar} title={isSidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}>
                            <i className={`ri-layout-left-${isSidebarOpen ? 'close' : 'open'}-line fs-18`}></i>
                        </Button>
                        <div className="vr text-muted opacity-50 mx-1" style={{ width: '1px', height: '16px' }}></div>
                    </>
                )}

                {/* Block Selector */}
                <Dropdown isOpen={blockDropdownOpen} toggle={toggleBlockDropdown}>
                    <DropdownToggle caret className="btn btn-sm btn-ghost-secondary px-2 py-1 d-flex align-items-center gap-1 fs-13">
                        {getActiveBlockName()}
                    </DropdownToggle>
                    <DropdownMenu className="shadow-sm border-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <DropdownItem onClick={() => editor.chain().focus().setParagraph().run()}>Texto</DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Título 1</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Título 2</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Título 3</DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => editor.chain().focus().toggleBulletList().run()}>Lista de viñetas</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>Lista numerada</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleTaskList().run()}>Lista de tareas</DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>Cita (Quote)</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Bloque de código</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().insertContent({ type: 'callout', content: [{ type: 'text', text: ' ' }] }).run()}>Destacado (Callout)</DropdownItem>
                    </DropdownMenu>
                </Dropdown>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Color Selector */}
                <Dropdown isOpen={colorDropdownOpen} toggle={toggleColorDropdown}>
                    <DropdownToggle className="btn btn-sm btn-ghost-secondary px-2 py-1 fs-13 fw-bold font-monospace">
                        A<span className="text-primary ms-1">A</span>
                    </DropdownToggle>
                    <DropdownMenu className="shadow-sm border-0 p-2">
                        <div className="text-muted fs-11 mb-2 fw-semibold text-uppercase">Color del texto</div>
                        <div className="d-flex gap-1 mb-2 flex-wrap" style={{width: '150px'}}>
                            {['#000000', '#f03e3e', '#d6336c', '#ae3ec9', '#7048e8', '#4263eb', '#1c7ed6', '#1098ad', '#0ca678', '#37b24d', '#f59f00', '#f76707'].map(color => (
                                <div key={color} style={{width: 20, height: 20, backgroundColor: color, cursor: 'pointer', borderRadius: '4px'}} onClick={() => { editor.chain().focus().setColor(color).run(); toggleColorDropdown(); }} />
                            ))}
                        </div>
                        <div className="text-muted fs-11 mb-2 fw-semibold text-uppercase mt-3">Color de resaltado</div>
                        <div className="d-flex gap-1 flex-wrap" style={{width: '150px'}}>
                            {['#ffe3e3', '#ffdeeb', '#f3d9fa', '#e5dbff', '#dbe4ff', '#d0ebff', '#c5f6fa', '#c3fae8', '#d3f9d8', '#fff3bf', '#ffe8cc'].map(color => (
                                <div key={color} style={{width: 20, height: 20, backgroundColor: color, cursor: 'pointer', borderRadius: '4px'}} onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); toggleColorDropdown(); }} />
                            ))}
                        </div>
                        <div className="mt-2">
                            <Button size="sm" color="light" outline className="w-100 fs-11 border-0" onClick={() => { editor.chain().focus().unsetColor().unsetHighlight().run(); toggleColorDropdown(); }}>Restablecer colores</Button>
                        </div>
                    </DropdownMenu>
                </Dropdown>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Character Styles */}
                <div className="d-flex gap-1">
                    <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><i className="ri-bold"></i></button>
                    <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><i className="ri-italic"></i></button>
                    <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado"><i className="ri-underline"></i></button>
                    <button className={btnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado"><i className="ri-strikethrough"></i></button>
                </div>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Alignment */}
                <Dropdown isOpen={alignDropdownOpen} toggle={toggleAlignDropdown}>
                    <DropdownToggle className="btn btn-sm btn-ghost-secondary px-2 py-1">
                        <i className={`ri-align-${editor.isActive({ textAlign: 'center' }) ? 'center' : editor.isActive({ textAlign: 'right' }) ? 'right' : editor.isActive({ textAlign: 'justify' }) ? 'justify' : 'left'}`}></i>
                    </DropdownToggle>
                    <DropdownMenu className="shadow-sm border-0 min-w-auto">
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('left').run()}><i className="ri-align-left me-2"></i> Izquierda</DropdownItem>
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('center').run()}><i className="ri-align-center me-2"></i> Centro</DropdownItem>
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('right').run()}><i className="ri-align-right me-2"></i> Derecha</DropdownItem>
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><i className="ri-align-justify me-2"></i> Justificado</DropdownItem>
                    </DropdownMenu>
                </Dropdown>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Quick Items */}
                <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista de viñetas"><i className="ri-list-unordered"></i></button>
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => {
                        const url = window.prompt('URL del enlace:');
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                    }} title="Enlace"><i className="ri-link"></i></button>
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloque de código"><i className="ri-code-box-line"></i></button>
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Tabla"><i className="ri-table-line"></i></button>
                </div>
            </div>

            {/* Right Zone: View Controls */}
            <div className="d-flex align-items-center gap-2">
                
                {/* Publish to Web */}
                {togglePublish && (
                    <div className="d-flex align-items-center border-end pe-2 me-1">
                        <button 
                            className={`btn btn-sm px-2 py-1 d-flex align-items-center gap-1 ${isPublic ? 'btn-success text-white' : 'btn-ghost-secondary text-muted'}`} 
                            onClick={togglePublish} 
                            title={isPublic ? "Página pública" : "Publicar en la Web"}
                        >
                            <i className={isPublic ? "ri-global-line" : "ri-earth-line"}></i>
                            <span className="fs-12 d-none d-sm-inline">{isPublic ? "Pública" : "Publicar"}</span>
                        </button>
                        {isPublic && publicToken && (
                            <button 
                                className="btn btn-sm btn-ghost-secondary px-2"
                                title="Copiar enlace público"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/public/p/${publicToken}`);
                                }}
                            >
                                <i className="ri-file-copy-line fs-14"></i>
                            </button>
                        )}
                    </div>
                )}

                {toggleFullWidth && (
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1 d-flex align-items-center gap-1" onClick={toggleFullWidth} title={isFullWidth ? "Contraer" : "Ancho Completo"}>
                        <i className={isFullWidth ? "ri-collapse-diagonal-line" : "ri-expand-diagonal-line"}></i>
                        <span className="fs-12 d-none d-sm-inline">{isFullWidth ? "Contraer" : "Ancho completo"}</span>
                    </button>
                )}
                {toggleLock && (
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1 d-flex align-items-center gap-1 text-muted" onClick={toggleLock} title="Bloquear página">
                        <i className="ri-lock-line"></i>
                        <span className="fs-12 d-none d-sm-inline">Bloquear</span>
                    </button>
                )}
                {onDownloadPage && (
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1 d-flex align-items-center gap-1 text-muted" onClick={() => setExportModalOpen(true)} title="Exportar página">
                        <i className="ri-download-2-line"></i>
                    </button>
                )}
                {onDeletePage && (
                    <button className="btn btn-sm btn-ghost-danger px-2 py-1 d-flex align-items-center gap-1 text-danger" onClick={onDeletePage} title="Eliminar página">
                        <i className="ri-delete-bin-line"></i>
                    </button>
                )}
            </div>

        </div>
            <ExportPageModal 
                isOpen={exportModalOpen} 
                toggle={() => setExportModalOpen(!exportModalOpen)} 
                editor={editor}
                pageTitle={pageTitle || document.title.split('|')[0].trim()}
            />
        </>
    );
};

export default TopToolbar;
