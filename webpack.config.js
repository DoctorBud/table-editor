var webpack = require('webpack');
var bourbon = require('node-bourbon').includePaths;
var _ = require('lodash');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

var nodeEnvironment = process.env.BUILD;
var dist = path.join(__dirname, 'docs');
var app = path.join(__dirname, 'app');
var bs = path.join(__dirname, 'node_modules/bootstrap');
var uigrid = path.join(__dirname, 'node_modules/angular-ui-grid');

var production = process.env.BUILD === 'production';

var useComponents = process.env.USE_COMPONENTS;

var entryFile = (useComponents ? './index.js' : './app.js');
var outputPath = (useComponents ? app : dist);
var outputFile = (useComponents ? './bundle.js' : './table-editor.js');

var config = {
  context: app,

  entry: entryFile,

  output: {
    path: outputPath,
    filename: outputFile
  },

  resolve: {
    root: app
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
    loaders: [
      {
        test: /\.css$/,
        loader: 'style!css'
      },

      {
        test: /\.scss$/,
        loader: 'style!css!sass?includePaths[]=' + bourbon
      },

      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      {
        // Reference: https://github.com/babel/babel-loader
        test: /\.js$/,
        loader: 'babel',
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
        loader: 'file',
        include: [bs, uigrid]
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
    contentBase: dist
  },
};

if (!useComponents) {
  config.plugins.push(
    new CopyWebpackPlugin([
        { from: '../README.md' },
        { from: '../examples', to: 'examples' }
    ]));
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: path.join(app, 'index.html'),
      inject: 'head',
      baseUrl: '/'
    }));
}

switch (nodeEnvironment) {
  case 'production':
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
      // Minify all javascript, switch loaders to minimizing mode
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: false,
        // mangle: false,
        mangle: {
          // except: ['$', '$scope', '$compile', '$timeout', '$rootScope', '$http',
          //           '$rootScopeProvider',
          //           '$location', '$state', '$q']
        },
        compress: {
          warnings: false
        }
      })
    );
    config.plugins.push(new webpack.optimize.DedupePlugin());
    config.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
    config.plugins.push(new webpack.optimize.CommonsChunkPlugin({name: 'vendor', minChunks: Infinity}));

    config.output.filename = '[name].js';

    config.entry = {
      bundle: entryFile,
      vendor: (useComponents ?
                      ['angular', 'angular-ui-router', 'lodash'] :
                      ['angular', 'lodash'])
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
