// ==========================================
// FIREBASE CONFIG - VAI COMIGO
// ==========================================

var firebaseConfig = {
  apiKey: "AIzaSyBEZz4Ypkk_E52YLMl7qx22_SUFpfCghPc",
  authDomain: "carona-test.firebaseapp.com",
  projectId: "carona-test",
  storageBucket: "carona-test.firebasestorage.app",
  messagingSenderId: "936429145764",
  appId: "1:936429145764:web:3af93ff1954c9b35182031"
};

// Inicializa somente uma vez
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Serviços Firebase
var auth = firebase.auth();
var db = firebase.firestore();


// ---------- COLEÇÕES ----------
var USUARIOS_COLLECTION = "usuarios";
var VEICULOS_COLLECTION = "veiculos";
var VIAGENS_COLLECTION = "viagens";
var SOLICITACOES_COLLECTION = "solicitacoes";
var AVALIACOES_COLLECTION = "avaliacoes";
var DENUNCIAS_COLLECTION = "denuncias";
var BLOQUEIOS_COLLECTION = "bloqueios";
var AUDITORIA_COLLECTION = "auditoria";
