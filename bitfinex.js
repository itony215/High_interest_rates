
const ws = require("ws");
const w = new ws("wss://api-pub.bitfinex.com/ws/2");
const fetch = require('node-fetch');


function handleUpdateRate() {
  const symbolByChanID = {};

  return (parse) => {
    let nextRate = null;

    if (parse.chanId) {
      symbolByChanID[parse.chanId] = parse.symbol;
    }

    if (Array.isArray(parse[1])) {
      nextRate = parse[1][0][3];
    }

    if (Array.isArray(parse[2])) {
      nextRate = parse[2][3];
    }

    if (nextRate) {
      const symbol = symbolByChanID[parse[0]];
      const rate = nextRate * 36500;

      console.log({ symbol, rate });

      if (rate > 14) {
        const lineNotifyToken = ''; // Replace with your Line Notify Token
        let message = `Bitfinex出高利: ${symbol} ${rate.toFixed(2)}`;
        fetch('https://notify-api.line.me/api/notify', {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${lineNotifyToken}`
          },
          body: `message=${message}`,
          method: 'POST'
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
      }
    }
  };
}

const updateRate = handleUpdateRate();
const payload = { event: "subscribe", channel: "trades" };
const symbolAry = ["fUSD", "fUST"];

w.on("message", (msg) => {
  const parse = JSON.parse(msg);

  updateRate(parse);
});

w.on("open", () => {
  symbolAry.forEach((value) => {
    w.send(JSON.stringify({ ...payload, symbol: value }));
  });
});
