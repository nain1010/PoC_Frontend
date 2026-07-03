import React from 'react';
// @ts-ignore
import { BubbleMenu } from '@tiptap/react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const TableBubbleMenu = ({ editor }: { editor: any }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [colorOpen, setColorOpen] = React.useState(false);

    if (!editor) return null;

    return (
        <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100, placement: 'top' }} 
            shouldShow={({ editor }) => editor.isActive('table')}
            className="shadow-sm border rounded bg-white p-1 d-flex gap-1 align-items-center"
        >
            <Dropdown isOpen={menuOpen} toggle={() => setMenuOpen(!menuOpen)}>
                <DropdownToggle className="btn btn-sm btn-ghost-secondary px-2 py-1 fs-12 fw-medium d-flex align-items-center gap-1">
                    <i className="ri-table-line"></i> Opciones de Tabla
                </DropdownToggle>
                <DropdownMenu className="shadow-lg border-0 fs-13" style={{ minWidth: '200px' }}>
                    
                    <div className="px-3 py-1 text-muted fs-11 fw-semibold text-uppercase">Filas</div>
                    <DropdownItem onClick={() => editor.chain().focus().addRowBefore().run()}><i className="ri-insert-row-top me-2 text-muted"></i> Insertar fila arriba</DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().addRowAfter().run()}><i className="ri-insert-row-bottom me-2 text-muted"></i> Insertar fila abajo</DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().deleteRow().run()} className="text-danger"><i className="ri-delete-row me-2"></i> Eliminar fila</DropdownItem>
                    
                    <DropdownItem divider />
                    
                    <div className="px-3 py-1 text-muted fs-11 fw-semibold text-uppercase">Columnas</div>
                    <DropdownItem onClick={() => editor.chain().focus().addColumnBefore().run()}><i className="ri-insert-column-left me-2 text-muted"></i> Insertar columna izq.</DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().addColumnAfter().run()}><i className="ri-insert-column-right me-2 text-muted"></i> Insertar columna der.</DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().deleteColumn().run()} className="text-danger"><i className="ri-delete-column me-2"></i> Eliminar columna</DropdownItem>
                    
                    <DropdownItem divider />
                    
                    <div className="px-3 py-1 text-muted fs-11 fw-semibold text-uppercase">Celdas</div>
                    <DropdownItem onClick={() => editor.chain().focus().mergeCells().run()}><i className="ri-layout-row-fill me-2 text-muted"></i> Combinar celdas</DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().splitCell().run()}><i className="ri-layout-column-fill me-2 text-muted"></i> Dividir celda</DropdownItem>
                    <DropdownItem onClick={() => editor.chain().focus().toggleHeaderCell().run()}><i className="ri-heading me-2 text-muted"></i> Alternar encabezado</DropdownItem>

                    <DropdownItem divider />
                    <DropdownItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-danger fw-medium"><i className="ri-delete-bin-line me-2"></i> Eliminar tabla completa</DropdownItem>
                </DropdownMenu>
            </Dropdown>

            <div className="vr opacity-25 my-1"></div>

            {/* Quick Actions (outside dropdown) */}
            <button className="btn btn-sm btn-ghost-secondary px-2 py-1" title="Insertar fila abajo" onClick={() => editor.chain().focus().addRowAfter().run()}><i className="ri-insert-row-bottom"></i></button>
            <button className="btn btn-sm btn-ghost-secondary px-2 py-1" title="Insertar columna derecha" onClick={() => editor.chain().focus().addColumnAfter().run()}><i className="ri-insert-column-right"></i></button>
            <button className="btn btn-sm btn-ghost-danger px-2 py-1 text-danger" title="Eliminar tabla" onClick={() => editor.chain().focus().deleteTable().run()}><i className="ri-delete-bin-line"></i></button>

        </BubbleMenu>
    );
};

export default TableBubbleMenu;
