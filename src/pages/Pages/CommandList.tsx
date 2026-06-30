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
        onKeyDown: ({ event }) => {
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

    return (
        <div className="dropdown-menu show shadow-lg border-0" style={{ position: 'relative', minWidth: '220px', borderRadius: '8px', overflow: 'hidden' }}>
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        className={`dropdown-item d-flex align-items-center gap-2 py-2 px-3 ${index === selectedIndex ? 'active bg-light text-dark' : ''}`}
                        key={index}
                        onClick={() => selectItem(index)}
                        style={{ cursor: 'pointer', outline: 'none' }}
                    >
                        <i className={`${item.icon} fs-16 text-muted`}></i>
                        <div>
                            <div className="fw-semibold fs-13">{item.title}</div>
                            <div className="text-muted fs-11">{item.description}</div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="p-3 text-muted fs-13 text-center">No hay resultados</div>
            )}
        </div>
    );
});
