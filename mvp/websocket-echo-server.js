const uWS = require("../uws.js");

const PORT = Number(process.env.PORT || 9002);
let connectedClients = 0;

uWS
  .App()
  .ws("/*", {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 30,
    maxBackpressure: 1024 * 1024,
    open: (ws) => {
      connectedClients += 1;
      ws.send(
        JSON.stringify({
          event: "connected",
          clients: connectedClients,
          timestamp: Date.now(),
        })
      );
    },
    message: (ws, message, isBinary) => {
      const text = isBinary ? null : Buffer.from(message).toString();
      ws.send(
        isBinary
          ? message
          : JSON.stringify({
              event: "echo",
              data: text,
              timestamp: Date.now(),
            }),
        isBinary
      );
    },
    drain: (ws) => {
      console.log(`Backpressure: ${ws.getBufferedAmount()}`);
    },
    close: () => {
      connectedClients -= 1;
    },
  })
  .get("/", (res) => {
    res
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          websocket: `ws://localhost:${PORT}`,
        })
      );
  })
  .listen(PORT, (token) => {
    if (token) {
      console.log(`WebSocket echo server listening on ws://localhost:${PORT}`);
      return;
    }
    console.error(`Failed to listen on port ${PORT}`);
  });
