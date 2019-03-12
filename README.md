# scss-variable

Generate css variables fro different css pre-processors. Mainly target for scss/sass.

## Installation

```bash
npm i -D scss-variable
#or
yarn add -D scss-variable
```

## Usage

Assume you have a `varaible.js` looks like this

```js
module.exports = {
  ns: {
    property: {
      a: "#fff",
      b: "#ccc"
    }
  }
};
```

Create another `scss-variable.js`

```js
const path = require("path");
const generateVariable = require("scss-variable");

generateVariable({
  src: path.resolve(__dirname, "path/to/variable.js"),
  dest: path.resolve(__dirname, "path/to/variable.scss")
});
```

Then run `node scss-variable`;

Output will look like this

```scss
// variable.scss
$ns-property-a: #fff;
$ns-property-b: #ccc;
```

## Advanced usage

### Scss map

```js
// in your variable.js
module.exports = {
  _map_: {
    ns: {
      case: {
        "font-size": "12px"
      }
    }
  }
};
```

Run `node scss-variable`

Output will look like this

```scss
$ns: (
  case: (
    font-size: 12px
  )
);
```

To use `!default`

```js
module.exports = {
  _map_: {
    ns: {
      default: true,
      case: {
        "font-size": "12px"
      }
    }
  }
};
```

Output will look like this

```scss
$ns: (
  case: (
    font-size: 12px
  )
) !default;
```

> map will be emitted after variables

> You can refer to your variables in your map

### Merge

`override` is used to provide a new object to merge with `src`

```js
const path = require("path");
const generateVariable = require("scss-variable");

generateVariable({
  src: path.resolve(__dirname, "path/to/variable.js"),
  dest: path.resolve(__dirname, "path/to/variable.scss"),
  override: {
    property: "value"
  }
});
```

You can merge variables as well as scss map

```js
// in variable.js
module.exports = {
  a: {
    p: "black"
  },
  _map_: {
    ns: {
      case: {
        "font-size": "12px"
      }
    }
  }
};
```

```js
// in your external override related js
module.exports = {
  a: {
    p: "red"
  },
  _map_: {
    ns: {
      case: {
        "font-size": "14px"
      }
    }
  }
};
```

```js
// in scss-variable.js
generateVariable({
  src: path.resolve(__dirname, "path/to/variable.js"),
  dest: path.resolve(__dirname, "path/to/variable.scss"),
  override: require("path/to/override/related/js")
});
```

Output will be:

```scss
$a-p: red;
$ns: (
  case: (
    font-size: 12px
  )
);
```

Viola!

In case you do not like nesting, flatten property key or even flatten map expression are supported

The case above can be rewritten as following

```js
// in your external override related js
module.exports = {
  "a-p": "red",
  "ns.case": {
    "font-size": "14px"
  }
};
```

## Configuration

### src

Source of your `variable`

### dest

Where to emit your file. **File extension is needed**!

> In other word, `less` or other syntax are possible and actually supported

### [override]

Object to override your `src`

### [prefix]

Default: `'$'`

String to use to prefix the variable (and map) assignment

Basically works like this

```js
`${prefix}${propertyName}`;
```

> `'@'` for less variables : )

### [semi]

Default: `true`

Whether to add semicolon at the end of variable assignment

### [assignToken]

Default: `':'`

As the name suggested, used for variable assignment

### [separator]

Default: `'-'`

String used to concat nested property names

```js
`${property}${separator}${property}`;
```

### [mapSeparator]

Default: `'.'`

When you write map structure as a single property in `override` (`ns.a.b.c`)

Only useful for `override`

```js
// in your variable.js

module.exports = {
  _map_: {
    ns: {
      a: {
        b: {
          "font-size": "12px"
        }
      }
    }
  }
};
```

In your `override`, you can refer the above map structure as following

```js
`ns${mapSeparator}a${mapSeparator}b`;
```

### [mapKey]

Default: `'_map_'`

Key to identify map object

Affected to both `src` and `override`

### [beforeBody]

Default: `''`

String inserted before generated content

```js
`${beforeBody}\n${generatedContent}`;
```

### [afterBody]

Default: `''`

String inserted after generated content

```js
`${generatedContent}\n${afterBody}`;
```

### [merge]

Default: `lodash.merge`

**Dangerous area**. Function used to merge `src` and `override`

Signature should look like `Object.assign`

## TODO

- [ ] watch mode
- [ ] cli
- [ ] webpack-loader
