import { uuid, nowISO } from "./utils.js";

export const STORAGE_KEY = "byron_week_gamify_v1";
const KEY = STORAGE_KEY;

function deepClone(obj) {
  try { return structuredClone(obj); }
  catch { return JSON.parse(JSON.stringify(obj)); }
}

const seedConfig = {
  points: {
    lecture: 25,           
    lectureAlt: 35,
    workshopPerDay: 30,
    idea: 20,
    figma: 40,
    codeDoc: 70
  },
  multipliers: {
    difficulty: {
      "Base": 1.00,
      "Médio": 1.20,
      "Difícil": 1.30
    },
    salinha: 1.20,
    salinhaMondayHoliday: 1.10
  },
  windows: {
    dpjStart: "13:30",
    dpjEnd: "17:30",
    dayCutoff: "23:59"
  },
  flags: {
    mondayHolidayDate: "", 
    lectureUsesAlt: false  
  },
  closing: {
    enabled: false,
    closeAt: ""
  },
  security: {
    dpjPassword: ""
  }
};

const initial = {
  config: seedConfig,
  users: [
    { id: uuid(), name: "Ana Clara" },
    { id: uuid(), name: "Bianca Rossi" },
    { id: uuid(), name: "Breno Yukihiro Hirakawa" },
    { id: uuid(), name: "Daniel Enrique Gonzalez de Aguiar" },
    { id: uuid(), name: "Eduardo Brandão Rocha" },
    { id: uuid(), name: "Enrique Abrahão Mantovani" },
    { id: uuid(), name: "Fabricio Pontes Ferreira" },
    { id: uuid(), name: "Gabriel Almeida Reis" },
    { id: uuid(), name: "Gabriel Barbosa Fernandes" },
    { id: uuid(), name: "Guilherme Ribeiro Livianu" },
    { id: uuid(), name: "Guilherme Teodoro Moreira Leite" },
    { id: uuid(), name: "João Pedro Gonçalves Sabino de Oliveira" },
    { id: uuid(), name: "João Victor Jacometti de Assis" },
    { id: uuid(), name: "Júlia Vitória Concari Arenhardt" },
    { id: uuid(), name: "Laura Camargo" },
    { id: uuid(), name: "Luís Fellipe Vargas de Araújo Sousa" },
    { id: uuid(), name: "Márcio Siqueira Lisboa Ribeiro" },
    { id: uuid(), name: "Maxime Koffi Junior" },
    { id: uuid(), name: "Pedro" },
    { id: uuid(), name: "Pedro Henrique de Souza Lopes" },
    { id: uuid(), name: "Pedro Henrique Fernandes Costa" },
    { id: uuid(), name: "Rafael Lemes Scarpel" },
    { id: uuid(), name: "Rafaela Pereira da Silva" },
    { id: uuid(), name: "Sofia Ferreira de Oliveira" },
    { id: uuid(), name: "Talles Alves de Morais" },
    { id: uuid(), name: "Victor Hugo Rodrigues Pereira" },
    { id: uuid(), name: "Victória Shirley Avelino da Silva" },
    { id: uuid(), name: "Vinicius Kody Murakami" }
  ],
  sessions: [],  
  presence: [],   
  workshops: [],  
  components: [],
  logs: []        
};

function normalizeDB(db) {
  const out = db || {};
  out.config = out.config || deepClone(seedConfig);

  out.config.points        = { ...seedConfig.points, ...(out.config.points || {}) };
  out.config.multipliers   = {
    ...seedConfig.multipliers,
    ...(out.config.multipliers || {}),
    difficulty: {
      ...seedConfig.multipliers.difficulty,
      ...(out.config.multipliers?.difficulty || {})
    }
  };
  out.config.windows       = { ...seedConfig.windows, ...(out.config.windows || {}) };
  out.config.flags         = { ...seedConfig.flags,   ...(out.config.flags || {}) };
  out.config.closing       = { ...seedConfig.closing, ...(out.config.closing || {}) };
  out.config.security      = { ...seedConfig.security, ...(out.config.security || {}) };

  out.users      = Array.isArray(out.users)      ? out.users      : [];
  out.sessions   = Array.isArray(out.sessions)   ? out.sessions   : [];
  out.presence   = Array.isArray(out.presence)   ? out.presence   : [];
  out.workshops  = Array.isArray(out.workshops)  ? out.workshops  : [];
  out.components = Array.isArray(out.components) ? out.components : [];
  out.logs       = Array.isArray(out.logs)       ? out.logs       : [];

  return out;
}

export function getDB() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const fresh = normalizeDB(deepClone(initial));
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return deepClone(fresh);
  }
  try {
    return normalizeDB(JSON.parse(raw));
  } catch {
    const fresh = normalizeDB(deepClone(initial));
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return deepClone(fresh);
  }
}

export function setDB(db) {
  const norm = normalizeDB(db);
  localStorage.setItem(KEY, JSON.stringify(norm));
  document.dispatchEvent(new CustomEvent("db:changed"));
  return norm;
}

export function resetDB(hard=false) {
  if (hard) localStorage.removeItem(KEY);
  const fresh = normalizeDB(deepClone(initial));
  localStorage.setItem(KEY, JSON.stringify(fresh));
  document.dispatchEvent(new CustomEvent("db:changed"));
  return fresh;
}

export function updateDB(mutator) {
  const db = getDB();
  mutator(db);
  return setDB(db);
}

export function addLog(db, { userId, kind, refId, points, details }) {
  db.logs.unshift({
    id: uuid(), userId, kind, refId, points,
    details, createdAtISO: nowISO()
  });
}

export function initStorage() {
  getDB(); 
}
