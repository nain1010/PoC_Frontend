import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export const EmojiList = forwardRef((props: any, ref) => {
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

    useEffect(() => setSelectedIndex(0), [props.items]);

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

    return (
        <div className="dropdown-menu show shadow-lg border-0 bg-dark p-2" style={{ maxHeight: '300px', overflowY: 'auto', minWidth: '150px' }}>
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`dropdown-item d-flex align-items-center gap-2 rounded px-2 py-1 ${index === selectedIndex ? 'bg-primary text-white' : 'text-light hover-bg-soft-light'}`}
                        key={index}
                        onClick={() => selectItem(index)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', background: index === selectedIndex ? 'var(--vz-primary)' : 'transparent' }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                        <span style={{ fontSize: '13px' }}>:{item.name}</span>
                    </button>
                ))
            ) : (
                <div className="dropdown-item text-muted text-center" style={{ fontSize: '13px' }}>
                    No hay resultados
                </div>
            )}
        </div>
    );
});

EmojiList.displayName = 'EmojiList';
