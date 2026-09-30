/* VaiComigo - Central de seguranca */
iniciarPagina(function () {});

function enviarDenuncia(e) {
  if (e) e.preventDefault();
  var alvo = document.getElementById("d-alvo").value.trim();
  var desc = document.getElementById("d-desc").value.trim();
  if (!alvo || !desc) { err("Informe o denunciado e a descricao."); return; }

  db.collection(DENUNCIAS_COLLECTION).add({
    alvo: alvo,
    motivo: document.getElementById("d-motivo").value,
    descricao: desc,
    denuncianteUid: USUARIO_ATUAL.uid,
    denuncianteNome: USUARIO_ATUAL.nome || "",
    status: "pendente",
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function () {
    ok("Denuncia registrada. Nossa moderacao vai analisar.");
    document.getElementById("d-alvo").value = "";
    document.getElementById("d-desc").value = "";
  }).catch(function () { err("Nao foi possivel registrar a denuncia."); });
}
