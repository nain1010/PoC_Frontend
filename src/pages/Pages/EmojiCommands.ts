import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { EmojiList } from './EmojiList';
import { PluginKey } from '@tiptap/pm/state';

export const emojiSuggestionPluginKey = new PluginKey('emojiSuggestion');

export default Extension.create({
    name: 'emojiCommands',
    addOptions() {
        return {
            suggestion: {
                char: ':',
                pluginKey: emojiSuggestionPluginKey,
                command: ({ editor, range, props }: any) => {
                    editor.chain().focus().deleteRange(range).insertContent(props.emoji).run();
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const getEmojiSuggestionItems = () => {
    // Lista ligera de emojis más comunes para no saturar
    const emojis = [
        { name: 'smile', emoji: '😀' },
        { name: 'grinning', emoji: '😁' },
        { name: 'joy', emoji: '😂' },
        { name: 'rofl', emoji: '🤣' },
        { name: 'wink', emoji: '😉' },
        { name: 'blush', emoji: '😊' },
        { name: 'heart_eyes', emoji: '😍' },
        { name: 'kissing_heart', emoji: '😘' },
        { name: 'stuck_out_tongue', emoji: '😛' },
        { name: 'sunglasses', emoji: '😎' },
        { name: 'sob', emoji: '😭' },
        { name: 'sweat_smile', emoji: '😅' },
        { name: 'thinking', emoji: '🤔' },
        { name: 'rolling_eyes', emoji: '🙄' },
        { name: 'thumbsup', emoji: '👍' },
        { name: 'thumbsdown', emoji: '👎' },
        { name: 'clap', emoji: '👏' },
        { name: 'pray', emoji: '🙏' },
        { name: 'fire', emoji: '🔥' },
        { name: 'heart', emoji: '❤️' },
        { name: 'broken_heart', emoji: '💔' },
        { name: 'star', emoji: '⭐' },
        { name: 'rocket', emoji: '🚀' },
        { name: 'check', emoji: '✅' },
        { name: 'cross', emoji: '❌' },
        { name: 'warning', emoji: '⚠️' },
        { name: 'info', emoji: 'ℹ️' },
        { name: 'question', emoji: '❓' },
        { name: 'bulb', emoji: '💡' },
        { name: 'tada', emoji: '🎉' },
    ];
    return emojis;
};

export const renderEmojiItems = () => {
    let component: any;
    let popup: any;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(EmojiList, {
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
            popup[0].destroy();
            component.destroy();
        },
    };
};
