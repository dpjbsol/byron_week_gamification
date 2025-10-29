// js/realtime.js
import { STORAGE_KEY } from "./storage.js";

/** Liga/desliga rápido */
export const REALTIME_ENABLED = true;

/** SUA API KEY DO ABLY */
const ABLY_API_KEY = "fCROew.ZQIfmA:Olz_8dPLXpnPLlP4oaoETLVDva-RY0c-axlWt49sYSQ";
const CHANNEL_NAME = "byron-week-db";

/** runtime */
let client = null;
let channel = null;
const ORIGIN = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random());

function log(...a){ try{ console.log("[rt]", ...a);}catch{} }

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

function getLocalDB() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

function applyDB(payload) {
  if (!payload) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  document.dispatchEvent(new CustomEvent("db:changed"));
}

export async function rtInit() {
  if (!REALTIME_ENABLED) return;
  const Ably = await loadAbly();

  client = new Ably.Realtime(ABLY_API_KEY);
  client.connection.on((st)=> log("conn", st.current, st.reason || ""));
  channel = client.channels.get(CHANNEL_NAME);

  // Presence: entrar no canal (pra ver quem está online)
  channel.presence.enter({ origin: ORIGIN }, (err)=>{
    if (err) log("presence enter err", err);
  });

  // Recebe diffs de DB
  channel.subscribe("db", (msg) => {
    const { payload, origin } = msg.data || {};
    if (!payload) return;
    if (origin === ORIGIN) return;
    log("db received");
    applyDB(payload);
  });

  // Handshake de snapshot (pedido/resposta)
  let gotSnapshot = false;

  channel.subscribe("req-snapshot", (msg) => {
    const { origin } = msg.data || {};
    if (origin === ORIGIN) return;
    const db = getLocalDB();
    const hasData = !!db && (
      (db.logs && db.logs.length) ||
      (db.presence && db.presence.length) ||
      (db.workshops && db.workshops.length) ||
      (db.components && db.components.length)
    );
    if (hasData) {
      log("answering snapshot");
      channel.publish("snapshot", { origin: ORIGIN, payload: db });
    }
  });

  channel.subscribe("snapshot", (msg) => {
    const { payload, origin } = msg.data || {};
    if (!payload || origin === ORIGIN) return;
    gotSnapshot = true;
    log("snapshot received");
    applyDB(payload);
  });

  // Canal pronto → pedir snapshot; se ninguém responder, faz fallback
  channel.once("attached", async () => {
    log("attached → requesting snapshot");
    channel.publish("req-snapshot", { origin: ORIGIN });

    setTimeout(async () => {
      if (gotSnapshot) return;

      // Se ninguém respondeu, e eu tenho dados, publico um snapshot (seed)
      const db = getLocalDB();
      const hasData = !!db && (
        (db.logs && db.logs.length) ||
        (db.presence && db.presence.length) ||
        (db.workshops && db.workshops.length) ||
        (db.components && db.components.length)
      );
      if (hasData) {
        log("fallback: publishing my snapshot");
        channel.publish("db", { origin: ORIGIN, payload: db });
      } else {
        log("fallback: no data to publish");
      }
    }, 1500);
  });

  // --- utilidades de debug expostas no window ---
  window.__rt = {
    ping: () => channel.publish("ping", { from: ORIGIN, t: Date.now() }),
    state: () => ({ hasClient: !!client, hasChannel: !!channel }),
    presence: async () => {
      const m = await channel.presence.get();
      log("presence:", m.map(x=>x.clientId || x.connectionId));
      return m;
    }
  };
  channel.subscribe("ping", (msg)=> log("ping from", msg.data?.from));
}

export function rtPublish(db) {
  if (!REALTIME_ENABLED || !channel) return;
  log("publish db");
  channel.publish("db", { origin: ORIGIN, payload: db });
}
