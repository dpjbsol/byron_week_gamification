import { uuid, nowISO } from "../utils.js";
import { scoreComponent } from "../rules.js";

export function ComponentPage(container, db, save) {
  const difficulties = Object.keys(db.config.multipliers.difficulty);

  container.innerHTML = `
    <h2>Lançar Etapa de Componente</h2>
    <div class="grid cols-2">
      <section>
        <div class="grid">
          <label>Participante
            <select id="c-user">
              ${db.users.map(u=>`<option value="${u.id}">${u.name}</option>`).join("")}
            </select>
          </label>
          <label>Nome do componente
            <input id="c-name" placeholder="Ex.: Button, Alert, Tabs..." />
          </label>
          <label>Etapa
            <select id="c-stage">
              <option value="IDEIA">Ideia</option>
              <option value="FIGMA">Figma</option>
              <option value="CODEDOC">Código + Doc</option>
            </select>
          </label>
          <label>Dificuldade (só para Código+Doc)
            <select id="c-diff">
              ${difficulties.map(d=>`<option value="${d}">${d}</option>`).join("")}
            </select>
          </label>
          <div class="grid cols-3">
            <label><input type="checkbox" id="c-salinha" /> Validado na salinha</label>
            <label><input type="checkbox" id="c-ideia-pronta" /> Ideia pronta DPJ</label>
            <span class="help">* Ideia pronta zera pontos da etapa Ideia</span>
          </div>
          <div id="salinha-date-wrap" style="display:none;">
            <label>Data da validação (salinha)
              <input type="date" id="c-salinha-date" />
            </label>
            <span class="help">Usado para aplicar 1.10 na segunda/feriado; vazio usa a data do envio.</span>
          </div>
          <div class="grid cols-2">
            <button id="c-send" class="ok">Enviar para validação</button>
            <button id="c-clear" class="ghost">Limpar</button>
          </div>
        </div>
      </section>

      <section>
        <h3>Minhas entregas</h3>
        <table class="table">
          <thead><tr><th>Componente</th><th>Etapa</th><th>Flags</th><th>Status</th></tr></thead>
          <tbody id="c-list"></tbody>
        </table>
      </section>
    </div>
  `;

  const $ = (q)=> container.querySelector(q);

  $("#c-salinha").onchange = ()=>{
    $("#salinha-date-wrap").style.display = $("#c-salinha").checked ? "block" : "none";
  };

  function clearForm(){
    $("#c-name").value = "";
    $("#c-stage").value = "IDEIA";
    $("#c-diff").value = "Base";
    $("#c-salinha").checked = false;
    $("#c-ideia-pronta").checked = false;
    $("#c-salinha-date").value = "";
    $("#salinha-date-wrap").style.display = "none";
  }

  $("#c-send").onclick = () => {
    const userId = $("#c-user").value;
    const name = $("#c-name").value.trim();
    const stage = $("#c-stage").value;
    const difficulty = $("#c-diff").value;
    const salinha = $("#c-salinha").checked;
    const ideaPronta = $("#c-ideia-pronta").checked;
    const salinhaDate = $("#c-salinha-date").value;

    if (!userId || !name) return alert("Informe participante e nome do componente.");

    const item = {
      id: uuid(),
      userId,
      name,
      stage,
      difficulty,
      salinha,
      ideaPronta,
      salinhaDate: salinha ? (salinhaDate || "") : "",
      createdAtISO: nowISO(),
      status: "PENDENTE",
      dpjComment: ""
    };
    db.components.unshift(item);
    save(db);
    renderTable();
    clearForm();
  };

  $("#c-clear").onclick = clearForm;

  function renderTable(){
    const rows = db.components
      .filter(c => c.status === "PENDENTE") 
      .slice(0,100)
      .map(c=>{
        const pts = scoreComponent(db, c);
        return `
          <tr>
            <td>${c.name}</td>
            <td>${c.stage}${c.stage==="CODEDOC" ? ` (${c.difficulty})` : ""}</td>
            <td>
              ${c.salinha?'<span class="tag">salinha</span>':''}
              ${c.salinhaDate?` <span class="tag">${c.salinhaDate}</span>`:''}
              ${c.ideaPronta?'<span class="tag warn">ideia pronta</span>':''}
            </td>
            <td>
              <span class="tag ${c.status==='APROVADO'?'ok':(c.status==='REPROVADO'?'bad':'')}">${c.status}</span>
              ${c.status==='APROVADO'?` <span class="tag ok">+${pts} pts</span>`:""}
            </td>
          </tr>`;
      }).join("");
    $("#c-list").innerHTML = rows || `<tr><td colspan="4" class="help">Sem pendências.</td></tr>`;
  }
  renderTable();
}
