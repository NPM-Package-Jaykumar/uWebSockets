const uWS = require("../uws.js");

const PORT = Number(process.env.PORT || 9003);
const CHANNELS = Object.create(null);

uWS
  .App()
  .ws("/*", {
    compression: uWS.DISABLED,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 30,
    upgrade: (res, req, context) => {
      const channelId = req.getQuery("channel_id");

      if (!channelId) {
        res
          .writeStatus("400 Bad Request")
          .writeHeader("content-type", "application/json; charset=utf-8")
          .end(JSON.stringify({ ok: false, error: "missing channel_id" }));
        return;
      }

      res.upgrade(
        { channelId },
        req.getHeader("sec-websocket-key"),
        req.getHeader("sec-websocket-protocol"),
        req.getHeader("sec-websocket-extensions"),
        context
      );
    },
    open: (ws) => {
      CHANNELS[ws.channelId] ||= new Set();
      CHANNELS[ws.channelId].add(ws);

      ws.send(
        JSON.stringify({
          event: "welcome",
          channelId: ws.channelId,
          connections: CHANNELS[ws.channelId].size,
          timestamp: Date.now(),
        })
      );
    },
    message: (ws, message, isBinary) => {
      if (isBinary) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "binary messages are not supported",
            timestamp: Date.now(),
          })
        );
        return;
      }

      try {
        const parsed = JSON.parse(Buffer.from(message).toString());
        const payload = JSON.stringify({
          event: "broadcast",
          from: ws.channelId,
          data: parsed,
          timestamp: Date.now(),
        });

        for (const client of CHANNELS[ws.channelId] || []) {
          client.send(payload);
        }
      } catch (error) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: error.message,
            timestamp: Date.now(),
          })
        );
      }
    },
    close: (ws) => {
      const clients = CHANNELS[ws.channelId];
      if (!clients) {
        return;
      }

      clients.delete(ws);
      if (!clients.size) {
        delete CHANNELS[ws.channelId];
      }
    },
  })
  .get("/", (res) => {
    res
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          usage: `ws://localhost:${PORT}/?channel_id=room-1`,
        })
      );
  })
  .listen(PORT, (token) => {
    if (token) {
      console.log(`Channel broadcast server listening on ws://localhost:${PORT}`);
      return;
    }
    console.error(`Failed to listen on port ${PORT}`);
  });
