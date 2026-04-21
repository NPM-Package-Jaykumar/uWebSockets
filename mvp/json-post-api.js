const uWS = require("../uws.js");

const PORT = Number(process.env.PORT || 9005);

uWS
  .App()
  .post("/api/echo", (res, req) => {
    const url = req.getUrl();
    const method = req.getMethod();

    let aborted = false;
    res.onAborted(() => {
      aborted = true;
    });

    readJsonBody(
      res,
      (body) => {
        if (aborted) {
          return;
        }

        res
          .writeStatus("200 OK")
          .writeHeader("content-type", "application/json; charset=utf-8")
          .end(
            JSON.stringify({
              ok: true,
              method,
              url,
              received: body,
              timestamp: Date.now(),
            })
          );
      },
      (error) => {
        if (aborted) {
          return;
        }

        res
          .writeStatus("400 Bad Request")
          .writeHeader("content-type", "application/json; charset=utf-8")
          .end(
            JSON.stringify({
              ok: false,
              error: error.message,
            })
          );
      }
    );
  })
  .get("/", (res) => {
    res
      .writeHeader("content-type", "application/json; charset=utf-8")
      .end(
        JSON.stringify({
          ok: true,
          method: "POST",
          url: `http://localhost:${PORT}/api/echo`,
          exampleBody: { hello: "world" },
        })
      );
  })
  .listen(PORT, (token) => {
    if (token) {
      console.log(`JSON API listening on http://localhost:${PORT}`);
      return;
    }
    console.error(`Failed to listen on port ${PORT}`);
  });

function readJsonBody(res, onSuccess, onError) {
  let buffer = Buffer.alloc(0);

  res.onData((chunk, isLast) => {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

    if (!isLast) {
      return;
    }

    try {
      onSuccess(JSON.parse(buffer.toString("utf8")));
    } catch (error) {
      onError(error);
    }
  });
}
