<div align="center">
<img src="https://raw.githubusercontent.com/uNetworking/uWebSockets/master/misc/logo.svg" height="180" /><br>
<i>Simple, secure</i><sup><a href="https://github.com/NPM-Package-Jaykumar/uWebSockets/tree/master/fuzzing#fuzz-testing-of-various-parsers-and-mocked-examples">1</a></sup><i> & standards compliant</i><sup><a href="https://unetworking.github.io/uWebSockets.js/report.pdf">2</a></sup><i> web server for the most demanding</i><sup><a href="https://github.com/NPM-Package-Jaykumar/uWebSockets/tree/master/benchmarks#benchmark-driven-development">3</a></sup><i> of applications.</i> <a href="https://github.com/NPM-Package-Jaykumar/uWebSockets#readme">Read more...</a>
<br><br>

<a href="https://github.com/NPM-Package-Jaykumar/uWebSockets/releases"><img src="https://img.shields.io/github/v/release/uNetworking/uWebSockets.js"></a> <a href="https://bugs.chromium.org/p/oss-fuzz/issues/list?sort=-opened&can=1&q=proj:uwebsockets"><img src="https://oss-fuzz-build-logs.storage.googleapis.com/badges/uwebsockets.svg" /></a> <img src="https://img.shields.io/badge/downloads-70%20million-green" /> <img src="https://img.shields.io/badge/established-in%202016-green" />

</div>
<br><br>

### :zap: Simple performance

µWebSockets.js is a web server bypass for Node.js that reimplements eventing, networking, encryption, web protocols, routing and pub/sub in highly optimized C++. As such, µWebSockets.js delivers web serving for Node.js, **[8.5x that of Fastify](https://alexhultman.medium.com/serving-100k-requests-second-from-a-fanless-raspberry-pi-4-over-ethernet-fdd2c2e05a1e)** and at least **[10x that of Socket.IO](https://medium.com/swlh/100k-secure-websockets-with-raspberry-pi-4-1ba5d2127a23)**. It is also the built-in **[web server of Bun](https://bun.sh/)**.

- Browse the [documentation](https://unetworking.github.io/uWebSockets.js/generated/) and see the [main repo](https://github.com/NPM-Package-Jaykumar/uWebSockets). There are tons of [examples](examples) but here's the gist of it all:

```javascript
/* Non-SSL is simply App() */
require("uWebSockets.js")
  .SSLApp({
    /* There are more SSL options, cut for brevity */
    key_file_name: "misc/key.pem",
    cert_file_name: "misc/cert.pem",
  })
  .ws("/*", {
    /* There are many common helper features */
    idleTimeout: 32,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
    compression: DEDICATED_COMPRESSOR_3KB,

    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    message: (ws, message, isBinary) => {
      /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */

      /* Here we echo the message back, using compression if available */
      let ok = ws.send(message, isBinary, true);
    },
  })
  .get("/*", (res, req) => {
    /* It does Http as well */
    res
      .writeStatus("200 OK")
      .writeHeader("IsExample", "Yes")
      .end("Hello there!");
  })
  .listen(9001, (listenSocket) => {
    if (listenSocket) {
      console.log("Listening to port 9001");
    }
  });
```
