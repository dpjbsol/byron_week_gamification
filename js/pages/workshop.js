import { uuid, nowISO } from "../utils.js";
import { canSystemAccept, validateWorkshopForPoints, scoreWorkshop } from "../rules.js";

export function WorkshopPage(container, db, save) {
  container.innerHTML = `
    <h2>Lançar Oficina (dia)</h2>
    <div class="grid cols-2">
      <section>
        <div class="grid">
          <label>Participante
            <select id="w-user">
              ${db.users.map(u=>`<option value="${u.id}">${u.name}</option>`).join("")}
            </select>
          </label>
          <label>Data da oficina
            <input id="w-date" type="date" />
          </label>
          <label>Modo de validação do dia
            <select id="w-mode">
              <option value="PRESENCIAL">Presencial (janela DPJ)</option>
              <option value="AVANCO">Avanço/entrega (até 23:59)</option>
            </select>
          </label>
          <div class="grid cols-2">
            <button id="w-launch" class="ok">Registrar dia de oficina</button>
            <button id="w-clear" class="ghost">Limpar</button>
          </div>
          <span class="help">* 30 pts 1× por dia por participante. DPJ precisa aprovar.</span>
        </div>
      </section>

      <section>
        <h3>Meus registros</h3>
        <table class="table">
          <thead><tr><th>Participante</th><th>Data</th><th>Modo</th><th>Status</th></tr></thead>
          <tbody id="w-list"></tbody>
        </table>
      </section>
    </div>
  `;

  const $ = (q)=> container.querySelector(q);

  function clearForm(){
    $("#w-date").value = "";
    $("#w-mode").value = "PRESENCIAL";
  }

  $("#w-launch").onclick = () => {
    if (!canSystemAccept(db)) return alert("Sistema fechado para novos lançamentos.");
    const userId = $("#w-user").value;
    const date = $("#w-date").value;
    const mode = $("#w-mode").value;
    if (!userId || !date) return alert("Informe participante e data.");

    const entry = {
      id: uuid(),
      userId,
      date,           // YYYY-MM-DD
      mode,           // PRESENCIAL | AVANCO
      createdAtISO: nowISO(),
      status: "PENDENTE",
      dpjComment: ""
    };
    db.workshops.unshift(entry);
    save(db);
    renderTable();
    clearForm();
  };

  $("#w-clear").onclick = clearForm;

  function renderTable(){
    const rows = db.workshops
      .filter(w => w.status === "PENDENTE") /* só pendentes: some após aprovação */
      .slice(0,100)
      .map(w=>{
        const user = db.users.find(u=>u.id===w.userId)?.name || "?";
        const valid = validateWorkshopForPoints(db, w);
        const pts = scoreWorkshop(db, w);
        return `
          <tr>
            <td>${user}</td>
            <td>${w.date}</td>
            <td>${w.mode}</td>
            <td>
              <span class="tag ${w.status==='APROVADO'?'ok':(w.status==='REPROVADO'?'bad':'')}">${w.status}</span>
              ${valid?` <span class="tag">regra ok</span>`:` <span class="tag bad">fora da janela</span>`}
              ${w.status==='APROVADO'?` <span class="tag ok">+${pts} pts</span>`:""}
            </td>
          </tr>`;
      }).join("");
    $("#w-list").innerHTML = rows || `<tr><td colspan="4" class="help">Sem pendências.</td></tr>`;
  }

  renderTable();
}
