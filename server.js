const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public")); // pasta frontend

// Carregar histórico de mensagens de um JSON
let historico = [];
if (fs.existsSync("historico.json")) {
  historico = JSON.parse(fs.readFileSync("historico.json"));
}

io.on("connection", (socket) => {
  console.log("Novo usuário conectado");

  // Enviar histórico para o novo cliente
  socket.emit("chat history", historico);

  // Receber nickname e avatar
  socket.on("register", (user) => {
    socket.data.user = user; // salva dados no socket
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
    fs.writeFileSync("historico.json", JSON.stringify(historico, null, 2));

    // Enviar para todos
    io.emit("chat message", mensagem);
  });

  socket.on("disconnect", () => {
    console.log("Usuário saiu");
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
