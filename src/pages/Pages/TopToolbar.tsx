import React from 'react';
import { Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const TopToolbar = ({ editor }: { editor: any }) => {
    const [blockDropdownOpen, setBlockDropdownOpen] = React.useState(false);
    const [colorDropdownOpen, setColorDropdownOpen] = React.useState(false);
    const [alignDropdownOpen, setAlignDropdownOpen] = React.useState(false);

    if (!editor) return null;

    const getActiveBlockName = () => {
        if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
        if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
        if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
        if (editor.isActive('heading', { level: 4 })) return 'Heading 4';
        if (editor.isActive('heading', { level: 5 })) return 'Heading 5';
        if (editor.isActive('heading', { level: 6 })) return 'Heading 6';
        if (editor.isActive('bulletList')) return 'Bullet List';
        if (editor.isActive('orderedList')) return 'Numbered List';
        if (editor.isActive('taskList')) return 'To-do List';
        if (editor.isActive('codeBlock')) return 'Code Block';
        if (editor.isActive('blockquote')) return 'Quote';
        if (editor.isActive('table')) return 'Table';
        if (editor.isActive('callout')) return 'Callout';
        return 'Text';
    };

    const toggleBlockDropdown = () => setBlockDropdownOpen(!blockDropdownOpen);
    const toggleColorDropdown = () => setColorDropdownOpen(!colorDropdownOpen);
    const toggleAlignDropdown = () => setAlignDropdownOpen(!alignDropdownOpen);

    const btnClass = (active: boolean) => `btn btn-sm ${active ? 'bg-soft-primary text-primary' : 'btn-ghost-secondary'} px-2 py-1`;

    return (
        <div className="d-flex align-items-center justify-content-between p-2 border-bottom sticky-top z-3" style={{ backgroundColor: 'var(--vz-card-bg-custom)', top: 0, marginTop: '-1px' }}>
            
            {/* Left Zone: Editor Controls */}
            <div className="d-flex align-items-center gap-2">
                {/* Block Selector */}
                <Dropdown isOpen={blockDropdownOpen} toggle={toggleBlockDropdown}>
                    <DropdownToggle caret className="btn btn-sm btn-ghost-secondary px-2 py-1 d-flex align-items-center gap-1 fs-13">
                        {getActiveBlockName()}
                    </DropdownToggle>
                    <DropdownMenu className="shadow-sm border-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <DropdownItem onClick={() => editor.chain().focus().setParagraph().run()}>Text</DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet List</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered List</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleTaskList().run()}>To-do List</DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code Block</DropdownItem>
                        <DropdownItem onClick={() => editor.chain().focus().insertContent({ type: 'callout', content: [{ type: 'text', text: ' ' }] }).run()}>Callout</DropdownItem>
                    </DropdownMenu>
                </Dropdown>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Color Selector */}
                <Dropdown isOpen={colorDropdownOpen} toggle={toggleColorDropdown}>
                    <DropdownToggle className="btn btn-sm btn-ghost-secondary px-2 py-1 fs-13 fw-bold font-monospace">
                        A<span className="text-primary ms-1">A</span>
                    </DropdownToggle>
                    <DropdownMenu className="shadow-sm border-0 p-2">
                        <div className="text-muted fs-11 mb-2 fw-semibold text-uppercase">Text Color</div>
                        <div className="d-flex gap-1 mb-2 flex-wrap" style={{width: '150px'}}>
                            {['#000000', '#f03e3e', '#d6336c', '#ae3ec9', '#7048e8', '#4263eb', '#1c7ed6', '#1098ad', '#0ca678', '#37b24d', '#f59f00', '#f76707'].map(color => (
                                <div key={color} style={{width: 20, height: 20, backgroundColor: color, cursor: 'pointer', borderRadius: '4px'}} onClick={() => { editor.chain().focus().setColor(color).run(); toggleColorDropdown(); }} />
                            ))}
                        </div>
                        <div className="text-muted fs-11 mb-2 fw-semibold text-uppercase mt-3">Highlight Color</div>
                        <div className="d-flex gap-1 flex-wrap" style={{width: '150px'}}>
                            {['#ffe3e3', '#ffdeeb', '#f3d9fa', '#e5dbff', '#dbe4ff', '#d0ebff', '#c5f6fa', '#c3fae8', '#d3f9d8', '#fff3bf', '#ffe8cc'].map(color => (
                                <div key={color} style={{width: 20, height: 20, backgroundColor: color, cursor: 'pointer', borderRadius: '4px'}} onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); toggleColorDropdown(); }} />
                            ))}
                        </div>
                        <div className="mt-2">
                            <Button size="sm" color="light" outline className="w-100 fs-11 border-0" onClick={() => { editor.chain().focus().unsetColor().unsetHighlight().run(); toggleColorDropdown(); }}>Reset Colors</Button>
                        </div>
                    </DropdownMenu>
                </Dropdown>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Character Styles */}
                <div className="d-flex gap-1">
                    <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><i className="ri-bold"></i></button>
                    <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><i className="ri-italic"></i></button>
                    <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><i className="ri-underline"></i></button>
                    <button className={btnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><i className="ri-strikethrough"></i></button>
                </div>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Alignment */}
                <Dropdown isOpen={alignDropdownOpen} toggle={toggleAlignDropdown}>
                    <DropdownToggle className="btn btn-sm btn-ghost-secondary px-2 py-1">
                        <i className={`ri-align-${editor.isActive({ textAlign: 'center' }) ? 'center' : editor.isActive({ textAlign: 'right' }) ? 'right' : editor.isActive({ textAlign: 'justify' }) ? 'justify' : 'left'}`}></i>
                    </DropdownToggle>
                    <DropdownMenu className="shadow-sm border-0 min-w-auto">
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('left').run()}><i className="ri-align-left me-2"></i> Left</DropdownItem>
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('center').run()}><i className="ri-align-center me-2"></i> Center</DropdownItem>
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('right').run()}><i className="ri-align-right me-2"></i> Right</DropdownItem>
                        <DropdownItem className="px-3" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><i className="ri-align-justify me-2"></i> Justify</DropdownItem>
                    </DropdownMenu>
                </Dropdown>

                <div className="vr text-muted opacity-50" style={{ width: '1px', height: '16px' }}></div>

                {/* Quick Items */}
                <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><i className="ri-list-unordered"></i></button>
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => {
                        const url = window.prompt('URL del enlace:');
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                    }} title="Link"><i className="ri-link"></i></button>
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block"><i className="ri-code-box-line"></i></button>
                    <button className="btn btn-sm btn-ghost-secondary px-2 py-1" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><i className="ri-table-line"></i></button>
                </div>
            </div>

        </div>
    );
};

export default TopToolbar;
