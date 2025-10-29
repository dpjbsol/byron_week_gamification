import { ymd, isBeforeCutoff } from "./utils.js";

export function lecturePoints(config) {
  return config.flags.lectureUsesAlt ? config.points.lectureAlt : config.points.lecture;
}

export function canSystemAccept(db) {
  const { enabled, closeAt } = db.config.closing || {};
  if (!enabled || !closeAt) return true;
  const now = new Date();
  return now < new Date(closeAt.replace(" ", "T"));
}

export function validatePresenceForPoints(db, pres) {
  return Boolean(pres.checkInISO && pres.checkOutISO);
}
export function scorePresence(db, pres) {
  if (pres.status !== "APROVADO") return 0;
  if (!validatePresenceForPoints(db, pres)) return 0;
  return lecturePoints(db.config);
}

export function validateWorkshopForPoints(db, w) {
  const { windows } = db.config;

  if (!w?.date) return false; 

  if (w.mode === "PRESENCIAL") {
    return true;
  }

  if (!w.createdAtISO) return false;
  const sameDay = ymd(w.createdAtISO) === w.date;
  return sameDay && isBeforeCutoff(w.createdAtISO, windows.dayCutoff);
}

export function scoreWorkshop(db, w) {
  if (w.status !== "APROVADO") return 0;
  if (!validateWorkshopForPoints(db, w)) return 0;

  const alreadyApproved = db.workshops.some(x =>
    x.id !== w.id && x.userId === w.userId && x.status === "APROVADO" && x.date === w.date
  );
  if (alreadyApproved) return 0;

  return db.config.points.workshopPerDay;
}

export function baseStagePoints(db, stage) {
  if (stage === "IDEIA") return db.config.points.idea;
  if (stage === "FIGMA") return db.config.points.figma;
  return db.config.points.codeDoc; 
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
    return db.config.multipliers.salinhaMondayHoliday; 
  }
  return db.config.multipliers.salinha; 
}

export function validateComponentForPoints(comp) {
  return true;
}

export function scoreComponent(db, comp) {
  if (comp.status !== "APROVADO") return 0;
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
