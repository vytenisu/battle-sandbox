const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const LicenseWebpackPlugin =
  require('license-webpack-plugin').LicenseWebpackPlugin

const exportedConfig = {
  entry: __dirname + '/index.ts',
  target: 'node',
  node: {
    __dirname: false,
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
  },
  mode: 'production',
  externals: [nodeExternals()],
  plugins: [new LicenseWebpackPlugin()],
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },
  output: {
    path: __dirname + '/dist',
    filename: 'index.js',
    sourceMapFilename: 'index.js.map',
    libraryTarget: 'umd',
  },
  resolveLoader: {
    modules: [__dirname + '/node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: __dirname + '/tsconfig.json',
            },
          },
        ],
      },
      {
        test: /\.json$/,
        use: ['json-loader'],
        type: 'javascript/auto',
      },
    ],
  },
}

module.exports = exportedConfig
