import { uuid, nowISO, fmtDateTime } from "../utils.js";
import { canSystemAccept, validatePresenceForPoints, scorePresence } from "../rules.js";

export function PresencePage(container, db, save) {
  const LECTURE_OPTIONS = [
    "palestra de segunda",
    "palestra de terça",
    "palestra de quarta",
    "palestra de quinta"
  ];

  container.innerHTML = `
    <h2>Lançar Presença (Palestra)</h2>
    <div class="grid cols-2">
      <section>
        <div class="grid">
          <label>Participante
            <select id="p-user">
              ${db.users.map(u=>`<option value="${u.id}">${u.name}</option>`).join("")}
            </select>
          </label>

          <label>Título da sessão
            <select id="p-title-sel">
              ${LECTURE_OPTIONS.map(t=>`<option value="${t}">${t}</option>`).join("")}
            </select>
          </label>

          <div class="grid cols-2">
            <label>Data <input id="p-date" type="date" /></label>
            <label>Início <input id="p-start" type="time" /></label>
          </div>
          <div class="grid cols-2">
            <label>Fim <input id="p-end" type="time" /></label>
            <div class="grid" style="align-items:end;">
              <label><input type="checkbox" id="cb-in" /> Marcar check-in</label>
              <label><input type="checkbox" id="cb-out" /> Marcar check-out</label>
              <span class="help">* presença só conta com check-in + check-out e aprovação DPJ</span>
            </div>
          </div>

          <div class="grid cols-2">
            <button id="p-launch" class="ok">Lançar</button>
            <button id="p-clear" class="ghost">Limpar</button>
          </div>
        </div>
      </section>

      <section>
        <h3>Minhas marcações (pendentes)</h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Participante</th><th>Sessão</th><th>Check-in/out</th><th>Status</th></tr></thead>
            <tbody id="p-list"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const $ = (q)=> container.querySelector(q);

  function upsertPresence() {
    if (!canSystemAccept(db)) {
      alert("Sistema fechado para novos lançamentos.");
      return null;
    }

    const title = $("#p-title-sel").value;
    const date = $("#p-date").value;
    const start = $("#p-start").value;
    const end = $("#p-end").value;
    const userId = $("#p-user").value;
    const markIn = $("#cb-in").checked;
    const markOut = $("#cb-out").checked;

    if (!title || !date || !start || !end) {
      alert("Informe data, início e fim da sessão.");
      return null;
    }

    let session = db.sessions.find(s => s.title===title && s.date===date);
    if (!session) {
      session = { id: uuid(), title, date, start, end };
      db.sessions.push(session);
    } else {
      session.start = start;
      session.end = end;
    }

    let pres = db.presence.find(p => p.sessionId===session.id && p.userId===userId);
    if (!pres) {
      pres = { id: uuid(), userId, sessionId: session.id, checkInISO: "", checkOutISO: "", status: "PENDENTE", dpjComment: "" };
      db.presence.unshift(pres);
    }

    if (markIn)  pres.checkInISO  = nowISO();
    if (markOut) pres.checkOutISO = nowISO();

    pres.status = "PENDENTE";
    pres.dpjComment = "";

    return db;
  }

  $("#p-launch").onclick = () => {
    const updated = upsertPresence();
    if (updated) {
      save(updated);
      renderTable();
      alert("Lançado! Aguarda aprovação DPJ.");
    }
  };

  $("#p-clear").onclick = () => {
    $("#cb-in").checked = false;
    $("#cb-out").checked = false;
    $("#p-date").value = "";
    $("#p-start").value = "";
    $("#p-end").value = "";
  };

  function renderTable() {
    const rows = db.presence
      .filter(p => p.status === "PENDENTE")
      .slice(0,50)
      .map(p=>{
        const user = db.users.find(u=>u.id===p.userId)?.name || "?";
        const sess = db.sessions.find(s=>s.id===p.sessionId);
        const valid = validatePresenceForPoints(db, p);
        const pts = scorePresence(db, p);
        return `
          <tr>
            <td>${user}</td>
            <td>${sess?.title || "?"} <br><span class="help">${sess?.date} ${sess?.start}–${sess?.end || "?"}</span></td>
            <td>
              <div>in: ${p.checkInISO ? fmtDateTime(p.checkInISO) : "-"}</div>
              <div>out: ${p.checkOutISO ? fmtDateTime(p.checkOutISO) : "-"}</div>
            </td>
            <td>
              <span class="tag ${p.status==='APROVADO'?'ok':(p.status==='REPROVADO'?'bad':'')}">${p.status}</span>
              ${valid?` <span class="tag">ok c/ regra</span>`:` <span class="tag bad">falta check</span>`}
              ${p.status==='APROVADO'?` <span class="tag ok">+${pts} pts</span>`:""}
            </td>
          </tr>`;
      }).join("");

    $("#p-list").innerHTML = rows || `<tr><td colspan="4" class="help">Sem pendências.</td></tr>`;
  }

  renderTable();
}
