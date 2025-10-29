import { setDB, getDB } from "./storage.js";
import { setActiveTab } from "./utils.js";
import { PresencePage } from "./pages/presence.js";
import { WorkshopPage } from "./pages/workshop.js";
import { ComponentPage } from "./pages/component.js";
import { DPJPage } from "./pages/dpj.js";
import { RankingPage } from "./pages/ranking.js";
import { LogsPage } from "./pages/logs.js";
import { SettingsPage } from "./pages/settings.js";

const routes = {
  "/presence": PresencePage,
  "/workshop": WorkshopPage,
  "/component": ComponentPage,
  "/dpj": DPJPage,
  "/ranking": RankingPage,
  "/logs": LogsPage,
  "/settings": SettingsPage
};

export function mountApp(root) {
  function render() {
    setActiveTab();
    const db = getDB();
    const hash = (location.hash || "#/presence").slice(1);
    const Page = routes[hash] || PresencePage;
    root.innerHTML = "";
    const el = document.createElement("div");
    el.className = "panel";
    Page(el, db, (updated)=> {
      if (updated) setDB(updated);
      render();
    });
    root.appendChild(el);
  }
  window.addEventListener("hashchange", render);
  render();
}
