const express = require('express');

const PORT = parseInt(process.env.APP_PORT || '5000', 10);

const app = express();

app.use(express.json());

app.listen(PORT, (err) => {
  if (err) {
    console.error('Something bad happened');
  } else {
    console.log(`app is listening on port ${PORT}`);
  }
});

// load all routes from the file routes/index.js
const router = require('./routes/index');

app.use(router);

module.exports = app;
