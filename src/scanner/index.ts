import { readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import { parseTodosPluginOptions, type TodosPluginOptions } from "../config/plugin";
import { cleanTodoText, matchTodoComment } from "./parser";
import type { TodoItem } from "../domain/types";
import { walkProjectFiles } from "./walk";

export async function scanTodoComments(
  projectRoot: string,
  options: TodosPluginOptions = parseTodosPluginOptions(undefined),
): Promise<readonly TodoItem[]> {
  if (path.resolve(projectRoot) === path.parse(path.resolve(projectRoot)).root) {
    throw new Error("Refusing to scan filesystem root for TODO comments");
  }

  const items: TodoItem[] = [];

  for await (const filePath of walkProjectFiles(projectRoot, options)) {
    const fileStats = await stat(filePath);
    if (fileStats.size > options.maxFileBytes) continue;

    const relativeFile = normalizeRelativePath(path.relative(projectRoot, filePath));
    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((lineText, index) => {
      const match = matchTodoComment(lineText, options);
      if (!match) return;

      const line = index + 1;
      const text = cleanTodoText(match.text);
      const tag = match.tag.toUpperCase();

      items.push({
        id: `${relativeFile}:${line}:${items.length}`,
        title: text,
        file: relativeFile,
        line,
        tag,
        text,
      });
    });
  }

  return items;
}

function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
