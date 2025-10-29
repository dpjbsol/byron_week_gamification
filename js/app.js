// js/app.js
import { setDB, getDB } from "./storage.js";
import { setActiveTab } from "./utils.js";

/**
 * Usa a MESMA versão que o index passou.
 * Se o index não passar nada, gera uma por sessão.
 */
const V =
  new URL(import.meta.url).search ||
  `?${(window.APP_V ||= `v=${Date.now().toString(36)}`)}`;

/**
 * Rotas com import dinâmico já herdando a mesma query (?v=...)
 * Assim você nunca fica preso em cache de módulo.
 */
const routes = {
  "/presence": () => import(`./pages/presence.js${V}`).then(m => m.PresencePage),
  "/workshop": () => import(`./pages/workshop.js${V}`).then(m => m.WorkshopPage),
  "/component": () => import(`./pages/component.js${V}`).then(m => m.ComponentPage),
  "/dpj": () => import(`./pages/dpj.js${V}`).then(m => m.DPJPage),
  "/ranking": () => import(`./pages/ranking.js${V}`).then(m => m.RankingPage),
  "/logs": () => import(`./pages/logs.js${V}`).then(m => m.LogsPage),
  "/settings": () => import(`./pages/settings.js${V}`).then(m => m.SettingsPage),
};

export function mountApp(root) {
  async function render() {
    setActiveTab();
    const db = getDB();
    const hash = (location.hash || "#/presence").slice(1);
    const loader = routes[hash] || routes["/presence"];
    const Page = await loader();

    root.innerHTML = "";
    const el = document.createElement("div");
    el.className = "panel";
    Page(el, db, (updated) => {
      if (updated) setDB(updated);
      render();
    });
    root.appendChild(el);
  }

  window.addEventListener("hashchange", render);
  render();
}
