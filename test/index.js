const generateVariable = require("../dist");
const path = require("path");

const override = {
  "ns-size-large": "20px",
  "ns-color-normal": "#444",
  _map_: {
    mapNS: {
      size: {
        normal: {
          "font-size": "100px"
        }
      }
    }
  },
  "mapNS.size.small": {
    "font-size": "11px"
  }
};

generateVariable({
  src: path.resolve(__dirname, "variable.js"),
  dest: path.resolve(__dirname, "variable.scss"),
  override
});
