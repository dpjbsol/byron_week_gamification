// js/realtime.js
import { STORAGE_KEY } from "./storage.js";

/** Habilitar/desabilitar facilmente */
export const REALTIME_ENABLED = true;

/** SUA API KEY DO ABLY (ok para demo/byron-week) */
const ABLY_API_KEY = "fCROew.ZQIfmA:Olz_8dPLXpnPLlP4oaoETLVDva-RY0c-axlWt49sYSQ";
const CHANNEL_NAME = "byron-week-db";

/** runtime */
let client = null;
let channel = null;
const ORIGIN = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random());

/** Carrega SDK via CDN para evitar npm/build */
function loadAbly() {
  return new Promise((resolve, reject) => {
    if (window.Ably) return resolve(window.Ably);
    const s = document.createElement("script");
    s.src = "https://cdn.ably.com/lib/ably.min-1.js";
    s.onload = () => resolve(window.Ably);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/** Inicia a conexão e escuta o canal */
export async function rtInit() {
  if (!REALTIME_ENABLED) return;
  const Ably = await loadAbly();
  client = new Ably.Realtime(ABLY_API_KEY);
  channel = client.channels.get(CHANNEL_NAME);

  // Ao receber DB remoto, grava local e notifica UI
  channel.subscribe("db", (msg) => {
    const { payload, origin } = msg.data || {};
    if (!payload) return;
    if (origin === ORIGIN) return; // ignora a própria publicação
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    document.dispatchEvent(new CustomEvent("db:changed"));
  });
}

/** Publica o DB no canal (chame após setDB) */
export function rtPublish(db) {
  if (!REALTIME_ENABLED || !channel) return;
  channel.publish("db", { origin: ORIGIN, payload: db });
}
