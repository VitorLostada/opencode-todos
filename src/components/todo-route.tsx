/** @jsxImportSource @opentui/solid */

import type { TuiThemeCurrent } from "@opencode-ai/plugin/tui";
import { useKeyboard } from "@opentui/solid";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { TodosPluginOptions } from "../config/plugin";
import {
  formatSelectedTodosForPrompt,
  getCurrentTodoId,
  getSelectionTodoIds,
  selectAllTodoIds,
  toggleTodoSelection,
} from "../domain/actions";
import { scanTodoComments } from "../scanner";
import { buildTodoTreeRows, getNextTodoRowIndex, getPreviousTodoRowIndex } from "../domain/tree";
import { getActionErrorStatus, getListStatus } from "../domain/status";
import type { TodoItem, TodoLoadState } from "../domain/types";
import { TodoListView } from "./todo-list-view";

export type TodoRouteProps = {
  readonly theme: () => TuiThemeCurrent;
  readonly projectRoot?: string;
  readonly scannerOptions: TodosPluginOptions;
  readonly navigateBack: () => void;
  readonly onConfirmItems: (itemsText: string) => void | Promise<void>;
};

export function TodoRoute(props: TodoRouteProps) {
  const [items, setItems] = createSignal<readonly TodoItem[]>([]);
  const [loadState, setLoadState] = createSignal<TodoLoadState>("loading");
  const [loadError, setLoadError] = createSignal<string | undefined>();
  const [actionError, setActionError] = createSignal<string | undefined>();
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [multiSelectedIds, setMultiSelectedIds] = createSignal(new Set<string>());
  const [focused, setFocused] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const rows = createMemo(() => buildTodoTreeRows(items()));

  onMount(() => {
    let cancelled = false;

    const loadTodos = async () => {
      if (!props.projectRoot) {
        setItems([]);
        setLoadState("ready");
        return;
      }

      try {
        setLoadState("loading");
        setLoadError(undefined);
        const scannedItems = await scanTodoComments(props.projectRoot, props.scannerOptions);
        const scannedRows = buildTodoTreeRows(scannedItems);
        if (cancelled) return;
        setItems(scannedItems);
        setSelectedIndex(getNextTodoRowIndex(scannedRows, -1));
        setMultiSelectedIds(new Set<string>());
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setItems([]);
        setLoadError(error instanceof Error ? error.message : "Unable to scan TODO comments");
        setLoadState("error");
      }
    };

    void loadTodos();

    onCleanup(() => {
      cancelled = true;
    });
  });

  useKeyboard((evt) => {
    if (evt.defaultPrevented) return;
    if (!focused()) return;

    const currentItems = items();
    const currentRows = rows();

    if (evt.name === "escape" || (evt.ctrl && evt.name === "c")) {
      evt.preventDefault();
      evt.stopPropagation();
      setMultiSelectedIds(new Set<string>());
      props.navigateBack();
      return;
    }

    if (evt.name === "up" || evt.name === "k") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((i) => getPreviousTodoRowIndex(currentRows, i));
      return;
    }

    if (evt.name === "down" || evt.name === "j") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((i) => getNextTodoRowIndex(currentRows, i));
      return;
    }

    if (evt.name === "a") {
      evt.preventDefault();
      evt.stopPropagation();
      setMultiSelectedIds(selectAllTodoIds(currentItems));
      return;
    }

    if (evt.name === "d") {
      evt.preventDefault();
      evt.stopPropagation();
      setMultiSelectedIds(new Set<string>());
      return;
    }

    if (evt.name === "space") {
      evt.preventDefault();
      evt.stopPropagation();
      const currentId = getCurrentTodoId(currentRows, selectedIndex());
      if (!currentId) return;
      setMultiSelectedIds((prev) => toggleTodoSelection(prev, currentId));
      return;
    }

    if (evt.name === "return") {
      evt.preventDefault();
      evt.stopPropagation();
      if (confirming()) return;

      const currentId = getCurrentTodoId(currentRows, selectedIndex());
      if (!currentId) return;

      const itemIds = getSelectionTodoIds(multiSelectedIds(), currentId);

      setConfirming(true);
      setActionError(undefined);
      void Promise.resolve(
        props.onConfirmItems(formatSelectedTodosForPrompt(currentItems, itemIds)),
      )
        .then(() => setMultiSelectedIds(new Set<string>()))
        .catch((error) => {
          setActionError(error instanceof Error ? error.message : "Unable to append TODO prompt");
        })
        .finally(() => setConfirming(false));
      return;
    }
  });

  const status = createMemo(() => {
    const actionStatus = getActionErrorStatus(actionError());
    if (actionStatus) return actionStatus;
    return getListStatus(loadState(), loadError(), items().length);
  });

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={0}
      paddingBottom={1}
    >
      <box
        flexDirection="row"
        gap={1}
        paddingLeft={1}
        paddingRight={1}
        paddingTop={1}
        paddingBottom={2}
      >
        <text fg={props.theme().textMuted}>
          <span style={{ fg: props.theme().accent }}>↑↓/jk</span> navigate{"  "}
          <span style={{ fg: props.theme().accent }}>space</span> toggle{"  "}
          <span style={{ fg: props.theme().accent }}>a</span> all{"  "}
          <span style={{ fg: props.theme().accent }}>d</span> none{"  "}
          <span style={{ fg: props.theme().accent }}>enter</span> confirm{"  "}
          <span style={{ fg: props.theme().accent }}>esc</span> back
        </text>
      </box>
      <TodoListView
        rows={rows()}
        status={status()}
        selectedIndex={selectedIndex()}
        multiSelectedIds={multiSelectedIds()}
        theme={props.theme}
        onFocusChange={setFocused}
      />
    </box>
  );
}
