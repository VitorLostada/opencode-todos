import { readdir } from "node:fs/promises";
import * as path from "node:path";
import type { TodosPluginOptions } from "../config/plugin";

export async function* walkProjectFiles(
  directory: string,
  options: Pick<
    TodosPluginOptions,
    "ignoredDirectories" | "includeExtensions" | "includeFilenames"
  >,
): AsyncGenerator<string> {
  const entries = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  const ignoredDirectories = new Set(options.ignoredDirectories);

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      yield* walkProjectFiles(entryPath, options);
      continue;
    }

    if (!entry.isFile() || !isScannableFile(entry.name, options)) continue;
    yield entryPath;
  }
}

export function isScannableFile(
  fileName: string,
  options: Pick<TodosPluginOptions, "includeExtensions" | "includeFilenames">,
): boolean {
  if (options.includeFilenames.includes(fileName)) return true;
  return options.includeExtensions.includes(path.extname(fileName).toLowerCase());
}
