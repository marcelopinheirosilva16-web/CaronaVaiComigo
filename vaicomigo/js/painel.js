// ======================================================
// PAINEL.JS
// VAI COMIGO
// ======================================================

// ======================================================
// INICIAR PAINEL
// ======================================================

iniciarPagina(function (user, dados) {

    console.log("Painel iniciado para:", user.uid);

    // ==================================================
    // SAUDAÇÃO
    // ==================================================

    var elementoOla = document.getElementById("ola");

    if (elementoOla) {
        elementoOla.textContent =
            "Olá, " + (dados.nome || "usuário") + "!";
    }


    // ==================================================
    // RESUMO DO USUÁRIO
    // ==================================================

    var elementoResumo = document.getElementById("resumo");

    if (elementoResumo) {

        var papel = dados.motorista
            ? "passageiro e motorista"
            : "passageiro";

        var nota = dados.notaMedia
            ? Number(dados.notaMedia).toFixed(1)
            : "sem avaliações";

        elementoResumo.textContent =
            "Você está como " +
            papel +
            ". Nota média: " +
            nota +
            ".";
    }


    // ==================================================
    // ÁREA DAS SOLICITAÇÕES
    // ==================================================

    var box = document.getElementById("minhas-solic");

    if (!box) {

        console.warn(
            "Elemento minhas-solic não encontrado no painel."
        );

        return;
    }


    // ==================================================
    // MENSAGEM TEMPORÁRIA
    // ==================================================

    box.innerHTML =
        '<p class="vazio">Carregando suas solicitações...</p>';


    // ==================================================
    // VERIFICAR COLEÇÃO
    // ==================================================

    if (typeof SOLICITACOES_COLLECTION === "undefined") {

        console.error(
            "SOLICITACOES_COLLECTION não foi definida."
        );

        box.innerHTML =
            '<p class="vazio">' +
            'Não foi possível carregar as solicitações.' +
            '</p>';

        return;
    }


    // ==================================================
    // BUSCAR SOLICITAÇÕES
    // ==================================================
    //
    // IMPORTANTE:
    // Não usamos orderBy()
    // Não usamos limit()
    //
    // Assim essa consulta não precisa de índice
    // composto do Firestore.
    // ==================================================

    db.collection(SOLICITACOES_COLLECTION)
        .where("passageiroUid", "==", user.uid)
        .get()

        .then(function (snap) {

            console.log(
                "Solicitações encontradas:",
                snap.size
            );


            // ==========================================
            // NENHUMA SOLICITAÇÃO
            // ==========================================

            if (snap.empty) {

                box.innerHTML =
                    '<p class="vazio">' +
                    'Você ainda não solicitou nenhuma vaga.' +
                    '</p>';

                return;
            }


            // ==========================================
            // TRANSFORMAR EM ARRAY
            // ==========================================

            var solicitacoes = [];

            snap.forEach(function (doc) {

                var dadosSolicitacao = doc.data();

                dadosSolicitacao.id = doc.id;

                solicitacoes.push(
                    dadosSolicitacao
                );
            });


            // ==========================================
            // ORDENAR NO JAVASCRIPT
            // ==========================================

            solicitacoes.sort(function (a, b) {

                var dataA =
                    obterData(a.criadoEm);

                var dataB =
                    obterData(b.criadoEm);

                return dataB.getTime() -
                       dataA.getTime();
            });


            // ==========================================
            // PEGAR AS 20 MAIS RECENTES
            // ==========================================

            var quantidade = Math.min(
                solicitacoes.length,
                20
            );


            // ==========================================
            // MONTAR TABELA
            // ==========================================

            var linhas = "";


            for (var i = 0; i < quantidade; i++) {

                var s = solicitacoes[i];


                var origem =
                    s.origem || s.viagemOrigem || "-";

                var destino =
                    s.destino || s.viagemDestino || "-";

                var status =
                    s.status || "pendente";


                // ======================================
                // DATA DA VIAGEM
                // ======================================

                var dataViagem = "-";

                if (
                    typeof formatarData === "function" &&
                    s.dataViagem
                ) {

                    dataViagem =
                        formatarData(
                            s.dataViagem
                        );
                } else if (s.dataHora) {
                    var dtObj = obterData(s.dataHora);
                    if (!isNaN(dtObj.getTime()) && dtObj.getTime() > 0) {
                        dataViagem = dtObj.toLocaleDateString("pt-BR") + " " + dtObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    }
                }


                // ======================================
                // ID PARA ACOMPANHAMENTO
                // ======================================
                var idParaAcompanhar = s.viagemId || s.id;


                // ======================================
                // CRIAR LINHA
                // ======================================

                linhas +=
                    "<tr>" +

                    "<td>" +
                    escapeHtmlSeguro(origem) +
                    " &rarr; " +
                    escapeHtmlSeguro(destino) +
                    "</td>" +

                    "<td>" +
                    escapeHtmlSeguro(
                        dataViagem
                    ) +
                    "</td>" +

                    "<td>" +

                    "<span class='badge " +
                    escapeHtmlSeguro(status) +
                    "'>" +

                    escapeHtmlSeguro(status) +

                    "</span>" +

                    "</td>" +

                    "<td>" +
                    "<button type='button' class='btn' onclick=\"window.location.href='acompanhamento.html?id=" + escapeHtmlSeguro(idParaAcompanhar) + "'\">Acompanhar</button>" +
                    "</td>" +

                    "</tr>";
            }


            // ==========================================
            // EXIBIR TABELA
            // ==========================================

            box.innerHTML =
                "<table>" +

                "<thead>" +

                "<tr>" +

                "<th>Trajeto</th>" +

                "<th>Data</th>" +

                "<th>Status</th>" +

                "<th>Ação</th>" +

                "</tr>" +

                "</thead>" +

                "<tbody>" +

                linhas +

                "</tbody>" +

                "</table>";


        })

        // ==================================================
        // ERRO
        // ==================================================

        .catch(function (erro) {

            console.error(
                "ERRO AO CARREGAR SOLICITAÇÕES:"
            );

            console.error(
                "Código:",
                erro.code
            );

            console.error(
                "Mensagem:",
                erro.message
            );

            console.error(
                "Erro completo:",
                erro
            );


            // ==========================================
            // MOSTRAR ERRO REAL NA TELA
            // ==========================================

            box.innerHTML =
                '<div class="vazio" style="padding:15px;">' +

                '<strong>Não foi possível carregar suas solicitações.</strong>' +

                '<br><br>' +

                '<small>' +

                'Código: ' +
                escapeHtmlSeguro(
                    erro.code || "desconhecido"
                ) +

                '<br><br>' +

                'Mensagem: ' +
                escapeHtmlSeguro(
                    erro.message || "Erro desconhecido"
                ) +

                '</small>' +

                '</div>';
        });

});


// ======================================================
// CONVERTER DATA DO FIRESTORE
// ======================================================

function obterData(valor) {

    if (!valor) {
        return new Date(0);
    }


    // Timestamp do Firestore
    if (
        typeof valor.toDate === "function"
    ) {

        return valor.toDate();
    }


    // Timestamp em segundos
    if (
        typeof valor.seconds !== "undefined"
    ) {

        return new Date(
            valor.seconds * 1000
        );
    }


    // Data JavaScript
    if (
        valor instanceof Date
    ) {

        return valor;
    }


    // Texto ou número
    var data =
        new Date(valor);


    if (
        isNaN(data.getTime())
    ) {

        return new Date(0);
    }


    return data;
}


// ======================================================
// ESCAPAR TEXTO COM SEGURANÇA
// ======================================================

function escapeHtmlSeguro(valor) {

    if (
        valor === null ||
        typeof valor === "undefined"
    ) {

        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}