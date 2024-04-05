var auth = require("./auth.js");
var organization = require("./organization.js");
var profile = require("./profile.js");
var settings = require("./settings.js");
var device = require("./device.js");

const translations = {
  "lang": {
    "name": "English",
    "tip": "Toggle language"
  },
  "action": {
    "submit": "Submit",
    "continue": "Continue",
    "save": "Save",
    "cancel": "Cancel",
    "logout": "Log out"
  },
  "tip": {
    "success": {
      "submit": "Submit success"
    }
  },
  "common": {
    "profile": "Profile",
    "billing": "Billing",
    "settings": "Settings",
    "overview": "Overview",
    "organizations": "Organizations"
  },
  ...auth,
  ...organization,
  ...profile,
  ...settings,
  ...device
}

module.exports = translations;
