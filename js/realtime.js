// js/realtime.js
import { STORAGE_KEY } from "./storage.js";

/** Liga/desliga rápido */
export const REALTIME_ENABLED = true;

/** SUA API KEY DO ABLY (ok para demo) */
const ABLY_API_KEY = "fCROew.ZQIfmA:Olz_8dPLXpnPLlP4oaoETLVDva-RY0c-axlWt49sYSQ";

/** canal único do app */
const CHANNEL_NAME = "byron-week-db";

/** runtime */
let client = null;
let channel = null;
const ORIGIN = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random());

/** carrega SDK Ably (CDN) */
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

/** Estado local atual (para responder snapshot) */
function getLocalDB() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

/** aplica DB recebido e avisa a UI */
function applyDB(payload) {
  if (!payload) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  document.dispatchEvent(new CustomEvent("db:changed"));
}

/** Inicia e assina os tópicos */
export async function rtInit() {
  if (!REALTIME_ENABLED) return;
  const Ably = await loadAbly();
  client = new Ably.Realtime(ABLY_API_KEY);
  channel = client.channels.get(CHANNEL_NAME);

  // 1) Recebe “diffs” (salvamentos) e aplica
  channel.subscribe("db", (msg) => {
    const { payload, origin } = msg.data || {};
    if (!payload) return;
    if (origin === ORIGIN) return; // ignora eco
    // console.log("[rt] db received");
    applyDB(payload);
  });

  // 2) Handshake de snapshot: quem entra pede; quem já tem responde
  channel.subscribe("req-snapshot", (msg) => {
    const { origin } = msg.data || {};
    if (origin === ORIGIN) return; // não responda a si mesmo
    const db = getLocalDB();
    if (db) {
      // console.log("[rt] answering snapshot");
      channel.publish("snapshot", { origin: ORIGIN, payload: db });
    }
  });

  channel.subscribe("snapshot", (msg) => {
    const { payload, origin } = msg.data || {};
    if (!payload || origin === ORIGIN) return;
    // console.log("[rt] snapshot received");
    applyDB(payload);
  });

  // assim que conectar, peça snapshot aos outros
  channel.once("attached", () => {
    // console.log("[rt] channel attached, requesting snapshot");
    channel.publish("req-snapshot", { origin: ORIGIN });
  });
}

/** Publica o DB após qualquer setDB/resetDB */
export function rtPublish(db) {
  if (!REALTIME_ENABLED || !channel) return;
  channel.publish("db", { origin: ORIGIN, payload: db });
}
