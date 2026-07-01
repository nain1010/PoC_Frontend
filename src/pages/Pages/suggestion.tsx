import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { APIClient } from '../../helpers/api_helper';

const api = APIClient;

// Componente visual del menú
export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.title, label: item.title, url: item.url }); // The actual text that will be inserted
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

  if (!props.items || props.items.length === 0) {
    return (
      <div className="bg-white border rounded shadow-sm p-2 text-muted fs-13" style={{ zIndex: 9999 }}>
        No se encontraron resultados
      </div>
    );
  }

  return (
    <div className="bg-white border rounded shadow-sm overflow-hidden" style={{ minWidth: '200px', maxWidth: '300px', zIndex: 9999 }}>
      {props.items.map((item: any, index: number) => (
        <button
          className={`btn btn-sm w-100 text-start rounded-0 border-0 px-2 py-1 ${
            index === selectedIndex ? 'bg-soft-primary text-primary' : 'bg-transparent text-body hover-bg-soft-light'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          <div className="d-flex align-items-center gap-2">
            <i className={item.type === 'story' ? "ri-book-mark-line text-success" : "ri-task-line text-info"}></i>
            <span className="text-truncate flex-grow-1" style={{ fontSize: '13px' }}>{item.title}</span>
          </div>
        </button>
      ))}
    </div>
  );
});

export const getSuggestionConfig = (activeProjectId: string) => ({
  char: '@',
  items: async ({ query }: { query: string }) => {
    if (!query || query.length < 2) return [];
    try {
        const res = await api.get(`/projects/${activeProjectId}/search-backlog?q=${query}`);
        return res || [];
    } catch (e) {
        return [];
    }
  },
  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        if (popup && popup[0]) {
            popup[0].destroy();
        }
        if (component) {
            component.destroy();
        }
      },
    };
  },
});
