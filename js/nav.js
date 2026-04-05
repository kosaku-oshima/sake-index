import { buildPageUrl } from "./query.js";

export function setupNavLinks() {
    const indexMenuBtn = document.getElementById("indexMenuBtn");
    if (indexMenuBtn) {
        indexMenuBtn.href = buildPageUrl("index.html", window.location.search, { id: null });
    }

    const searchMenuBtn = document.getElementById("searchMenuBtn");
    if (searchMenuBtn) {
        searchMenuBtn.href = buildPageUrl("search.html");
    }

    const registerMenuBtn = document.getElementById("registerMenuBtn");
    if (registerMenuBtn) {
        registerMenuBtn.href = buildPageUrl("register.html");
    }

    const exportMenuBtn = document.getElementById("exportMenuBtn");
    if (exportMenuBtn) {
        exportMenuBtn.href = buildPageUrl("export.html");
    }
}