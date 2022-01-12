const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const Dotenv = require('dotenv-webpack');

console.log(`WEBPACK IS LOADING!!!!!!! in ${__dirname}`)

module.exports = {
    mode: 'development',
    entry: `${__dirname}/frontend/app.ts`,
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.json"
                    }
                }],
                exclude: [/node_modules/, /server.ts/]
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.ttf$/,
                use: ['file-loader']
            },
            { 
                test: /\.pug$/, 
                use: [{ loader: 'pug3-loader' }] 
            },

        ],
    },
//     optimization: {
//         splitChunks: {
//             cacheGroups: {
//                 monacoCommon: {
//                     test: /[\\/]node_modules[\\/]monaco\-editor/,
//                     name: 'monaco-editor-common',
//                     chunks: 'async'
//                 }
//             }
//         }
//    },
    plugins: [
        new MonacoWebpackPlugin({
            languages: ['markdown', 'javascript', 'typescript', 'r', 'shell']
        }),
        new HtmlWebpackPlugin({
            template: "./frontend/markup/index.pug",
            inject: 'body',
            filename: 'index.html'
        }),
        new MiniCssExtractPlugin({
            filename: "style.css"
        }),
        new MiniCssExtractPlugin({
            filename: "modal.css"
        }),
        new Dotenv()
    ],

    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            frontend: `${__dirname}/frontend`,
            backend: `${__dirname}/backend`
            
        }
    },

    output: {
        path: `${__dirname}/dist/`,
        filename: 'bundle.js'
    },

    devtool: 'inline-source-map',

    devServer: {
        static: { directory: './frontend/code' },
        port: 9000,
        open: false,
        hot: true
    }
}