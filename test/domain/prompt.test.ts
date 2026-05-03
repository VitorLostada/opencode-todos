import { describe, expect, test } from "bun:test";
import { formatTodoForPrompt, formatTodosForPrompt } from "../../src/domain/prompt";
import type { TodoItem } from "../../src/domain/types";

const todo: TodoItem = {
  id: "src/app.ts:2:0",
  title: "wire this up",
  file: "src/app.ts",
  line: 2,
  tag: "TODO",
  text: "wire this up",
};

describe("formatTodoForPrompt", () => {
  test("formats a TODO with location", () => {
    expect(formatTodoForPrompt(todo)).toBe("- TODO: wire this up (src/app.ts:2)");
  });
});

describe("formatTodosForPrompt", () => {
  test("joins TODOs and preserves trailing newline", () => {
    expect(formatTodosForPrompt([todo])).toBe("- TODO: wire this up (src/app.ts:2)\n");
  });
});
