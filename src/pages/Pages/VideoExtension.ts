import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import VideoNodeView from './VideoNodeView';

export interface VideoOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        video: {
            setVideo: (options: { src: string; isYouTube?: boolean }) => ReturnType;
        };
    }
}

export const VideoExtension = Node.create<VideoOptions>({
    name: 'video',

    group: 'block',

    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            src: {
                default: null,
            },
            isYouTube: {
                default: false,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="video"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'video' }, this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setVideo:
                options =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: options,
                    });
                },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(VideoNodeView);
    },
});

export default VideoExtension;
