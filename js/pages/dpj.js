import { scorePresence, scoreWorkshop, scoreComponent } from "../rules.js";
import { addLog } from "../storage.js";
import { ensureDpjAccess } from "../guard.js"; // guard compartilhado

export function DPJPage(container, db, save) {
  if (!ensureDpjAccess(db, save, container)) return;

  container.innerHTML = `
    <h2>Validações DPJ</h2>

    <div class="grid">
      <section class="panel">
        <div class="grid cols-2" style="align-items:end">
          <h3>Palestras</h3>
          <label style="justify-self:end">
            <input id="show-approved-pres" type="checkbox"> Mostrar aprovados
          </label>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Participante</th><th>Sessão</th><th>Check-in/out</th><th>Ação</th></tr></thead>
            <tbody id="t-pres"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="grid cols-2" style="align-items:end">
          <h3>Oficinas</h3>
          <label style="justify-self:end">
            <input id="show-approved-work" type="checkbox"> Mostrar aprovados
          </label>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Participante</th><th>Data</th><th>Modo</th><th>Ação</th></tr></thead>
            <tbody id="t-work"></tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="grid cols-2" style="align-items:end">
          <h3>Componentes</h3>
          <label style="justify-self:end">
            <input id="show-approved-comp" type="checkbox"> Mostrar aprovados
          </label>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Participante</th><th>Componente</th><th>Etapa</th><th>Flags</th><th>Ação</th></tr></thead>
            <tbody id="t-comp"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const $ = q => container.querySelector(q);

  function actionButtonsPending() {
    return `
      <div class="grid cols-3">
        <button class="ok approve">Aprovar</button>
        <button class="bad reject">Reprovar</button>
        <input placeholder="Comentário (opcional)" class="dpj-comment"/>
      </div>`;
  }
  function actionButtonsApproved() {
    return `
      <div class="grid cols-3">
        <button class="bad revoke">Anular</button>
        <button class="ghost delete">Excluir</button>
        <span class="help">ação permanente</span>
      </div>`;
  }

  function revokeItem(item, scorer) {
    if (item.status !== "APROVADO") { alert("Só é possível anular itens aprovados."); return; }
    if (!confirm("Anular esta aprovação e retirar a pontuação?")) return;
    const pts = scorer(item) || 0;
    item.status = "REVERTIDO";
    addLog(db, {
      userId: item.userId,
      kind: "AJUSTE",
      refId: item.id,
      points: -pts,
      details: "Reversão de aprovação pelo DPJ"
    });
    save(db);
    renderAll();
  }

  function deleteItem(arrayRef, id) {
    if (!confirm("Excluir definitivamente este lançamento? Esta ação não pode ser desfeita.")) return;
    const idx = arrayRef.findIndex(x => x.id === id);
    if (idx >= 0) arrayRef.splice(idx,1);
    save(db);
    renderAll();
  }

  function renderPresence() {
    const showApproved = $("#show-approved-pres").checked;
    const scope = db.presence.filter(p => showApproved ? p.status==="APROVADO" : p.status==="PENDENTE");
    $("#t-pres").innerHTML = scope.map(p=>{
      const user = db.users.find(u=>u.id===p.userId)?.name || "?";
      const sess = db.sessions.find(s=>s.id===p.sessionId);
      const sessInfo = `${sess?.date||""} ${sess?.start||""}–${sess?.end||""}`.trim();
      return `<tr data-id="${p.id}">
        <td>${user}</td>
        <td>${sess?.title || "?"}<br><span class="help">${sessInfo}</span></td>
        <td><span class="help">in</span> ${p.checkInISO || "-"}<br><span class="help">out</span> ${p.checkOutISO || "-"}</td>
        <td>${showApproved ? actionButtonsApproved() : actionButtonsPending()}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="4" class="help">Sem ${showApproved?'aprovados':'pendências'}.</td></tr>`;

    if (showApproved) {
      $("#t-pres").querySelectorAll(".revoke").forEach(btn=>{
        btn.onclick = ()=>{
          const id = btn.closest("tr").dataset.id;
          const item = db.presence.find(x=>x.id===id);
          revokeItem(item, (it)=>scorePresence(db,it));
        };
      });
      $("#t-pres").querySelectorAll(".delete").forEach(btn=>{
        btn.onclick = ()=>{
          const id = btn.closest("tr").dataset.id;
          deleteItem(db.presence, id);
        };
      });
    } else {
      $("#t-pres").querySelectorAll(".approve").forEach((btn)=>{
        btn.onclick = ()=>{
          const row = btn.closest("tr");
          const id = row.dataset.id;
          const item = db.presence.find(x=>x.id===id);
          item.status = "APROVADO";
          item.dpjComment = row.querySelector(".dpj-comment")?.value || "";
          const pts = scorePresence(db, item);
          if (pts>0) addLog(db, { userId:item.userId, kind:"PONTOS", refId:item.id, points:pts, details:"Palestra aprovada" });
          save(db); renderAll();
        };
      });
      $("#t-pres").querySelectorAll(".reject").forEach(btn=>{
        btn.onclick = ()=>{
          const row = btn.closest("tr");
          const id = row.dataset.id;
          const item = db.presence.find(x=>x.id===id);
          item.status = "REPROVADO";
          item.dpjComment = row.querySelector(".dpj-comment")?.value || "Revisar";
          save(db); renderAll();
        };
      });
    }
  }

  function renderWorkshops() {
    const showApproved = $("#show-approved-work").checked;
    const scope = db.workshops.filter(w => showApproved ? w.status==="APROVADO" : w.status==="PENDENTE");
    $("#t-work").innerHTML = scope.map(w=>{
      const user = db.users.find(u=>u.id===w.userId)?.name || "?";
      return `<tr data-id="${w.id}">
        <td>${user}</td>
        <td>${w.date}</td>
        <td>${w.mode}</td>
        <td>${showApproved ? actionButtonsApproved() : actionButtonsPending()}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="4" class="help">Sem ${showApproved?'aprovados':'pendências'}.</td></tr>`;

    if (showApproved) {
      $("#t-work").querySelectorAll(".revoke").forEach(btn=>{
        btn.onclick = ()=>{
          const id = btn.closest("tr").dataset.id;
          const item = db.workshops.find(x=>x.id===id);
          revokeItem(item, (it)=>scoreWorkshop(db,it));
        };
      });
      $("#t-work").querySelectorAll(".delete").forEach(btn=>{
        btn.onclick = ()=>{
          const id = btn.closest("tr").dataset.id;
          deleteItem(db.workshops, id);
        };
      });
    } else {
      $("#t-work").querySelectorAll(".approve").forEach(btn=>{
        btn.onclick = ()=>{
          const row = btn.closest("tr");
          const id = row.dataset.id;
          const item = db.workshops.find(x=>x.id===id);
          item.status = "APROVADO";
          item.dpjComment = row.querySelector(".dpj-comment")?.value || "";
          const pts = scoreWorkshop(db, item);
          if (pts>0) addLog(db, { userId:item.userId, kind:"PONTOS", refId:item.id, points:pts, details:"Oficina aprovada" });
          save(db); renderAll();
        };
      });
      $("#t-work").querySelectorAll(".reject").forEach(btn=>{
        btn.onclick = ()=>{
          const row = btn.closest("tr");
          const id = row.dataset.id;
          const item = db.workshops.find(x=>x.id===id);
          item.status = "REPROVADO";
          item.dpjComment = row.querySelector(".dpj-comment")?.value || "Revisar";
          save(db); renderAll();
        };
      });
    }
  }

  function renderComponents() {
    const showApproved = $("#show-approved-comp").checked;
    const scope = db.components.filter(c => showApproved ? c.status==="APROVADO" : c.status==="PENDENTE");
    $("#t-comp").innerHTML = scope.map(c=>{
      const user = db.users.find(u=>u.id===c.userId)?.name || "?";
      return `<tr data-id="${c.id}">
        <td>${user}</td>
        <td>${c.name}</td>
        <td>${c.stage}${c.stage==="CODEDOC"?` (${c.difficulty})`:""}</td>
        <td>${c.salinha?'<span class="tag">salinha</span>':''} ${c.ideaPronta?'<span class="tag warn">ideia pronta</span>':''}</td>
        <td>${showApproved ? actionButtonsApproved() : actionButtonsPending()}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="5" class="help">Sem ${showApproved?'aprovados':'pendências'}.</td></tr>`;

    if (showApproved) {
      $("#t-comp").querySelectorAll(".revoke").forEach(btn=>{
        btn.onclick = ()=>{
          const id = btn.closest("tr").dataset.id;
          const item = db.components.find(x=>x.id===id);
          revokeItem(item, (it)=>scoreComponent(db,it));
        };
      });
      $("#t-comp").querySelectorAll(".delete").forEach(btn=>{
        btn.onclick = ()=>{
          const id = btn.closest("tr").dataset.id;
          deleteItem(db.components, id);
        };
      });
    } else {
      $("#t-comp").querySelectorAll(".approve").forEach(btn=>{
        btn.onclick = ()=>{
          const row = btn.closest("tr");
          const id = row.dataset.id;
          const item = db.components.find(x=>x.id===id);
          item.status = "APROVADO";
          item.dpjComment = row.querySelector(".dpj-comment")?.value || "";
          const pts = scoreComponent(db, item);
          if (pts>0) addLog(db, { userId:item.userId, kind:"PONTOS", refId:item.id, points:pts, details:"Componente aprovado" });
          save(db); renderAll();
        };
      });
      $("#t-comp").querySelectorAll(".reject").forEach(btn=>{
        btn.onclick = ()=>{
          const row = btn.closest("tr");
          const id = row.dataset.id;
          const item = db.components.find(x=>x.id===id);
          item.status = "REPROVADO";
          item.dpjComment = row.querySelector(".dpj-comment")?.value || "Revisar";
          save(db); renderAll();
        };
      });
    }
  }

  function renderAll() {
    renderPresence();
    renderWorkshops();
    renderComponents();
  }

  ["#show-approved-pres", "#show-approved-work", "#show-approved-comp"].forEach(sel=>{
    $(sel).onchange = renderAll;
  });

  renderAll();
}
