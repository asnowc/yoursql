import { SqlValuesCreator } from "@asnc/yoursql";
import { expect, test } from "vitest";

let v = new SqlValuesCreator();

test("objectToValues-auto-columns", function () {
  const s = v.objectToValues({ ab: 1, cd: 3, ef: undefined });
  expect(s).toMatchSnapshot();
});

test("objectListToValuesList-auto-columns", function () {
  const s = v.objectListToValuesList([
    { ab: 1, cd: 3, mya: undefined },
    { ab: 2, cd: 4, ef: undefined },
    { ab: 2, cd: 4, maa: 99 },
  ]);
  expect(s, "ef、mya 被忽略").toMatchSnapshot();
  const s2 = v.objectListToValuesList([
    { ab: 1, cd: 3, ef: undefined },
    { ab: 2, cd: 4, ef: undefined },
  ]);
  expect(s2, "ef被忽略").toMatchSnapshot();
});
test("objectListToValuesList-select-keys", function () {
  const s = v.objectListToValuesList(
    [
      { ab: 1, cd: 3, ef: 7 },
      { ab: 2, cd: 4, ef: 9 },
    ],
    ["ab", "cd"]
  );
  expect(s).toMatchSnapshot();
});
test("objectListToValuesList-define-type", function () {
  const s = v.objectListToValuesList(
    [
      { ab: 1, cd: 3, ef: 7 },
      { ab: 2, cd: 4, ef: 9 },
    ],
    { ab: "INT", cd: undefined }
  );
  expect(s).toMatchSnapshot();
});
