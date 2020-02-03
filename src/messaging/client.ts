import WebSocket = require("ws");
let on = 0;
function connect() {
  const ws = new WebSocket("ws://localhost:8083", {
    headers: {
      authorization: "teste"
    }
  });

  ws.on("open", function open() {
    setInterval(() => ws.send("something"), 10000);
    on++;
    console.log(`Connecttion: ${on}`);
    if (on > 16000) {
      setInterval(() => connect(), 1000);
    } else {
      connect();
    }
  });
}

connect();
