<template>
    <div class="mb-4 flex flex-col">
        <div class="relative">
            <div class="flex flex-wrap gap-1 p-2 border-b">
                <button
                    v-for="btn in toolbar"
                    :key="btn.title"
                    :title="btn.title"
                    @click="btn.action"
                    class="px-2 py-1 text-sm rounded hover:bg-gray-200"
                    :class="{ 'bg-indigo-100 text-indigo-700': btn.isActive() }"
                >
                    {{ btn.label }}
                </button>
            </div>
            <div
                v-if="showEmojiPicker"
                class="absolute top-full left-0 mt-1 bg-white border rounded shadow p-2 z-50 w-72 h-60 overflow-hidden"
            >
                <emoji-picker
                    @emoji-click="insertEmojiEvent"
                    style="--emoji-size: 20px; width: 100%; height: 100%"
                />
            </div>
            <div
                v-if="showLinkInput"
                class="absolute top-full left-0 mt-1 bg-white border rounded shadow p-3 z-50 w-64"
            >
                <input
                    v-model="linkUrl"
                    placeholder="https://example.com"
                    class="border rounded w-full text-sm px-2 py-1 mb-2"
                />
                <div class="flex justify-end gap-2">
                    <button
                        @click.stop="cancelLink"
                        class="px-2 py-1 text-sm bg-gray-200 rounded"
                    >
                        Отмена
                    </button>
                    <button
                        @click.stop="confirmLink"
                        class="px-2 py-1 text-sm bg-indigo-600 text-white rounded"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>

        <EditorContent
            :editor="editor"
            class="p-3 min-h-64 custom-editor-content"
            @click="focusEditor"
        />
    </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import "emoji-picker-element";

const props = defineProps({
    modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const showEmojiPicker = ref(false);
const showLinkInput = ref(false);
const linkUrl = ref("");

const editor = useEditor({
    extensions: [StarterKit, Link, Underline],
    content: props.modelValue || "",
    onUpdate: ({ editor }) => {
        emit("update:modelValue", editor.getHTML());
    },
});

watch(
    () => props.modelValue,
    (val) => {
        if (!editor?.value) return;
        const current = editor.value.getHTML();
        if (val !== current) {
            editor.value.commands.setContent(val || "");
        }
    }
);

function toggleEmojiPicker() {
    showLinkInput.value = false;
    showEmojiPicker.value = !showEmojiPicker.value;
}

function insertEmojiEvent(e) {
    const emoji = e.detail.unicode;
    if (emoji) editor.value?.chain().focus().insertContent(emoji).run();
}

function toggleLinkInput() {
    showLinkInput.value = !showLinkInput.value;
    showEmojiPicker.value = false;
    linkUrl.value = "";
}

function confirmLink() {
    if (linkUrl.value.trim()) {
        editor.value
            ?.chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: linkUrl.value.trim() })
            .run();
    }
    showLinkInput.value = false;
}

function cancelLink() {
    showLinkInput.value = false;
}

function focusEditor() {
    editor.value?.chain().focus().run();
}

const toolbar = computed(() => {
    if (!editor.value) return [];
    return [
        {
            label: "B",
            title: "Bold",
            action: () => editor.value.chain().focus().toggleBold().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("bold"),
        },
        {
            label: "I",
            title: "Italic",
            action: () => editor.value.chain().focus().toggleItalic().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("italic"),
        },
        {
            label: "U",
            title: "Underline",
            action: () => editor.value.chain().focus().toggleUnderline().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("underline"),
        },
        {
            label: "S",
            title: "Strike",
            action: () => editor.value.chain().focus().toggleStrike().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("strike"),
        },
        {
            label: "</>",
            title: "Code",
            action: () => editor.value.chain().focus().toggleCodeBlock().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("codeBlock"),
        },
        {
            label: "{}",
            title: "Inline code",
            action: () => editor.value.chain().focus().toggleCode().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("code"),
        },
        {
            label: '"',
            title: "Quote",
            action: () => editor.value.chain().focus().toggleBlockquote().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("blockquote"),
        },
        {
            label: "• List",
            title: "Bullet List",
            action: () => editor.value.chain().focus().toggleBulletList().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("bulletList"),
        },
        {
            label: "1. List",
            title: "Ordered List",
            action: () =>
                editor.value.chain().focus().toggleOrderedList().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("orderedList"),
        },
        {
            label: "😀",
            title: "Emoji",
            action: toggleEmojiPicker,
            isActive: () => false,
        },
        {
            label: "🔗",
            title: "Link",
            action: toggleLinkInput,
            isActive: () =>
                editor.value.isActive && editor.value.isActive("link"),
        },
    ];
});

onBeforeUnmount(() => {
    editor.value?.destroy();
});

function getHTML() {
    return editor.value?.getHTML() || "";
}

defineExpose({ getHTML });
</script>

<style scoped>
.custom-editor-content {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    min-height: 200px;
    background: #fff;
    caret-color: #3b82f6;
    font-size: 1rem;
    font-family: inherit;
    cursor: text;
    resize: vertical;
    overflow-y: auto;
}

.custom-editor-content:focus {
    outline: none !important;
    box-shadow: none !important;
    border: 1px solid #d1d5db !important;
}

.custom-editor-content .ProseMirror {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    min-height: 180px;
    padding: 0;
    margin: 0;
    cursor: text;
}

/* Убираем все синие рамки и outline для всех элементов внутри редактора */
.custom-editor-content .ProseMirror * {
    outline: none !important;
    box-shadow: none !important;
}

.custom-editor-content .ProseMirror:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.custom-editor-content .ProseMirror:focus-within {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Убираем синие рамки для всех интерактивных элементов */
.custom-editor-content .ProseMirror button,
.custom-editor-content .ProseMirror input,
.custom-editor-content .ProseMirror textarea,
.custom-editor-content .ProseMirror [contenteditable] {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.custom-editor-content .ProseMirror button:focus,
.custom-editor-content .ProseMirror input:focus,
.custom-editor-content .ProseMirror textarea:focus,
.custom-editor-content .ProseMirror [contenteditable]:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Убираем синие рамки для параграфов и других блоков */
.custom-editor-content .ProseMirror p,
.custom-editor-content .ProseMirror div,
.custom-editor-content .ProseMirror h1,
.custom-editor-content .ProseMirror h2,
.custom-editor-content .ProseMirror h3,
.custom-editor-content .ProseMirror h4,
.custom-editor-content .ProseMirror h5,
.custom-editor-content .ProseMirror h6,
.custom-editor-content .ProseMirror ul,
.custom-editor-content .ProseMirror ol,
.custom-editor-content .ProseMirror li,
.custom-editor-content .ProseMirror blockquote,
.custom-editor-content .ProseMirror pre,
.custom-editor-content .ProseMirror code {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    margin: 0;
    padding: 0;
}

.custom-editor-content .ProseMirror p {
    margin: 0;
    padding: 0;
    min-height: 1.5em;
}

/* Убираем синие рамки для всех состояний фокуса */
.custom-editor-content .ProseMirror *:focus,
.custom-editor-content .ProseMirror *:focus-visible,
.custom-editor-content .ProseMirror *:focus-within {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Убираем синие рамки для всех состояний активного элемента */
.custom-editor-content .ProseMirror *:active,
.custom-editor-content .ProseMirror *:hover {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Дополнительные правила для полного удаления outline */
.custom-editor-content *,
.custom-editor-content *:before,
.custom-editor-content *:after {
    outline: none !important;
}

.custom-editor-content *:focus,
.custom-editor-content *:focus-visible,
.custom-editor-content *:focus-within {
    outline: none !important;
    box-shadow: none !important;
}

/* Дополнительные правила для полной кликабельности */
.custom-editor-content {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

.custom-editor-content .ProseMirror {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    cursor: text;
}

/* Убираем все возможные синие рамки для всех браузеров */
.custom-editor-content *::-moz-focus-inner,
.custom-editor-content *::-moz-focus-outer {
    outline: none !important;
    border: none !important;
}

.custom-editor-content *::-webkit-focus-ring-color {
    outline: none !important;
}

/* Дополнительные правила для Safari */
.custom-editor-content *::-webkit-tap-highlight-color {
    background: transparent !important;
}

/* Убираем синие рамки для всех состояний фокуса в разных браузерах */
.custom-editor-content *:focus-visible {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.custom-editor-content *:focus-within {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}
</style>
