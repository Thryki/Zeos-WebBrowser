/**
 * auth.js — lógica do formulário de login da extensão.
 *
 * Não fala com o Supabase: só manda zyrex:auth:* pro service worker e reporta
 * o resultado. Nenhum token passa por aqui.
 *
 * Comunicação com quem embute o iframe (o widget) é por postMessage, e só com
 * sinais inofensivos: altura do conteúdo, "fechar", "logou". Quem escuta valida
 * a origem — ver AuthModal.tsx.
 */
(function () {
  "use strict";

  var byId = function (id) { return document.getElementById(id); };

  var root = byId("authRoot");
  var titleEl = byId("title");
  var subtitleEl = byId("subtitle");
  var tabSignin = byId("tabSignin");
  var tabSignup = byId("tabSignup");
  var form = byId("form");
  var nameField = byId("nameField");
  var nameInput = byId("name");
  var emailInput = byId("email");
  var passField = byId("passField");
  var passInput = byId("password");
  var peekBtn = byId("peek");
  var msgEl = byId("msg");
  var submitBtn = byId("submit");
  var forgotBtn = byId("forgot");
  var openSiteBtn = byId("openSite");

  var SITE_URL = "https://dislexfy.com";
  var mode = "signin"; // signin | signup | forgot
  var busy = false;
  // "signed-in" é irreversível e só pode sair UMA vez: o widget troca de tela
  // ao recebê-lo, e um segundo sinal reabriria a confirmação.
  var signaled = false;

  // ---------- ponte com o widget ----------
  function post(type, payload) {
    try {
      window.parent.postMessage(Object.assign({ source: "zyrex-auth", type: type }, payload || {}), "*");
    } catch (_) {}
  }

  // O widget dimensiona o iframe pelo que a gente reporta — sem isto o
  // formulário nasceria cortado ou com sobra de fundo.
  function reportHeight() {
    var h = Math.ceil(root.getBoundingClientRect().height);
    post("height", { height: h });
  }
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(reportHeight).observe(root);
  }
  window.addEventListener("load", reportHeight);

  // ---------- UI ----------
  function setMsg(text, kind) {
    msgEl.textContent = text || "";
    msgEl.classList.toggle("is-error", kind === "error");
    msgEl.classList.toggle("is-ok", kind === "ok");
    reportHeight();
  }

  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? "Aguarde..." : submitLabel();
  }

  function submitLabel() {
    if (mode === "signup") return "Criar conta e entrar";
    if (mode === "forgot") return "Enviar link de recuperação";
    return "Entrar";
  }

  function setMode(next) {
    mode = next;
    var isSignup = mode === "signup";
    var isForgot = mode === "forgot";

    tabSignin.classList.toggle("is-on", !isSignup && !isForgot);
    tabSignin.setAttribute("aria-selected", String(!isSignup && !isForgot));
    tabSignup.classList.toggle("is-on", isSignup);
    tabSignup.setAttribute("aria-selected", String(isSignup));

    nameField.hidden = !isSignup;
    passField.hidden = isForgot;
    passInput.required = !isForgot;
    passInput.setAttribute("autocomplete", isSignup ? "new-password" : "current-password");

    titleEl.textContent = isForgot ? "Recuperar senha" : isSignup ? "Criar sua conta" : "Entrar no Dislexfy";
    subtitleEl.textContent = isForgot
      ? "Enviamos um link para você definir uma nova senha."
      : "Sincronize suas preferências e libere os recursos Pro.";
    forgotBtn.textContent = isForgot ? "Voltar para o login" : "Esqueci minha senha";

    setMsg("");
    submitBtn.textContent = submitLabel();
    reportHeight();
  }

  tabSignin.addEventListener("click", function () { setMode("signin"); });
  tabSignup.addEventListener("click", function () { setMode("signup"); });
  forgotBtn.addEventListener("click", function () { setMode(mode === "forgot" ? "signin" : "forgot"); });

  peekBtn.addEventListener("click", function () {
    var showing = passInput.type === "text";
    passInput.type = showing ? "password" : "text";
    peekBtn.textContent = showing ? "Ver" : "Ocultar";
    peekBtn.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
  });

  // Google/Apple exigem o fluxo OAuth do site (a extensão não hospeda o
  // callback). Abrimos a página de conta numa aba nova; ao voltar, o widget
  // reconsulta o plano.
  openSiteBtn.addEventListener("click", function () {
    try { window.open(SITE_URL + "/conta.html", "_blank", "noopener,noreferrer"); } catch (_) {}
    post("opened-site");
  });

  // ---------- ponte com o service worker ----------
  function send(message) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage(message, function (resp) {
          var err = chrome.runtime.lastError;
          if (err || !resp) {
            // "Receiving end does not exist" = service worker morto (quase
            // sempre extensão desatualizada carregada sem reload completo).
            // A instrução certa vale mais que um "tente de novo" genérico.
            resolve({
              ok: false,
              swDead: true,
              message: "A extensão não respondeu. Abra chrome://extensions, recarregue o Dislexfy e atualize esta página.",
            });
            return;
          }
          resolve(resp);
        });
      } catch (_) {
        resolve({
          ok: false,
          swDead: true,
          message: "A extensão não respondeu. Abra chrome://extensions, recarregue o Dislexfy e atualize esta página.",
        });
      }
    });
  }

  // Health check ANTES de o usuário digitar qualquer coisa: se o service
  // worker está morto, o formulário avisa já na abertura — aceitar e-mail e
  // senha para falhar no submit é a pior versão dessa conversa.
  send({ type: "zyrex:ping" }).then(function (resp) {
    if (resp && resp.ok) return;
    setMsg(resp.message, "error");
    submitBtn.disabled = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;

    var email = emailInput.value.trim();
    if (!email) { setMsg("Informe seu e-mail.", "error"); emailInput.focus(); return; }

    setBusy(true);
    setMsg("");

    var request;
    if (mode === "forgot") {
      request = send({ type: "zyrex:auth:reset", email: email });
    } else if (mode === "signup") {
      request = send({
        type: "zyrex:auth:signup",
        email: email,
        password: passInput.value,
        name: nameInput.value.trim(),
      });
    } else {
      request = send({ type: "zyrex:auth:signin", email: email, password: passInput.value });
    }

    request.then(function (resp) {
      setBusy(false);
      if (!resp.ok) { setMsg(resp.message || "Não foi possível concluir.", "error"); return; }

      if (mode === "forgot") {
        setMsg("Link enviado. Confira sua caixa de entrada.", "ok");
        return;
      }
      if (resp.needsConfirmation) {
        setMsg("Conta criada! Confirme o e-mail que enviamos e depois entre.", "ok");
        setMode("signin");
        return;
      }
      // Logou: limpa a senha da memória do formulário antes de avisar o widget.
      passInput.value = "";
      // Avisa NA HORA. A confirmação visual é um modal próprio do widget
      // (AuthSuccessModal), fora deste iframe — antes ela morava aqui embaixo
      // do formulário e o sinal só saía no clique em "Fechar" (ou 30s depois),
      // o que atrasava o destravamento do Pro pelo mesmo tanto. O nome NÃO
      // viaja no postMessage (evita vazar PII pra página); a saudação vem do
      // widget, que reconfirma a conta com o service worker.
      if (signaled) return;
      signaled = true;
      setBusy(true); // trava o formulário no lugar até o widget trocar de tela
      post("signed-in");
    });
  });

  setMode("signin");
  reportHeight();
  // Autofocus: o modal abriu porque a pessoa quer digitar o e-mail — poupa um
  // clique. setTimeout porque o iframe pode ainda não ter foco do documento.
  setTimeout(function () {
    try { emailInput.focus(); } catch (_) {}
  }, 120);
})();
