import { writeFile, readFileSync } from "fs";
import merge from "lodash/merge";
import flow from "lodash/flow";
import set from "lodash/set";
import chokidar from "chokidar";

type VariableMap = { [key: string]: string | VariableMap };

const NAME: string = "scss-variable";

export interface Option {
  src: string;
  dest: string;
  assignToken?: string;
  prefix?: string;
  semi?: boolean;
  override?: VariableMap;
  beforeBody?: string;
  afterBody?: string;
  mapKey?: string;
  separator?: string;
  mapSeparator?: string;
  watch: boolean;
  merge?(target: VariableMap, ...source: VariableMap[]): VariableMap;
}

type BreakDownResult = [string, string][];

function breakDown(
  source: VariableMap,
  keyPath: string[] = [],
  separator: string = ""
): BreakDownResult {
  return Object.entries(source).reduce(
    (last: BreakDownResult, [key, value]: [string, string | VariableMap]) => {
      if (typeof value === "string") {
        // stop
        return [...last, [[...keyPath, key].join(separator), value]] as [
          string,
          string
        ][];
      } else {
        const result: BreakDownResult = breakDown(
          value,
          [...keyPath, key],
          separator
        );
        return last.concat(result);
      }
    },
    []
  );
}

function pairToObj(pair: BreakDownResult): { [key: string]: string } {
  return pair.reduce((last, [key, value]) => {
    return {
      ...last,
      [key]: value
    };
  }, {});
}

const flattenObj = flow([breakDown, pairToObj]);

function objToMap(object: VariableMap) {
  return JSON.stringify(object, null, 2)
    .replace(/{/g, "(")
    .replace(/}/g, ")")
    .replace(/"/g, "");
}

export default function generateVariable(option: Option) {
  const {
    src,
    dest,
    assignToken = ":",
    prefix = "$",
    semi = true,
    override,
    merge: customMerge,
    separator = "-",
    mapSeparator = ".",
    beforeBody = "",
    afterBody = "",
    mapKey = "_map_",
    watch = false
  } = option;

  const source: VariableMap = require(src);
  if (typeof source !== "object") {
    throw new Error(`${src} is not a valid source file`);
  }

  const source2Use = merge({}, source);

  // merge two parts
  // one is variables
  // one is map
  const map = source2Use[mapKey] as undefined | VariableMap;
  const mapToBeMerged: VariableMap = map || {};
  let overrideMapToBeMerged: VariableMap = {};
  if (map) {
    delete source2Use[mapKey];
  }
  const sourceVarsToBeMerged = flattenObj(source2Use, [], separator);
  let result = sourceVarsToBeMerged;
  // merge variables
  let overRide2Use = merge({}, override);
  if (overRide2Use) {
    const overrideMap = overRide2Use[mapKey];
    if (overrideMap) {
      overrideMapToBeMerged = overrideMap as VariableMap;
      delete overRide2Use[mapKey];
    }
    const overrideVarsToBeMerged = flattenObj(overRide2Use, [], separator);
    if (typeof customMerge === "function") {
      result = customMerge({}, sourceVarsToBeMerged, overrideVarsToBeMerged);
    } else {
      result = merge({}, sourceVarsToBeMerged, overrideVarsToBeMerged);
    }
  }

  // check key from override in source[mapKey]
  // source = { _map_: { map : { ns : { ns: "oldValue" } } } }
  // override = { map.ns.ns.key: "newValue" }
  if (map && overRide2Use) {
    const flattenSourceMap = flattenObj(map, [], mapSeparator);
    const flattenKeys: string[] = Object.keys(flattenSourceMap);
    const mapKeyAndPropNamePair: [string, string][] = flattenKeys.map(
      flattenKey => {
        const mapRelatedPart = flattenKey.split(mapSeparator).slice(0, -1);
        const propName: string = flattenKey.split(mapSeparator).slice(-1)[0];
        return [mapRelatedPart.join(mapSeparator), propName] as [
          string,
          string
        ];
      }
    );
    const mapsWriteInKey: [string, string][] = mapKeyAndPropNamePair.filter(
      ([mapKey]) => {
        return mapKey in overRide2Use;
      }
    );
    if (mapsWriteInKey.length) {
      const extraOverrideMap = mapsWriteInKey.reduce((last, [mapKey]) => {
        set(last, mapKey.split(mapSeparator).join("."), overRide2Use[mapKey]);
        return last;
      }, {});
      // since mapKey is only useful for map merge
      // delete all of them from the final result
      mapKeyAndPropNamePair.forEach(([mapKey, propName]) => {
        delete result[[mapKey, propName].join(separator)];
      });
      // update overrideMap
      overrideMapToBeMerged = merge(
        {},
        overrideMapToBeMerged,
        extraOverrideMap
      );
    }
  }
  // merge map
  const mergedMap = merge({}, mapToBeMerged, overrideMapToBeMerged);
  const mapResult: string = Object.entries(mergedMap).reduce(
    (last, [key, value]) => {
      // set up !default for map
      let suffix: string = "";
      if (typeof value === "object" && value.default) {
        suffix = " !default;";
        delete value.default;
      }
      return (
        last + `${prefix}${key}: ${objToMap(value as VariableMap)}${suffix}\n`
      );
    },
    "\n"
  );

  const resultString: string = Object.entries(result).reduce(
    (last, [key, value]) => {
      return last + `${prefix}${key}${assignToken}${value}${semi ? ";" : ""}\n`;
    },
    ""
  );

  // watch mode
  if (watch) {
    console.log(`[${NAME}]: watching...`);
    const watcher = chokidar.watch(src);
    watcher.on("change", () => {
      // require fresh module every time
      delete require.cache[require.resolve(src)];
      console.log(`[${NAME}]: source changed, recompile`);
      generateVariable({ ...option, watch: false });
    });
  }

  return writeFile(
    dest,
    `${beforeBody}\n${resultString}\n${mapResult}\n${afterBody}`,
    err => {
      if (err) {
        console.warn(err);
      }
    }
  );
}
