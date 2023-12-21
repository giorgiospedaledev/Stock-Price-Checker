"use strict";
const axios = require("axios");
const bcrypt = require("bcrypt");

module.exports = function (app) {
  const stocksAndIPs = {
    stock: {
      likes: 0,
      ips: [],
    },
  };

  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;

    let stockData;

    if (typeof stock == "string") {
      const response = await axios.get(
        `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
      );
      const { latestPrice } = response.data;

      //if There isn't a object propety for the stock then initialize it
      if (!stocksAndIPs[stock]) {
        stocksAndIPs[stock] = {
          likes: 0,
          ips: [],
        };
      }

      if (like) {
        const clientIp = req.socket.remoteAddress;

        const hash = await bcrypt.hash(clientIp, 13);

        if (!stocksAndIPs[stock].ips.include(hash)) {
          stocksAndIPs[stock].likes += 1;
          stocksAndIPs[stock].ips.push(hash);
        }
      }

      stockData = {
        stock,
        price: latestPrice,
        likes: stocksAndIPs[stock].likes,
      };
    } else if (typeof stock == "object") {
      stockData = [];
      for (let stockSymbol of stock) {
        const response = await axios.get(
          `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`
        );
        const { latestPrice } = response.data;
        if (!stocksAndIPs[stockSymbol]) {
          stocksAndIPs[stockSymbol] = {
            likes: 0,
            ips: [],
          };
        }

        if (like) {
          const clientIp = req.socket.remoteAddress;

          const hash = await bcrypt.hash(clientIp, 13);

          if (!stocksAndIPs[stockSymbol].ips.include(hash)) {
            stocksAndIPs[stockSymbol].likes += 1;
            stocksAndIPs[stockSymbol].ips.push(hash);
          }
        }
        stockData.push({
          stock: stockSymbol,
          price: latestPrice,
          likes: stocksAndIPs[stockSymbol].likes,
        });
      }
      stockData[0].rel_likes = stockData[0].likes - stockData[1].likes
      stockData[1].rel_likes = stockData[1].likes - stockData[0].likes 
      stockData[0].likes = undefined
      stockData[1].likes = undefined
    }
    res.json({ stockData: stockData });
  });
};
