import { describe, expect, test } from "bun:test";
import {
  formatSelectedTodosForPrompt,
  getCurrentTodoId,
  getSelectionTodoIds,
  selectAllTodoIds,
  toggleTodoSelection,
} from "../../src/domain/actions";
import type { TodoItem, TodoTreeRow } from "../../src/domain/types";

const todo: TodoItem = {
  id: "src/app.ts:1:0",
  title: "ship",
  file: "src/app.ts",
  line: 1,
  tag: "TODO",
  text: "ship",
};

const rows: readonly TodoTreeRow[] = [
  { kind: "file", id: "file:src/app.ts", depth: 0, name: "app.ts", file: "src/app.ts" },
  { kind: "todo", id: todo.id, depth: 1, item: todo },
];

describe("todo actions", () => {
  test("gets current TODO id only from TODO rows", () => {
    expect(getCurrentTodoId(rows, 0)).toBeUndefined();
    expect(getCurrentTodoId(rows, 1)).toBe(todo.id);
  });

  test("toggles and selects TODO ids", () => {
    expect([...toggleTodoSelection(new Set(), todo.id)]).toEqual([todo.id]);
    expect([...toggleTodoSelection(new Set([todo.id]), todo.id)]).toEqual([]);
    expect([...selectAllTodoIds([todo])]).toEqual([todo.id]);
  });

  test("falls back to current TODO when no multi-selection exists", () => {
    expect([...getSelectionTodoIds(new Set(), todo.id)]).toEqual([todo.id]);
    expect([...getSelectionTodoIds(new Set(["other"]), todo.id)]).toEqual(["other"]);
  });

  test("formats selected TODOs for prompt", () => {
    expect(formatSelectedTodosForPrompt([todo], new Set([todo.id]))).toBe(
      "- TODO: ship (src/app.ts:1)\n",
    );
  });
});
