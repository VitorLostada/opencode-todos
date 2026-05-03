import type { TodoItem } from "./types";

export function formatTodoForPrompt(todo: TodoItem): string {
  return `- ${todo.tag}: ${todo.text} (${todo.file}:${todo.line})`;
}

export function formatTodosForPrompt(todos: readonly TodoItem[]): string {
  return `${todos.map(formatTodoForPrompt).join("\n")}\n`;
}
