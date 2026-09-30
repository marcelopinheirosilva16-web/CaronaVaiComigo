// ======================================================
// ACOMPANHAMENTO.JS
// VAI COMIGO - Rastreamento em Tempo Real com Leaflet
// ======================================================

var mapaAcompanhamento = null;
var marcadorMotorista = null;
var unsubscribeViagem = null;

// ======================================================
// INICIALIZAÇÃO AUTOMÁTICA AO CARREGAR A PÁGINA
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
    // 1. Pega o ID da viagem passado na URL (ex: acompanhamento.html?id=SEU_ID)
    const urlParams = new URLSearchParams(window.location.search);
    const viagemId = urlParams.get('id');

    const statusBox = document.getElementById("status-viagem");

    if (!statusBox) return;

    if (!viagemId) {
        statusBox.innerHTML = "❌ Erro: Nenhum ID de viagem fornecido para acompanhamento.";
        return;
    }

    // 2. Inicia o rastreamento em tempo real
    iniciarAcompanhamentoUsuario(viagemId);
});

// ======================================================
// FUNÇÃO DE RASTREAMENTO EM TEMPO REAL
// ======================================================
function iniciarAcompanhamentoUsuario(viagemId) {
    var statusBox = document.getElementById("status-viagem");
    
    if (!statusBox) return;

    if (typeof db === "undefined" || !db) {
        statusBox.innerHTML = "❌ Erro: Banco de dados não inicializado.";
        return;
    }

    statusBox.innerHTML = "🔄 Conectando ao rastreamento da viagem...";

    var nomeColecao = (typeof VIAGENS_COLLECTION !== "undefined" && VIAGENS_COLLECTION) ? VIAGENS_COLLECTION : "viagens";

    // 1. Inicializa o Mapa Leaflet caso ainda não exista
    if (!mapaAcompanhamento) {
        // Coordenadas centrais padrão (caso o motorista ainda não tenha enviado GPS)
        mapaAcompanhamento = L.map('mapa-acompanhamento').setView([-18.5122, -42.5552], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapaAcompanhamento);
    }

    // 2. Ouve em tempo real as mudanças no documento da viagem no Firestore
    if (unsubscribeViagem) {
        unsubscribeViagem(); // Evita múltiplos listeners duplicados
    }

    unsubscribeViagem = db.collection(nomeColecao).doc(viagemId).onSnapshot(function (doc) {
        if (!doc.exists) {
            statusBox.innerHTML = "❌ Esta viagem não foi encontrada ou foi encerrada.";
            return;
        }

        var dados = doc.data();
        var origem = dados.origem || "-";
        var destino = dados.destino || "-";
        var motorista = dados.motoristaNome || "Motorista";
        var status = dados.status || "em andamento";

        // Atualiza a caixinha de status visual
        statusBox.innerHTML = 
            "🚗 <strong>Trajeto:</strong> " + escapeHtmlAcomp(origem) + " &rarr; " + escapeHtmlAcomp(destino) + "<br>" +
            "👤 <strong>Motorista:</strong> " + escapeHtmlAcomp(motorista) + "<br>" +
            "📌 <strong>Status:</strong> <span style='text-transform: uppercase; color: #1565c0;'>" + escapeHtmlAcomp(status) + "</span>";

        // Verifica se o motorista enviou coordenadas de GPS recentes
        if (dados.localizacaoAtual && typeof dados.localizacaoAtual.latitude === "number" && typeof dados.localizacaoAtual.longitude === "number") {
            var lat = dados.localizacaoAtual.latitude;
            var lng = dados.localizacaoAtual.longitude;

            var novaPosicao = [lat, lng];

            if (!marcadorMotorista) {
                // Cria o marcador do motorista se ele não existir no mapa
                marcadorMotorista = L.marker(novaPosicao).addTo(mapaAcompanhamento)
                    .bindPopup("<b>" + escapeHtmlAcomp(motorista) + "</b><br>Localização atualizada em tempo real.").openPopup();
            } else {
                // Atualiza a posição do marcador existente
                marcadorMotorista.setLatLng(novaPosicao);
            }

            // Centraliza o mapa na posição atual do motorista
            mapaAcompanhamento.setView(novaPosicao, 15);
        } else {
            // Se o motorista ainda não mandou o GPS
            if (marcadorMotorista) {
                mapaAcompanhamento.removeLayer(marcadorMotorista);
                marcadorMotorista = null;
            }
        }

    }, function (erro) {
        console.error("Erro no monitoramento em tempo real:", erro);
        statusBox.innerHTML = "❌ Erro ao sincronizar a viagem em tempo real.";
    });
}

// ======================================================
// PARAR RASTREAMENTO (Se sair da página)
// ======================================================
function pararRastreamentoPassageiro() {
    if (unsubscribeViagem) {
        unsubscribeViagem();
        unsubscribeViagem = null;
    }
}

// ======================================================
// ESCAPAR TEXTO COM SEGURANÇA
// ======================================================
function escapeHtmlAcomp(valor) {
    if (valor === null || typeof valor === "undefined") {
        return "";
    }
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Expõe as funções globalmente
window.iniciarAcompanhamentoUsuario = iniciarAcompanhamentoUsuario;
window.pararRastreamentoPassageiro = pararRastreamentoPassageiro;