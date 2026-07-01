import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
// @ts-ignore
import { BubbleMenu } from '@tiptap/react/menus';

const TextBubbleMenu = ({ editor }: { editor: any }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

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
                <DropdownToggle tag="div" className="d-flex align-items-center gap-1 px-2 py-1 rounded hover-bg-dark" style={{ cursor: 'pointer', fontSize: '13px' }}>
                    {getActiveTextType()} <i className="ri-arrow-down-s-line fs-14"></i>
                </DropdownToggle>
                <DropdownMenu className="shadow-lg border-0 bg-dark p-1" style={{ minWidth: '150px' }}>
                    <DropdownItem className="text-light hover-bg-soft-light rounded px-3 py-2" onClick={() => editor.chain().focus().setParagraph().run()}>Text</DropdownItem>
                    <DropdownItem className="text-light hover-bg-soft-light rounded px-3 py-2" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</DropdownItem>
                    <DropdownItem className="text-light hover-bg-soft-light rounded px-3 py-2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</DropdownItem>
                    <DropdownItem className="text-light hover-bg-soft-light rounded px-3 py-2" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</DropdownItem>
                    <DropdownItem className="text-light hover-bg-soft-light rounded px-3 py-2" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code Block</DropdownItem>
                </DropdownMenu>
            </Dropdown>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Link */}
            <button 
                onClick={setLink} 
                className={`btn btn-sm btn-ghost-light p-1 px-2 text-light rounded d-flex align-items-center gap-1 ${editor.isActive('link') ? 'bg-primary border-primary' : 'border-0'}`}
                style={{ fontSize: '13px' }}
            >
                Link <i className="ri-links-line"></i>
            </button>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Color */}
            <Dropdown isOpen={colorDropdownOpen} toggle={toggleColorDropdown} direction="down">
                <DropdownToggle tag="div" className="btn btn-sm btn-ghost-light p-1 px-2 text-light rounded d-flex align-items-center gap-1 border-0" style={{ cursor: 'pointer', fontSize: '13px' }}>
                    Color <i className="ri-font-color border border-secondary rounded px-1" style={{ fontSize: '11px', padding: '1px' }}></i>
                </DropdownToggle>
                <DropdownMenu className="shadow-lg border-0 bg-dark p-2" style={{ minWidth: '150px', zIndex: 1050 }}>
                    <div className="fs-11 text-muted text-uppercase mb-2 px-2">Text Color</div>
                    {colors.map(color => (
                        <div 
                            key={color.value}
                            className="d-flex align-items-center gap-2 px-2 py-1 rounded hover-bg-soft-light"
                            style={{ cursor: 'pointer', fontSize: '13px', color: '#e9ecef' }}
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
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive('bold') ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-bold"></i></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive('italic') ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-italic"></i></button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive('underline') ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-underline"></i></button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive('strike') ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-strikethrough"></i></button>
            </div>

            <div className="vr opacity-25 mx-1" style={{ height: '16px', backgroundColor: '#fff' }}></div>

            {/* Alignment */}
            <div className="d-flex align-items-center gap-1">
                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive({ textAlign: 'left' }) ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-align-left"></i></button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive({ textAlign: 'center' }) ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-align-center"></i></button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`btn btn-sm p-1 rounded border-0 ${editor.isActive({ textAlign: 'right' }) ? 'btn-primary' : 'btn-ghost-light text-light'}`}><i className="ri-align-right"></i></button>
            </div>

            <style>{`
                .hover-bg-dark:hover { background-color: rgba(255,255,255,0.1); }
            `}</style>
        </BubbleMenu>
    );
};

export default TextBubbleMenu;
