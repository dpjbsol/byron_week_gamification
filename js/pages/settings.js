// js/pages/settings.js
import { getDB, setDB } from "../storage.js";

export function SettingsPage(container, db, save) {
  const cfg = db.config;

  container.innerHTML = `
    <h2>Configurações</h2>

    <div class="grid cols-3">
      <section class="panel">
        <h3>Pontos</h3>

        <label>Palestra (2 checks: in + out)
          <input id="pt-lecture-full" type="number" min="0" value="${cfg.points.lectureFull}">
        </label>

        <label>Palestra (1 check: in OU out)
          <input id="pt-lecture-single" type="number" min="0" value="${cfg.points.lectureSingle}">
        </label>

        <label>Oficina por dia
          <input id="pt-work" type="number" min="0" value="${cfg.points.workshopPerDay}">
        </label>

        <label>Ideia
          <input id="pt-idea" type="number" min="0" value="${cfg.points.idea}">
        </label>

        <label>Figma
          <input id="pt-figma" type="number" min="0" value="${cfg.points.figma}">
        </label>

        <label>Código+Doc
          <input id="pt-codedoc" type="number" min="0" value="${cfg.points.codeDoc}">
        </label>
      </section>

      <section class="panel">
        <h3>Multiplicadores</h3>
        <label>Salinha padrão
          <input id="mult-salinha" type="number" step="0.05" value="${cfg.multipliers.salinha}">
        </label>
        <label>Salinha (segunda/feriado)
          <input id="mult-salinha-mon" type="number" step="0.05" value="${cfg.multipliers.salinhaMondayHoliday}">
        </label>
        <label>Dificuldade Base
          <input id="diff-base" type="number" step="0.05" value="${cfg.multipliers.difficulty.Base}">
        </label>
        <label>Dificuldade Médio
          <input id="diff-mid" type="number" step="0.05" value="${cfg.multipliers.difficulty['Médio']}">
        </label>
        <label>Dificuldade Difícil
          <input id="diff-hard" type="number" step="0.05" value="${cfg.multipliers.difficulty['Difícil']}">
        </label>
      </section>

      <section class="panel">
        <h3>Janelas e Fechamento</h3>
        <label>Validação DPJ (início)
          <input id="win-start" type="time" value="${cfg.windows.dpjStart}">
        </label>
        <label>Validação DPJ (fim)
          <input id="win-end" type="time" value="${cfg.windows.dpjEnd}">
        </label>
        <label>Cutoff diário (oficina)
          <input id="win-cutoff" type="time" value="${cfg.windows.dayCutoff}">
        </label>
        <label>Segunda (feriado)
          <input id="flag-mon" type="date" value="${cfg.flags.mondayHolidayDate}">
        </label>
        <label>
          <input type="checkbox" id="closing-enabled" ${cfg.closing?.enabled?'checked':''}>
          Bloquear lançamentos
        </label>
        <label>Data/hora de fechamento
          <input id="closing-at" type="datetime-local" value="${cfg.closing?.closeAt || ""}">
        </label>
      </section>
    </div>

    <div class="panel" style="margin-top:16px;">
      <h3>Segurança (DPJ)</h3>
      <div class="grid cols-3" style="max-width:800px;">
        <label>Senha do DPJ
          <input id="sec-dpj" type="password" placeholder="defina ou altere a senha" value="${(db.config.security?.dpjPassword || "")}">
        </label>
        <div class="grid" style="align-items:end;">
          <button id="sec-save" class="ok">Salvar senha</button>
        </div>
        <div class="grid" style="align-items:end;">
          <button id="sec-logout" class="ghost">Encerrar sessão DPJ (esta aba)</button>
        </div>
      </div>
      <span class="help">A senha fica apenas no seu navegador (localStorage). Ao abrir “Validações DPJ”, ela será solicitada.</span>
    </div>

    <hr class="sep"/>

    <div class="grid cols-3">
      <button id="save" class="ok">Salvar configurações</button>
      <button id="reset" class="warn">Reset (manter dados)</button>
      <button id="hardreset" class="bad">Reset Total (apaga TUDO)</button>
    </div>
  `;

  const $ = (q)=> container.querySelector(q);

  /* ----- Salvar config ----- */
  $("#save").onclick = ()=>{
    // Pontos
    cfg.points.lectureFull   = Number($("#pt-lecture-full").value || 0);
    cfg.points.lectureSingle = Number($("#pt-lecture-single").value || 0);
    cfg.points.workshopPerDay= Number($("#pt-work").value || 0);
    cfg.points.idea          = Number($("#pt-idea").value || 0);
    cfg.points.figma         = Number($("#pt-figma").value || 0);
    cfg.points.codeDoc       = Number($("#pt-codedoc").value || 0);

    // Multiplies
    cfg.multipliers.salinha               = Number($("#mult-salinha").value);
    cfg.multipliers.salinhaMondayHoliday  = Number($("#mult-salinha-mon").value);
    cfg.multipliers.difficulty.Base       = Number($("#diff-base").value);
    cfg.multipliers.difficulty["Médio"]   = Number($("#diff-mid").value);
    cfg.multipliers.difficulty["Difícil"] = Number($("#diff-hard").value);

    // Janelas
    cfg.windows.dpjStart   = $("#win-start").value;
    cfg.windows.dpjEnd     = $("#win-end").value;
    cfg.windows.dayCutoff  = $("#win-cutoff").value;
    cfg.flags.mondayHolidayDate = $("#flag-mon").value;

    // Fechamento
    cfg.closing = cfg.closing || {};
    cfg.closing.enabled = $("#closing-enabled").checked;
    cfg.closing.closeAt = $("#closing-at").value;

    db.config = cfg;
    save(db);
    alert("Configurações salvas!");
  };

  /* ----- Reset “soft” e “hard” ----- */
  $("#reset").onclick = ()=>{
    const keep = getDB();
    setDB(keep);
    alert("Config regravada; dados mantidos.");
    location.reload();
  };

  $("#hardreset").onclick = ()=>{
    if (!confirm("Apagar TUDO (inclui usuários e lançamentos)?")) return;
    localStorage.clear();
    location.reload();
  };

  /* ----- Segurança (DPJ) ----- */
  $("#sec-save").onclick = ()=>{
    const v = $("#sec-dpj").value.trim();
    db.config.security = db.config.security || {};
    db.config.security.dpjPassword = v;
    save(db);
    alert("Senha do DPJ salva.");
  };
  $("#sec-logout").onclick = ()=>{
    sessionStorage.removeItem("byron_dpj_auth");
    alert("Sessão DPJ desta aba foi encerrada. Ao abrir “Validações DPJ” vai pedir a senha.");
  };
}
