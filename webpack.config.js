const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = {
    mode: 'development',
    entry: `${__dirname}/frontend/code/app.ts`,
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [{ loader: 'ts-loader'}],
                exclude: [/node_modules/, /server.ts/]
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'style-loader'],
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
        })
    ],

    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            frontend: `${__dirname}/frontend`
            
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