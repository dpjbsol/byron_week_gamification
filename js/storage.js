import { uuid, nowISO } from "./utils.js";

const KEY = "byron_week_gamify_v1";

const seedConfig = {
  points: {
    lecture: 25,           // palestra (padrão 25; modo alternativo 35)
    lectureAlt: 35,
    workshopPerDay: 30,
    idea: 20,
    figma: 40,
    codeDoc: 70
  },
  multipliers: {
    difficulty: { // aplicado ao Code+Doc
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
    mondayHolidayDate: "", // YYYY-MM-DD (aplica +10% salinha somente nesse dia)
    lectureUsesAlt: false  // se true usa 35 pts
  },
  closing: {
    enabled: false,
    closeAt: "" // "YYYY-MM-DDTHH:mm"
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
  sessions: [], // {id, title, date, start, end}
  presence: [], // {id, userId, sessionId, checkInISO, checkOutISO, status:'PENDENTE|APROVADO|REPROVADO', dpjComment}
  workshops: [], // {id, userId, date, mode:'PRESENCIAL|AVANCO', createdAtISO, status, dpjComment}
  components: [], // {id, userId, name, stage:'IDEIA|FIGMA|CODEDOC', difficulty, salinha, ideaPronta, createdAtISO, status, dpjComment}
  logs: [] // {id, userId, kind, refId, points, details, createdAtISO}
};

export function getDB() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(initial));
    return structuredClone(initial);
  }
  try { return JSON.parse(raw); }
  catch { localStorage.setItem(KEY, JSON.stringify(initial)); return structuredClone(initial); }
}

export function setDB(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDB(hard=false) {
  if (hard) localStorage.removeItem(KEY);
  setDB(structuredClone(initial));
}

export function addLog(db, { userId, kind, refId, points, details }) {
  db.logs.unshift({
    id: uuid(), userId, kind, refId, points,
    details, createdAtISO: nowISO()
  });
}


// Adicione isto em js/storage.js
export function initStorage() {
  // só garante que o DB foi inicializado
  getDB();
}
