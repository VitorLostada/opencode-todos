import { describe, expect, test } from "bun:test";
import { resolveProjectRoot } from "../../src/project/root";

describe("resolveProjectRoot", () => {
  test("prefers directory when present", () => {
    expect(
      resolveProjectRoot({
        worktree: "/repo/root",
        directory: "/repo/root/packages/plugin",
      }),
    ).toBe("/repo/root/packages/plugin");
  });

  test("falls back to worktree", () => {
    expect(
      resolveProjectRoot({
        worktree: "/repo/root",
        directory: "",
      }),
    ).toBe("/repo/root");
  });

  test("falls back to directory when worktree is filesystem root", () => {
    expect(
      resolveProjectRoot({
        worktree: "/",
        directory: "/Users/vitorlostada/Projects/bela",
      }),
    ).toBe("/Users/vitorlostada/Projects/bela");
  });

  test("returns undefined when only filesystem root paths are available", () => {
    expect(
      resolveProjectRoot({
        worktree: "/",
        directory: "/",
      }),
    ).toBeUndefined();
  });

  test("returns undefined when no path is available", () => {
    expect(
      resolveProjectRoot({
        worktree: "",
        directory: "",
      }),
    ).toBeUndefined();
  });
});
