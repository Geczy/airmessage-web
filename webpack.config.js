/* eslint-env node */
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const path = require("path");
const fs = require("fs");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
// const ESLintPlugin = require("eslint-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

module.exports = (env) => ({
  entry: "./src/index.tsx",
  target: "web",
  mode: env.WEBPACK_SERVE ? "development" : "production",
  devtool: env.WEBPACK_SERVE ? "cheap-source-map" : "source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 8080,
    https: env.secure
      ? {
          key: fs.readFileSync("webpack.key"),
          cert: fs.readFileSync("webpack.crt"),
        }
      : undefined,
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "index.js",
    assetModuleFilename: "res/[hash][ext][query]",
    publicPath: "",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
        },
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        exclude: /\.module\.css$/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: true,
            },
          },
        ],
        include: /\.module\.css$/,
      },
      {
        test: /\.(svg)|(wav)$/,
        type: "asset/resource",
      },
      {
        test: /\.md$/,
        type: "asset/source",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      shared: path.resolve(__dirname, "src"),
    },
  },
  optimization: {
    usedExports: true,
  },
  plugins: [
    new Dotenv({ defaults: true }),
    new ForkTsCheckerWebpackPlugin(),
    new CopyPlugin({
      patterns: [{ from: "public" }],
    }),
    new webpack.DefinePlugin({
      "WPEnv.ENVIRONMENT": JSON.stringify(
        env.WEBPACK_SERVE ? "development" : "production"
      ),
      "WPEnv.PACKAGE_VERSION": JSON.stringify(process.env.npm_package_version),
      "WPEnv.RELEASE_HASH": '"undefined"',
      "WPEnv.BUILD_DATE": Date.now(),
    }),
  ].concat(!env.WEBPACK_SERVE ? new WorkboxPlugin.GenerateSW() : []),
});
