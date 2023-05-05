const { getPosthtmlBemLinter } = require("pineglade-bemlinter");
const { getPosthtmlW3c } = require("pineglade-w3c");
const minifyHtml = require("htmlnano");

const getSourceName = (filename) =>
  filename.replace(/^.*pages(\\+|\/+)(.*)\.twig$/, "$2").replace(/\\/g, "/");

const isDev = process.argv.includes("--dev");

const plugins = [
  getPosthtmlW3c({
    forceOffline: true,
    getSourceName,
  }),
  getPosthtmlBemLinter({
    getSourceName,
  }),
];
if (isDev) {
  plugins.push(
    minifyHtml({ collapseWhitespace: "aggressive", minifySvg: false })
  );
}

module.exports = {
  plugins,
};