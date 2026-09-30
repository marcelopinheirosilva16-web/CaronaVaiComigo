/* =====================================================
   VaiComigo - Rastreamento do Passageiro
   ===================================================== */

var mapaPassageiro = null;
var marcadorMotoristaPassageiro = null;
var listenerRastreamento = null;
var viagemRastreadaId = null;


/* =====================================================
   ACOMPANHAR VIAGEM
   ===================================================== */

function acompanharViagem(viagemId) {

  if (!viagemId) {
    console.error("ID da viagem não informado.");
    return;
  }

  pararRastreamentoPassageiro();

  viagemRastreadaId = viagemId;

  var area =
    document.getElementById("rastreamento-passageiro");

  var info =
    document.getElementById("rastreamento-info");

  if (area) {
    area.style.display = "block";
  }

  if (info) {
    info.innerHTML =
      "🟡 Conectando ao rastreamento da viagem...";
  }


  /*
   * Escuta a viagem em tempo real.
   */

  listenerRastreamento =
    db.collection(VIAGENS_COLLECTION)
      .doc(viagemId)
      .onSnapshot(

        function (doc) {

          if (!doc.exists) {

            if (info) {
              info.innerHTML =
                "❌ Esta viagem não foi encontrada.";
            }

            return;
          }


          var viagem =
            doc.data();


          atualizarInformacoesRastreamento(
            viagem
          );


          /*
           * Verifica se o motorista
           * possui localização.
           */

          if (
            typeof viagem.latitudeMotorista === "number" &&
            typeof viagem.longitudeMotorista === "number"
          ) {

            atualizarMapaPassageiro(
              viagem.latitudeMotorista,
              viagem.longitudeMotorista
            );

          }

        },

        function (erro) {

          console.error(
            "Erro no rastreamento:",
            erro
          );

          if (info) {

            info.innerHTML =
              "❌ Não foi possível acompanhar o motorista.";

          }

        }

      );

}


/* =====================================================
   INFORMAÇÕES DO RASTREAMENTO
   ===================================================== */

function atualizarInformacoesRastreamento(
  viagem
) {

  var info =
    document.getElementById(
      "rastreamento-info"
    );


  if (!info) {
    return;
  }


  var status =
    viagem.status || "aberta";


  var html = "";


  /*
   * VIAGEM CANCELADA
   */

  if (status === "cancelada") {

    html +=
      "<div style='" +
      "padding:12px;" +
      "border-radius:10px;" +
      "background:#ffebee;" +
      "color:#c62828;" +
      "border:1px solid #ef9a9a;" +
      "'>" +

      "❌ <strong>Viagem cancelada</strong><br>" +

      "<span style='font-size:13px'>" +
      "O motorista cancelou esta viagem." +
      "</span>" +

      "</div>";

    info.innerHTML = html;

    return;
  }


  /*
   * VIAGEM ENCERRADA
   */

  if (
    status === "encerrada" ||
    viagem.viagemFinalizada === true
  ) {

    html +=
      "<div style='" +
      "padding:12px;" +
      "border-radius:10px;" +
      "background:#f4f6f9;" +
      "border:1px solid #e0e4ea;" +
      "'>" +

      "🏁 <strong>Viagem encerrada</strong><br>" +

      "<span style='font-size:13px'>" +
      "O acompanhamento em tempo real foi encerrado." +
      "</span>" +

      "</div>";

    info.innerHTML = html;

    return;
  }


  /*
   * MOTORISTA ONLINE
   */

  if (
    status === "em_andamento" &&
    viagem.motoristaOnline === true
  ) {

    html +=
      "<div style='" +
      "padding:12px;" +
      "border-radius:10px;" +
      "background:#eaf7ed;" +
      "border:1px solid #a5d6a7;" +
      "color:#2e7d32;" +
      "'>" +

      "🟢 <strong>Motorista online</strong><br>" +

      "<span style='font-size:13px'>" +
      "A localização do motorista está sendo atualizada em tempo real." +
      "</span>" +

      "</div>";

  }

  /*
   * VIAGEM EM ANDAMENTO, MAS GPS OFF
   */

  else if (
    status === "em_andamento"
  ) {

    html +=
      "<div style='" +
      "padding:12px;" +
      "border-radius:10px;" +
      "background:#fff8e1;" +
      "border:1px solid #ffe082;" +
      "color:#8a6500;" +
      "'>" +

      "🟡 <strong>Viagem em andamento</strong><br>" +

      "<span style='font-size:13px'>" +
      "Aguardando atualização da localização do motorista." +
      "</span>" +

      "</div>";

  }

  /*
   * VIAGEM ABERTA
   */

  else {

    html +=
      "<div style='" +
      "padding:12px;" +
      "border-radius:10px;" +
      "background:#eaf3ff;" +
      "border:1px solid #bbd7f7;" +
      "color:#1565c0;" +
      "'>" +

      "🕐 <strong>Aguardando início da viagem</strong><br>" +

      "<span style='font-size:13px'>" +
      "O mapa será atualizado quando o motorista iniciar a viagem." +
      "</span>" +

      "</div>";

  }


  info.innerHTML =
    html;

}


/* =====================================================
   MAPA DO PASSAGEIRO
   ===================================================== */

function iniciarMapaPassageiro(
  latitude,
  longitude
) {

  var mapaElement =
    document.getElementById(
      "mapa-passageiro"
    );


  if (!mapaElement) {
    return;
  }


  /*
   * Se o mapa já existe,
   * apenas atualiza.
   */

  if (mapaPassageiro) {

    atualizarMapaPassageiro(
      latitude,
      longitude
    );

    return;

  }


  /*
   * Cria o mapa.
   */

  mapaPassageiro =
    L.map(
      "mapa-passageiro"
    ).setView(
      [
        latitude,
        longitude
      ],
      15
    );


  /*
   * OpenStreetMap
   */

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(
    mapaPassageiro
  );


  /*
   * Marcador do motorista.
   */

  marcadorMotoristaPassageiro =
    L.marker(
      [
        latitude,
        longitude
      ]
    )
    .addTo(
      mapaPassageiro
    )
    .bindPopup(
      "🚗 Motorista"
    );


  marcadorMotoristaPassageiro
    .openPopup();

}


/* =====================================================
   ATUALIZAR MAPA
   ===================================================== */

function atualizarMapaPassageiro(
  latitude,
  longitude
) {

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return;
  }


  /*
   * Cria o mapa se necessário.
   */

  if (!mapaPassageiro) {

    iniciarMapaPassageiro(
      latitude,
      longitude
    );

    return;

  }


  var posicao = [
    latitude,
    longitude
  ];


  /*
   * Atualiza marcador.
   */

  if (
    marcadorMotoristaPassageiro
  ) {

    marcadorMotoristaPassageiro
      .setLatLng(
        posicao
      );

  }

  else {

    marcadorMotoristaPassageiro =
      L.marker(
        posicao
      )
      .addTo(
        mapaPassageiro
      )
      .bindPopup(
        "🚗 Motorista"
      );

  }


  /*
   * Centraliza no motorista.
   */

  mapaPassageiro.setView(
    posicao,
    mapaPassageiro.getZoom()
  );

}


/* =====================================================
   AJUSTAR TAMANHO DO MAPA
   ===================================================== */

function atualizarTamanhoMapaPassageiro() {

  if (!mapaPassageiro) {
    return;
  }


  setTimeout(
    function () {

      mapaPassageiro.invalidateSize();

    },
    200
  );

}


/* =====================================================
   PARAR RASTREAMENTO
   ===================================================== */

function pararRastreamentoPassageiro() {

  if (
    listenerRastreamento
  ) {

    listenerRastreamento();

    listenerRastreamento =
      null;

  }


  viagemRastreadaId =
    null;


  /*
   * Mantemos o mapa na tela.
   * Apenas encerramos a escuta
   * do Firestore.
   */

}


/* =====================================================
   CENTRALIZAR NO MOTORISTA
   ===================================================== */

function centralizarMotoristaPassageiro() {

  if (
    !mapaPassageiro ||
    !marcadorMotoristaPassageiro
  ) {

    mostrarToast(
      "A localização do motorista ainda não está disponível.",
      "info"
    );

    return;

  }


  mapaPassageiro.setView(
    marcadorMotoristaPassageiro.getLatLng(),
    16
  );

}