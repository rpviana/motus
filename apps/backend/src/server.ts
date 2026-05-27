import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "8mb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "motus-backend" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin
  }
});

io.on("connection", (socket) => {
  socket.emit("system:ready", { connectedAt: new Date().toISOString() });
});

httpServer.listen(port, () => {
  console.log(`Motus backend listening on http://localhost:${port}`);
});
