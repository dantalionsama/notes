// danny notebook — Backend
// Handles persistent storage of pages. No macros, no AI integration.

const STORAGE_KEY = "notebook.json";

const DEFAULT_DATA = {
  pages: [{ id: "1", title: "Notes", content: "" }],
  activePage: "1",
};

async function load() {
  return await spindle.storage.getJson(STORAGE_KEY, { fallback: DEFAULT_DATA });
}

async function save(data) {
  await spindle.storage.setJson(STORAGE_KEY, data, { indent: 2 });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

(async () => {
  const data = await load();
  spindle.sendToFrontend({ type: "data_loaded", data });
  spindle.log.info("[Notebook] Ready — " + data.pages.length + " page(s)");
})();

// ─── Message router ───────────────────────────────────────────────────────────

spindle.onFrontendMessage(async (payload) => {
  switch (payload.type) {

    case "request_data": {
      const data = await load();
      spindle.sendToFrontend({ type: "data_loaded", data });
      break;
    }

    case "save_page": {
      // payload: { id, content }
      const data = await load();
      const page = data.pages.find(p => p.id === payload.id);
      if (page) {
        page.content = payload.content;
        await save(data);
      }
      break;
    }

    case "rename_page": {
      // payload: { id, title }
      const data = await load();
      const page = data.pages.find(p => p.id === payload.id);
      if (page) {
        page.title = payload.title.trim() || page.title;
        await save(data);
        spindle.sendToFrontend({ type: "data_loaded", data });
      }
      break;
    }

    case "new_page": {
      const data = await load();
      const id = String(Date.now());
      data.pages.push({ id, title: "New page", content: "" });
      data.activePage = id;
      await save(data);
      spindle.sendToFrontend({ type: "data_loaded", data });
      break;
    }

    case "delete_page": {
      // payload: { id }
      const data = await load();
      if (data.pages.length <= 1) break; // always keep at least one page
      data.pages = data.pages.filter(p => p.id !== payload.id);
      if (data.activePage === payload.id) data.activePage = data.pages[0].id;
      await save(data);
      spindle.sendToFrontend({ type: "data_loaded", data });
      break;
    }

    case "set_active_page": {
      // payload: { id } — just persist which tab was last open
      const data = await load();
      data.activePage = payload.id;
      await save(data);
      break;
    }
  }
});
