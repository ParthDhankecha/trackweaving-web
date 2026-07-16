const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const port = 3005;
const compression = require('compression');

const app = express();

// compress all responses
app.use(compression());
//Enables cors request
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(path.join(__dirname, 'dist', 'trackweaving', 'browser')));

app.use(/.*/, function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'trackweaving', 'browser', 'index.html'));
});

app.listen(port, function () {
  console.log('Server running on ' + port);
});


module.exports = app;