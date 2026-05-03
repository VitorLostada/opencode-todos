import { describe, expect, test } from "bun:test";
import { DEFAULT_MAX_FILE_BYTES, parseTodosPluginOptions } from "../../src/config/plugin";

describe("parseTodosPluginOptions", () => {
  test("returns defaults", () => {
    const options = parseTodosPluginOptions(undefined);
    expect(options.tags).toContain("TODO");
    expect(options.ignoredDirectories).toContain("node_modules");
    expect(options.includeExtensions).toContain(".ts");
    expect(options.includeFilenames).toContain("Dockerfile");
    expect(options.maxFileBytes).toBe(DEFAULT_MAX_FILE_BYTES);
  });

  test("normalizes custom options", () => {
    expect(
      parseTodosPluginOptions({
        tags: ["todo", "TODO", "fix"],
        ignoredDirectories: ["tmp", "tmp"],
        includeExtensions: [".TS", ".tsx"],
        includeFilenames: ["Justfile"],
        maxFileBytes: 100,
      }),
    ).toEqual({
      tags: ["TODO", "FIX"],
      ignoredDirectories: ["tmp"],
      includeExtensions: [".ts", ".tsx"],
      includeFilenames: ["Justfile"],
      maxFileBytes: 100,
    });
  });

  test("rejects invalid options", () => {
    expect(() => parseTodosPluginOptions({ tags: [] })).toThrow();
    expect(() => parseTodosPluginOptions({ includeExtensions: ["ts"] })).toThrow();
    expect(() => parseTodosPluginOptions({ maxFileBytes: 0 })).toThrow();
  });
});
