const port = global.config.discovery_port
const app_port = global.config.app_port
const cast_address = global.config.discovery_cast_addr
const ip_addr = global.ip.address()
const server_name = global.config.server_name

const dgram = require("dgram");
const process = require("process");

const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

console.log(ip_addr);
if (ip_addr != '127.0.0.1' && ip_addr != '0.0.0.0') {
  socket.bind(port);

  function sendMessage() {
    const message = Buffer.from(`SPYFALL_SERVER,${ip_addr},${app_port},${server_name}`);
    socket.send(message, 0, message.length, port, cast_address, function() {});
  }

  socket.on("listening", () => {
    socket.addMembership(cast_address);
    setInterval(sendMessage, 2500);
    console.log(
      `Started discovery session on ${cast_address}:${port}`
    );
  });
} else {
  console.log('Cannot start discovery on localhost');
}
