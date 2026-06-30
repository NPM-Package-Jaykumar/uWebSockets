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

Example 1 (Basic Echo & HTTP): 
*Ideal for simple, single-instance applications that just need basic WebSocket echoing and HTTP serving.*

> **💡 Note on `.App()` vs `.SSLApp()`:**
> - Use `.App()` to create a standard, unencrypted server (`http://` and `ws://`). This is standard for local testing or when deploying behind a cloud load balancer (like AWS or Render) that handles SSL termination for you.
> - Use `.SSLApp()` (shown below) to create a secure, encrypted server (`https://` and `wss://`). You only need this if your Node.js server is directly exposed to the public internet and you must manually provide SSL certificates (`key.pem` and `cert.pem`).

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

Example 2 (Authentication & Local Rooms): 
*Great for medium-scale, single-instance applications (like a local multiplayer game or small chat app) that require query parameter authentication and room-based broadcasting.*

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
    // Check if the request has a valid "channel_name" query parameter
    const channel_name = req.getQuery("channel_name");

    // Check if the channel_name is valid (you can implement your own validation logic). below is an example
    if (!channel_name) {
      // Invalid channel_name, send a 400 Bad Request response
      res
        .writeStatus("400 Bad Request! missing channel_name in query parameter")
        .end();
      return;
    }

    // Store the channel_name in the WebSocket connection
    res.upgrade(
      { channel_name },
      req.getHeader("sec-websocket-key"),
      req.getHeader("sec-websocket-protocol"),
      req.getHeader("sec-websocket-extensions"),
      context
    );
  },

  open: (ws) => {
    // Check if the channel_name is already connected
    const channel_name = ws.channel_name;

    // Store the WebSocket connection in the WS_INSTANCES object
    WS_INSTANCES[channel_name] = WS_INSTANCES[channel_name] || [];
    WS_INSTANCES[channel_name].push(ws);

    // Send a welcome message to the client
    const welcomePayload = {
      event: "welcome",
      message: `Welcome ${channel_name} to the WebSocket server!`,
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(welcomePayload));
  },

  message: (ws, message) => {
    try {
      // Parse the message and handle it
      const channel_name = ws.channel_name;

      // Buffer.from(message).toString() is used to convert the message to a string
      // This is necessary because uwebsockets may send binary messages
      // If you are sending text messages, you can directly use message.toString()
      // If you are sending binary messages, you may need to convert them to a string first, Buffer.from(message).toString()
      const msg = Buffer.from(message).toString();
      const parsedMsg = JSON.parse(msg);

      // Payload to be sent to the channel_name
      // You can customize the payload structure based on your requirements
      // For example, you can include the channel_name, event type, and data
      const payload = {
        event: "broadcast",
        from: channel_name,
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

      // error payload to be sent to the channel_name
      // You can customize the error payload structure based on your requirements
      const errorPayload = {
        event: "error",
        from: ws.channel_name,
        message: error.message,
        data: JSON.stringify(msg),
        timestamp: Date.now(),
      };

      // Send the error message back to the client
      ws.send(JSON.stringify(errorPayload));
      console.error("Error processing message:", {
        error,
        message: JSON.stringify(msg),
        ws: ws.channel_name,
      });
    }
  },
  close: (ws) => {
    // Handle WebSocket disconnection
    const channel_name = ws.channel_name;

    // Remove the WebSocket connection from the WS_INSTANCES object
    // This is done by filtering out the closed connection from the array of connections for the channel_name
    // If there are no more connections for the channel_name, delete the channel_name entry from WS_INSTANCES
    // This ensures that the server does not keep track of closed connections
    // and helps to free up resources
    WS_INSTANCES[channel_name] =
      WS_INSTANCES[channel_name]?.filter((conn) => conn !== ws) || [];
    if (WS_INSTANCES[channel_name].length === 0) delete WS_INSTANCES[channel_name];
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

Example 3 (Massive Scale with Redis Sharded Pub/Sub): 
*The architecture required for highly scalable, globally distributed applications like WhatsApp, Discord, or Snapchat.*

```javascript
const uWS = require("uwebsockets");
const Redis = require("ioredis"); // npm install ioredis

const WS_INSTANCES = {};

// Setup Redis Publisher and Subscriber for bridging

// Option 1: Standalone Setup
const redisConfig = {
  host: "127.0.0.1",
  port: 6379,
  // username: "my_username", // Optional: uncomment if your Redis requires a username
  // password: "my_password"  // Optional: uncomment if your Redis requires a password
};

const redisPub = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);

// Option 2: Cluster Setup
// If you are using a Redis Cluster, comment out the standalone setup above and uncomment this block:
/*
const clusterNodes = [
  { host: "127.0.0.1", port: 6379 },
  { host: "127.0.0.1", port: 6380 },
  { host: "127.0.0.1", port: 6381 },
];
const clusterOptions = {
  redisOptions: {
    // username: "my_username", // Optional: uncomment if your Redis requires a username
    // password: "my_password"  // Optional: uncomment if your Redis requires a password
  }
};
const redisPub = new Redis.Cluster(clusterNodes, clusterOptions);
const redisSub = new Redis.Cluster(clusterNodes, clusterOptions);
*/


// Listen for sharded messages from Redis and send to valid WebSocket instances
redisSub.on("smessage", (channel, message) => {
  try {
    // The channel argument tells us exactly which chat room this message is for!
    if (WS_INSTANCES[channel]) {
      WS_INSTANCES[channel].forEach((ws) => {
        ws.send(message);
      });
    }
  } catch (error) {
    console.error("Error processing Redis message:", error);
  }
});

const wsApp = uWS.App().ws("/*", {
  compression: 0,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 8,

  upgrade: (res, req, context) => {
    const channel_name = req.getQuery("channel_name");
    const user = req.getQuery("user");
    if (!channel_name || !user) {
      res.writeStatus("400 Bad Request! missing channel_name or user in query parameter").end();
      return;
    }
    res.upgrade({ channel_name, user }, req.getHeader("sec-websocket-key"), req.getHeader("sec-websocket-protocol"), req.getHeader("sec-websocket-extensions"), context);
  },

  open: (ws) => {
    const channel_name = ws.channel_name;
    
    // If this is the first local user in this channel, subscribe to it in Redis
    if (!WS_INSTANCES[channel_name]) {
      WS_INSTANCES[channel_name] = [];
      redisSub.ssubscribe(channel_name, (err) => {
        if (err) console.error(`Failed to subscribe to ${channel_name}:`, err);
      });
    }
    WS_INSTANCES[channel_name].push(ws);
    
    ws.send(JSON.stringify({ event: "welcome", message: `Welcome ${ws.user} to ${channel_name}!` }));
  },

  message: (ws, message) => {
    try {
      const msg = Buffer.from(message).toString();
      const parsedMsg = JSON.parse(msg);

      // Publish the incoming message to Redis instead of echoing directly.
      // This bridges the message across all Node.js instances!
      const payload = {
        event: "broadcast",
        from: ws.user,
        channel_name: parsedMsg.channel_name, // specify this if you want targeted delivery
        data: parsedMsg,
        timestamp: Date.now(),
      };

      // Uses spublish for Sharded Pub/Sub. ioredis automatically hashes channel_name to distribute load!
      redisPub.spublish(ws.channel_name, JSON.stringify(payload));
    } catch (error) {
      ws.send(JSON.stringify({ event: "error", message: error.message }));
    }
  },

  close: (ws) => {
    const channel_name = ws.channel_name;
    WS_INSTANCES[channel_name] = WS_INSTANCES[channel_name]?.filter((conn) => conn !== ws) || [];
    
    // If no local users are left in this channel, unsubscribe from Redis to save resources
    if (WS_INSTANCES[channel_name].length === 0) {
      delete WS_INSTANCES[channel_name];
      redisSub.sunsubscribe(channel_name, (err) => {
        if (err) console.error(`Failed to unsubscribe from ${channel_name}:`, err);
      });
    }
  },
});

wsApp.listen(9001, (token) => {
  if (token) {
    console.log("WebSocket listening on ws://localhost:9001");
  }
});
```

## Supported Node Versions

- Oldest supported Node.js version: `16`
- Supported Node.js versions: `16`, `18`, `20`, `21`, `22`, `24`, `25`
- Not supported: `17`, `19`, `23`

## Supported Docker Images

- `node:16-bullseye`, `node:16-bullseye-slim`
- `node:18-bullseye`, `node:18-bullseye-slim`
- `node:20-bullseye`, `node:20-bullseye-slim`, `node:20-bookworm`, `node:20-bookworm-slim`, `node:20-trixie`, `node:20-trixie-slim`
- `node:21-bookworm`, `node:21-bookworm-slim`, `node:21-trixie`, `node:21-trixie-slim`
- `node:22-trixie`, `node:22-trixie-slim`
- `node:24-trixie`, `node:24-trixie-slim`
- `node:25-trixie`, `node:25-trixie-slim`

## Local Ubuntu / Linux Support

- Linux support depends on `glibc`, not only Node.js version
- Node `16`, `18`, `20`, `21` work with the bundled older Linux builds
- Node `22`, `24`, `25` Linux builds require `glibc >= 2.38`
- Ubuntu `22.04` uses older `glibc`, so Node `22`, `24`, `25` may fail there
- Ubuntu `24.04` or newer is recommended for Node `22`, `24`, `25`
