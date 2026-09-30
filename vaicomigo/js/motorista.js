/* =====================================================
   VIAGENS-MOTORISTA.JS  (VaiComigo)
   Lista "Minhas viagens" em tempo real + Excluir viagem.
   Gerenciamento de solicitações corrigido e integrado.
   Início de Viagem e Transmissão de GPS em tempo real.
   ===================================================== */

function vmObterMotorista() {
  if (typeof USUARIO_ATUAL !== "undefined" && USUARIO_ATUAL && USUARIO_ATUAL.uid) {
    return { uid: USUARIO_ATUAL.uid, nome: USUARIO_ATUAL.nome || USUARIO_ATUAL.displayName || "Motorista" };
  }
  try {
    if (firebase && firebase.auth && firebase.auth().currentUser) {
      var u = firebase.auth().currentUser;
      return { uid: u.uid, nome: u.displayName || "Motorista" };
    }
  } catch (e) {}
  return null;
}
function vmColViagens() { return (typeof VIAGENS_COLLECTION !== "undefined" && VIAGENS_COLLECTION) ? VIAGENS_COLLECTION : "viagens"; }
function vmColSolic() { return (typeof SOLICITACOES_COLLECTION !== "undefined" && SOLICITACOES_COLLECTION) ? SOLICITACOES_COLLECTION : "solicitacoes"; }
function vmEsc(s){ if(s==null) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function vmToast(m,t){ if(typeof mostrarToast==="function"){mostrarToast(m,t||"info");} else { alert(m); } }
function vmMillis(ts){ if(!ts) return 0; if(typeof ts.toMillis==="function") return ts.toMillis(); if(ts.seconds!==undefined) return Number(ts.seconds)*1000; if(ts instanceof Date) return ts.getTime(); return 0; }

var vmListenerViagens = null;

function carregarMinhasViagens() {
  var box = document.getElementById("minhas-viagens");
  if (!box) return;
  if (typeof db === "undefined" || !db) return;
  var mot = vmObterMotorista();
  if (!mot) return;

  if (vmListenerViagens) { vmListenerViagens(); vmListenerViagens = null; }

  vmListenerViagens = db.collection(vmColViagens())
    .where("motoristaUid", "==", mot.uid)
    .onSnapshot(function (snap) {
      var viagens = [];
      snap.forEach(function (doc) { var d = doc.data(); d.id = doc.id; viagens.push(d); });
      viagens.sort(function (a, b) { return vmMillis(a.dataHora) - vmMillis(b.dataHora); });
      renderMinhasViagens(viagens);
    }, function (erro) {
      console.error("Erro ao carregar minhas viagens:", erro);
      box.innerHTML = "<p class='vazio'>❌ Erro ao carregar suas viagens.<br><small>" + vmEsc(erro.message || "") + "</small></p>";
    });
}

function renderMinhasViagens(viagens) {
  var box = document.getElementById("minhas-viagens");
  if (!box) return;

  if (!viagens.length) {
    box.innerHTML = "<p class='vazio'>Você ainda não publicou nenhuma viagem.</p>";
    return;
  }

  var html = "<table><thead><tr>" +
    "<th>Origem → Destino</th><th>Data</th><th>Vagas</th><th>Valor</th><th>Status</th><th>Ações</th>" +
    "</tr></thead><tbody>";

  viagens.forEach(function (v) {
    var dt = vmMillis(v.dataHora) ? new Date(vmMillis(v.dataHora)) : null;
    var dataTxt = dt
      ? dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "-";
    var valor = Number(v.valor || 0);
    var valorTxt = valor > 0 ? "R$ " + valor.toFixed(2).replace(".", ",") : "Grátis";
    var statusAtual = v.status || "aberta";

    html += "<tr>" +
      "<td>" + vmEsc(v.origem || "-") + " → " + vmEsc(v.destino || "-") + "</td>" +
      "<td>" + dataTxt + "</td>" +
      "<td>" + Number(v.vagasDisponiveis || 0) + "</td>" +
      "<td>" + valorTxt + "</td>" +
      "<td>" + vmEsc(statusAtual) + "</td>" +
      "<td>" +
        "<button type='button' class='btn' onclick=\"verSolicitacoes('" + vmEsc(v.id) + "')\">👥 Solicitações</button> ";
        
    if (statusAtual === "em_andamento") {
        html += "<button type='button' class='btn' style='background:#dc3545; color:white;' onclick=\"encerrarViagem('" + vmEsc(v.id) + "')\">⏹️ Encerrar</button> ";
    } else {
        html += "<button type='button' class='btn' style='background:#28a745; color:white;' onclick=\"iniciarViagemEGPS('" + vmEsc(v.id) + "')\">🚀 Iniciar Viagem</button> ";
    }

    html += "<button type='button' class='btn btn-vermelho' onclick=\"excluirViagem('" + vmEsc(v.id) + "')\">🗑️ Excluir</button>" +
      "</td>" +
    "</tr>";
  });

  html += "</tbody></table>";
  box.innerHTML = html;
}

function excluirViagem(viagemId) {
  if (!viagemId) return;
  var mot = vmObterMotorista();
  if (!mot) { vmToast("Faça login como motorista.", "err"); return; }

  if (!window.confirm("Deseja realmente excluir esta viagem? As solicitações dela também serão removidas.")) return;

  var refViagem = db.collection(vmColViagens()).doc(viagemId);

  db.collection(vmColSolic()).where("viagemId", "==", viagemId).get()
    .then(function (snap) {
      var batch = db.batch();
      snap.forEach(function (doc) { batch.delete(doc.ref); });
      batch.delete(refViagem);
      return batch.commit();
    })
    .then(function () { vmToast("🗑️ Viagem excluída com sucesso.", "ok"); })
    .catch(function (erro) {
      console.error("Erro ao excluir viagem:", erro);
      vmToast("Não foi possível excluir a viagem.", "err");
    });
}

/* Criar Viagem */
if (typeof window.criarViagem !== "function") {
  window.criarViagem = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var mot = vmObterMotorista();
    if (!mot) { vmToast("Faça login como motorista.", "err"); return; }

    var origem = (document.getElementById("t-origem").value || "").trim();
    var destino = (document.getElementById("t-destino").value || "").trim();
    var dataStr = document.getElementById("t-data").value;
    var horaStr = document.getElementById("t-hora").value;
    var vagas = Number(document.getElementById("t-vagas").value || 0);
    var valor = Number(document.getElementById("t-valor").value || 0);
    var rota = document.getElementById("t-rota") ? (document.getElementById("t-rota").value || "").trim() : "";
    var regras = document.getElementById("t-regras") ? (document.getElementById("t-regras").value || "").trim() : "";
    var obs = document.getElementById("t-obs") ? (document.getElementById("t-obs").value || "").trim() : "";

    if (!origem || !destino || !dataStr || !horaStr || vagas <= 0) {
      vmToast("Preencha origem, destino, data, horário e vagas.", "err");
      return;
    }

    var quando = new Date(dataStr + "T" + horaStr + ":00");

    db.collection(vmColViagens()).add({
      origem: origem,
      destino: destino,
      origemBusca: origem.toLowerCase(),
      destinoBusca: destino.toLowerCase(),
      dataHora: firebase.firestore.Timestamp.fromDate(quando),
      vagasDisponiveis: vagas,
      vagas: vagas,
      valor: valor,
      rota: rota,
      regras: regras,
      observacoes: obs,
      status: "aberta",
      motoristaUid: mot.uid,
      motoristaNome: mot.nome,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      vmToast("🚗 Viagem publicada!", "ok");
      if (e && e.target && e.target.reset) e.target.reset();
    }).catch(function (erro) {
      console.error("Erro ao criar viagem:", erro);
      vmToast("Não foi possível publicar a viagem.", "err");
    });
  };
}

/* Salvar Veículo */
if (typeof window.salvarVeiculo !== "function") {
  window.salvarVeiculo = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var mot = vmObterMotorista();
    if (!mot) { vmToast("Faça login como motorista.", "err"); return; }

    var col = (typeof VEICULOS_COLLECTION !== "undefined" && VEICULOS_COLLECTION) ? VEICULOS_COLLECTION : "veiculos";

    db.collection(col).doc(mot.uid).set({
      modelo: (document.getElementById("v-modelo").value || "").trim(),
      cor: (document.getElementById("v-cor").value || "").trim(),
      placa: (document.getElementById("v-placa").value || "").trim().toUpperCase(),
      lugares: Number(document.getElementById("v-lugares").value || 0),
      motoristaUid: mot.uid,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function () {
      vmToast("💾 Veículo salvo!", "ok");
    }).catch(function (erro) {
      console.error("Erro ao salvar veículo:", erro);
      vmToast("Não foi possível salvar o veículo.", "err");
    });
  };
}

/* =====================================================
   COMPARTILHAMENTO DE LOCALIZAÇÃO E INÍCIO DA VIAGEM
   ===================================================== */
var vmWatchId = null;

window.iniciarViagemEGPS = function (viagemId) {
    if (!navigator.geolocation) {
        vmToast("Seu navegador não suporta geolocalização.", "err");
        return;
    }

    if (!viagemId) {
        vmToast("ID da viagem inválido.", "err");
        return;
    }

    vmToast("🚀 Iniciando viagem e ativando GPS...", "info");

    if (vmWatchId !== null) {
        navigator.geolocation.clearWatch(vmWatchId);
    }

    // Pega a posição inicial, atualiza o status para "em_andamento" e salva as coordenadas
    navigator.geolocation.getCurrentPosition(function (position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;

        db.collection(vmColViagens()).doc(viagemId).update({
            status: "em_andamento",
            "localizacaoAtual.latitude": lat,
            "localizacaoAtual.longitude": lng,
            "localizacaoAtual.atualizadoEm": firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            vmToast("✅ Viagem iniciada! Os passageiros já podem te acompanhar.", "ok");
        }).catch(function (err) {
            console.error("Erro ao iniciar viagem no Firestore:", err);
            vmToast("Erro ao atualizar status da viagem.", "err");
        });
    }, function (err) {
        console.error("Erro GPS:", err);
        vmToast("Permissão de localização negada ou indisponível.", "err");
    }, { enableHighAccuracy: true });

    // Monitora o movimento em tempo real e atualiza no banco
    vmWatchId = navigator.geolocation.watchPosition(
        function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

            db.collection(vmColViagens()).doc(viagemId).update({
                "localizacaoAtual.latitude": lat,
                "localizacaoAtual.longitude": lng,
                "localizacaoAtual.atualizadoEm": firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function (err) {
                console.error("Erro ao atualizar GPS:", err);
            });
        },
        function (error) {
            console.error("Erro watchPosition:", error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 5000
        }
    );
};

window.encerrarViagem = function (viagemId) {
    if (!viagemId) return;
    if (!window.confirm("Deseja encerrar esta viagem?")) return;

    if (vmWatchId !== null) {
        navigator.geolocation.clearWatch(vmWatchId);
        vmWatchId = null;
    }

    db.collection(vmColViagens()).doc(viagemId).update({
        status: "concluida"
    }).then(function () {
        vmToast("🏁 Viagem encerrada com sucesso!", "ok");
    }).catch(function (err) {
        console.error("Erro ao encerrar viagem:", err);
        vmToast("Erro ao encerrar viagem.", "err");
    });
};

/* =====================================================
   PAINEL DE SOLICITAÇÕES DO MOTORISTA
   ===================================================== */
function verSolicitacoes(viagemId) {
    if (!viagemId || typeof db === "undefined" || !db) return;

    db.collection(vmColSolic())
      .where("viagemId", "==", viagemId)
      .get()
      .then(function (snap) {
          var solicitacoes = [];
          snap.forEach(function (doc) {
              var d = doc.data();
              d.id = doc.id;
              solicitacoes.push(d);
          });
          renderPainelSolicitacoes(viagemId, solicitacoes);
      })
      .catch(function (erro) {
          console.error("Erro ao carregar solicitações:", erro);
          vmToast("Erro ao carregar solicitações.", "err");
      });
}

function renderPainelSolicitacoes(viagemId, solicitacoes) {
    var containerId = "painel-solicitacoes-modal";
    var painel = document.getElementById(containerId);

    if (!painel) {
        painel = document.createElement("div");
        painel.id = containerId;
        painel.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999;";
        document.body.appendChild(painel);
    }

    var htmlConteudo = `
        <div style="background:white; padding:25px; border-radius:10px; width:90%; max-width:600px; max-height:80vh; overflow-y:auto; box-shadow:0 4px 15px rgba(0,0,0,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0;">Gerenciar Solicitações</h3>
                <button type="button" onclick="fecharPainelSolicitacoes()" style="background:none; border:none; font-size:18px; cursor:pointer;">❌</button>
            </div>
    `;

    if (solicitacoes.length === 0) {
        htmlConteudo += "<p style='color:#666;'>Nenhum passageiro solicitou vaga nesta viagem ainda.</p>";
    } else {
        htmlConteudo += "<table style='width:100%; border-collapse:collapse;'><thead><tr style='border-bottom:1px solid #ddd; text-align:left;'><th>Passageiro</th><th>Status</th><th>Ações</th></tr></thead><tbody>";
        
        solicitacoes.forEach(function (s) {
            var statusBadge = s.status || "pendente";
            var corStatus = statusBadge === "aceito" ? "green" : (statusBadge === "recusado" ? "red" : "orange");

            htmlConteudo += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${vmEsc(s.passageiroNome || "Passageiro")}</td>
                <td style="padding:10px; color:${corStatus}; font-weight:bold;">${vmEsc(statusBadge)}</td>
                <td style="padding:10px;">`;
            
            if (statusBadge === "pendente") {
                htmlConteudo += `
                    <button type="button" onclick="responderSolicitacao('${s.id}', 'aceito', '${viagemId}')" style="background:green; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;">Aceitar</button>
                    <button type="button" onclick="responderSolicitacao('${s.id}', 'recusado', '${viagemId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Recusar</button>
                `;
            } else {
                htmlConteudo += `<span style="font-size:12px; color:#888;">${statusBadge.toUpperCase()}</span>`;
            }

            htmlConteudo += `</td></tr>`;
        });

        htmlConteudo += "</tbody></table>";
    }

    htmlConteudo += `</div>`;
    painel.innerHTML = htmlConteudo;
    painel.style.display = "flex";
}

window.fecharPainelSolicitacoes = function () {
    var painel = document.getElementById("painel-solicitacoes-modal");
    if (painel) {
        painel.style.display = "none";
    }
};

window.responderSolicitacao = function (solicitacaoId, novoStatus, viagemId) {
    if (!solicitacaoId) return;

    db.collection(vmColSolic()).doc(solicitacaoId).update({
        status: novoStatus,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function () {
        vmToast("Solicitação " + (novoStatus === "aceito" ? "aceita" : "recusada") + " com sucesso!", "ok");
        verSolicitacoes(viagemId);
    })
    .catch(function (erro) {
        console.error("Erro ao atualizar solicitação:", erro);
        vmToast("Erro ao processar solicitação.", "err");
    });
};

(function () {
  function tentar() {
    if (vmObterMotorista() && typeof db !== "undefined" && db) {
      carregarMinhasViagens();
      return true;
    }
    return false;
  }
  function loop() {
    var n = 0;
    var iv = setInterval(function () {
      n++;
      if (tentar() || n >= 20) { clearInterval(iv); }
    }, 500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loop);
  } else {
    loop();
  }
})();

window.carregarMinhasViagens = carregarMinhasViagens;
window.excluirViagem = excluirViagem;
window.verSolicitacoes = verSolicitacoes;