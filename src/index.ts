import { writeFile } from "fs";
import merge from "lodash/merge";
type VariableMap = { [key: string]: string | VariableMap };

interface Option {
  src: string;
  dest: string;
  assignToken?: string;
  prefix?: string;
  semi?: boolean;
  override?: VariableMap;
  merge?(target: VariableMap, ...source: VariableMap[]): VariableMap;
}

type BreakDownResult = [string, string][];
function breakDown(
  source: VariableMap,
  keyPath: string[] = []
): BreakDownResult {
  return Object.entries(source).reduce(
    // @ts-ignore
    (last: BreakDownResult, [key, value]: [string, string | VariableMap]) => {
      if (typeof value === "string") {
        // stop
        return [...last, [[...keyPath, key].join(""), value]];
      } else {
        const result: BreakDownResult = breakDown(value, [...keyPath, key]);
        return [...last];
      }
    },
    []
  );
}

export default function generateVariable(option: Option) {
  const {
    src,
    dest,
    assignToken = ":",
    prefix = "$",
    semi = true,
    override,
    merge: customMerge
  } = option;

  const source: VariableMap = require(src);
  if (typeof source !== "object") {
    throw new Error(`${src} is not a valid source file`);
  }
  let result: VariableMap = source;
  if (override) {
    if (typeof customMerge === "function") {
      result = customMerge({}, source, override);
    } else {
      result = merge({}, source, override);
    }
  }

  const resultPair = breakDown(result);
  const resultString: string = resultPair.reduce((last, [key, value]) => {
    return last + `${prefix}${key}${assignToken}${value}${semi ? ";" : ""}\n`;
  }, "");
  return writeFile(dest, resultString, (err) => {
    if (err) {
      console.warn(err)
    }
  });
}
