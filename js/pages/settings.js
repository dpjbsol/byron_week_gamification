import { getDB, setDB, resetDB } from "../storage.js";

export function SettingsPage(container, db, save) {
  const cfg = db.config;

  container.innerHTML = `
    <h2>Configurações</h2>
    <div class="grid cols-3">
      <section>
        <h3>Pontos</h3>
        <label>Palestra (padrão) <input id="pt-lecture" type="number" value="${cfg.points.lecture}"/></label>
        <label>Palestra (alternativo) <input id="pt-lecture-alt" type="number" value="${cfg.points.lectureAlt}"/></label>
        <label><input type="checkbox" id="flag-lecture-alt" ${cfg.flags.lectureUsesAlt?'checked':''}/> Usar alternativo (35)</label>
        <label>Oficina por dia <input id="pt-work" type="number" value="${cfg.points.workshopPerDay}"/></label>
        <label>Ideia <input id="pt-idea" type="number" value="${cfg.points.idea}"/></label>
        <label>Figma <input id="pt-figma" type="number" value="${cfg.points.figma}"/></label>
        <label>Código+Doc <input id="pt-codedoc" type="number" value="${cfg.points.codeDoc}"/></label>
      </section>

      <section>
        <h3>Multiplicadores</h3>
        <label>Salinha padrão <input id="mult-salinha" type="number" step="0.05" value="${cfg.multipliers.salinha}"/></label>
        <label>Salinha (segunda feriado) <input id="mult-salinha-mon" type="number" step="0.05" value="${cfg.multipliers.salinhaMondayHoliday}"/></label>
        <label>Dificuldade Base <input id="diff-base" type="number" step="0.05" value="${cfg.multipliers.difficulty.Base}"/></label>
        <label>Dificuldade Médio <input id="diff-mid" type="number" step="0.05" value="${cfg.multipliers.difficulty['Médio']}"/></label>
        <label>Dificuldade Difícil <input id="diff-hard" type="number" step="0.05" value="${cfg.multipliers.difficulty['Difícil']}"/></label>
      </section>

      <section>
        <h3>Janelas e Fechamento</h3>
        <label>Validação DPJ (início) <input id="win-start" type="time" value="${cfg.windows.dpjStart}"/></label>
        <label>Validação DPJ (fim) <input id="win-end" type="time" value="${cfg.windows.dpjEnd}"/></label>
        <label>Cutoff diário (oficina) <input id="win-cutoff" type="time" value="${cfg.windows.dayCutoff}"/></label>
        <label>Segunda (feriado) <input id="flag-mon" type="date" value="${cfg.flags.mondayHolidayDate}"/></label>
        <label><input type="checkbox" id="closing-enabled" ${cfg.closing?.enabled?'checked':''}/> Bloquear lançamentos</label>
        <label>Data/hora de fechamento <input id="closing-at" type="datetime-local" value="${cfg.closing?.closeAt || ""}"/></label>
      </section>
    </div>
    <hr class="sep"/>
    <div class="grid cols-3">
      <button id="save" class="ok">Salvar configurações</button>
      <button id="reset" class="warn">Reset (manter dados)</button>
      <button id="hardreset" class="bad">Reset Total (apaga TUDO)</button>
    </div>
  `;

  const $ = (q)=> container.querySelector(q);

  $("#save").onclick = ()=>{
    cfg.points.lecture = Number($("#pt-lecture").value);
    cfg.points.lectureAlt = Number($("#pt-lecture-alt").value);
    cfg.flags.lectureUsesAlt = $("#flag-lecture-alt").checked;
    cfg.points.workshopPerDay = Number($("#pt-work").value);
    cfg.points.idea = Number($("#pt-idea").value);
    cfg.points.figma = Number($("#pt-figma").value);
    cfg.points.codeDoc = Number($("#pt-codedoc").value);

    cfg.multipliers.salinha = Number($("#mult-salinha").value);
    cfg.multipliers.salinhaMondayHoliday = Number($("#mult-salinha-mon").value);
    cfg.multipliers.difficulty.Base = Number($("#diff-base").value);
    cfg.multipliers.difficulty["Médio"] = Number($("#diff-mid").value);
    cfg.multipliers.difficulty["Difícil"] = Number($("#diff-hard").value);

    cfg.windows.dpjStart = $("#win-start").value;
    cfg.windows.dpjEnd = $("#win-end").value;
    cfg.windows.dayCutoff = $("#win-cutoff").value;
    cfg.flags.mondayHolidayDate = $("#flag-mon").value;

    cfg.closing = cfg.closing || {};
    cfg.closing.enabled = $("#closing-enabled").checked;
    cfg.closing.closeAt = $("#closing-at").value;

    db.config = cfg;
    save(db);
    alert("Configurações salvas!");
  };

  $("#reset").onclick = ()=>{
    const keep = getDB();
    setDB(keep); // força normalização simples
    alert("Config regravada; dados mantidos.");
    location.reload();
  };

  $("#hardreset").onclick = ()=>{
    if (!confirm("Apagar TUDO (inclui usuários e lançamentos)?")) return;
    localStorage.clear();
    location.reload();
  };
}
