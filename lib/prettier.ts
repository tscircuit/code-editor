import * as parserBabel from "prettier/plugins/babel";
import * as parserEstree from "prettier/plugins/estree";
import * as parserTypeScript from "prettier/plugins/typescript";
import * as prettier from "./prettier";

// Configure prettier with your desired options
window.prettier = prettier;
window.prettierPlugins = {
  typescript: parserTypeScript,
  babel: parserBabel,
  estree: parserEstree
};

// Declare the types for the window object
declare global {
  interface Window {
    prettier: typeof prettier;
    prettierPlugins: {
      typescript: typeof parserTypeScript;
      babel: typeof parserBabel;
      estree: typeof parserEstree;
    };
  }
}