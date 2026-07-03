import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    useEffect(() => {
        const selectedBtn = document.getElementById(`slash-cmd-${selectedIndex}`);
        if (selectedBtn) {
            selectedBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex]);

    return (
        <div className="dropdown-menu show shadow-lg border no-scrollbar" style={{ position: 'relative', minWidth: '240px', maxHeight: '320px', overflowY: 'auto', borderRadius: '12px', backgroundColor: 'var(--vz-dropdown-bg)', padding: '0.5rem' }}>
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        id={`slash-cmd-${index}`}
                        className={`d-flex align-items-center gap-3 py-2 px-3 w-100 border-0 text-start ${index === selectedIndex ? 'bg-soft-primary text-primary rounded' : 'bg-transparent text-body'}`}
                        key={index}
                        onClick={() => selectItem(index)}
                        style={{ cursor: 'pointer', outline: 'none', transition: 'all 0.2s ease' }}
                    >
                        <div className={`d-flex align-items-center justify-content-center rounded ${index === selectedIndex ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px' }}>
                            <i className={`${item.icon} fs-16`}></i>
                        </div>
                        <div>
                            <div className="fw-semibold fs-13">{item.title}</div>
                            <div className="opacity-75 fs-11">{item.description}</div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="p-3 text-muted fs-13 text-center">No hay resultados</div>
            )}
        </div>
    );
});
