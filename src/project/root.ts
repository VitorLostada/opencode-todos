import * as path from "node:path";
import type { TuiState } from "@opencode-ai/plugin/tui";

export type OpenCodePathState = Pick<TuiState["path"], "worktree" | "directory">;

const fsRoot = path.parse(path.resolve(path.sep)).root;

export function resolveProjectRoot(state: OpenCodePathState): string | undefined {
  const worktree = state.worktree.trim();
  if (worktree && path.resolve(worktree) !== fsRoot) return worktree;

  const directory = state.directory.trim();
  if (directory && path.resolve(directory) !== fsRoot) return directory;

  return undefined;
}
