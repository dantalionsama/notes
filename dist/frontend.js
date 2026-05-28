// danny notebook — Frontend
// Floating notebook widget. Multiple pages, autosave, rename, add/delete.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildWidget(pages, activePage, renamingId, isCollapsed) {
  if (isCollapsed) {
    return `
      <button class="nb-pill" id="nb-expand" aria-label="Open notebook">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span>notebook</span>
      </button>`;
  }

  const active = pages.find(p => p.id === activePage) || pages[0];

  const tabs = pages.map(p => {
    const isActive = p.id === active.id;
    const isRenaming = p.id === renamingId;

    const tabInner = isRenaming
      ? `<input class="nb-tab-rename" id="nb-rename-input" data-id="${escAttr(p.id)}"
           value="${escAttr(p.title)}" spellcheck="false" maxlength="32" />`
      : `<span class="nb-tab-name" data-id="${escAttr(p.id)}">${escHtml(p.title)}</span>
         ${isActive && pages.length > 1
           ? `<span class="nb-tab-del" data-del="${escAttr(p.id)}" title="Delete page">×</span>`
           : ""}`;

    return `<button class="nb-tab ${isActive ? "nb-tab--active" : ""}" data-tab="${escAttr(p.id)}">${tabInner}</button>`;
  }).join("");

  return `
    <div class="nb-card">
      <div class="nb-header">
        <span class="nb-title">danny's notebook</span>
        <div class="nb-header-actions">
          <button class="nb-icon-btn" id="nb-new" title="New page">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="nb-icon-btn" id="nb-collapse" aria-label="Collapse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>

      <div class="nb-tab-bar">${tabs}</div>

      <textarea
        class="nb-textarea"
        id="nb-textarea"
        placeholder="write anything..."
        spellcheck="false"
      >${escHtml(active.content)}</textarea>

      <div class="nb-footer">
        <span class="nb-status" id="nb-status"></span>
        <span class="nb-hint">double-click tab to rename</span>
      </div>
    </div>`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .nb-card {
    width: 320px;
    font-family: var(--lumiverse-font, system-ui, sans-serif);
    background: rgba(14, 11, 30, 0.92);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    overflow: hidden;
    backdrop-filter: blur(24px) saturate(140%);
    -webkit-backdrop-filter: blur(24px) saturate(140%);
    box-shadow: 0 2px 0 rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.65);
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .nb-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 10px 9px 13px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
    flex-shrink: 0;
  }
  .nb-title {
    font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em;
    text-transform: uppercase; color: rgba(255,255,255,0.3);
  }
  .nb-header-actions { display: flex; gap: 5px; }
  .nb-icon-btn {
    width: 24px; height: 24px; border-radius: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.35); cursor: pointer; padding: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s, color 0.12s;
  }
  .nb-icon-btn:hover { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85); }
  .nb-icon-btn svg { width: 12px; height: 12px; }

  /* ── Tabs ── */
  .nb-tab-bar {
    display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 4px;
    padding: 7px 10px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.055);
    flex-shrink: 0;
    scrollbar-width: none;
  }
  .nb-tab-bar::-webkit-scrollbar { display: none; }
  .nb-tab {
    display: flex; align-items: center; gap: 3px;
    padding: 3px 9px 3px 10px;
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    font-family: inherit; font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.38); cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
    transition: background 0.12s, color 0.12s;
  }
  .nb-tab:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }
  .nb-tab--active {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.92);
  }
  .nb-tab-name { pointer-events: none; }
  .nb-tab-del {
    font-size: 13px; line-height: 1;
    color: rgba(255,255,255,0.18); padding: 0 1px;
    transition: color 0.12s;
  }
  .nb-tab-del:hover { color: rgba(255,100,100,0.8); }
  .nb-tab-rename {
    background: none; border: none; outline: none;
    font-family: inherit; font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.92); width: 90px; padding: 0;
  }

  /* ── Textarea ── */
  .nb-textarea {
    flex: 1;
    width: 100%; min-height: 220px;
    padding: 12px 14px;
    background: transparent;
    border: none; outline: none; resize: none;
    color: rgba(255,255,255,0.85);
    font-family: var(--lumiverse-font, system-ui, sans-serif);
    font-size: 13px; line-height: 1.65;
    box-sizing: border-box;
    caret-color: rgba(255,255,255,0.7);
  }
  .nb-textarea::placeholder { color: rgba(255,255,255,0.18); }

  /* ── Footer ── */
  .nb-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 5px 13px 8px;
    border-top: 1px solid rgba(255,255,255,0.055);
    flex-shrink: 0;
  }
  .nb-status {
    font-size: 9.5px; font-weight: 600; letter-spacing: 0.05em;
    color: rgba(255,255,255,0.2); text-transform: uppercase;
    transition: color 0.3s;
  }
  .nb-status.saved { color: rgba(120,220,140,0.65); }
  .nb-hint {
    font-size: 9.5px; color: rgba(255,255,255,0.14);
    font-style: italic;
  }

  /* ── Collapsed pill ── */
  .nb-pill {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 14px 8px 11px;
    background: rgba(14,11,30,0.92);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px; color: rgba(255,255,255,0.55);
    cursor: pointer; font-family: inherit;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(0,0,0,0.55);
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .nb-pill svg { width: 13px; height: 13px; flex-shrink: 0; }
  .nb-pill:hover { background: rgba(28,20,52,0.95); color: rgba(255,255,255,0.9); }
`;

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setup(ctx) {
  let pages      = [{ id: "1", title: "Notes", content: "" }];
  let activePage = "1";
  let isCollapsed = false;
  let renamingId  = null;
  let saveTimer   = null;

  const removeStyle = ctx.dom.addStyle(STYLES);

  // Restore position
  const POSITION_KEY = "danny_notebook_position";
  let savedPos = { x: 20, y: 100 }; // left side by default — different from tracker
  try {
    const stored = localStorage.getItem(POSITION_KEY);
    if (stored) savedPos = JSON.parse(stored);
  } catch {}

  const floatWidget = ctx.ui.createFloatWidget({
    width: 320,
    height: 380,
    initialPosition: savedPos,
    snapToEdge: true,
    tooltip: "Notebook",
    chromeless: true,
    onMove: (pos) => {
      try { localStorage.setItem(POSITION_KEY, JSON.stringify(pos)); } catch {}
    },
  });

  const root = floatWidget.root;

  // ── Autosave ─────────────────────────────────────────────────────────────────

  function scheduleSave(id, content) {
    clearTimeout(saveTimer);
    setStatus("unsaved");
    saveTimer = setTimeout(() => {
      // Update local copy
      const page = pages.find(p => p.id === id);
      if (page) page.content = content;
      ctx.sendToBackend({ type: "save_page", id, content });
      setStatus("saved");
      setTimeout(() => setStatus(""), 2000);
    }, 800); // 800ms debounce
  }

  function setStatus(state) {
    const el = root.querySelector("#nb-status");
    if (!el) return;
    el.textContent = state === "saved" ? "saved" : state === "unsaved" ? "unsaved" : "";
    el.className = "nb-status" + (state === "saved" ? " saved" : "");
  }

  // ── Repaint ──────────────────────────────────────────────────────────────────

  function repaint() {
    root.innerHTML = buildWidget(pages, activePage, renamingId, isCollapsed);

    // Expand / collapse
    root.querySelector("#nb-expand")?.addEventListener("click", () => {
      isCollapsed = false; repaint();
    });
    root.querySelector("#nb-collapse")?.addEventListener("click", () => {
      isCollapsed = true; repaint();
    });

    // New page
    root.querySelector("#nb-new")?.addEventListener("click", () => {
      ctx.sendToBackend({ type: "new_page" });
    });

    // Tab switch
    root.querySelectorAll(".nb-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        if (e.target.closest(".nb-tab-del") || e.target.closest(".nb-tab-rename")) return;
        const id = tab.dataset.tab;
        if (id && id !== activePage) {
          activePage = id;
          renamingId = null;
          ctx.sendToBackend({ type: "set_active_page", id });
          repaint();
        }
      });

      // Double-click to rename
      tab.addEventListener("dblclick", (e) => {
        if (e.target.closest(".nb-tab-del")) return;
        renamingId = tab.dataset.tab;
        repaint();
        // Focus the rename input
        const input = root.querySelector("#nb-rename-input");
        if (input) { input.focus(); input.select(); }
      });
    });

    // Rename input — commit on Enter or blur
    const renameInput = root.querySelector("#nb-rename-input");
    if (renameInput) {
      const commit = () => {
        const id = renameInput.dataset.id;
        const title = renameInput.value.trim();
        if (title) ctx.sendToBackend({ type: "rename_page", id, title });
        renamingId = null;
        // Optimistically update local title
        const page = pages.find(p => p.id === id);
        if (page && title) page.title = title;
        repaint();
      };
      renameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { renamingId = null; repaint(); }
      });
      renameInput.addEventListener("blur", commit);
    }

    // Delete page
    root.querySelectorAll(".nb-tab-del").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.del;
        if (pages.length <= 1) return;
        ctx.sendToBackend({ type: "delete_page", id });
      });
    });

    // Textarea — type and autosave
    const textarea = root.querySelector("#nb-textarea");
    if (textarea) {
      textarea.addEventListener("input", () => {
        scheduleSave(activePage, textarea.value);
      });
      // Restore scroll position
      textarea.scrollTop = textarea._scrollTop || 0;
      textarea.addEventListener("scroll", () => {
        textarea._scrollTop = textarea.scrollTop;
      });
    }
  }

  // ── Backend messages ─────────────────────────────────────────────────────────

  const unsubBackend = ctx.onBackendMessage((payload) => {
    if (payload.type === "data_loaded") {
      pages = payload.data.pages || [];
      activePage = payload.data.activePage || (pages[0]?.id ?? "1");
      repaint();
    }
  });

  // Initial load
  ctx.sendToBackend({ type: "request_data" });
  repaint();

  return () => {
    clearTimeout(saveTimer);
    unsubBackend();
    removeStyle();
    floatWidget.destroy();
  };
}
