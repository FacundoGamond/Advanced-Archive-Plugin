//***************************** */
// Webpack configuration.
//***************************** */
const currenPath = __dirname;
const three = currenPath.split('/');
const localhost = 'http://' + three[three.indexOf('Local Sites') + 1] + '.local'

const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const cssnano = require('cssnano');
const {
    CleanWebpackPlugin
} = require('clean-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

//Live local server proxy
require('dotenv').config()

// JS Directory path.
const JS_DIR = path.resolve(__dirname, 'assets/js');

// BUILD Directory path.
const BUILD_DIR = path.resolve(__dirname, 'assets/build');

const entry = {
    'advanced-archive': [`./assets/js/index.js`, `./assets/scss/styles.scss`]
};

const output = {
    path: BUILD_DIR,
    publicPath: '/',
    filename: '[name].min.js'
}

const plugins = (argv) => [
    new CleanWebpackPlugin({
        cleanStaleWebpackAssets: ('production' === argv.mode)
    }),

    new MiniCssExtractPlugin({
        filename: '[name].min.css'
    }),

    new BrowserSyncPlugin({
        host: 'localhost',
        port: 3000,
        proxy: process.env.LOCAL_SERVER_URL || localhost, //Do not change this value! use .env-webpack to browser sync
        files: ["./**/*"],
        ignore: ["node_modules", "assets/build"]
    })
]

const rules = [{
        test: /\.js$/,
        include: [JS_DIR],
        exclude: /node_modules/,
        use: 'babel-loader'
    },
    {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
            MiniCssExtractPlugin.loader,
            {
                loader: 'css-loader',
                options: {
                    url: false
                }
            },
            'postcss-loader',
            'sass-loader',
        ]
    }
]

module.exports = (env, argv) => ({
    entry: entry,
    output: output,
    devtool: process.argv[3] == 'production' ? false : 'source-map',

    module: {
        rules: rules
    },

    devServer: {
        writeToDisk: true
    },

    optimization: {
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin({
                extractComments: false,
            })
        ]
    },

    plugins: plugins(argv),
    externals: {
        jquery: 'jQuery'
    },
    target: 'node'
})