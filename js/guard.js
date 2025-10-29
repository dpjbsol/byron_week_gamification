// js/guard.js
// Guard de acesso para rotas protegidas (DPJ / Auditoria / Configurações)
export function ensureDpjAccess(db, save, container) {
  if (sessionStorage.getItem("byron_dpj_auth") === "1") return true;

  const pwdSaved = db?.config?.security?.dpjPassword || "";
  let secret = pwdSaved;

  if (!secret) {
    if (!confirm("Nenhuma senha do DPJ está definida.\nDeseja definir agora?")) {
      renderDenied(container);
      return false;
    }
    const set = prompt("Defina uma senha para o DPJ:");
    if (!set) { renderDenied(container); return false; }
    db.config = db.config || {};
    db.config.security = db.config.security || {};
    db.config.security.dpjPassword = set;
    save(db);
    secret = set;
    alert("Senha do DPJ definida. Guarde-a com o responsável.");
  }

  const entered = prompt("Senha do DPJ:");
  if (entered === secret) {
    sessionStorage.setItem("byron_dpj_auth", "1");
    return true;
  }

  alert("Senha incorreta.");
  renderDenied(container);
  return false;

  function renderDenied(containerEl){
    containerEl.innerHTML = `
      <div class="panel">
        <h2>Acesso restrito • DPJ</h2>
        <p class="help">Você precisa da senha do DPJ para continuar.</p>
        <div class="grid cols-2" style="max-width:460px;">
          <button id="retry" class="ok">Tentar novamente</button>
          <button id="back" class="ghost">Voltar</button>
        </div>
      </div>`;
    const $ = (q)=> containerEl.querySelector(q);
    $("#retry").onclick = () => {
      sessionStorage.removeItem("byron_dpj_auth");
      location.reload(); // reexecuta o guard ao recarregar a rota atual
    };
    $("#back").onclick = () => history.back();
  }
}
