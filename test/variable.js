module.exports = {
  ns: {
    size: {
      large: "18px",
      normal: "14px",
      small: "12px"
    },
    color: {
      normal: "#fff",
      small: "#222"
    }
  },
  _map_: {
    mapNS: {
      default: true,
      size: {
        normal: {
          "font-size": "18px",
          height: "32px",
          "padding-horizontal": "16px",
          color: "$ns-color-normal",
          default: true
        },
        small: {
          "font-size": "12px",
          height: "24px",
          "padding-horizontal": "8px",
          color: "$ns-color-small"
        }
      }
    }
  }
};
