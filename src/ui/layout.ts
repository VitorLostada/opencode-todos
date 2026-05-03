import type { TodoTreeRow } from "../domain/types";

export function formatTreePrefix(
  depth: number,
  highlighted: boolean,
  kind: TodoTreeRow["kind"],
): string {
  const marker = kind === "todo" ? (highlighted ? "\u203A " : "  ") : "  ";
  return `${marker}${" ".repeat(depth)}`;
}

export function formatTreeLabel(row: TodoTreeRow): string {
  if (row.kind === "folder") return row.name;
  if (row.kind === "file") return row.name;
  return row.item.title;
}

export function formatTodoCheckbox(multiSelected: boolean): string {
  return multiSelected ? "\u25FC" : "\u25FB";
}
