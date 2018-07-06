const path = require('path');

const webpack = require('webpack');  

module.exports = {
  entry: './zbus.js',
  output: {
    filename: 'zbus.min.js',
    path: path.resolve(__dirname, '')
  }, 
  plugins: [
    new webpack.IgnorePlugin(/ws/),  
  ]
};