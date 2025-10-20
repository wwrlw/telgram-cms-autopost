<template>
    <div class="telegraph-wrapper">
        <div ref="holder" class="telegraph-editor" />

        <div
            v-if="ctxMenu.visible"
            class="tg-context-menu"
            :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }"
        >
            <button class="tg-menu-item" @click="applyCtx('bold')">
                <span>Жирный</span>
            </button>
            <button class="tg-menu-item" @click="applyCtx('italic')">
                <span>Курсив</span>
            </button>
            <button class="tg-menu-item" @click="applyCtx('underline')">
                <span>Подчёркнутый</span>
            </button>
            <button class="tg-menu-item" @click="applyCtx('strike')">
                <span>Зачёркнутый</span>
            </button>
            <button class="tg-menu-item" @click="applyCtx('quote')">
                <span>Цитата</span>
            </button>
            <button class="tg-menu-item" @click="applyCtx('mono')">
                <span>Моноширинный</span>
            </button>
            <button class="tg-menu-item" @click="applyCtx('spoiler')">
                <span>Скрытый</span>
            </button>
            <div class="tg-menu-sep"></div>
            <button class="tg-menu-item" @click="applyCtx('link')">
                <span>Добавить ссылку</span>
            </button>
        </div>
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
const ctxMenu = ref({ visible: false, x: 0, y: 0 });

// InlineTools для EditorJS: underline, strike, spoiler
class UnderlineTool {
    static get isInline() {
        return true;
    }
    static get sanitize() {
        return { u: true };
    }
    constructor({ api }) {
        this.api = api;
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.classList.add(this.api.styles.inlineToolButton);
        this.button.innerHTML = "<u>U</u>";
    }
    render() {
        return this.button;
    }
    surround(range) {
        if (!range) return;
        const u = this.api.selection.findParentTag("U");
        if (u) {
            this.unwrap(u);
        } else {
            this.wrap(range);
        }
    }
    wrap(range) {
        const u = document.createElement("u");
        range.surroundContents(u);
    }
    unwrap(tag) {
        this.api.selection.expandToTag(tag);
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const frag = range.extractContents();
        tag.parentNode.replaceChild(frag, tag);
    }
    checkState() {
        const u = this.api.selection.findParentTag("U");
        this.button.classList.toggle(
            this.api.styles.inlineToolButtonActive,
            !!u
        );
    }
}

class StrikeTool {
    static get isInline() {
        return true;
    }
    static get sanitize() {
        return { s: true, del: true, strike: true };
    }
    constructor({ api }) {
        this.api = api;
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.classList.add(this.api.styles.inlineToolButton);
        this.button.innerHTML = "<s>S</s>";
    }
    render() {
        return this.button;
    }
    surround(range) {
        if (!range) return;
        const s =
            this.api.selection.findParentTag("S") ||
            this.api.selection.findParentTag("DEL") ||
            this.api.selection.findParentTag("STRIKE");
        if (s) {
            this.unwrap(s);
        } else {
            this.wrap(range);
        }
    }
    wrap(range) {
        const s = document.createElement("s");
        range.surroundContents(s);
    }
    unwrap(tag) {
        this.api.selection.expandToTag(tag);
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const frag = range.extractContents();
        tag.parentNode.replaceChild(frag, tag);
    }
    checkState() {
        const s =
            this.api.selection.findParentTag("S") ||
            this.api.selection.findParentTag("DEL") ||
            this.api.selection.findParentTag("STRIKE");
        this.button.classList.toggle(
            this.api.styles.inlineToolButtonActive,
            !!s
        );
    }
}

class SpoilerTool {
    static get isInline() {
        return true;
    }
    static get sanitize() {
        return { span: { class: "tg-spoiler" } };
    }
    constructor({ api }) {
        this.api = api;
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.classList.add(this.api.styles.inlineToolButton);
        this.button.textContent = "SP";
        this.wrapperClass = "tg-spoiler";
    }
    render() {
        return this.button;
    }
    surround(range) {
        if (!range) return;
        const span = this.findWrapper();
        if (span) {
            this.unwrap(span);
        } else {
            this.wrap(range);
        }
    }
    findWrapper() {
        const parent = this.api.selection.findParentTag("SPAN");
        if (parent && parent.classList.contains(this.wrapperClass))
            return parent;
        return null;
    }
    wrap(range) {
        const span = document.createElement("span");
        span.className = this.wrapperClass;
        range.surroundContents(span);
    }
    unwrap(tag) {
        this.api.selection.expandToTag(tag);
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const frag = range.extractContents();
        tag.parentNode.replaceChild(frag, tag);
    }
    checkState() {
        const span = this.findWrapper();
        this.button.classList.toggle(
            this.api.styles.inlineToolButtonActive,
            !!span
        );
    }
}

function openCtxMenu(e) {
    e.preventDefault();
    ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY };
    window.addEventListener("click", closeCtxMenu, { once: true });
    window.addEventListener("scroll", closeCtxMenu, { once: true });
    const onEsc = (ev) => {
        if (ev.key === "Escape") closeCtxMenu();
        window.removeEventListener("keydown", onEsc);
    };
    window.addEventListener("keydown", onEsc);
}

function closeCtxMenu() {
    ctxMenu.value.visible = false;
}

function applyCtx(action) {
    closeCtxMenu();
    switch (action) {
        case "bold":
            document.execCommand("bold");
            break;
        case "italic":
            document.execCommand("italic");
            break;
        case "underline":
            wrapSelectionWithTag("u");
            break;
        case "strike":
            wrapSelectionWithTag("s");
            break;
        case "quote":
            wrapSelectionWithBlockquote();
            break;
        case "mono":
            insertInlineCode();
            break;
        case "spoiler":
            wrapSelectionWithSpoiler();
            break;
        case "link": {
            const url = window.prompt("Ссылка (пусто — удалить)", "https://");
            if (url === null) break;
            if (url === "" || url === "https://") {
                document.execCommand("unlink");
            } else {
                document.execCommand("createLink", false, url);
            }
            break;
        }
    }
}

function blocksToHtml(data) {
    if (!data || !Array.isArray(data.blocks)) return "";
    const esc = (s) => s || "";
    const html = data.blocks
        .map((block) => {
            switch (block.type) {
                case "paragraph": {
                    let text = block.data?.text || "";
                    text = text.replace(
                        /<span class="tg-spoiler">([\s\S]*?)<\/span>/g,
                        '<span class="tg-spoiler">$1</span>'
                    );
                    // поддержка кастомных эмодзи
                    text = text.replace(
                        /<img([^>]*class="tg-emoji"[^>]*)>/g,
                        "<img$1>"
                    );
                    // если внутри есть блочная цитата, не заворачиваем в <p>
                    if (/<blockquote[\s>]/i.test(text)) {
                        return `${esc(text)}`;
                    }
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
    const container = document.createElement("div");
    container.innerHTML = html || "";
    const blocks = [];
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
        inlineToolbar: [
            "bold",
            "italic",
            "link",
            "inlineCode",
            "underlineTool",
            "strikeTool",
            "spoilerTool",
        ],
        // Глобальный санитайзер: гарантируем сохранение нужных инлайновых тегов
        sanitizer: {
            blockquote: true,
            u: true,
            s: true,
            strike: true,
            del: true,
            span: {
                class: "tg-spoiler",
            },
        },
        tools: {
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                config: {
                    preserveBlank: true,
                },
                sanitize: {
                    blockquote: true,
                    b: true,
                    i: true,
                    s: true,
                    strike: true,
                    del: true,
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
                    strike: true,
                    del: true,
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
                    strike: true,
                    del: true,
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
                    strike: true,
                    del: true,
                    u: true,
                    em: true,
                    strong: true,
                    code: true,
                },
            },
            linkTool: LinkTool,
            inlineCode: InlineCode,
            underlineTool: UnderlineTool,
            strikeTool: StrikeTool,
            spoilerTool: SpoilerTool,
        },
        data: htmlToInitialBlocks(props.modelValue),
        onChange: async () => {
            try {
                const data = await editorInstance.save();
                const html = blocksToHtml(data);
                isInternalUpdate = true;
                emit("update:modelValue", html);
                queueMicrotask(() => {
                    isInternalUpdate = false;
                });
            } catch {
                // ignore
            }
        },
    });

    holder.value?.addEventListener("keydown", handleHotkeys);
    holder.value?.addEventListener("contextmenu", openCtxMenu);
});

watch(
    () => props.modelValue,
    async (val) => {
        if (!editorInstance || isInternalUpdate) return;
        try {
            const data = htmlToInitialBlocks(val || "");
            await editorInstance.isReady;
            await editorInstance.render(data);
        } catch {
            // ignore
        }
    }
);

// function focusEditor() {}

onBeforeUnmount(() => {
    if (editorInstance?.destroy) editorInstance.destroy();
    holder.value?.removeEventListener("contextmenu", openCtxMenu);
});

function getHTML() {
    return props.modelValue || "";
}

function handleHotkeys(e) {
    const meta = e.metaKey || e.ctrlKey;
    if (!meta) return;
    if (e.key.toLowerCase() === "i") {
        document.execCommand("italic");
        e.preventDefault();
    }
    if (e.key.toLowerCase() === "b") {
        document.execCommand("bold");
        e.preventDefault();
    }
    if (e.key.toLowerCase() === "u") {
        wrapSelectionWithTag("u");
        e.preventDefault();
    }
    // зачёркнутый Ctrl/Cmd+Shift+X
    if (e.key.toLowerCase() === "x" && e.shiftKey) {
        wrapSelectionWithTag("s");
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
    if (e.key.toLowerCase() === "s" && e.shiftKey) {
        wrapSelectionWithSpoiler();
        e.preventDefault();
    }
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
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
    }
    sel.removeAllRanges();
}

// Оборачивание выделения произвольным тегом (u, s)
function wrapSelectionWithTag(tagName) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const el = document.createElement(tagName);
    try {
        range.surroundContents(el);
    } catch {
        const contents = range.extractContents();
        el.appendChild(contents);
        range.insertNode(el);
    }
    sel.removeAllRanges();
}

function insertCustomEmoji(id) {
    const img = document.createElement("img");
    img.className = "tg-emoji";
    img.setAttribute("data-custom-emoji-id", id);
    img.alt = ":emoji:";
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.insertNode(img);
    range.setStartAfter(img);
    range.collapse(true);
}

function wrapSelectionWithBlockquote() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const selectedText = sel.toString();
    sel.removeAllRanges();
    try {
        const blocksApi = editorInstance?.blocks;
        const insertIndex =
            blocksApi?.getCurrentBlockIndex &&
            typeof blocksApi.getCurrentBlockIndex === "function"
                ? blocksApi.getCurrentBlockIndex() + 1
                : undefined;
        if (blocksApi?.insert) {
            blocksApi.insert("quote", { text: selectedText }, {}, insertIndex);
        } else {
            document.execCommand(
                "insertHTML",
                false,
                `<blockquote>${selectedText}</blockquote>`
            );
        }
    } catch {
        // ignore
    }
}

function insertInlineCode() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed) {
        document.execCommand("insertHTML", false, "<code></code>");
        return;
    }
    const range = sel.getRangeAt(0);
    const code = document.createElement("code");
    try {
        range.surroundContents(code);
    } catch {
        const contents = range.extractContents();
        code.appendChild(contents);
        range.insertNode(code);
    }
    sel.removeAllRanges();
}

defineExpose({ getHTML });
</script>

<style scoped>
::v-deep(.codex-editor__redactor) {
    padding-bottom: 0 !important;
}
::v-deep(.codex-editor__redactor--empty) {
    width: 100% !important;
}
::v-deep(.ce-popover__container) {
    display: none !important;
}
::v-deep(.ce-toolbar__actions) {
    display: none !important;
}
/* ::v-deep(.ce-popover__content) {
    display: none !important;
}
::v-deep(.ce-popover__content) {
    display: none !important;
}
::v-deep(.ce-popover__content) {
    display: none !important;
} */

.telegraph-wrapper {
    max-width: 100%;
    /* width: 100%; */
    /* margin: 0 auto; */
}

.telegraph-editor {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    padding: 20px 24px;
    min-height: 280px;
}

.tg-context-menu {
    position: fixed;
    min-width: 160px;
    background: #fff;
    color: #111827;
    border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    border: 1px solid #e5e7eb;
    padding: 6px 0;
    z-index: 1000;
}

.tg-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 14px;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
}
.tg-menu-item:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
}

.tg-menu-item:hover {
    background: rgba(255, 255, 255, 0.06);
}

.tg-menu-item kbd {
    background: rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 12px;
}

.tg-menu-sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 0;
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
/* .telegraph-editor .ProseMirror button,
.telegraph-editor .ProseMirror input,
.telegraph-editor .ProseMirror textarea,
.telegraph-editor .ProseMirror [contenteditable] {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
} */

/* .telegraph-editor .ProseMirror button:focus,
.telegraph-editor .ProseMirror input:focus,
.telegraph-editor .ProseMirror textarea:focus,
.telegraph-editor .ProseMirror [contenteditable]:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
} */

/* .telegraph-editor .ProseMirror p,
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
} */

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

.telegraph-editor .ProseMirror *:active,
.telegraph-editor .ProseMirror *:hover {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

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

.telegraph-editor *::-moz-focus-inner,
.telegraph-editor *::-moz-focus-outer {
    outline: none !important;
    border: none !important;
}

.telegraph-editor *::-webkit-focus-ring-color {
    outline: none !important;
}

.telegraph-editor *::-webkit-tap-highlight-color {
    background: transparent !important;
}

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

::v-deep(span.tg-spoiler) {
    background: rgba(0, 0, 0, 0.15);
    box-shadow:
        inset 0 0 0 1px rgba(245, 158, 11, 0.35),
        0 1px 2px rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    padding: 0 2px;
    transition:
        box-shadow 0.15s ease,
        background 0.15s ease;
}

::v-deep(span.tg-spoiler:hover) {
    background: rgba(0, 0, 0, 0.15);
    box-shadow:
        inset 0 0 0 1px rgba(245, 158, 11, 0.6),
        0 2px 4px rgba(0, 0, 0, 0.08);
}
</style>
