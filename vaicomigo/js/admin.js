/* VaiComigo - Painel administrativo */
iniciarPagina(function (user, dados) {
  if (!dados.admin) {
    document.getElementById("sem-acesso").style.display = "block";
    return;
  }
  document.getElementById("conteudo").style.display = "block";
  carregarMetricas();
  carregarUsuarios();
  carregarDenuncias();
  carregarViagensAdmin();
  carregarAuditoria();
});

function carregarMetricas() {
  db.collection(USUARIOS_COLLECTION).get().then(function (s) {
    document.getElementById("m-usuarios").textContent = s.size;
  });
  db.collection(VIAGENS_COLLECTION).get().then(function (s) {
    document.getElementById("m-viagens").textContent = s.size;
  });
  db.collection(DENUNCIAS_COLLECTION).where("status", "==", "pendente").get().then(function (s) {
    document.getElementById("m-denuncias").textContent = s.size;
  });
}

function carregarUsuarios() {
  db.collection(USUARIOS_COLLECTION).orderBy("criadoEm", "desc").limit(50).get().then(function (snap) {
    var html = "<table><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th></th></tr></thead><tbody>";
    snap.forEach(function (d) {
      var u = d.data();
      var papel = u.admin ? "admin" : (u.motorista ? "motorista" : "passageiro");
      html += "<tr><td>" + escapeHtml(u.nome) + "</td><td>" + escapeHtml(u.email) +
        "</td><td>" + papel + "</td><td>" +
        (u.bloqueado ? "<span class='badge cancelada'>bloqueado</span>" : "<span class='badge aceita'>ativo</span>") +
        "</td><td>" +
        (u.bloqueado
          ? "<button class='btn sm verde' onclick=\"alternarBloqueio('" + d.id + "',false)\">Desbloquear</button>"
          : "<button class='btn sm vermelho' onclick=\"alternarBloqueio('" + d.id + "',true)\">Bloquear</button>") +
        "</td></tr>";
    });
    document.getElementById("tab-usuarios").innerHTML = html + "</tbody></table>";
  });
}

function alternarBloqueio(uid, bloquear) {
  db.collection(USUARIOS_COLLECTION).doc(uid).update({ bloqueado: bloquear })
    .then(function () {
      return registrarAuditoria(bloquear ? "bloqueio" : "desbloqueio", "usuario " + uid);
    })
    .then(function () { ok(bloquear ? "Usuario bloqueado." : "Usuario desbloqueado."); carregarUsuarios(); carregarAuditoria(); })
    .catch(function () { err("Nao foi possivel atualizar."); });
}

function carregarDenuncias() {
  db.collection(DENUNCIAS_COLLECTION).orderBy("criadoEm", "desc").limit(50).get().then(function (snap) {
    if (snap.empty) { document.getElementById("tab-denuncias").innerHTML = '<p class="vazio">Sem denuncias.</p>'; return; }
    var html = "<table><thead><tr><th>Alvo</th><th>Motivo</th><th>Descricao</th><th>Status</th><th></th></tr></thead><tbody>";
    snap.forEach(function (d) {
      var r = d.data();
      html += "<tr><td>" + escapeHtml(r.alvo) + "</td><td>" + escapeHtml(r.motivo) +
        "</td><td>" + escapeHtml((r.descricao || "").slice(0, 60)) +
        "</td><td><span class='badge " + (r.status === "pendente" ? "pendente" : "encerrada") + "'>" + r.status + "</span></td><td>" +
        (r.status === "pendente"
          ? "<button class='btn sm' onclick=\"moderarDenuncia('" + d.id + "','resolvida')\">Resolver</button> " +
            "<button class='btn sm ghost' onclick=\"moderarDenuncia('" + d.id + "','arquivada')\">Arquivar</button>"
          : "-") +
        "</td></tr>";
    });
    document.getElementById("tab-denuncias").innerHTML = html + "</tbody></table>";
  });
}

function moderarDenuncia(id, status) {
  db.collection(DENUNCIAS_COLLECTION).doc(id).update({ status: status })
    .then(function () { return registrarAuditoria("moderacao", "denuncia " + id + " -> " + status); })
    .then(function () { ok("Denuncia " + status + "."); carregarDenuncias(); carregarMetricas(); carregarAuditoria(); });
}

function carregarViagensAdmin() {
  db.collection(VIAGENS_COLLECTION).orderBy("criadoEm", "desc").limit(30).get().then(function (snap) {
    if (snap.empty) { document.getElementById("tab-viagens").innerHTML = '<p class="vazio">Sem viagens.</p>'; return; }
    var html = "<table><thead><tr><th>Trajeto</th><th>Motorista</th><th>Data</th><th>Status</th></tr></thead><tbody>";
    snap.forEach(function (d) {
      var t = d.data();
      html += "<tr><td>" + escapeHtml(t.origem) + " &rarr; " + escapeHtml(t.destino) +
        "</td><td>" + escapeHtml(t.motoristaNome || "-") +
        "</td><td>" + formatarData(t.dataHora) +
        "</td><td><span class='badge " + t.status + "'>" + t.status + "</span></td></tr>";
    });
    document.getElementById("tab-viagens").innerHTML = html + "</tbody></table>";
  });
}

function carregarAuditoria() {
  db.collection(AUDITORIA_COLLECTION).orderBy("criadoEm", "desc").limit(30).get().then(function (snap) {
    if (snap.empty) { document.getElementById("tab-auditoria").innerHTML = '<p class="vazio">Sem registros.</p>'; return; }
    var html = "<table><thead><tr><th>Acao</th><th>Detalhe</th><th>Por</th><th>Quando</th></tr></thead><tbody>";
    snap.forEach(function (d) {
      var a = d.data();
      html += "<tr><td>" + escapeHtml(a.acao) + "</td><td>" + escapeHtml(a.detalhe) +
        "</td><td>" + escapeHtml(a.porEmail || "-") + "</td><td>" + formatarData(a.criadoEm) + "</td></tr>";
    });
    document.getElementById("tab-auditoria").innerHTML = html + "</tbody></table>";
  });
}
