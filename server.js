const express = require('express');

const server = express();

server.get('/', (req, res) => {
  res.send('Twitter Bot is alive!');
});

function keepAlive() {
  app.listen(3000, () => {
    console.log('Server is ready!');
  });
}

module.exports = keepAlive;
