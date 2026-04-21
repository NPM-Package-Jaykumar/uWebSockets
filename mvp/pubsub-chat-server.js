const uWS = require("../uws.js");

const PORT = Number(process.env.PORT || 9004);

uWS
  .App()
  .ws("/*", {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 30,
    maxBackpressure: 1024 * 1024,
    upgrade: (res, req, context) => {
      const room = req.getQuery("room") || "general";
      const user = req.getQuery("user") || `guest-${Date.now()}`;

      res.upgrade(
        { room, user },
        req.getHeader("sec-websocket-key"),
        req.getHeader("sec-websocket-protocol"),
        req.getHeader("sec-websocket-extensions"),
        context
      );
    },
    open: (ws) => {
      ws.subscribe(`room:${ws.room}`);
      ws.publish(
        `room:${ws.room}`,
        JSON.stringify({
          event: "join",
          room: ws.room,
          user: ws.user,
          timestamp: Date.now(),
        })
      );
    },
    message: (ws, message, isBinary) => {
      const payload = JSON.stringify({
        event: "message",
        room: ws.room,
        user: ws.user,
        isBinary,
        data: isBinary ? Buffer.from(message).toString("base64") : Buffer.from(message).toString(),
        timestamp: Date.now(),
      });

      ws.publish(`room:${ws.room}`, payload);
    },
    close: (ws) => {
      ws.publish(
        `room:${ws.room}`,
        JSON.stringify({
          event: "leave",
          room: ws.room,
          user: ws.user,
          timestamp: Date.now(),
        })
      );
    },
  })
  .get("/", (res) => {
    res
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          usage: `ws://localhost:${PORT}/?room=general&user=alice`,
        })
      );
  })
  .listen(PORT, (token) => {
    if (token) {
      console.log(`PubSub chat server listening on ws://localhost:${PORT}`);
      return;
    }
    console.error(`Failed to listen on port ${PORT}`);
  });
