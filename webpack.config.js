const path= require('path');

module.exports = {
    mode : "development",
    entry : "./public/scripts/react.js",
    output : {
        path : path.resolve("public", "dist"),
        filename: "qroom.bundle.js"
    }
};

module.exports = {
    mode : "development",
    entry : "./public/scripts/react.js",
    output : {
        path : path.resolve("public", "dist"),
        filename: "qroom.bundle.js"
    },
    watch : true,
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options : {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            }
        ]
    }
};