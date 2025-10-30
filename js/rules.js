// js/rules.js
import { ymd, isBeforeCutoff } from "./utils.js";

/* ===== Sistema / fechamento ============================================= */
export function canSystemAccept(db) {
  const { enabled, closeAt } = db.config.closing || {};
  if (!enabled || !closeAt) return true;
  const now = new Date();
  return now < new Date(closeAt.replace(" ", "T"));
}

/* ===== Presenças (palestra) ============================================= */
// 0 = nenhum check, 1 = um check, 2 = dois checks
function presenceChecksCount(p) {
  return (p?.checkInISO ? 1 : 0) + (p?.checkOutISO ? 1 : 0);
}

export function validatePresenceForPoints(db, pres) {
  // “válido para pontuar” agora significa ter pelo menos 1 check
  return presenceChecksCount(pres) > 0;
}

export function scorePresence(db, pres) {
  if (pres?.status !== "APROVADO") return 0;
  const n = presenceChecksCount(pres);
  if (n >= 2) return Number(db.config.points.lectureFull || 0);   // duplo check
  if (n === 1) return Number(db.config.points.lectureSingle || 0); // check único
  return 0;
}

/* ===== Oficinas ========================================================== */
export function validateWorkshopForPoints(db, w) {
  const { windows } = db.config;
  if (!w?.date) return false;

  if (w.mode === "PRESENCIAL") return true;

  if (!w.createdAtISO) return false;
  const sameDay = ymd(w.createdAtISO) === w.date;
  return sameDay && isBeforeCutoff(w.createdAtISO, windows.dayCutoff);
}

export function scoreWorkshop(db, w) {
  if (w?.status !== "APROVADO") return 0;
  if (!validateWorkshopForPoints(db, w)) return 0;

  // evita pontuar duas vezes no mesmo dia para o mesmo user
  const alreadyApproved = db.workshops.some(x =>
    x.id !== w.id &&
    x.userId === w.userId &&
    x.status === "APROVADO" &&
    x.date === w.date
  );
  if (alreadyApproved) return 0;

  return Number(db.config.points.workshopPerDay || 0);
}

/* ===== Componentes ======================================================= */
export function baseStagePoints(db, stage) {
  if (stage === "IDEIA")  return Number(db.config.points.idea || 0);
  if (stage === "FIGMA")  return Number(db.config.points.figma || 0);
  return Number(db.config.points.codeDoc || 0); // CODEDOC
}
export function applyDifficulty(mult, stage) {
  return stage === "CODEDOC" ? mult : 1.0;
}

export function salinhaMultiplier(db, dateISO) {
  const dStr = ymd(dateISO);
  const d = new Date(`${dStr}T12:00:00`);
  const isMonday = d.getDay() === 1;
  const special = db.config.flags.mondayHolidayDate;
  if ((special && dStr === special) || isMonday) {
    return Number(db.config.multipliers.salinhaMondayHoliday || 1);
  }
  return Number(db.config.multipliers.salinha || 1);
}

export function validateComponentForPoints(comp) {
  return true;
}

export function scoreComponent(db, comp) {
  if (comp?.status !== "APROVADO") return 0;
  if (!validateComponentForPoints(comp)) return 0;

  if (comp.stage === "IDEIA" && comp.ideaPronta) return 0;

  const base = baseStagePoints(db, comp.stage);
  const diffMult = applyDifficulty(
    (db.config.multipliers.difficulty[comp.difficulty || "Base"] || 1.0),
    comp.stage
  );

  let total = base * diffMult;

  if (comp.salinha) {
    const refISO = comp.salinhaDate
      ? `${comp.salinhaDate}T12:00:00`
      : (comp.createdAtISO || new Date().toISOString());
    total = Math.round(total * salinhaMultiplier(db, refISO));
  }

  return total;
}
