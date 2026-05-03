/** @jsxImportSource @opentui/solid */

import { ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import { createEffect, createMemo, For, on, onCleanup, onMount } from "solid-js";
import { formatTodoCheckbox, formatTreeLabel, formatTreePrefix } from "../ui/layout";
import type { TodoListStatus } from "../domain/status";
import { getTodoCheckboxForeground, getTodoRowForeground } from "../ui/theme";
import type { TodoTreeRow } from "../domain/types";

type RenderedTodoRow = {
  readonly id: string;
  readonly kind: TodoTreeRow["kind"];
  readonly highlighted: boolean;
  readonly multiSelected: boolean;
  readonly selected: boolean;
  readonly prefix: string;
  readonly label: string;
  readonly checkbox: string | undefined;
  readonly checkboxFg: TuiThemeCurrent["primary"] | TuiThemeCurrent["accent"] | undefined;
  readonly backgroundColor: TuiThemeCurrent["backgroundElement"] | undefined;
  readonly fgColor:
    | TuiThemeCurrent["primary"]
    | TuiThemeCurrent["accent"]
    | TuiThemeCurrent["textMuted"]
    | undefined;
  readonly attributes: typeof TextAttributes.BOLD | undefined;
};

export type TodoListViewProps = {
  readonly rows: readonly TodoTreeRow[];
  readonly status: TodoListStatus;
  readonly selectedIndex: number;
  readonly multiSelectedIds: Set<string>;
  readonly theme: () => TuiThemeCurrent;
  readonly onFocusChange: (focused: boolean) => void;
};

export function TodoListView(props: TodoListViewProps) {
  let scrollRef: ScrollBoxRenderable | undefined;
  let pendingScrollTimeout: ReturnType<typeof setTimeout> | undefined;

  const handleFocused = () => props.onFocusChange(true);
  const handleBlurred = () => props.onFocusChange(false);

  const renderedItems = createMemo<readonly RenderedTodoRow[]>(() => {
    const theme = props.theme();
    return props.rows.map((row, index) => {
      const highlighted = props.selectedIndex === index;
      const multiSelected = row.kind === "todo" && props.multiSelectedIds.has(row.item.id);
      const selected = highlighted || multiSelected;
      const prefix = formatTreePrefix(row.depth, highlighted, row.kind);

      return {
        id: row.id,
        kind: row.kind,
        highlighted,
        multiSelected,
        selected,
        prefix,
        label: formatTreeLabel(row),
        checkbox: row.kind === "todo" ? formatTodoCheckbox(multiSelected) : undefined,
        checkboxFg: getTodoCheckboxForeground(theme, highlighted, multiSelected),
        backgroundColor: highlighted && row.kind === "todo" ? theme.backgroundElement : undefined,
        fgColor: getTodoRowForeground(theme, row, highlighted, multiSelected),
        attributes: selected && row.kind === "todo" ? TextAttributes.BOLD : undefined,
      };
    });
  });

  const selectedRowId = createMemo(() => renderedItems()[props.selectedIndex]?.id);

  const clearPendingScroll = () => {
    if (pendingScrollTimeout === undefined) return;
    clearTimeout(pendingScrollTimeout);
    pendingScrollTimeout = undefined;
  };

  const scheduleScrollIntoView = (rowId: string) => {
    clearPendingScroll();

    const scrollIntoViewWhenReady = () => {
      pendingScrollTimeout = undefined;
      if (!scrollRef) return;

      const child = scrollRef.content.findDescendantById(rowId);
      if (!child || scrollRef.viewport.height <= 0 || child.height <= 0) {
        pendingScrollTimeout = setTimeout(scrollIntoViewWhenReady, 0);
        return;
      }

      scrollRef.scrollChildIntoView(rowId);
    };

    pendingScrollTimeout = setTimeout(scrollIntoViewWhenReady, 0);
  };

  onMount(() => {
    scrollRef?.on("focused", handleFocused);
    scrollRef?.on("blurred", handleBlurred);
    scrollRef?.focus();

    const rowId = selectedRowId();
    if (!rowId) return;
    scheduleScrollIntoView(rowId);
  });

  createEffect(
    on(
      selectedRowId,
      (rowId) => {
        if (!rowId) return;
        scheduleScrollIntoView(rowId);
      },
      { defer: true },
    ),
  );

  onCleanup(() => {
    clearPendingScroll();
    scrollRef?.off("focused", handleFocused);
    scrollRef?.off("blurred", handleBlurred);
    props.onFocusChange(false);
  });

  return (
    <scrollbox
      ref={(renderable: ScrollBoxRenderable) => (scrollRef = renderable)}
      flexGrow={1}
      minHeight={0}
      width="100%"
      focusable
      scrollbarOptions={{ visible: false }}
    >
      <box flexDirection="column" gap={0} width="100%">
        {props.status ? (
          <text fg={props.status.error ? props.theme().error : props.theme().textMuted}>
            {props.status.title}
          </text>
        ) : null}
        <For each={renderedItems()}>
          {(row) => (
            <box id={row.id} width="100%" flexDirection="row" backgroundColor={row.backgroundColor}>
              <text wrapMode="none" attributes={row.attributes} fg={row.fgColor}>
                <span style={{ fg: props.theme().textMuted }}>{row.prefix}</span>
                {row.checkbox ? (
                  <>
                    <span style={{ fg: row.checkboxFg }}>{row.checkbox}</span>{" "}
                  </>
                ) : null}
                {row.label}
              </text>
            </box>
          )}
        </For>
      </box>
    </scrollbox>
  );
}
