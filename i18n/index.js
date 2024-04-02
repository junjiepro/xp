var en = require("./en/translations.js");
var zh = require("./zh/translations.js");

const i18n = {
  translations: {
    en,
    zh,
  },
  defaultLang: "zh",
  useBrowserDefault: true,
  // optional property will default to "query" if not set
  languageDataStore: "localStorage",
};

module.exports = i18n;
