import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

io.on("connection", (socket) => {
  socket.emit("server.hello", { ok: true });
  socket.on("ping", () => socket.emit("pong"));
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`API listening on ${port}`));
