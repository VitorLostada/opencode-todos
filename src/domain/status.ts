import type { TodoLoadState } from "./types";

export type TodoListStatus =
  | {
      readonly title: string;
      readonly error: boolean;
    }
  | undefined;

export function getListStatus(
  loadState: TodoLoadState,
  loadError: string | undefined,
  itemCount: number,
): TodoListStatus {
  if (loadState === "loading") {
    return { title: "Scanning TODO comments...", error: false };
  }

  if (loadState === "error") {
    return { title: loadError ?? "Unable to scan TODO comments", error: true };
  }

  if (itemCount === 0) {
    return { title: "No TODO comments found", error: false };
  }

  return undefined;
}

export function getActionErrorStatus(actionError: string | undefined): TodoListStatus {
  if (!actionError) return undefined;
  return { title: actionError, error: true };
}
