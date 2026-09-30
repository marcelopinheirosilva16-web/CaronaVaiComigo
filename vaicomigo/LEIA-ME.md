# VaiComigo

Plataforma web de caronas que conecta passageiros e motoristas com trajetos semelhantes.
Feito com **HTML + CSS + JavaScript + Firebase (Auth + Firestore)**, usando Firebase compat **v10.12.5**.

## Estrutura de arquivos

```
vaicomigo/
├── index.html          Login, cadastro e recuperacao de acesso
├── painel.html         Painel inicial (hub) + minhas solicitacoes
├── perfil.html         Perfil, reputacao, avaliacoes recebidas, logout
├── passageiro.html     Pesquisa de viagens, filtros, detalhes, solicitar vaga, avaliar
├── motorista.html      Cadastro de veiculo, criar viagem, gerenciar solicitacoes
├── seguranca.html      Denuncia, orientacoes e contatos de emergencia
├── admin.html          Usuarios, viagens, denuncias, metricas, bloqueios, auditoria
├── css/style.css       Estilos
├── js/
│   ├── firebase-config.js  Configuracao UNICA do Firebase (edite aqui)
│   ├── common.js           Toast, modal, guarda de rota, utilitarios
│   ├── nav.js              Menu dinamico + iniciarPagina()
│   ├── auth.js             Cadastro / Login / Recuperacao
│   ├── painel.js
│   ├── perfil.js
│   ├── passageiro.js
│   ├── motorista.js
│   ├── seguranca.js
│   └── admin.js
└── firestore.rules    Regras de seguranca do Firestore
```

## Colecoes do Firestore

- `usuarios`      dados do usuario, papel, nota media, flag bloqueado/admin
- `veiculos`      um veiculo por motorista (id = uid)
- `viagens`       origem, destino, dataHora, vagas, valor, rota, regras, status
- `solicitacoes`  pedidos de vaga (pendente / aceita / recusada)
- `avaliacoes`    nota (1-5) + comentario, com anti-duplicacao
- `denuncias`     denuncias para moderacao
- `auditoria`     registro das acoes administrativas

## Como rodar

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. **Authentication** > ative o metodo **E-mail/Senha**.
   - Sem isso aparece o erro `auth/configuration-not-found`.
3. **Firestore Database** > crie o banco.
4. Cole o conteudo de `firestore.rules` em Firestore > Regras > Publicar.
5. Abra `js/firebase-config.js` e preencha com os dados do seu app Web.
6. Sirva o site por **localhost** (ex.: extensao *Live Server* do VS Code).
   - Nao abra por `file://`, o login do Firebase nao funciona assim.

## Tornar-se administrador

O primeiro admin e definido manualmente: no Firestore, abra o documento do seu
usuario na colecao `usuarios` e mude o campo `admin` para `true`.

## Fluxo de uso

- **Passageiro:** busca viagens (com filtros), ve detalhes, solicita vaga e
  acompanha o status no painel. Apos a viagem, avalia a experiencia.
- **Motorista:** cadastra o veiculo, cria viagens (rota, horario, vagas, regras),
  e aceita/recusa solicitacoes (com controle automatico de vagas).
- **Admin:** consulta metricas, bloqueia/desbloqueia usuarios, modera denuncias
  e ve o log de auditoria.

## Observacao sobre indices

Algumas consultas (ordenacao + filtro) podem pedir a criacao de um indice
composto. O proprio console mostra um link direto para criar quando isso ocorrer.
