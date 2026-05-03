import { describe, expect, test } from "bun:test";
import {
  buildTodoTreeRows,
  getNextTodoRowIndex,
  getPreviousTodoRowIndex,
} from "../../src/domain/tree";
import { formatTreeLabel, formatTreePrefix } from "../../src/ui/layout";
import { getListStatus } from "../../src/domain/status";
import type { TodoItem } from "../../src/domain/types";

const items: readonly TodoItem[] = [
  {
    id: "src/z.ts:10:0",
    title: "later",
    file: "src/z.ts",
    line: 10,
    tag: "TODO",
    text: "later",
  },
  {
    id: "src/a.ts:2:1",
    title: "first",
    file: "src/a.ts",
    line: 2,
    tag: "FIXME",
    text: "first",
  },
];

describe("buildTodoTreeRows", () => {
  test("sorts by file and line and creates folder/file/todo rows", () => {
    expect(buildTodoTreeRows(items)).toMatchObject([
      { kind: "folder", id: "folder:src", depth: 0, name: "src/" },
      { kind: "file", id: "file:src/a.ts", depth: 1, name: "a.ts" },
      { kind: "todo", id: "src/a.ts:2:1", depth: 2 },
      { kind: "file", id: "file:src/z.ts", depth: 1, name: "z.ts" },
      { kind: "todo", id: "src/z.ts:10:0", depth: 2 },
    ]);
  });
});

describe("todo row navigation", () => {
  const rows = buildTodoTreeRows(items);

  test("moves to the next TODO row", () => {
    expect(getNextTodoRowIndex(rows, -1)).toBe(2);
    expect(getNextTodoRowIndex(rows, 2)).toBe(4);
    expect(getNextTodoRowIndex(rows, 4)).toBe(4);
  });

  test("moves to the previous TODO row", () => {
    expect(getPreviousTodoRowIndex(rows, 4)).toBe(2);
    expect(getPreviousTodoRowIndex(rows, 2)).toBe(2);
  });
});

describe("row formatting", () => {
  test("formats prefixes and labels", () => {
    const rows = buildTodoTreeRows(items);
    expect(formatTreePrefix(2, true, "todo")).toBe("\u203A   ");
    expect(formatTreeLabel(rows[0]!)).toBe("src/");
    expect(formatTreeLabel(rows[2]!)).toBe("first");
  });
});

describe("getListStatus", () => {
  test("returns loading, error, empty, and ready status", () => {
    expect(getListStatus("loading", undefined, 0)).toEqual({
      title: "Scanning TODO comments...",
      error: false,
    });
    expect(getListStatus("error", "boom", 0)).toEqual({ title: "boom", error: true });
    expect(getListStatus("ready", undefined, 0)).toEqual({
      title: "No TODO comments found",
      error: false,
    });
    expect(getListStatus("ready", undefined, 1)).toBeUndefined();
  });
});
