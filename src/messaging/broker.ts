import WebSocket = require("ws");
import { IncomingMessage } from "http";
import * as cluster from "cluster";
import * as http from "http";
import * as os from "os";

class Broker {
  totalConnections = 0;
  private server: WebSocket.Server;
  public processMessage(message: any) {}

  clients: WebSocket[] = [];
  public start(port: number = 8083) {
    this.server = new WebSocket.Server({
      port,
      backlog: 20000,
      perMessageDeflate: {
        zlibDeflateOptions: {
          // See zlib defaults.
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed.
      }
    });

    this.server.on("connection", (s: WebSocket, r: IncomingMessage) => this.onConnection(s, r));
  }

  private onConnection(socket: WebSocket, request: IncomingMessage): void {
    socket.on("message", data => {
      // console.log(`${this.clients.indexOf(socket)}: ${data.toString()}`);
    });
  }
}

const numberOfCores = os.cpus().length;
(cluster as any).schedulingPolicy = cluster.SCHED_RR;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} started`);
  for (let i = 0; i < numberOfCores; i++) {
    cluster.fork();
  }
} else {
  let totalConnections = 0;
  const server = http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end(`Process ${process.pid} says hello!`);
    })
    .listen(8083);
  const wss = new WebSocket.Server({ server });
  wss.on("connection", (s: WebSocket, r: IncomingMessage) => {
    console.log(`Process ${process.pid} has: ${totalConnections++}`);
    s.on("message", data => {
      return;
    });
  });

  console.log(`Worker ${process.pid} started`);
}
