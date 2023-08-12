import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import curd from "..";

describe("@acme/curd fali", async () => {
  const lib = await curd.library.create({
    name: faker.lorem.word(),
    dir: faker.system.filePath(),
    type: "eagle",
  });

  test("Create and get", async () => {
    await curd.fail.upsert({
      libraryId: lib.id,
      path: faker.system.filePath(),
      type: "trash",
    });

    await curd.fail.upsert({
      libraryId: lib.id,
      path: faker.system.filePath(),
      type: "json-error",
    });

    const fails = await curd.fail.get({ libraryId: lib.id });
    expect(fails).toHaveLength(2);
  });

  test("delete", async () => {
    await curd.fail.delete({ libraryId: lib.id });
    const fails = await curd.fail.get({ libraryId: lib.id });
    expect(fails).toHaveLength(0);
  });
});
