const uWS = require("../uws.js");

const PORT = Number(process.env.PORT || 9006);

uWS
  .App()
  .get("/", (res) => {
    res.end("Try /users/42 or /search?tag=node");
  })
  .get("/users/:id", (res, req) => {
    res
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          id: req.getParameter(0),
          timestamp: Date.now(),
        })
      );
  })
  .get("/search", (res, req) => {
    res
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          tag: req.getQuery("tag") || null,
          timestamp: Date.now(),
        })
      );
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
      console.log(`Router server listening on http://localhost:${PORT}`);
      return;
    }
    console.error(`Failed to listen on port ${PORT}`);
  });
