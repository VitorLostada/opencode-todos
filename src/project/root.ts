import * as path from "node:path";
import type { TuiState } from "@opencode-ai/plugin/tui";

export type OpenCodePathState = Pick<TuiState["path"], "worktree" | "directory">;

const fsRoot = path.parse(path.resolve(path.sep)).root;

export function resolveProjectRoot(state: OpenCodePathState): string | undefined {
  const directory = safeProjectPath(state.directory);
  if (directory) return directory;

  const worktree = safeProjectPath(state.worktree);
  if (worktree) return worktree;

  return undefined;
}

function safeProjectPath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (path.resolve(trimmed) === fsRoot) return undefined;
  return trimmed;
}
