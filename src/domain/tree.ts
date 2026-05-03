import type { TodoItem, TodoTreeRow } from "./types";

export function buildTodoTreeRows(items: readonly TodoItem[]): readonly TodoTreeRow[] {
  const rows: TodoTreeRow[] = [];
  const seenFolders = new Set<string>();
  const seenFiles = new Set<string>();
  const sortedItems = [...items].sort((a, b) => {
    const fileOrder = a.file.localeCompare(b.file);
    if (fileOrder !== 0) return fileOrder;
    return a.line - b.line;
  });

  for (const item of sortedItems) {
    const parts = item.file.split("/");
    const fileName = parts.pop() ?? item.file;
    let folderPath = "";

    parts.forEach((part, index) => {
      folderPath = folderPath ? `${folderPath}/${part}` : part;
      if (seenFolders.has(folderPath)) return;

      seenFolders.add(folderPath);
      rows.push({
        kind: "folder",
        id: `folder:${folderPath}`,
        depth: index,
        name: `${part}/`,
      });
    });

    if (!seenFiles.has(item.file)) {
      seenFiles.add(item.file);
      rows.push({
        kind: "file",
        id: `file:${item.file}`,
        depth: parts.length,
        name: fileName,
        file: item.file,
      });
    }

    rows.push({
      kind: "todo",
      id: item.id,
      depth: parts.length + 1,
      item,
    });
  }

  return rows;
}

export function getPreviousTodoRowIndex(
  rows: readonly TodoTreeRow[],
  currentIndex: number,
): number {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    if (rows[index]?.kind === "todo") return index;
  }

  return Math.max(0, currentIndex);
}

export function getNextTodoRowIndex(rows: readonly TodoTreeRow[], currentIndex: number): number {
  for (let index = currentIndex + 1; index < rows.length; index += 1) {
    if (rows[index]?.kind === "todo") return index;
  }

  return Math.max(0, currentIndex);
}
