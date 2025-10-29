import { scorePresence, scoreWorkshop, scoreComponent } from "../rules.js";
import { addLog } from "../storage.js";

export function DPJPage(container, db, save) {
  container.innerHTML = `
    <h2>Validações DPJ</h2>
    <div class="grid">
      <section class="panel">
        <h3>Palestras</h3>
        <table class="table">
          <thead><tr><th>Participante</th><th>Sessão</th><th>Check-in/out</th><th>Ação</th></tr></thead>
          <tbody id="t-pres"></tbody>
        </table>
      </section>
      <section class="panel">
        <h3>Oficinas</h3>
        <table class="table">
          <thead><tr><th>Participante</th><th>Data</th><th>Modo</th><th>Ação</th></tr></thead>
          <tbody id="t-work"></tbody>
        </table>
      </section>
      <section class="panel">
        <h3>Componentes</h3>
        <table class="table">
          <thead><tr><th>Participante</th><th>Componente</th><th>Etapa</th><th>Flags</th><th>Ação</th></tr></thead>
          <tbody id="t-comp"></tbody>
        </table>
      </section>
    </div>
  `;
  const $ = (q)=> container.querySelector(q);

  function actionButtons(onApprove, onReject) {
    return `
      <div class="grid cols-3">
        <button class="ok approve">Aprovar</button>
        <button class="bad reject">Reprovar</button>
        <input placeholder="Comentário (opcional)" class="dpj-comment"/>
      </div>`;
  }

  function bindRowEvents(scope, list, scorer) {
    list.querySelectorAll(".approve").forEach((btn, idx)=>{
      btn.onclick = ()=>{
        const row = btn.closest("tr");
        const comment = row.querySelector(".dpj-comment")?.value || "";
        const item = scope[idx];
        item.status = "APROVADO";
        item.dpjComment = comment;
        const pts = scorer(item);
        if (pts>0) {
          // registrar log
          addLog(db, {
            userId: item.userId,
            kind: "PONTOS",
            refId: item.id,
            points: pts,
            details: `Lançamento aprovado: ${item.kind || 'evento'}`
          });
        }
        save(db);
      };
    });
    list.querySelectorAll(".reject").forEach((btn, idx)=>{
      btn.onclick = ()=>{
        const row = btn.closest("tr");
        const comment = row.querySelector(".dpj-comment")?.value || "";
        const item = scope[idx];
        item.status = "REPROVADO";
        item.dpjComment = comment || "Revisar em até 6h.";
        save(db);
      };
    });
  }

  // Palestras
  const pendPres = db.presence.filter(p=>p.status==="PENDENTE");
  $("#t-pres").innerHTML = pendPres.map(p=>{
    const user = db.users.find(u=>u.id===p.userId)?.name || "?";
    const sess = db.sessions.find(s=>s.id===p.sessionId);
    p.kind = "PALESTRA";
    return `<tr>
      <td>${user}</td>
      <td>${sess?.title || "?"}<br><span class="help">${sess?.date} ${sess?.start}–${sess?.end || "?"}</span></td>
      <td><span class="help">in</span> ${p.checkInISO || "-"}<br><span class="help">out</span> ${p.checkOutISO || "-"}</td>
      <td>${actionButtons()}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="help">Sem pendências.</td></tr>`;
  bindRowEvents(pendPres, $("#t-pres"), (item)=> scorePresence(db, item));

  // Oficinas
  const pendWork = db.workshops.filter(w=>w.status==="PENDENTE");
  $("#t-work").innerHTML = pendWork.map(w=>{
    const user = db.users.find(u=>u.id===w.userId)?.name || "?";
    w.kind = "OFICINA";
    return `<tr>
      <td>${user}</td>
      <td>${w.date}</td>
      <td>${w.mode}</td>
      <td>${actionButtons()}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="help">Sem pendências.</td></tr>`;
  bindRowEvents(pendWork, $("#t-work"), (item)=> scoreWorkshop(db, item));

  // Componentes
  const pendComp = db.components.filter(c=>c.status==="PENDENTE");
  $("#t-comp").innerHTML = pendComp.map(c=>{
    const user = db.users.find(u=>u.id===c.userId)?.name || "?";
    c.kind = "COMPONENTE";
    return `<tr>
      <td>${user}</td>
      <td>${c.name}</td>
      <td>${c.stage}${c.stage==="CODEDOC"?` (${c.difficulty})`:""}</td>
      <td>${c.salinha?'<span class="tag">salinha</span>':''} ${c.ideaPronta?'<span class="tag warn">ideia pronta</span>':''}</td>
      <td>${actionButtons()}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" class="help">Sem pendências.</td></tr>`;
  bindRowEvents(pendComp, $("#t-comp"), (item)=> scoreComponent(db, item));
}
