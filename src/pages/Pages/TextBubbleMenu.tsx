import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
// @ts-ignore
import { BubbleMenu } from '@tiptap/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIClient } from '../../helpers/api_helper';
import { toast } from 'react-toastify';

const api = APIClient;

const TextBubbleMenu = ({ editor }: { editor: any }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const queryClient = useQueryClient();
    const activeProjectId = localStorage.getItem('activeProjectId');

    const convertToTaskMutation = useMutation({
        mutationFn: (payload: any) => api.create(`/projects/${activeProjectId}/stories`, payload),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['pages', activeProjectId] });
            if (editor) {
                // Reemplazar texto seleccionado por el "chip" de la mención de TipTap
                editor.chain().focus().insertContent({
                    type: 'mention',
                    attrs: {
                        id: `[${res.correlativo}] ${res.titulo}`,
                        label: `[${res.correlativo}] ${res.titulo}`,
                    }
                }).run();
            }
            toast.success("Historia/Tarea creada exitosamente", { position: "top-center" });
        },
        onError: () => {
            toast.error("Error al crear la tarea.", { position: "top-center" });
        }
    });

    if (!editor) return null;

    const toggleDropdown = () => setDropdownOpen(prevState => !prevState);
    const toggleColorDropdown = () => setColorDropdownOpen(prevState => !prevState);

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleConvertToTask = () => {
        if (!activeProjectId) {
            toast.warning("Debe haber un proyecto activo para crear tareas.");
            return;
        }
        
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (!text || text.trim().length === 0) {
            toast.warning("Selecciona algún texto válido para convertir.");
            return;
        }

        const payload = {
            titulo: text.substring(0, 50),
            descripcion: text,
        };
        convertToTaskMutation.mutate(payload);
    };

    const handleAddComment = () => {
        const commentId = `comment-${Math.random().toString(36).substr(2, 9)}`;
        editor.chain().focus().setComment(commentId).run();
        // Here we could emit an event to open the right sidebar
        const event = new CustomEvent('open-comment-sidebar', { detail: { commentId } });
        document.dispatchEvent(event);
    };

    const getActiveTextType = () => {
        if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
        if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
        if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
        if (editor.isActive('heading', { level: 4 })) return 'Heading 4';
        if (editor.isActive('heading', { level: 5 })) return 'Heading 5';
        if (editor.isActive('heading', { level: 6 })) return 'Heading 6';
        if (editor.isActive('codeBlock')) return 'Code Block';
        return 'Text';
    };

    const colors = [
        { label: 'Default', value: 'inherit' },
        { label: 'Gray', value: '#8a94a5' },
        { label: 'Brown', value: '#976e57' },
        { label: 'Orange', value: '#d9730d' },
        { label: 'Yellow', value: '#cb912f' },
        { label: 'Green', value: '#448361' },
        { label: 'Blue', value: '#337ea9' },
        { label: 'Purple', value: '#9065b0' },
        { label: 'Pink', value: '#c14c8a' },
        { label: 'Red', value: '#d44c47' },
    ];

    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100, placement: 'top' }} className="bubble-menu-advanced shadow-lg rounded d-flex align-items-center px-1 py-1" style={{ backgroundColor: '#262626', color: '#e9ecef', gap: '2px', border: '1px solid #333' }}>
            
            {/* Text Type Dropdown */}
            <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} direction="down">
                <DropdownToggle tag="div" className="menu-btn d-flex align-items-center gap-1 rounded" style={{ cursor: 'pointer' }}>
                    {getActiveTextType()} <i className="ri-arrow-down-s-line fs-14"></i>
                </DropdownToggle>
                <DropdownMenu className="shadow-lg border-0 bg-dark p-1" style={{ minWidth: '150px' }}>
                    <DropdownItem className="menu-dropdown-item rounded px-3 py-2" onClick={() => editor.chain().focus().setParagraph().run()}>Text</DropdownItem>
                    <DropdownItem className="menu-dropdown-item rounded px-3 py-2" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</DropdownItem>
                    <DropdownItem className="menu-dropdown-item rounded px-3 py-2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</DropdownItem>
                    <DropdownItem className="menu-dropdown-item rounded px-3 py-2" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</DropdownItem>
                    <DropdownItem className="menu-dropdown-item rounded px-3 py-2" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code Block</DropdownItem>
                </DropdownMenu>
            </Dropdown>

            <div className="vr bg-secondary opacity-25 mx-1" style={{ width: '1px' }}></div>
            
            <button
                type="button"
                className="btn btn-sm btn-ghost-secondary px-2 text-white d-flex align-items-center gap-1"
                onClick={handleAddComment}
                title="Añadir comentario"
            >
                <i className="ri-chat-1-line fs-14"></i>
            </button>

            <div className="vr bg-secondary opacity-25 mx-1" style={{ width: '1px' }}></div>

            {/* Link */}
            <button 
                onClick={setLink} 
                className={`menu-btn rounded d-flex align-items-center gap-1 ${editor.isActive('link') ? 'is-active' : ''}`}
            >
                Link <i className="ri-links-line"></i>
            </button>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Color */}
            <Dropdown isOpen={colorDropdownOpen} toggle={toggleColorDropdown} direction="down">
                <DropdownToggle tag="div" className="menu-btn rounded d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                    Color <i className="ri-font-color border border-secondary rounded px-1" style={{ fontSize: '11px', padding: '1px' }}></i>
                </DropdownToggle>
                <DropdownMenu className="shadow-lg border-0 bg-dark p-2" style={{ minWidth: '150px', zIndex: 1050 }}>
                    <div className="fs-11 text-muted text-uppercase mb-2 px-2">Text Color</div>
                    {colors.map(color => (
                        <div 
                            key={color.value}
                            className="d-flex align-items-center gap-2 px-2 py-1 rounded menu-dropdown-item"
                            style={{ cursor: 'pointer', fontSize: '13px' }}
                            onClick={() => {
                                if (color.value === 'inherit') {
                                    editor.chain().focus().unsetColor().run();
                                } else {
                                    editor.chain().focus().setColor(color.value).run();
                                }
                                setColorDropdownOpen(false);
                            }}
                        >
                            <div className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: color.value === 'inherit' ? '#e9ecef' : color.value, border: color.value === 'inherit' ? '1px solid #495057' : 'none' }}></div>
                            {color.label}
                        </div>
                    ))}
                </DropdownMenu>
            </Dropdown>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Formatting */}
            <div className="d-flex align-items-center gap-1">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`menu-btn rounded ${editor.isActive('bold') ? 'is-active' : ''}`}><i className="ri-bold"></i></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`menu-btn rounded ${editor.isActive('italic') ? 'is-active' : ''}`}><i className="ri-italic"></i></button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`menu-btn rounded ${editor.isActive('underline') ? 'is-active' : ''}`}><i className="ri-underline"></i></button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`menu-btn rounded ${editor.isActive('strike') ? 'is-active' : ''}`}><i className="ri-strikethrough"></i></button>
            </div>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Alignment */}
            <div className="d-flex align-items-center gap-1">
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`menu-btn rounded ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}><i className="ri-align-left"></i></button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`menu-btn rounded ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}><i className="ri-align-center"></i></button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`menu-btn rounded ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}><i className="ri-align-right"></i></button>
            </div>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Convert to Task */}
            <button
                onClick={handleConvertToTask}
                className="menu-btn rounded d-flex align-items-center gap-1 text-info"
                title="Convertir a Tarea"
                disabled={convertToTaskMutation.isPending}
            >
                {convertToTaskMutation.isPending ? <i className="ri-loader-4-line ri-spin"></i> : <i className="ri-task-line"></i>}
                <span className="fs-12 d-none d-sm-inline">a Tarea</span>
            </button>

            <style>{`
                .hover-bg-dark:hover { background-color: rgba(255,255,255,0.1); }
                .menu-btn {
                    background: transparent;
                    border: none;
                    color: #d1d5db; /* Light gray */
                    padding: 4px 8px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .menu-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                    color: #ffffff;
                }
                .menu-btn.is-active {
                    background-color: var(--vz-primary);
                    color: #ffffff;
                }
                .menu-dropdown-item {
                    color: #d1d5db !important;
                    background-color: transparent !important;
                    transition: all 0.2s ease;
                }
                .menu-dropdown-item:hover {
                    background-color: rgba(255,255,255,0.1) !important;
                    color: #ffffff !important;
                }
            `}</style>
        </BubbleMenu>
    );
};

export default TextBubbleMenu;
