import path from "node:path";
import { spawnSync } from "node:child_process";
import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import HtmlMinimizerPlugin from "html-minimizer-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import { WebpackManifestPlugin } from "webpack-manifest-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import webpack from "webpack";

const __dirname = import.meta.dirname;

export default {
  entry: {
    index: "./src/index.tsx",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new WebpackManifestPlugin({
      basePath: "dist",
      publicPath: "",
      assetHookStage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
      generate: (seed, files, entries) => entries
    }),
    new CopyPlugin({
      patterns: [
        { from: "static", to: "" },
        { from: "worker", to: "" },
      ]
    }),
    {
      apply: compiler => {
        const name = "PreRenderingPlugin";
        compiler.hooks.thisCompilation.tap(name, compilation => {
          compilation.hooks.processAssets.tapAsync({
            name: name, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
          }, async (assets, callback) => {
            const manifest = assets["manifest.json"].source();
            console.log("Prerendering...");
            const proc = spawnSync("npx", ["tsx", "./src/prerender.tsx", manifest], { encoding: "utf-8" });
            console.error(proc.stderr);
            const result = JSON.parse(proc.stdout);
            for (const res of result) {
              compilation.emitAsset(res[0], new webpack.sources.RawSource(res[1]));
            }
            console.log("Prerendering Completed");
            callback();
          });
        });
      }
    }
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            passes: 5
          }
        }
      }),
      new HtmlMinimizerPlugin({
        minimizerOptions: {
          conservativeCollapse: false
        }
      }),
      new CssMinimizerPlugin()
    ]
  }
};
