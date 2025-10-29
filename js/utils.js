export const TZ = "America/Sao_Paulo";

export function nowISO() {
  const d = new Date();
  return toLocalISO(d);
}

export function toLocalISO(d) {
  const pad = (n)=> String(n).padStart(2,"0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth()+1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

export function parseLocal(dateStr) {
  return new Date(dateStr.replace(" ", "T"));
}

export function ymd(d) {
  if (!(d instanceof Date)) d = new Date(d);
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function betweenTimes(date, startHHMM, endHHMM) {
  const [h1,m1]=startHHMM.split(":").map(Number);
  const [h2,m2]=endHHMM.split(":").map(Number);
  const d = new Date(date);
  const s = new Date(d); s.setHours(h1,m1,0,0);
  const e = new Date(d); e.setHours(h2,m2,59,999);
  return d >= s && d <= e;
}

export function isBeforeCutoff(date, cutoffHHMM="23:59") {
  const [h,m] = cutoffHHMM.split(":").map(Number);
  const d = new Date(date);
  const c = new Date(d); c.setHours(h,m,59,999);
  return d <= c;
}

export function fmtDateTime(d) {
  if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleString("pt-BR", { hour12:false });
}

export function fmtNum(n) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function downloadCSV(filename, rows) {
  const escape = (v)=> `"${String(v ?? "").replaceAll('"','""')}"`;
  const csv = rows.map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function setActiveTab() {
  const hash = location.hash || "#/presence";
  document.querySelectorAll(".tabs a").forEach(a=>{
    a.classList.toggle("active", a.getAttribute("href")===hash);
  });
}
