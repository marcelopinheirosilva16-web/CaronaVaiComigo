// ==========================================
// COMMON.JS - FUNÇÕES GERAIS DO VAI COMIGO
// ==========================================


// ==========================================
// TOAST
// ==========================================

function toast(msg, tipo) {

  var box = document.getElementById("toast");

  if (!box) {

    box = document.createElement("div");

    box.id = "toast";

    document.body.appendChild(box);

  }

  box.textContent = msg;

  box.className =
    "toast show " +
    (tipo || "info");

  clearTimeout(window.__toastTimer);

  window.__toastTimer =
    setTimeout(function () {

      box.className = "toast";

    }, 3500);

}


// ==========================================
// COMPATIBILIDADE COM AUTH.JS
// ==========================================

function mostrarToast(msg, tipo) {

  toast(
    msg,
    tipo || "info"
  );

}


function err(msg) {

  toast(
    msg,
    "err"
  );

}


function ok(msg) {

  toast(
    msg,
    "ok"
  );

}


// ==========================================
// ABAS DO LOGIN
// ==========================================

function mostrarAba(aba) {

  var login =
    document.getElementById("aba-login");

  var cadastro =
    document.getElementById("aba-cadastro");

  var recuperar =
    document.getElementById("aba-recuperar");

  var tabLogin =
    document.getElementById("tab-login");

  var tabCadastro =
    document.getElementById("tab-cadastro");


  // Esconde todas

  if (login) {

    login.style.display = "none";

  }

  if (cadastro) {

    cadastro.style.display = "none";

  }

  if (recuperar) {

    recuperar.style.display = "none";

  }


  // Remove ativo

  if (tabLogin) {

    tabLogin.classList.remove("ativo");

  }

  if (tabCadastro) {

    tabCadastro.classList.remove("ativo");

  }


  // Login

  if (aba === "login") {

    if (login) {

      login.style.display = "block";

    }

    if (tabLogin) {

      tabLogin.classList.add("ativo");

    }

  }


  // Cadastro

  else if (aba === "cadastro") {

    if (cadastro) {

      cadastro.style.display = "block";

    }

    if (tabCadastro) {

      tabCadastro.classList.add("ativo");

    }

  }


  // Recuperação

  else if (aba === "recuperar") {

    if (recuperar) {

      recuperar.style.display = "block";

    }

  }

}


// ==========================================
// MODAIS
// ==========================================

function abrirModal(id) {

  var m =
    document.getElementById(id);

  if (m) {

    m.classList.add("show");

  }

}


function fecharModal(id) {

  var m =
    document.getElementById(id);

  if (m) {

    m.classList.remove("show");

  }

}


// ==========================================
// ERROS DO FIREBASE AUTH
// ==========================================

function traduzErroAuth(code) {

  var mapa = {

    "auth/invalid-email":
      "E-mail inválido.",

    "auth/user-disabled":
      "Esta conta foi bloqueada.",

    "auth/user-not-found":
      "Usuário não encontrado.",

    "auth/wrong-password":
      "Senha incorreta.",

    "auth/invalid-credential":
      "E-mail ou senha incorretos.",

    "auth/email-already-in-use":
      "Este e-mail já está cadastrado.",

    "auth/weak-password":
      "A senha deve ter ao menos 6 caracteres.",

    "auth/too-many-requests":
      "Muitas tentativas. Tente mais tarde.",

    "auth/network-request-failed":
      "Erro de conexão com a internet.",

    "auth/configuration-not-found":
      "Ative o método E-mail/Senha no Firebase Console."

  };


  return mapa[code] ||
    "Ocorreu um erro. Tente novamente.";

}


// ==========================================
// EXIGIR LOGIN
// ==========================================

function exigirLogin(callback) {

  auth.onAuthStateChanged(function (user) {

    if (!user) {

      window.location.href =
        "index.html";

      return;

    }


    if (typeof callback === "function") {

      callback(user);

    }

  });

}


// ==========================================
// CARREGAR USUÁRIO
// ==========================================

function carregarUsuario(uid) {

  console.log(
    "=========================================="
  );

  console.log(
    "CARREGANDO USUÁRIO"
  );

  console.log(
    "UID:",
    uid
  );

  console.log(
    "COLLECTION:",
    USUARIOS_COLLECTION
  );

  console.log(
    "=========================================="
  );


  return db

    .collection(
      USUARIOS_COLLECTION
    )

    .doc(uid)

    .get()

    .then(function (doc) {

      console.log(
        "Resultado da consulta do usuário:",
        doc.exists
      );


      if (doc.exists) {

        console.log(
          "Dados do usuário:",
          doc.data()
        );

        return doc.data();

      }


      console.warn(
        "Documento do usuário não encontrado."
      );


      return null;

    })

    .catch(function (erro) {

      console.error(
        "=========================================="
      );

      console.error(
        "ERRO AO CARREGAR USUÁRIO"
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

      console.error(
        "=========================================="
      );


      throw erro;

    });

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

  auth.signOut()

    .then(function () {

      window.location.href =
        "index.html";

    })

    .catch(function (erro) {

      console.error(
        "Erro ao sair:",
        erro
      );

      mostrarToast(
        "Não foi possível sair.",
        "err"
      );

    });

}


// ==========================================
// AUDITORIA
// ==========================================

function registrarAuditoria(
  acao,
  detalhe
) {

  var u =
    auth.currentUser;


  return db

    .collection(
      AUDITORIA_COLLECTION
    )

    .add({

      acao:
        acao,

      detalhe:
        detalhe || "",

      porUid:
        u ? u.uid : null,

      porEmail:
        u ? u.email : null,

      criadoEm:
        firebase.firestore.FieldValue
          .serverTimestamp()

    });

}


// ==========================================
// DATA
// ==========================================

function formatarData(ts) {

  if (!ts) {

    return "-";

  }


  var d =
    ts.toDate
      ? ts.toDate()
      : new Date(ts);


  return d.toLocaleDateString(
    "pt-BR"
  ) +
  " " +
  d.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// ==========================================
// SEGURANÇA HTML
// ==========================================

function escapeHtml(s) {

  if (s == null) {

    return "";

  }


  return String(s)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}
/* =====================================================
   CORREÇÃO GLOBAL: FUNÇÕES DE ACOMPANHAMENTO E MAPA
   ===================================================== */
if (typeof window.pararAcompanhamentoUsuario !== "function") {
    window.pararAcompanhamentoUsuario = function() {
        console.log("Rastreamento de acompanhamento encerrado.");
        if (typeof unsubscribeAcompanhamento === "function") {
            unsubscribeAcompanhamento();
        }
        if (window.location.href.indexOf("acompanhamento.html") !== -1) {
            window.location.href = "painel.html";
        }
    };
}