/**
 * Backend Imports
 */
const express = require("express");

/**
 * Server Imports
 */
const http = require("http");
const { Server } = require("socket.io");

/**
 * Huddly imports
 */
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

/**If we have an environment
 * port, it can be used; if not,
 * we will use the default 4001
 */
const port = process.env.PORT || 4001;
const index = require("./routes/index");

/**
 * Create app using express backend.
 */
const app = express();
app.use(index);

/**
 * Generate the server, while passing
 * the new express object to it.
 */
const server = http.createServer(app);

/**
 * Creating a new socket using
 * the server.
 */
const io = new Server(server, {
  cors: {
    origin: 'http://127.0.0.1:3000',
  }
});

/**
 * Instantiate Huddly SDKs
 */
const usbApi = new HuddlyDeviceAPIUSB();
const sdk = new HuddlySdk(usbApi);

sdk.init();

let cameraManager;
sdk.on('ATTACH', (newDevice) => {
  cameraManager = newDevice;
  cameraManager.getInfo().then(console.log);
});

sdk.on('DETACH', (serial) => {
  cameraManager = null;
});

/**
 * Server Code
 */

io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
  });
});

function emitChanges(value) {
  value = JSON.stringify(value);
  io.emit("FromAPI", value);
}

function sendChanges() {
  if (cameraManager == null) {
    emitChanges({cameraConnected: false});
  } else {
    cameraManager.getInfo().then(emitChanges).catch((result) => {
      console.log(`The promise was unexpectedly rejected: ${result}`);
    });
  }
}

interval = setInterval(() => sendChanges(), 1000);

server.listen(port, () => console.log(`Listening on port ${port} !`));