/* VaiComigo - Perfil do usuario */
iniciarPagina(function (user, dados) {
  document.getElementById("p-nome").value = dados.nome || "";
  document.getElementById("p-telefone").value = dados.telefone || "";
  document.getElementById("p-cidade").value = dados.cidade || "";
  document.getElementById("p-bio").value = dados.bio || "";
  document.getElementById("p-motorista").checked = !!dados.motorista;
  document.getElementById("p-nota").textContent = dados.notaMedia ? dados.notaMedia.toFixed(1) : "-";
  document.getElementById("p-total").textContent = dados.totalAvaliacoes || 0;

  // Avaliacoes recebidas
  db.collection(AVALIACOES_COLLECTION)
    .where("avaliadoUid", "==", user.uid)
    .orderBy("criadoEm", "desc").limit(20)
    .get().then(function (snap) {
      var box = document.getElementById("lista-avaliacoes");
      if (snap.empty) { box.innerHTML = '<p class="vazio">Ainda sem avaliacoes.</p>'; return; }
      var html = "";
      snap.forEach(function (d) {
        var a = d.data();
        var estrelas = "\u2605".repeat(a.nota) + "\u2606".repeat(5 - a.nota);
        html += "<div style='padding:10px 0;border-bottom:1px solid var(--borda)'>" +
          "<div style='color:#ffc107'>" + estrelas + "</div>" +
          "<div class='meta'>" + escapeHtml(a.comentario || "") + "</div></div>";
      });
      box.innerHTML = html;
    }).catch(function () {
      document.getElementById("lista-avaliacoes").innerHTML = '<p class="vazio">Nao foi possivel carregar.</p>';
    });
});

function salvarPerfil(e) {
  if (e) e.preventDefault();
  var upd = {
    nome: document.getElementById("p-nome").value.trim(),
    telefone: document.getElementById("p-telefone").value.trim(),
    cidade: document.getElementById("p-cidade").value.trim(),
    bio: document.getElementById("p-bio").value.trim(),
    motorista: document.getElementById("p-motorista").checked
  };
  if (!upd.nome) { err("O nome nao pode ficar vazio."); return; }
  db.collection(USUARIOS_COLLECTION).doc(USUARIO_ATUAL.uid).update(upd)
    .then(function () {
      if (auth.currentUser) auth.currentUser.updateProfile({ displayName: upd.nome });
      ok("Perfil atualizado!");
    })
    .catch(function () { err("Nao foi possivel salvar."); });
}

function reenviarReset() {
  auth.sendPasswordResetEmail(auth.currentUser.email)
    .then(function () { ok("Enviamos o link de redefinicao ao seu e-mail."); })
    .catch(function (e) { err(traduzErroAuth(e.code)); });
}
