import http from "http";
import dotenv from "dotenv";
import { createGatewayApp } from "./app.js";
import { initSocketServer } from "./socket.js";

dotenv.config();

const app = createGatewayApp();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 5001;

initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Orderly API Gateway running at http://localhost:${PORT} with WebSocket support`);
});

// Also bind port 8000 if different from PORT to support configured callback URLs
if (PORT !== 8000) {
  const secondaryServer = http.createServer(app);
  initSocketServer(secondaryServer);
  secondaryServer.listen(8000, () => {
    console.log(`Orderly API Gateway secondary listener active on port 8000`);
  }).on('error', (err) => {
    console.warn(`[Gateway Port 8000] Notice: Port 8000 already in use or unavailable (${err.message})`);
  });
}

