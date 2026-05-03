import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "bun:test";
import { parseTodosPluginOptions } from "../../src/config/plugin";
import { cleanTodoText, matchTodoComment } from "../../src/scanner/parser";
import { scanTodoComments } from "../../src/scanner";
import { isScannableFile, walkProjectFiles } from "../../src/scanner/walk";

let tempRoots: string[] = [];

async function createTempProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "opencode-todos-test-"));
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
  tempRoots = [];
});

describe("matchTodoComment", () => {
  const options = parseTodosPluginOptions(undefined);

  test("matches supported comment styles", () => {
    expect(matchTodoComment("// TODO: slash", options)?.text).toBe("slash");
    expect(matchTodoComment("# FIXME hash", options)?.tag).toBe("FIXME");
    expect(matchTodoComment("/* HACK block */", options)?.text).toBe("block ");
    expect(matchTodoComment(" * XXX continuation", options)?.text).toBe("continuation");
    expect(matchTodoComment("<!-- TODO html -->", options)?.text).toBe("html ");
    expect(matchTodoComment("-- TODO sql", options)?.text).toBe("sql");
    expect(matchTodoComment("; TODO lisp", options)?.text).toBe("lisp");
  });

  test("ignores non-TODO comments", () => {
    expect(matchTodoComment("// NOTE: not tracked", options)).toBeUndefined();
  });

  test("supports custom tags", () => {
    const customOptions = parseTodosPluginOptions({ tags: ["followup"] });
    expect(matchTodoComment("// FOLLOWUP: later", customOptions)).toEqual({
      tag: "FOLLOWUP",
      text: "later",
    });
    expect(matchTodoComment("// TODO: ignored", customOptions)).toBeUndefined();
  });
});

describe("cleanTodoText", () => {
  test("trims closing markers and fills empty descriptions", () => {
    expect(cleanTodoText("ship it */")).toBe("ship it");
    expect(cleanTodoText("ship it -->")).toBe("ship it");
    expect(cleanTodoText("   ")).toBe("No description");
  });
});

describe("isScannableFile", () => {
  const options = parseTodosPluginOptions(undefined);

  test("allows supported extensions and special filenames", () => {
    expect(isScannableFile("app.tsx", options)).toBe(true);
    expect(isScannableFile("Dockerfile", options)).toBe(true);
    expect(isScannableFile("image.png", options)).toBe(false);
  });
});

describe("walkProjectFiles", () => {
  test("walks deterministically and keeps .github visible", async () => {
    const root = await createTempProject();
    const options = parseTodosPluginOptions(undefined);
    await mkdir(join(root, ".github"));
    await mkdir(join(root, ".hidden"));
    await writeFile(join(root, "z.ts"), "// TODO z\n", "utf8");
    await writeFile(join(root, "a.ts"), "// TODO a\n", "utf8");
    await writeFile(join(root, ".github", "workflow.yml"), "# TODO ci\n", "utf8");
    await writeFile(join(root, ".hidden", "ignored.ts"), "// TODO hidden\n", "utf8");

    const files: string[] = [];
    for await (const filePath of walkProjectFiles(root, options)) {
      files.push(filePath.slice(root.length + 1));
    }

    expect(files).toEqual([".github/workflow.yml", "a.ts", "z.ts"]);
  });
});

describe("scanTodoComments", () => {
  test("scans supported files and ignores generated directories", async () => {
    const root = await createTempProject();
    const options = parseTodosPluginOptions(undefined);
    await mkdir(join(root, "src"));
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "src", "app.ts"), "// TODO: build app\nconst x = 1;\n", "utf8");
    await writeFile(join(root, "node_modules", "ignored.ts"), "// TODO: ignore me\n", "utf8");
    await writeFile(join(root, "image.png"), "// TODO: ignore extension\n", "utf8");

    expect(await scanTodoComments(root, options)).toEqual([
      {
        id: "src/app.ts:1:0",
        title: "build app",
        file: "src/app.ts",
        line: 1,
        tag: "TODO",
        text: "build app",
      },
    ]);
  });

  test("refuses to scan the filesystem root", async () => {
    await expect(scanTodoComments("/", parseTodosPluginOptions(undefined))).rejects.toThrow(
      "Refusing to scan filesystem root for TODO comments",
    );
  });

  test("honors custom tags and max file size", async () => {
    const root = await createTempProject();
    await writeFile(join(root, "small.ts"), "// FOLLOWUP: custom\n", "utf8");
    await writeFile(join(root, "large.ts"), "// FOLLOWUP: ignored by size\n", "utf8");

    expect(
      await scanTodoComments(
        root,
        parseTodosPluginOptions({
          tags: ["FOLLOWUP"],
          maxFileBytes: 20,
        }),
      ),
    ).toEqual([
      {
        id: "small.ts:1:0",
        title: "custom",
        file: "small.ts",
        line: 1,
        tag: "FOLLOWUP",
        text: "custom",
      },
    ]);
  });
});
