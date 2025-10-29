import { ymd, isBeforeCutoff } from "./utils.js";

// Pontuação e verificações consolidadas
export function lecturePoints(config) {
  return config.flags.lectureUsesAlt ? config.points.lectureAlt : config.points.lecture;
}

export function canSystemAccept(db) {
  const { enabled, closeAt } = db.config.closing || {};
  if (!enabled || !closeAt) return true;
  const now = new Date();
  return now < new Date(closeAt.replace(" ", "T"));
}

// ---------- PRESENÇA (PALESTRA) ----------
export function validatePresenceForPoints(db, pres) {
  return Boolean(pres.checkInISO && pres.checkOutISO);
}
export function scorePresence(db, pres) {
  if (pres.status !== "APROVADO") return 0;
  if (!validatePresenceForPoints(db, pres)) return 0;
  return lecturePoints(db.config);
}

// ---------- OFICINA (DIA) ----------
/*
 * Regras:
 * - PRESENCIAL: conta 30 pts 1x por dia por usuário quando DPJ aprova.
 * - AVANCO: precisa ter sido lançado até 23:59 do próprio dia.
 */
export function validateWorkshopForPoints(db, w) {
  const { windows } = db.config;

  if (!w?.date) return false; // precisa de dia

  if (w.mode === "PRESENCIAL") {
    // janela é operacional do DPJ; para pontuar basta existir o dia + aprovação
    return true;
  }

  // AVANCO: lançado até 23:59 do mesmo dia
  if (!w.createdAtISO) return false;
  const sameDay = ymd(w.createdAtISO) === w.date;
  return sameDay && isBeforeCutoff(w.createdAtISO, windows.dayCutoff);
}

export function scoreWorkshop(db, w) {
  if (w.status !== "APROVADO") return 0;
  if (!validateWorkshopForPoints(db, w)) return 0;

  // apenas 1x por dia por usuário
  const alreadyApproved = db.workshops.some(x =>
    x.id !== w.id && x.userId === w.userId && x.status === "APROVADO" && x.date === w.date
  );
  if (alreadyApproved) return 0;

  return db.config.points.workshopPerDay;
}

// ---------- COMPONENTES ----------
export function baseStagePoints(db, stage) {
  if (stage === "IDEIA") return db.config.points.idea;
  if (stage === "FIGMA") return db.config.points.figma;
  return db.config.points.codeDoc; // CODEDOC
}
export function applyDifficulty(mult, stage) {
  return stage === "CODEDOC" ? mult : 1.0;
}

/**
 * Bônus de "salinha":
 * - 1.10 se a data for a segunda-feira (qualquer segunda) OU se for igual à data especial configurada.
 * - 1.20 nos demais dias.
 */
export function salinhaMultiplier(db, dateISO) {
  const dStr = ymd(dateISO);
  const d = new Date(`${dStr}T12:00:00`); // noon evita problemas de fuso
  const isMonday = d.getDay() === 1; // 0=Dom, 1=Seg, ...
  const special = db.config.flags.mondayHolidayDate;
  if ((special && dStr === special) || isMonday) {
    return db.config.multipliers.salinhaMondayHoliday; // ex.: 1.10
  }
  return db.config.multipliers.salinha; // ex.: 1.20
}

export function validateComponentForPoints(comp) {
  return true;
}

export function scoreComponent(db, comp) {
  if (comp.status !== "APROVADO") return 0;
  if (!validateComponentForPoints(comp)) return 0;

  // Ideia pronta DPJ zera etapa de IDEIA
  if (comp.stage === "IDEIA" && comp.ideaPronta) return 0;

  const base = baseStagePoints(db, comp.stage);
  const diffMult = applyDifficulty(
    (db.config.multipliers.difficulty[comp.difficulty || "Base"] || 1.0),
    comp.stage
  );

  let total = base * diffMult;

  // Referência para o bônus de salinha:
  // - se o usuário informar uma data de salinha, usamos ela;
  // - caso contrário, usamos a data de criação (retrocompatível).
  if (comp.salinha) {
    const refISO = comp.salinhaDate
      ? `${comp.salinhaDate}T12:00:00`
      : (comp.createdAtISO || new Date().toISOString());
    total = Math.round(total * salinhaMultiplier(db, refISO));
  }

  return total;
}
