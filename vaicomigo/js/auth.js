// ==========================================
// AUTH.JS - AUTENTICAÇÃO DO VAI COMIGO
// ==========================================


// ==========================================
// CADASTRO
// ==========================================
function fazerCadastro(event) {

  event.preventDefault();


  var nome =
    document.getElementById("cad-nome").value.trim();


  var email =
    document.getElementById("cad-email").value.trim();


  var telefone =
    document.getElementById("cad-telefone").value.trim();


  var senha =
    document.getElementById("cad-senha").value;


  var senha2 =
    document.getElementById("cad-senha2").value;


  /*
   * Perfil escolhido no cadastro.
   *
   * Caso o campo ainda não exista,
   * usamos "ambos" para manter
   * compatibilidade com contas antigas.
   */

  var campoTipo =
    document.getElementById("cad-tipo");


  var tipo =
    campoTipo
      ? campoTipo.value
      : "ambos";


  // ========================================
  // VALIDAÇÕES
  // ========================================

  if (!nome) {

    mostrarToast(
      "Informe seu nome.",
      "err"
    );

    return;
  }


  if (!email) {

    mostrarToast(
      "Informe seu e-mail.",
      "err"
    );

    return;
  }


  if (
    tipo !== "passageiro" &&
    tipo !== "motorista" &&
    tipo !== "ambos"
  ) {

    mostrarToast(
      "Escolha seu tipo de perfil.",
      "err"
    );

    return;
  }


  if (senha.length < 6) {

    mostrarToast(
      "A senha deve ter pelo menos 6 caracteres.",
      "err"
    );

    return;
  }


  if (senha !== senha2) {

    mostrarToast(
      "As senhas não conferem.",
      "err"
    );

    return;
  }


  mostrarToast(
    "Criando sua conta..."
  );


  // ========================================
  // CRIAR CONTA FIREBASE AUTH
  // ========================================

  auth
    .createUserWithEmailAndPassword(
      email,
      senha
    )

    .then(function (credencial) {

      var user =
        credencial.user;


      // ====================================
      // SALVAR PERFIL NO FIRESTORE
      // ====================================

      return db
        .collection(
          USUARIOS_COLLECTION
        )
        .doc(user.uid)
        .set({

          uid:
            user.uid,

          nome:
            nome,

          email:
            email,

          telefone:
            telefone || "",

          /*
           * PERFIL DO USUÁRIO
           *
           * passageiro
           * motorista
           * ambos
           */

          tipo:
            tipo,

          /*
           * Mantemos estes campos
           * para compatibilidade com
           * seu sistema atual.
           */

          passageiro:
            tipo === "passageiro" ||
            tipo === "ambos",

          motorista:
            tipo === "motorista" ||
            tipo === "ambos",

          admin:
            false,

          bloqueado:
            false,

          criadoEm:
            firebase.firestore
              .FieldValue
              .serverTimestamp(),

          atualizadoEm:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });

    })

    .then(function () {

      mostrarToast(
        "Conta criada com sucesso!",
        "ok"
      );


      // ====================================
      // LIMPAR FORMULÁRIO
      // ====================================

      var campos = [
        "cad-nome",
        "cad-email",
        "cad-telefone",
        "cad-senha",
        "cad-senha2"
      ];


      campos.forEach(function (id) {

        var campo =
          document.getElementById(id);


        if (campo) {
          campo.value = "";
        }

      });


      /*
       * Mantém o perfil selecionado
       * como "passageiro" apenas se
       * o campo existir.
       */

      var campoTipo =
        document.getElementById("cad-tipo");


      if (campoTipo) {
        campoTipo.value = "passageiro";
      }


      mostrarAba(
        "login"
      );

    })

    .catch(function (erro) {

      console.error(
        "Erro no cadastro:",
        erro
      );


      switch (erro.code) {

        case "auth/email-already-in-use":

          mostrarToast(
            "Este e-mail já está cadastrado.",
            "err"
          );

          break;


        case "auth/invalid-email":

          mostrarToast(
            "O e-mail informado é inválido.",
            "err"
          );

          break;


        case "auth/weak-password":

          mostrarToast(
            "A senha deve ter pelo menos 6 caracteres.",
            "err"
          );

          break;


        case "auth/network-request-failed":

          mostrarToast(
            "Erro de conexão com a internet.",
            "err"
          );

          break;


        case "auth/configuration-not-found":

          mostrarToast(
            "Ative o login por E-mail/Senha no Firebase.",
            "err"
          );

          break;


        default:

          mostrarToast(
            "Não foi possível criar a conta.",
            "err"
          );

          console.error(
            erro.message
          );

      }

    });

}



// ==========================================
// LOGIN
// ==========================================
function fazerLogin(event) {

  event.preventDefault();


  var email =
    document.getElementById(
      "log-email"
    ).value.trim();


  var senha =
    document.getElementById(
      "log-senha"
    ).value;


  if (!email || !senha) {

    mostrarToast(
      "Informe e-mail e senha.",
      "err"
    );

    return;
  }


  mostrarToast(
    "Entrando..."
  );


  // ========================================
  // LOGIN FIREBASE
  // ========================================

  auth
    .signInWithEmailAndPassword(
      email,
      senha
    )

    .then(function (credencial) {

      var user =
        credencial.user;


      console.log(
        "Usuário conectado:",
        user.uid
      );


      /*
       * Agora buscamos o perfil
       * do usuário no Firestore.
       */

      return db
        .collection(
          USUARIOS_COLLECTION
        )
        .doc(user.uid)
        .get();

    })

    .then(function (doc) {

      if (!doc.exists) {

        /*
         * Conta antiga sem documento
         * no Firestore.
         */

        mostrarToast(
          "Perfil do usuário não encontrado.",
          "err"
        );

        return;
      }


      var dados =
        doc.data();


      /*
       * Bloqueio de conta.
       */

      if (dados.bloqueado === true) {

        auth.signOut();


        mostrarToast(
          "Esta conta está bloqueada.",
          "err"
        );

        return;
      }


      /*
       * Perfil do usuário.
       *
       * Contas antigas sem "tipo"
       * serão consideradas "ambos".
       */

      var tipo =
        dados.tipo || "ambos";


      mostrarToast(
        "Login realizado com sucesso!",
        "ok"
      );


      // ====================================
      // REDIRECIONAMENTO
      // ====================================

      setTimeout(function () {

        if (
          tipo === "passageiro"
        ) {

          window.location.href =
            "passageiro.html";

          return;
        }


        if (
          tipo === "motorista"
        ) {

          window.location.href =
            "motorista.html";

          return;
        }


        /*
         * Ambos
         */

        window.location.href =
          "painel.html";

      }, 500);

    })

    .catch(function (erro) {

      console.error(
        "Erro no login:",
        erro
      );


      switch (erro.code) {

        case "auth/invalid-email":

          mostrarToast(
            "E-mail inválido.",
            "err"
          );

          break;


        case "auth/invalid-credential":

        case "auth/wrong-password":

        case "auth/user-not-found":

          mostrarToast(
            "E-mail ou senha incorretos.",
            "err"
          );

          break;


        case "auth/user-disabled":

          mostrarToast(
            "Esta conta está desativada.",
            "err"
          );

          break;


        case "auth/too-many-requests":

          mostrarToast(
            "Muitas tentativas. Tente novamente mais tarde.",
            "err"
          );

          break;


        case "auth/network-request-failed":

          mostrarToast(
            "Erro de conexão com a internet.",
            "err"
          );

          break;


        default:

          mostrarToast(
            "Não foi possível entrar.",
            "err"
          );

          console.error(
            erro.message
          );

      }

    });

}



// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
function recuperarAcesso(event) {

  event.preventDefault();


  var email =
    document.getElementById(
      "rec-email"
    ).value.trim();


  if (!email) {

    mostrarToast(
      "Informe seu e-mail.",
      "err"
    );

    return;
  }


  mostrarToast(
    "Enviando link..."
  );


  auth
    .sendPasswordResetEmail(
      email
    )

    .then(function () {

      mostrarToast(
        "Link de recuperação enviado para seu e-mail.",
        "ok"
      );


      document.getElementById(
        "rec-email"
      ).value = "";


      mostrarAba(
        "login"
      );

    })

    .catch(function (erro) {

      console.error(
        "Erro na recuperação:",
        erro
      );


      switch (erro.code) {

        case "auth/invalid-email":

          mostrarToast(
            "E-mail inválido.",
            "err"
          );

          break;


        case "auth/user-not-found":

          mostrarToast(
            "Não encontramos uma conta com esse e-mail.",
            "err"
          );

          break;


        case "auth/network-request-failed":

          mostrarToast(
            "Erro de conexão com a internet.",
            "err"
          );

          break;


        default:

          mostrarToast(
            "Não foi possível enviar o link.",
            "err"
          );

          console.error(
            erro.message
          );

      }

    });

}



// ==========================================
// OBSERVAR USUÁRIO LOGADO
// ==========================================

auth.onAuthStateChanged(
  function (user) {

    if (user) {

      console.log(
        "Usuário autenticado:",
        user.uid
      );

    }

    else {

      console.log(
        "Nenhum usuário autenticado."
      );

    }

  }
);