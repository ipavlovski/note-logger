const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    mode: 'development',
    entry: './src/app.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },

            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }, {
                test: /\.ttf$/,
                use: ['file-loader']
            }

        ],
    },
    plugins: [
        new MonacoWebpackPlugin(
            {
                languages: ['markdown', 'javascript', 'typescript', 'r', 'shell']
            }
        ),
        // new HtmlWebpackPlugin({
        //     title: "Hot Module Replacement"
        // })
    ],

    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            src: path.resolve(__dirname, 'src')
        }
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js'
    },
    devtool: 'inline-source-map',
    devServer: {
        static: './public',
        port: 9000,
        open: false,
        hot: true
    },
};