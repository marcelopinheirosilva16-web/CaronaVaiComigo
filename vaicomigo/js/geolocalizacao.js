// ======================================================
// VaiComigo - Geolocalização + Mapa
// ======================================================

let mapaLocalizacao = null;
let marcadorUsuario = null;
let circuloPrecisao = null;

// Camadas do mapa
let camadaMapa = null;
let camadaSatelite = null;

function inicializarMapaLocalizacao() {

    const elemento = document.getElementById("mapa-localizacao");

    if (!elemento) {
        return;
    }

    // Evita criar o mapa duas vezes
    if (mapaLocalizacao) {
        return;
    }

    mapaLocalizacao = L.map("mapa-localizacao", {
        zoomControl: true,
        attributionControl: true
    }).setView([-14.2350, -51.9253], 4);

    // ==================================================
    // MAPA DE RUAS
    // ==================================================

    camadaMapa = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        }
    );

    // ==================================================
    // SATÉLITE
    // ==================================================

    camadaSatelite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
            attribution:
                'Tiles &copy; Esri'
        }
    );

    // Começa com mapa de ruas
    camadaMapa.addTo(mapaLocalizacao);

    // Controle para alternar mapa/satélite
    const camadasBase = {
        "🗺️ Mapa": camadaMapa,
        "🛰️ Satélite": camadaSatelite
    };

    L.control.layers(
        camadasBase,
        null,
        {
            position: "topright",
            collapsed: false
        }
    ).addTo(mapaLocalizacao);

    // Corrige tamanho do mapa
    setTimeout(function () {
        mapaLocalizacao.invalidateSize();
    }, 300);
}


// ======================================================
// OBTER LOCALIZAÇÃO
// ======================================================

function obterLocalizacao() {

    const status = document.getElementById("status");
    const coordenadas = document.getElementById("coordenadas");

    // Inicializa o mapa
    inicializarMapaLocalizacao();

    if (!navigator.geolocation) {

        if (status) {
            status.textContent =
                "❌ Seu navegador não suporta geolocalização.";
        }

        return;
    }

    if (status) {
        status.textContent =
            "📍 Obtendo sua localização...";
    }

    navigator.geolocation.getCurrentPosition(

        function (posicao) {

            const latitude = posicao.coords.latitude;
            const longitude = posicao.coords.longitude;
            const precisao = posicao.coords.accuracy;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);
            console.log("Precisão:", precisao);

            // ==========================================
            // STATUS
            // ==========================================

            if (status) {
                status.textContent =
                    "✅ Sua localização foi encontrada!";
            }

            // ==========================================
            // COORDENADAS
            // ==========================================

            if (coordenadas) {

                coordenadas.innerHTML = `

                    <div style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                        margin-top:10px;
                    ">

                        <div style="
                            background:#f4f6f9;
                            padding:10px 14px;
                            border-radius:10px;
                        ">

                            <strong>Latitude</strong><br>
                            ${latitude.toFixed(6)}

                        </div>

                        <div style="
                            background:#f4f6f9;
                            padding:10px 14px;
                            border-radius:10px;
                        ">

                            <strong>Longitude</strong><br>
                            ${longitude.toFixed(6)}

                        </div>

                        <div style="
                            background:#e8f5e9;
                            padding:10px 14px;
                            border-radius:10px;
                        ">

                            <strong>Precisão</strong><br>
                            ${Math.round(precisao)} metros

                        </div>

                    </div>
                `;
            }

            // ==========================================
            // SALVA LOCALIZAÇÃO GLOBAL
            // ==========================================

            window.localizacaoUsuario = {
                latitude: latitude,
                longitude: longitude,
                precisao: precisao
            };

            // ==========================================
            // ATUALIZA MAPA
            // ==========================================

            atualizarMapaUsuario(
                latitude,
                longitude,
                precisao
            );

        },

        function (erro) {

            let mensagem =
                "❌ Não foi possível obter sua localização.";

            switch (erro.code) {

                case erro.PERMISSION_DENIED:

                    mensagem =
                        "❌ Você não permitiu o acesso à localização.";

                    break;

                case erro.POSITION_UNAVAILABLE:

                    mensagem =
                        "⚠️ A localização não está disponível.";

                    break;

                case erro.TIMEOUT:

                    mensagem =
                        "⏱️ O tempo para obter a localização terminou.";

                    break;
            }

            if (status) {
                status.textContent = mensagem;
            }

            console.error(
                "Erro de geolocalização:",
                erro
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


// ======================================================
// ATUALIZAR MAPA
// ======================================================

function atualizarMapaUsuario(
    latitude,
    longitude,
    precisao
) {

    inicializarMapaLocalizacao();

    if (!mapaLocalizacao) {
        return;
    }

    const posicao = [
        latitude,
        longitude
    ];

    // Centraliza
    mapaLocalizacao.setView(
        posicao,
        16,
        {
            animate: true
        }
    );

    // Remove marcador anterior
    if (marcadorUsuario) {
        mapaLocalizacao.removeLayer(
            marcadorUsuario
        );
    }

    // Remove círculo anterior
    if (circuloPrecisao) {
        mapaLocalizacao.removeLayer(
            circuloPrecisao
        );
    }

    // ==========================================
    // ÍCONE PERSONALIZADO
    // ==========================================

    const iconeUsuario = L.divIcon({

        className: "icone-localizacao",

        html: `
            <div style="
                width:42px;
                height:42px;
                background:#1565c0;
                border:4px solid #fff;
                border-radius:50%;
                box-shadow:0 3px 12px rgba(0,0,0,.35);
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-size:20px;
            ">
                📍
            </div>
        `,

        iconSize: [42,42],

        iconAnchor: [21,42]

    });

    // ==========================================
    // MARCADOR
    // ==========================================

    marcadorUsuario = L.marker(
        posicao,
        {
            icon: iconeUsuario
        }
    )
    .addTo(mapaLocalizacao);

    marcadorUsuario.bindPopup(`
        <div style="text-align:center">

            <strong style="font-size:16px">
                📍 Você está aqui
            </strong>

            <br><br>

            <span>
                Sua localização atual
            </span>

            <br>

            <small>
                Precisão aproximada:
                ${Math.round(precisao)} m
            </small>

        </div>
    `);

    // Abre o popup
    marcadorUsuario.openPopup();

    // ==========================================
    // CÍRCULO DE PRECISÃO
    // ==========================================

    circuloPrecisao = L.circle(
        posicao,
        {
            radius: precisao,
            color: "#1565c0",
            fillColor: "#1565c0",
            fillOpacity: 0.12,
            weight: 2
        }
    ).addTo(mapaLocalizacao);

    // Corrige visualização
    setTimeout(function () {

        mapaLocalizacao.invalidateSize();

    }, 200);
}


// ======================================================
// CENTRALIZAR NO USUÁRIO
// ======================================================

function centralizarMinhaLocalizacao() {

    if (
        !window.localizacaoUsuario ||
        !mapaLocalizacao
    ) {

        obterLocalizacao();

        return;
    }

    const latitude =
        window.localizacaoUsuario.latitude;

    const longitude =
        window.localizacaoUsuario.longitude;

    mapaLocalizacao.setView(
        [
            latitude,
            longitude
        ],
        17,
        {
            animate: true
        }
    );

    if (marcadorUsuario) {
        marcadorUsuario.openPopup();
    }
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        inicializarMapaLocalizacao();

    }
);
