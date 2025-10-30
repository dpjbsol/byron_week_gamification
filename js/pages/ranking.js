// js/pages/ranking.js
import { fmtNum } from "../utils.js";
import { scorePresence, scoreWorkshop, scoreComponent } from "../rules.js";
import { getDB, STORAGE_KEY } from "../storage.js"; // STORAGE_KEY para escutar a chave correta

export function RankingPage(container, dbInitial) {
  let destroyed = false;

  function computeScores(db) {
    return db.users.map(u=>{
      const presPts = db.presence.filter(p=>p.userId===u.id)
        .reduce((acc,p)=> acc + scorePresence(db,p), 0);
      const workPts = db.workshops.filter(w=>w.userId===u.id)
        .reduce((acc,w)=> acc + scoreWorkshop(db,w), 0);
      const compApproved = db.components.filter(c=>c.userId===u.id && c.status==="APROVADO");
      const compPts = compApproved.reduce((acc,c)=> acc + scoreComponent(db,c), 0);

      const codeDocs = compApproved.filter(c=>c.stage==="CODEDOC").length;
      const workCount = db.workshops.filter(w=>w.userId===u.id && w.status==="APROVADO").length;
      const presCount = db.presence.filter(p=>p.userId===u.id && p.status==="APROVADO").length;
      const firstLog = db.logs.filter(l=>l.userId===u.id).slice(-1)[0]?.createdAtISO || "9999-12-31T00:00:00";

      return {
        user: u.name,
        total: presPts + workPts + compPts,
        tie: { codeDocs, workCount, presCount, firstLog }
      };
    }).sort((a,b)=>{
      if (b.total !== a.total) return b.total - a.total;
      if (b.tie.codeDocs !== a.tie.codeDocs) return b.tie.codeDocs - a.tie.codeDocs;
      if (b.tie.workCount !== a.tie.workCount) return b.tie.workCount - a.tie.workCount;
      if (b.tie.presCount !== a.tie.presCount) return b.tie.presCount - a.tie.presCount;
      return a.tie.firstLog.localeCompare(b.tie.firstLog);
    });
  }

  function render(db) {
    if (destroyed) return;
    const scores = computeScores(db);
    container.innerHTML = `
      <h2>Ranking</h2>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>Participante</th><th>Pontos</th><th>Desempate</th></tr></thead>
          <tbody>
            ${scores.map((s,i)=>`
              <tr>
                <td>${i+1}</td>
                <td>${s.user}</td>
                <td class="kpi">${fmtNum(s.total)}</td>
                <td class="help">
                  Code+Doc: ${s.tie.codeDocs} · Oficinas: ${s.tie.workCount} · Palestras: ${s.tie.presCount}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // render inicial
  render(dbInitial);

  // re-render quando o DB local mudar (por este ou outro tab)
  const onDbChanged = () => render(getDB());
  document.addEventListener("db:changed", onDbChanged);

  // re-render ao receber alterações pelo storage (outra aba)
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) render(getDB());
  };
  window.addEventListener("storage", onStorage);

  // opcional: limpar handlers quando o container for descartado
  container.__destroy = () => {
    destroyed = true;
    document.removeEventListener("db:changed", onDbChanged);
    window.removeEventListener("storage", onStorage);
  };
}
