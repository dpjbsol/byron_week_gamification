import { downloadCSV, fmtDateTime } from "../utils.js";
import { ensureDpjAccess } from "../guard.js";

export function LogsPage(container, db, save) {
  if (!ensureDpjAccess(db, save, container)) return;
  container.innerHTML = `
    <h2>Auditoria & Export</h2>
    <div class="grid">
      <button id="export">Exportar CSV</button>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Data/Hora</th><th>Participante</th><th>Tipo</th><th>Pontos</th><th>Detalhes</th></tr></thead>
          <tbody id="log-list"></tbody>
        </table>
      </div>
    </div>
  `;

  const $ = (q)=> container.querySelector(q);

  $("#export").onclick = ()=>{
    const header = ["datetime","user","type","points","details"];
    const rows = db.logs.map(l=>{
      const user = db.users.find(u=>u.id===l.userId)?.name || "?";
      return [fmtDateTime(l.createdAtISO), user, l.kind, l.points, l.details];
    });
    downloadCSV("auditoria.csv", [header, ...rows]);
  };

  $("#log-list").innerHTML = db.logs.map(l=>{
    const user = db.users.find(u=>u.id===l.userId)?.name || "?";
    return `<tr>
      <td>${fmtDateTime(l.createdAtISO)}</td>
      <td>${user}</td>
      <td>${l.kind}</td>
      <td>${l.points}</td>
      <td class="help">${l.details}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" class="help">Sem lançamentos ainda.</td></tr>`;
}
