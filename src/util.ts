/**
 * @public
 * @param keepUndefinedKey - 是否保留值为 undefined 的 key
 */
export function getObjectListKeys(objectList: any[], keepUndefinedKey?: boolean): string[] {
    let keys = new Set<string>();
    for (let i = 0; i < objectList.length; i++) {
      let obj = objectList[i];
      let hasKeys = Object.keys(obj);
      let k: string;
      for (let j = 0; j < hasKeys.length; j++) {
        k = hasKeys[j];
        if (typeof k !== "string") continue;
        if (!keepUndefinedKey && obj[k] === undefined) continue;
        keys.add(k);
      }
    }
    return Array.from(keys);
  }
  