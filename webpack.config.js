var webpack = require('webpack');
var _ = require('lodash');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

var nodeEnvironment = process.env.BUILD;
var dist = path.join(__dirname, 'docs');
var app = path.join(__dirname, 'app');
var bs = path.join(__dirname, 'node_modules/bootstrap');
var bss = path.join(__dirname, 'node_modules/bootstrap-sass');
var uigrid = path.join(__dirname, 'node_modules/angular-ui-grid');

var production = process.env.BUILD === 'production';
var debugMode = true;

var entryFile = './app.js';
var outputPath = dist;
var outputFile = './bundle.js';
var indexFile = 'index.html';

var config = {
  context: app,

  entry: entryFile,

  output: {
    path: outputPath,
    filename: outputFile
  },

  resolve: {
    modules: [
      app,
      'node_modules'
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),

    new webpack.DefinePlugin({
      'INCLUDE_ALL_MODULES': function includeAllModulesGlobalFn(modulesArray, application) {
        modulesArray.forEach(function executeModuleIncludesFn(moduleFn) {
            moduleFn(application);
        });
      },
      ENVIRONMENT: JSON.stringify(nodeEnvironment)
    })
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },

      {
        test: /\.scss$/,
        // loader: 'style!css!sass?includePaths[]=' + bootstrap
        loaders: [
          'style-loader',
          'css-loader?importLoaders=1',
          'postcss-loader',
          'sass-loader'
        ]
      },

      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      {
        // Reference: https://github.com/babel/babel-loader
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
            // https://github.com/babel/babel-loader#options
            cacheDirectory: true,
            presets: ['es2015']
        },
        exclude: /node_modules/,
        include: [app]
      },

      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|txt|ico)$/,
        loader: 'file-loader',
        include: [bs, bss, uigrid, app]
      },

      {
        test: /\.(html)$/,
        loader: 'html-loader',
        exclude: /node_modules/
      }
    ]
  },

  node: {
    fs: 'empty'
  },

  devServer: {
    inline: false,
    contentBase: dist,
    historyApiFallback: true
  },
};

config.plugins.push(
  new CopyWebpackPlugin([
      { from: '../README.md' },
      { from: '../examples', to: 'examples' }
  ]));

config.plugins.push(
  new HtmlWebpackPlugin({
    template: path.join(app, indexFile),
    inject: 'head',
    baseUrl: '/'
  }));

switch (nodeEnvironment) {
  case 'production':
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
      // Minify all javascript, switch loaders to minimizing mode
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: false,
        mangle: debugMode ?
                  false :
                  {
                    // except: ['$', '$scope', '$compile', '$timeout', '$rootScope', '$http',
                    //           '$rootScopeProvider',
                    //           '$location', '$state', '$q']
                  },
        compress: {
          warnings: false
        }
      })
    );
    config.plugins.push(new webpack.optimize.CommonsChunkPlugin({name: 'vendor', minChunks: Infinity}));

    config.output.filename = '[name].js';

    config.entry = {
      bundle: entryFile,
      vendor: ['angular', 'angular-ui-router', 'lodash']
    };
    config.devtool = 'source-map';
    break;

  case 'test':
    config.entry = entryFile;
    break;

  case 'development':
    config.entry = [entryFile, 'webpack/hot/dev-server'];
    config.devtool = 'source-map';
    break;

  default:
    console.warn('Unknown or Undefigned Node Environment. Please refer to package.json for available build commands.');
}

module.exports = config;
