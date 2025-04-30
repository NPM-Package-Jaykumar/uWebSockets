<div align="center">
<img src="https://github.com/NPM-Package-Jaykumar/uWebSockets/blob/main/logo.svg" height="180" /><br>
<i>Simple, secure</i><sup><a href="https://github.com/NPM-Package-Jaykumar/uWebSockets/tree/master/fuzzing#fuzz-testing-of-various-parsers-and-mocked-examples">1</a></sup><i> & standards compliant</i><sup><a href="https://unetworking.github.io/uwebsockets/report.pdf">2</a></sup><i> web server for the most demanding</i><sup><a href="https://github.com/NPM-Package-Jaykumar/uWebSockets/tree/master/benchmarks#benchmark-driven-development">3</a></sup><i> of applications.</i> <a href="https://github.com/NPM-Package-Jaykumar/uWebSockets#readme">Read more...</a>
<br><br>

<a href="https://github.com/NPM-Package-Jaykumar/uWebSockets/releases"><img src="https://img.shields.io/github/v/release/uNetworking/uwebsockets"></a> <a href="https://bugs.chromium.org/p/oss-fuzz/issues/list?sort=-opened&can=1&q=proj:uwebsockets"><img src="https://oss-fuzz-build-logs.storage.googleapis.com/badges/uwebsockets.svg" /></a> <img src="https://img.shields.io/badge/downloads-70%20million-green" /> <img src="https://img.shields.io/badge/established-in%202016-green" />

</div>
<br><br>

### :zap: Simple performance

µWebSockets.js is a web server bypass for Node.js that reimplements eventing, networking, encryption, web protocols, routing and pub/sub in highly optimized C++. As such, µWebSockets.js delivers web serving for Node.js, **[8.5x that of Fastify](https://alexhultman.medium.com/serving-100k-requests-second-from-a-fanless-raspberry-pi-4-over-ethernet-fdd2c2e05a1e)** and at least **[10x that of Socket.IO](https://medium.com/swlh/100k-secure-websockets-with-raspberry-pi-4-1ba5d2127a23)**. It is also the built-in **[web server of Bun](https://bun.sh/)**.

- Browse the [documentation](https://unetworking.github.io/uwebsockets/generated/) and see the [main repo](https://github.com/NPM-Package-Jaykumar/uWebSockets). There are tons of [examples](examples) but here's the gist of it all:

Example 1:

```javascript
/* Non-SSL is simply App() */
require("uwebsockets")
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

Example 2:

```javascript
const uWS = require("uwebsockets");

const WS_INSTANCES = {};

// Below is a sample UWS server that listens for WebSocket connections and handles messages
// from clients. It also includes a simple authentication mechanism based on a query parameter.
// This is a basic example and should be adapted to your specific use case and security requirements.
// This example uses uwebsockets for WebSocket handling.
// You can install uwebsockets using npm:
// npm install uwebsockets
// Note: Make sure to replace the placeholder code with your actual logic.

const wsApp = uWS.App().ws("/*", {
  // Options for WebSocket server
  compression: 0, // No compression
  maxPayloadLength: 16 * 1024 * 1024, // 16 MB max payload size
  idleTimeout: 8, // 8 seconds idle timeout

  upgrade: (res, req, context) => {
    // Check if the request has a valid "channel_id" query parameter
    const channel_id = req.getQuery("channel_id");

    // Check if the channel_id is valid (you can implement your own validation logic). below is an example
    if (!channel_id) {
      // Invalid channel_id, send a 400 Bad Request response
      res
        .writeStatus("400 Bad Request! missing channel_id in query parameter")
        .end();
      return;
    }

    // Store the channel_id in the WebSocket connection
    res.upgrade(
      { channel_id },
      req.getHeader("sec-websocket-key"),
      req.getHeader("sec-websocket-protocol"),
      req.getHeader("sec-websocket-extensions"),
      context
    );
  },

  open: (ws) => {
    // Check if the channel_id is already connected
    const channel_id = ws.channel_id;

    // Store the WebSocket connection in the WS_INSTANCES object
    WS_INSTANCES[channel_id] = WS_INSTANCES[channel_id] || [];
    WS_INSTANCES[channel_id].push(ws);

    // Send a welcome message to the client
    const welcomePayload = {
      event: "welcome",
      message: `Welcome ${channel_id} to the WebSocket server!`,
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(welcomePayload));
  },

  message: (ws, message) => {
    try {
      // Parse the message and handle it
      const channel_id = ws.channel_id;

      // Buffer.from(message).toString() is used to convert the message to a string
      // This is necessary because uwebsockets may send binary messages
      // If you are sending text messages, you can directly use message.toString()
      // If you are sending binary messages, you may need to convert them to a string first, Buffer.from(message).toString()
      const msg = Buffer.from(message).toString();
      const parsedMsg = JSON.parse(msg);

      // Payload to be sent to the channel_id
      // You can customize the payload structure based on your requirements
      // For example, you can include the channel_id, event type, and data
      const payload = {
        event: "broadcast",
        from: channel_id,
        data: parsedMsg,
        timestamp: Date.now(),
      };

      // Example: Echo the message back to the same user (or broadcast as needed)
      ws.send(JSON.stringify(payload));
    } catch (error) {
      // Handle errors that occur during message processing
      // For example, if the message is not a valid JSON string or if there is an error in your logic
      // You can send an error message back to the client
      // and log the error for debugging purposes
      // Buffer.from(message).toString() is used to convert the message to a string
      // This is necessary because uwebsockets may send binary messages
      // If you are sending text messages, you can directly use message.toString()
      const msg = Buffer.from(message).toString();

      // error payload to be sent to the channel_id
      // You can customize the error payload structure based on your requirements
      const errorPayload = {
        event: "error",
        from: ws.channel_id,
        message: error.message,
        data: JSON.stringify(msg),
        timestamp: Date.now(),
      };

      // Send the error message back to the client
      ws.send(JSON.stringify(errorPayload));
      console.error("Error processing message:", {
        error,
        message: JSON.stringify(msg),
        ws: ws.channel_id,
      });
    }
  },
  close: (ws) => {
    // Handle WebSocket disconnection
    const channel_id = ws.channel_id;

    // Remove the WebSocket connection from the WS_INSTANCES object
    // This is done by filtering out the closed connection from the array of connections for the channel_id
    // If there are no more connections for the channel_id, delete the channel_id entry from WS_INSTANCES
    // This ensures that the server does not keep track of closed connections
    // and helps to free up resources
    WS_INSTANCES[channel_id] =
      WS_INSTANCES[channel_id]?.filter((conn) => conn !== ws) || [];
    if (WS_INSTANCES[channel_id].length === 0) delete WS_INSTANCES[channel_id];
  },
});

// Start the WebSocket server
// Listen using the properly defined wsApp instance
wsApp.listen(9001, (token) => {
  if (token) {
    console.log(`WebSocket listening on ws://localhost:${9001}`);
  } else {
    console.error(`Failed to listen on port ${9001}`);
  }
});
// Note: Make sure to handle errors and edge cases in your production code.
// This example is a basic starting point and should be adapted to your specific use case.
// You can also implement additional features such as authentication, authorization, and message validation
// based on your requirements.
// For more information on uwebsockets, refer to the official documentation
```
