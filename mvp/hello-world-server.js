const uWS = require("../uws.js");

const PORT = Number(process.env.PORT || 9001);

uWS
  .App()
  .get("/", (res) => {
    res
      .writeStatus("200 OK")
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          name: "hello-world-server",
          message: "uWebSockets.js is running",
          timestamp: Date.now(),
        })
      );
  })
  .get("/health", (res) => {
    res
      .writeStatus("200 OK")
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(JSON.stringify({ status: "healthy", timestamp: Date.now() }));
  })
  .any("/*", (res, req) => {
    res
      .writeStatus("404 Not Found")
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: false,
          error: "Route not found",
          method: req.getMethod(),
          path: req.getUrl(),
        })
      );
  })
  .listen(PORT, (token) => {
    if (token) {
      console.log(`HTTP server listening on http://localhost:${PORT}`);
      return;
    }
    console.error(`Failed to listen on port ${PORT}`);
  });
