import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import type { TodoTreeRow } from "../domain/types";

export function getTodoRowForeground(
  theme: TuiThemeCurrent,
  row: TodoTreeRow,
  highlighted: boolean,
  multiSelected: boolean,
):
  | TuiThemeCurrent["primary"]
  | TuiThemeCurrent["accent"]
  | TuiThemeCurrent["textMuted"]
  | undefined {
  if (row.kind !== "todo") return theme.textMuted;
  if (highlighted && multiSelected) return theme.primary;
  if (multiSelected) return theme.accent;
  return undefined;
}

export function getTodoCheckboxForeground(
  theme: TuiThemeCurrent,
  highlighted: boolean,
  multiSelected: boolean,
): TuiThemeCurrent["primary"] | TuiThemeCurrent["accent"] | undefined {
  if (highlighted && multiSelected) return theme.primary;
  if (multiSelected) return theme.accent;
  return undefined;
}
