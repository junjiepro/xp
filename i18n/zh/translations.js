var auth = require("./auth.js");
var organization = require("./organization.js");
var profile = require("./profile.js");
var settings = require("./settings.js");
var device = require("./device.js");

const translations = {
  "hello": "你好",
  "world": "世界",
  "lang": {
    "name": "中文",
    "tip": "切换语言"
  },
  "action": {
    "submit": "提交",
    "continue": "继续",
    "cancel": "取消",
    "logout": "登出"
  },
  "tip": {
    "success": {
      "submit": "提交成功"
    }
  },
  "common": {
    "profile": "简介",
    "billing": "账单",
    "settings": "设置",
    "overview": "概览",
    "organizations": "组织"
  },
  ...auth,
  ...organization,
  ...profile,
  ...settings,
  ...device,
}

module.exports = translations
