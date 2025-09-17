<template>
    <div class="telegraph-wrapper">
        <div ref="holder" class="telegraph-editor" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import LinkTool from "@editorjs/link";
import Paragraph from "@editorjs/paragraph";
import InlineCode from "@editorjs/inline-code";

const props = defineProps({
    modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const holder = ref(null);
let editorInstance = null;
let isInternalUpdate = false;

function blocksToHtml(data) {
    if (!data || !Array.isArray(data.blocks)) return "";
    const esc = (s) => s || "";
    const html = data.blocks
        .map((block) => {
            switch (block.type) {
                case "paragraph": {
                    let text = block.data?.text || "";
                    // поддержка спойлеров
                    text = text.replace(
                        /<span class=\"tg-spoiler\">([\s\S]*?)<\/span>/g,
                        '<span class="tg-spoiler">$1<\/span>'
                    );
                    // поддержка кастомных эмодзи
                    text = text.replace(
                        /<img([^>]*class=\"tg-emoji\"[^>]*)>/g,
                        "<img$1>"
                    );
                    return `<p>${esc(text)}</p>`;
                }
                case "header": {
                    const level = block.data?.level || 2;
                    const text = block.data?.text || "";
                    return `<h${level}>${esc(text)}</h${level}>`;
                }
                case "list": {
                    const style = block.data?.style === "ordered" ? "ol" : "ul";
                    const items = (block.data?.items || [])
                        .map((it) => `<li>${esc(it)}</li>`)
                        .join("");
                    return `<${style}>${items}</${style}>`;
                }
                case "quote": {
                    const text = block.data?.text || "";
                    const caption = block.data?.caption
                        ? `<cite>${esc(block.data.caption)}</cite>`
                        : "";
                    return `<blockquote>${esc(text)}${caption}</blockquote>`;
                }
                default:
                    return "";
            }
        })
        .join("");
    return html;
}

function htmlToInitialBlocks(html) {
    // Конвертация HTML -> набор блоков параграфов по <br> и пустым строкам
    const container = document.createElement("div");
    container.innerHTML = html || "";
    const blocks = [];
    // Разбиваем по блочным элементам и <br>
    const raw = container.innerHTML
        .replace(/\r/g, "")
        .split(/<br\s*\/?>(?:\s*<br\s*\/?>)?/i);
    for (const piece of raw) {
        const text = piece.trim();
        if (text.length === 0) {
            blocks.push({ type: "paragraph", data: { text: "" } });
        } else {
            blocks.push({ type: "paragraph", data: { text } });
        }
    }
    if (blocks.length === 0)
        blocks.push({ type: "paragraph", data: { text: "" } });
    return { time: Date.now(), blocks };
}

onMounted(() => {
    editorInstance = new EditorJS({
        holder: holder.value,
        placeholder: "Начните писать…",
        inlineToolbar: ["bold", "italic", "link", "inlineCode"],
        tools: {
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                config: {
                    preserveBlank: true,
                },
                sanitize: {
                    b: true,
                    i: true,
                    s: true,
                    u: true,
                    em: true,
                    strong: true,
                    code: true,
                    span: {
                        class: "tg-spoiler",
                    },
                    img: {
                        class: "tg-emoji",
                        "data-custom-emoji-id": true,
                        alt: true,
                        src: true,
                    },
                    a: {
                        href: true,
                        target: true,
                        rel: true,
                    },
                },
            },
            header: {
                class: Header,
                inlineToolbar: true,
                config: { levels: [1, 2, 3], defaultLevel: 2 },
                sanitize: {
                    b: true,
                    i: true,
                    s: true,
                    u: true,
                    em: true,
                    strong: true,
                    code: true,
                },
            },
            list: {
                class: List,
                inlineToolbar: true,
                sanitize: {
                    li: true,
                    b: true,
                    i: true,
                    s: true,
                    u: true,
                    em: true,
                    strong: true,
                    code: true,
                },
            },
            quote: {
                class: Quote,
                inlineToolbar: true,
                sanitize: {
                    b: true,
                    i: true,
                    s: true,
                    u: true,
                    em: true,
                    strong: true,
                    code: true,
                },
            },
            linkTool: LinkTool,
            inlineCode: InlineCode,
        },
        data: htmlToInitialBlocks(props.modelValue),
        onChange: async () => {
            try {
                const data = await editorInstance.save();
                const html = blocksToHtml(data);
                isInternalUpdate = true;
                emit("update:modelValue", html);
                // флаг сбросим в следующем тике, чтобы watcher не перерисовывал редактор
                queueMicrotask(() => {
                    isInternalUpdate = false;
                });
            } catch (_) {}
        },
    });

    // Горячие клавиши для форматирования + спойлер и ссылка
    holder.value?.addEventListener("keydown", handleHotkeys);
});

watch(
    () => props.modelValue,
    async (val) => {
        if (!editorInstance || isInternalUpdate) return;
        // Если внешнее значение изменилось (например, переключение текста),
        // переинициализируем содержимое.
        try {
            const data = htmlToInitialBlocks(val || "");
            await editorInstance.isReady;
            await editorInstance.render(data);
        } catch (_) {}
    }
);

function focusEditor() {}

onBeforeUnmount(() => {
    if (editorInstance?.destroy) editorInstance.destroy();
});

function getHTML() {
    // Возвращаем текущее v-model значение через DOM, если нужно
    return props.modelValue || "";
}

function handleHotkeys(e) {
    const meta = e.metaKey || e.ctrlKey;
    if (!meta) return;
    // курсив
    if (e.key.toLowerCase() === "i") {
        document.execCommand("italic");
        e.preventDefault();
    }
    // жирный
    if (e.key.toLowerCase() === "b") {
        document.execCommand("bold");
        e.preventDefault();
    }
    // подчёркивание
    if (e.key.toLowerCase() === "u") {
        document.execCommand("underline");
        e.preventDefault();
    }
    // вставка/удаление ссылки
    if (e.key.toLowerCase() === "k") {
        const url = window.prompt("Ссылка (пусто — удалить)", "https://");
        if (url === null) return;
        if (url === "" || url === "https://") {
            document.execCommand("unlink");
        } else {
            document.execCommand("createLink", false, url);
        }
        e.preventDefault();
    }
    // спойлер: Cmd/Ctrl+Shift+S
    if (e.key.toLowerCase() === "s" && e.shiftKey) {
        wrapSelectionWithSpoiler();
        e.preventDefault();
    }
    // кастомный эмодзи: Cmd/Ctrl+E — вставка по id
    if (e.key.toLowerCase() === "e") {
        const id = window.prompt("ID кастомного эмодзи", "");
        if (!id) return;
        insertCustomEmoji(id);
        e.preventDefault();
    }
}

function wrapSelectionWithSpoiler() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    span.className = "tg-spoiler";
    try {
        range.surroundContents(span);
    } catch {
        // если пересекает несколько блоков — просто вставим wrapper
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
    }
    sel.removeAllRanges();
}

function insertCustomEmoji(id) {
    const img = document.createElement("img");
    img.className = "tg-emoji";
    img.setAttribute("data-custom-emoji-id", id);
    img.alt = ":emoji:";
    // src опционально — можно подставлять превью, если есть
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.insertNode(img);
    range.setStartAfter(img);
    range.collapse(true);
}

defineExpose({ getHTML });
</script>

<style scoped>
/* Минималистичный стиль в духе Telegraph */
.telegraph-wrapper {
    max-width: 820px; /* ширина зоны письма (чуть шире) */
    width: 100%;
    margin: 0 auto; /* по центру */
}

.telegraph-editor {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    padding: 20px 24px;
    min-height: 280px;
}

.telegraph-editor .ProseMirror {
    outline: none;
    font-size: 18px;
    line-height: 1.7;
    color: #111827;
}

.telegraph-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    color: #9ca3af;
    float: left;
    height: 0;
    pointer-events: none;
}

/* Убираем все синие рамки и outline для всех элементов внутри редактора */
.telegraph-editor .ProseMirror * {
    outline: none !important;
    box-shadow: none !important;
}

.telegraph-editor .ProseMirror:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.telegraph-editor .ProseMirror:focus-within {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Убираем синие рамки для всех интерактивных элементов */
.telegraph-editor .ProseMirror button,
.telegraph-editor .ProseMirror input,
.telegraph-editor .ProseMirror textarea,
.telegraph-editor .ProseMirror [contenteditable] {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.telegraph-editor .ProseMirror button:focus,
.telegraph-editor .ProseMirror input:focus,
.telegraph-editor .ProseMirror textarea:focus,
.telegraph-editor .ProseMirror [contenteditable]:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Убираем синие рамки для параграфов и других блоков */
.telegraph-editor .ProseMirror p,
.telegraph-editor .ProseMirror div,
.telegraph-editor .ProseMirror h1,
.telegraph-editor .ProseMirror h2,
.telegraph-editor .ProseMirror h3,
.telegraph-editor .ProseMirror h4,
.telegraph-editor .ProseMirror h5,
.telegraph-editor .ProseMirror h6,
.telegraph-editor .ProseMirror ul,
.telegraph-editor .ProseMirror ol,
.telegraph-editor .ProseMirror li,
.telegraph-editor .ProseMirror blockquote,
.telegraph-editor .ProseMirror pre,
.telegraph-editor .ProseMirror code {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    margin: 0;
    padding: 0;
}

.telegraph-editor .ProseMirror p {
    margin: 0;
    padding: 0;
    min-height: 1.5em;
}

/* Убираем синие рамки для всех состояний фокуса */
.telegraph-editor .ProseMirror *:focus,
.telegraph-editor .ProseMirror *:focus-visible,
.telegraph-editor .ProseMirror *:focus-within {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Убираем синие рамки для всех состояний активного элемента */
.telegraph-editor .ProseMirror *:active,
.telegraph-editor .ProseMirror *:hover {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* Дополнительные правила для полного удаления outline */
.telegraph-editor *,
.telegraph-editor *:before,
.telegraph-editor *:after {
    outline: none !important;
}

.telegraph-editor *:focus,
.telegraph-editor *:focus-visible,
.telegraph-editor *:focus-within {
    outline: none !important;
    box-shadow: none !important;
}

/* Дополнительные правила для полной кликабельности */
.telegraph-editor {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

.telegraph-editor .ProseMirror {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    cursor: text;
}

/* Убираем все возможные синие рамки для всех браузеров */
.telegraph-editor *::-moz-focus-inner,
.telegraph-editor *::-moz-focus-outer {
    outline: none !important;
    border: none !important;
}

.telegraph-editor *::-webkit-focus-ring-color {
    outline: none !important;
}

/* Дополнительные правила для Safari */
.telegraph-editor *::-webkit-tap-highlight-color {
    background: transparent !important;
}

/* Убираем синие рамки для всех состояний фокуса в разных браузерах */
.telegraph-editor *:focus-visible {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.telegraph-editor *:focus-within {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.bubble-menu {
    display: flex;
    gap: 6px;
    background: #111827;
    color: #fff;
    padding: 6px 8px;
    border-radius: 8px;
}
.bubble-menu button {
    font-weight: 600;
    font-size: 12px;
    opacity: 0.9;
}
.bubble-menu button.active {
    opacity: 1;
    text-decoration: underline;
}

.floating-menu {
    display: flex;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 6px 8px;
}
</style>
