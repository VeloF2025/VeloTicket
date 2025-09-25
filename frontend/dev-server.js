const express = require('express');
const path = require('path');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const config = require('./webpack.config.dev.js');

const app = express();
const compiler = webpack(config);

const PORT = process.env.PORT || 3030;
const HOST = process.env.HOST || 'localhost';

// Webpack middleware
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  stats: {
    colors: true,
    chunks: false
  }
}));

// Hot reload middleware
app.use(webpackHotMiddleware(compiler));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// All other requests go to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Server running at http://${HOST}:${PORT}`);
});