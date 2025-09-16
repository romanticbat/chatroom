const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public")); // Pasta frontend (index.html, css, js, imagens, etc.)

// =========================
// Carregar histórico de mensagens
// =========================
let historico = [];
if (fs.existsSync("historico.json")) {
  try {
    historico = JSON.parse(fs.readFileSync("historico.json", "utf8"));
  } catch (err) {
    console.error("Erro ao carregar histórico:", err);
    historico = [];
  }
}

// =========================
// Conexão do Socket.IO
// =========================
io.on("connection", (socket) => {
  console.log("Novo usuário conectado:", socket.id);

  // Enviar histórico para o novo cliente
  socket.emit("chat history", historico);

  // Registro de usuário (nickname + avatar)
  socket.on("register", (user) => {
    socket.data.user = {
      nick: user.nick?.trim() || "Anônimo",
      avatar: user.avatar || ""
    };
    console.log(`Usuário registrado: ${socket.data.user.nick}`);
  });

  // Receber mensagem
  socket.on("chat message", (msg) => {
    const user = socket.data.user || { nick: "Anônimo", avatar: "" };

    const mensagem = {
      nick: user.nick,
      avatar: user.avatar,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    // Salvar no histórico
    historico.push(mensagem);
    if (historico.length > 100) historico.shift(); // mantém no máximo 100 mensagens
    fs.writeFileSync("historico.json", JSON.stringify(historico, null, 2));

    // Enviar para todos os clientes conectados
    io.emit("chat message", mensagem);
  });

  // Usuário desconectou
  socket.on("disconnect", () => {
    console.log(`Usuário saiu: ${socket.data?.user?.nick || "Anônimo"} (${socket.id})`);
  });
});

// =========================
// Iniciar servidor
// =========================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
