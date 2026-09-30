/* =====================================================
   VaiComigo - passageiro.js
   Busca de caronas + detalhes + solicitar vaga + avaliação.
   Trabalha com o esquema salvo pelo motorista:
   status="aberta", origem/destino, origemBusca/destinoBusca,
   dataHora (Timestamp), vagasDisponiveis, valor,
   motoristaUid, motoristaNome.
   ===================================================== */

/* ---------- Helpers ---------- */
function pjColViagens() { return (typeof VIAGENS_COLLECTION !== "undefined" && VIAGENS_COLLECTION) ? VIAGENS_COLLECTION : "viagens"; }
function pjColSolic()   { return (typeof SOLICITACOES_COLLECTION !== "undefined" && SOLICITACOES_COLLECTION) ? SOLICITACOES_COLLECTION : "solicitacoes"; }
function pjColAval()    { return (typeof AVALIACOES_COLLECTION !== "undefined" && AVALIACOES_COLLECTION) ? AVALIACOES_COLLECTION : "avaliacoes"; }

function pjEsc(s){ if(s==null) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function pjToast(m,t){ if(typeof mostrarToast==="function"){ mostrarToast(m,t||"info"); } }
function pjMillis(ts){ if(!ts) return 0; if(typeof ts.toMillis==="function") return ts.toMillis(); if(ts.seconds!==undefined) return Number(ts.seconds)*1000; if(ts instanceof Date) return ts.getTime(); return 0; }
function pjNorm(s){ return String(s||"").trim().toLowerCase(); }

function pjPassageiro() {
  if (typeof USUARIO_ATUAL !== "undefined" && USUARIO_ATUAL && USUARIO_ATUAL.uid) {
    return { uid: USUARIO_ATUAL.uid, nome: USUARIO_ATUAL.nome || USUARIO_ATUAL.displayName || "Passageiro" };
  }
  try {
    if (firebase && firebase.auth && firebase.auth().currentUser) {
      var u = firebase.auth().currentUser;
      return { uid: u.uid, nome: u.displayName || "Passageiro" };
    }
  } catch (e) {}
  return null;
}

/* Cache das viagens encontradas (para abrir detalhes) */
var pjViagens = {};

/* ---------- BUSCAR VIAGENS ---------- */
function buscarViagens() {
  var box = document.getElementById("resultados");
  if (!box) return;
  if (typeof db === "undefined" || !db) {
    box.innerHTML = "<p class='vazio'>Conexão com o banco de dados indisponível.</p>";
    return;
  }

  box.innerHTML = "<p class='vazio'>🔄 Buscando caronas...</p>";

  var fOrigem  = pjNorm(document.getElementById("f-origem")  ? document.getElementById("f-origem").value  : "");
  var fDestino = pjNorm(document.getElementById("f-destino") ? document.getElementById("f-destino").value : "");
  var fData    = document.getElementById("f-data")    ? document.getElementById("f-data").value    : "";
  var fVagas   = Number(document.getElementById("f-vagas") ? document.getElementById("f-vagas").value : 1) || 1;
  var fValorEl = document.getElementById("f-valor");
  var fValor   = (fValorEl && fValorEl.value !== "") ? Number(fValorEl.value) : null;

  db.collection(pjColViagens())
    .where("status", "==", "aberta")
    .get()
    .then(function (snap) {
      var lista = [];
      pjViagens = {};

      snap.forEach(function (doc) {
        var v = doc.data();
        v.id = doc.id;

        var ob = pjNorm(v.origemBusca || v.origem);
        var dbs = pjNorm(v.destinoBusca || v.destino);

        /* filtros no cliente */
        if (fOrigem  && ob.indexOf(fOrigem)     === -1) return;
        if (fDestino && dbs.indexOf(fDestino) === -1) return;

        if (fData) {
          var ms = pjMillis(v.dataHora);
          if (ms) {
            var dv = new Date(ms);
            var y = dv.getFullYear();
            var m = ("0" + (dv.getMonth() + 1)).slice(-2);
            var d = ("0" + dv.getDate()).slice(-2);
            if ((y + "-" + m + "-" + d) !== fData) return;
          }
        }

        if (Number(v.vagasDisponiveis || 0) < fVagas) return;
        if (fValor !== null && Number(v.valor || 0) > fValor) return;

        lista.push(v);
        pjViagens[v.id] = v;
      });

      lista.sort(function (a, b) { return pjMillis(a.dataHora) - pjMillis(b.dataHora); });
      renderResultados(lista);
    })
    .catch(function (erro) {
      console.error("Erro ao buscar viagens:", erro);
      if (erro && erro.code === "permission-denied") {
        box.innerHTML = "<p class='vazio'>❌ As regras do Firestore bloquearam a leitura das viagens.</p>";
      } else {
        box.innerHTML = "<p class='vazio'>❌ Erro ao buscar caronas.<br><small>" + pjEsc(erro.message || "") + "</small></p>";
      }
    });
}

/* ---------- RENDER RESULTADOS ---------- */
function renderResultados(lista) {
  var box = document.getElementById("resultados");
  if (!box) return;

  if (!lista.length) {
    box.innerHTML = "<p class='vazio'>Nenhuma carona encontrada para esses filtros.</p>";
    return;
  }

  var html = "";
  lista.forEach(function (v) {
    var dt = pjMillis(v.dataHora) ? new Date(pjMillis(v.dataHora)) : null;
    var dataTxt = dt
      ? dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "-";
    var valor = Number(v.valor || 0);
    var valorTxt = valor > 0 ? "R$ " + valor.toFixed(2).replace(".", ",") : "Grátis";

    html += "<div class='card'>" +
      "<h3 style='margin-bottom:6px'>" + pjEsc(v.origem || "-") + " → " + pjEsc(v.destino || "-") + "</h3>" +
      "<p class='meta'>👤 " + pjEsc(v.motoristaNome || "Motorista") + "</p>" +
      "<p style='margin-top:8px'>🗓️ " + dataTxt + "</p>" +
      "<p>💺 " + Number(v.vagasDisponiveis || 0) + " vaga(s) · 💰 " + valorTxt + "</p>" +
      "<button type='button' class='btn block' style='margin-top:12px' onclick=\"abrirDetalhesPassageiro('" + pjEsc(v.id) + "')\">Ver detalhes</button>" +
    "</div>";
  });

  box.innerHTML = html;
}

/* ---------- LIMPAR FILTROS ---------- */
function limparFiltrosPassageiro() {
  ["f-origem","f-destino","f-data","f-valor"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  var vg = document.getElementById("f-vagas");
  if (vg) vg.value = "1";
  buscarViagens();
}

/* ---------- DETALHES DA VIAGEM ---------- */
function abrirDetalhesPassageiro(viagemId) {
  var v = pjViagens[viagemId];
  var alvo = document.getElementById("det-conteudo");
  var modal = document.getElementById("modal-det");
  if (!v || !alvo || !modal) return;

  // Armazena também a viagem atual para fins de avaliação futura se necessário
  window.pjViagemAtualSelecionada = viagemId;

  var dt = pjMillis(v.dataHora) ? new Date(pjMillis(v.dataHora)) : null;
  var dataTxt = dt
    ? dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "-";
  var valor = Number(v.valor || 0);
  var valorTxt = valor > 0 ? "R$ " + valor.toFixed(2).replace(".", ",") : "Grátis";

  var html = "<h3>" + pjEsc(v.origem || "-") + " → " + pjEsc(v.destino || "-") + "</h3>" +
    "<p class='meta'>👤 Motorista: " + pjEsc(v.motoristaNome || "Motorista") + "</p>" +
    "<p style='margin-top:8px'>🗓️ <strong>" + dataTxt + "</strong></p>" +
    "<p>💺 " + Number(v.vagasDisponiveis || 0) + " vaga(s) · 💰 " + valorTxt + "</p>";

  if (v.rota)        html += "<p style='margin-top:8px'>🛣️️ Rota: " + pjEsc(v.rota) + "</p>";
  if (v.regras)      html += "<p>📌 Regras: " + pjEsc(v.regras) + "</p>";
  if (v.observacoes) html += "<p>📝 Obs.: " + pjEsc(v.observacoes) + "</p>";

  html += "<div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:14px'>" +
    "<button type='button' class='btn verde' onclick=\"solicitarVaga('" + pjEsc(v.id) + "')\">✅ Solicitar vaga</button>" +
    "<button type='button' class='btn' onclick=\"acompanharViagem('" + pjEsc(v.id) + "')\">📍 Acompanhar motorista</button>" +
  "</div>";

  alvo.innerHTML = html;

  /* esconde rastreamento até o passageiro clicar em acompanhar */
  var rast = document.getElementById("rastreamento-passageiro");
  if (rast) rast.style.display = "none";

  modal.classList.add("aberto");
  modal.style.display = "flex";
}

function fecharDetalhesPassageiro() {
  var modal = document.getElementById("modal-det");
  if (modal) { modal.classList.remove("aberto"); modal.style.display = "none"; }
  if (typeof pararRastreamentoPassageiro === "function") pararRastreamentoPassageiro();
}

/* ---------- SOLICITAR VAGA ---------- */
function solicitarVaga(viagemId) {
  var v = pjViagens[viagemId];
  if (!v) return;

  var pax = pjPassageiro();
  if (!pax) { pjToast("Faça login para solicitar uma vaga.", "err"); return; }

  db.collection(pjColSolic())
    .where("viagemId", "==", viagemId)
    .where("passageiroUid", "==", pax.uid)
    .get()
    .then(function (snap) {
      if (!snap.empty) {
        pjToast("Você já solicitou vaga nesta viagem.", "info");
        return null;
      }
      return db.collection(pjColSolic()).add({
        viagemId: viagemId,
        viagemOrigem: v.origem || "",
        viagemDestino: v.destino || "",
        dataHora: v.dataHora || null,
        motoristaUid: v.motoristaUid || "",
        motoristaNome: v.motoristaNome || "",
        passageiroUid: pax.uid,
        passageiroNome: pax.nome,
        status: "pendente",
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(function (res) {
      if (res) {
        pjToast("✅ Solicitação enviada ao motorista!", "ok");
        fecharDetalhesPassageiro();
      }
    })
    .catch(function (erro) {
      console.error("Erro ao solicitar vaga:", erro);
      if (erro && erro.code === "permission-denied") {
        pjToast("As regras do Firestore bloquearam a solicitação.", "err");
      } else {
        pjToast("Não foi possível enviar a solicitação.", "err");
      }
    });
}

/* ---------- ACOMPANHAR VIAGEM (PASSAGEIRO) ---------- */
function acompanharViagem(viagemId) {
    if (!viagemId) {
        // Se por acaso o ID vier vazio, tenta buscar do objeto global ou da seleção ativa
        if (typeof window.pjViagemAtualSelecionada !== "undefined") {
            viagemId = window.pjViagemAtualSelecionada;
        } else if (typeof pjViagens !== "undefined") {
            var chaves = Object.keys(pjViagens);
            if (chaves.length > 0) {
                viagemId = chaves[0]; // Pega a primeira viagem em cache como segurança
            }
        }
    }

    if (!viagemId) {
        pjToast("ID da viagem inválido ou não encontrado.", "err");
        console.error("Erro: Tentativa de acompanhar viagem sem ID.");
        return;
    }
    
    // Redireciona o passageiro para a tela de acompanhamento passando o ID exato da viagem na URL
    window.location.href = "acompanhamento.html?id=" + viagemId;
}

/* ---------- AVALIAÇÃO ---------- */
var pjNotaAval = 0;
var pjViagemAval = null;

function selecionarEstrela(n) {
  pjNotaAval = Number(n) || 0;
  var estrelas = document.querySelectorAll("#estrelas span");
  estrelas.forEach(function (el) {
    var val = Number(el.getAttribute("data-n"));
    if (val <= pjNotaAval) el.classList.add("ativo");
    else el.classList.remove("ativo");
  });
}

function enviarAvaliacao() {
  var pax = pjPassageiro();
  if (!pax) { pjToast("Faça login para avaliar.", "err"); return; }
  if (pjNotaAval < 1) { pjToast("Escolha uma nota de 1 a 5 estrelas.", "err"); return; }

  var coment = document.getElementById("aval-coment") ? document.getElementById("aval-coment").value.trim() : "";

  db.collection(pjColAval()).add({
    viagemId: pjViagemAval || window.pjViagemAtualSelecionada || null,
    passageiroUid: pax.uid,
    passageiroNome: pax.nome,
    nota: pjNotaAval,
    comentario: coment,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function () {
    pjToast("⭐ Avaliação enviada. Obrigado!", "ok");
    pjNotaAval = 0;
    if (typeof fecharModal === "function") fecharModal("modal-aval");
    var el = document.getElementById("aval-coment"); if (el) el.value = "";
  }).catch(function (erro) {
    console.error("Erro ao enviar avaliação:", erro);
    pjToast("Não foi possível enviar a avaliação.", "err");
  });
}

/* ---------- CARGA INICIAL ---------- */
(function () {
  function tentar() {
    if (typeof db !== "undefined" && db && document.getElementById("resultados")) {
      buscarViagens();
      return true;
    }
    return false;
  }
  function loop() {
    var n = 0;
    var iv = setInterval(function () {
      n++;
      if (tentar() || n >= 20) clearInterval(iv);
    }, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loop);
  else loop();
})();

/* Expor no escopo global */
window.buscarViagens = buscarViagens;
window.limparFiltrosPassageiro = limparFiltrosPassageiro;
window.abrirDetalhesPassageiro = abrirDetalhesPassageiro;
window.fecharDetalhesPassageiro = fecharDetalhesPassageiro;
window.solicitarVaga = solicitarVaga;
window.selecionarEstrela = selecionarEstrela;
window.enviarAvaliacao = enviarAvaliacao;
window.acompanharViagem = acompanharViagem;