import { formatTodosForPrompt } from "./prompt";
import type { TodoItem, TodoTreeRow } from "./types";

export function getCurrentTodoId(
  rows: readonly TodoTreeRow[],
  selectedIndex: number,
): string | undefined {
  const currentRow = rows[selectedIndex];
  return currentRow?.kind === "todo" ? currentRow.item.id : undefined;
}

export function toggleTodoSelection(selectedIds: ReadonlySet<string>, todoId: string): Set<string> {
  const next = new Set<string>(selectedIds);
  if (next.has(todoId)) {
    next.delete(todoId);
  } else {
    next.add(todoId);
  }
  return next;
}

export function selectAllTodoIds(items: readonly TodoItem[]): Set<string> {
  return new Set(items.map((item) => item.id));
}

export function getSelectionTodoIds(
  selectedIds: ReadonlySet<string>,
  fallbackTodoId: string,
): ReadonlySet<string> {
  return selectedIds.size > 0 ? selectedIds : new Set([fallbackTodoId]);
}

export function formatSelectedTodosForPrompt(
  items: readonly TodoItem[],
  selectedIds: ReadonlySet<string>,
): string {
  return formatTodosForPrompt(items.filter((todo) => selectedIds.has(todo.id)));
}
