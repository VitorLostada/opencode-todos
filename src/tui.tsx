/** @jsxImportSource @opentui/solid */

import { readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import { ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import type { TuiThemeCurrent, TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { useKeyboard } from "@opentui/solid";
import { createComponent, createEffect, createMemo, createSignal, For, on, onCleanup, onMount } from "solid-js";

const id = "opencode.todos";
const routeName = "todos";

type TodoItem = {
  readonly id: string;
  readonly title: string;
  readonly file: string;
  readonly line: number;
  readonly tag: string;
  readonly text: string;
};

type TodoLoadState = "loading" | "ready" | "error";

const tui: TuiPlugin = async (api, _options, _meta) => {
  api.command.register(() => [
    {
      title: "Todos",
      value: "todos.open",
      category: "Plugin",
      slash: {
        name: "todos",
      },
      onSelect: () => {
        const current = api.route.current;
        if (current.name === "session") {
          api.route.navigate(routeName, {
            fromSessionID: current.params?.sessionID,
          });
        } else {
          api.route.navigate(routeName);
        }
      },
    },
  ]);

  api.route.register([
    {
      name: routeName,
      render: ({ params }) => {
        const p = params as Record<string, unknown> | undefined;
        const fromSessionID = p?.fromSessionID as string | undefined;
        return createComponent(TodoList, {
          theme: () => api.theme.current,
          projectRoot: resolveProjectRoot(api.state.path),
          fromSessionID,
          navigateBack: () => {
            if (fromSessionID) {
              api.route.navigate("session", { sessionID: fromSessionID });
            } else {
              api.route.navigate("home");
            }
          },
          onConfirmItems: async (itemsText: string) => {
            if (fromSessionID) {
              api.route.navigate("session", { sessionID: fromSessionID });
            } else {
              api.route.navigate("home");
            }
            await new Promise((resolve) => setTimeout(resolve, 0));
            await api.client.tui.appendPrompt({
              directory: api.state.path.directory,
              text: itemsText,
            });
          },
        });
      },
    },
  ]);
};

type TodoListProps = {
  readonly theme: () => TuiThemeCurrent;
  readonly projectRoot?: string;
  readonly fromSessionID?: string;
  readonly navigateBack: () => void;
  readonly onConfirmItems: (itemsText: string) => void | Promise<void>;
};

function TodoList(props: TodoListProps) {
  const [items, setItems] = createSignal<readonly TodoItem[]>([]);
  const [loadState, setLoadState] = createSignal<TodoLoadState>("loading");
  const [loadError, setLoadError] = createSignal<string | undefined>();
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [multiSelectedIds, setMultiSelectedIds] = createSignal(new Set<string>());
  const [focused, setFocused] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);

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
        const scannedItems = await scanTodoComments(props.projectRoot);
        if (cancelled) return;
        setItems(scannedItems);
        setSelectedIndex(0);
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
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (evt.name === "down" || evt.name === "j") {
      evt.preventDefault();
      evt.stopPropagation();
      setSelectedIndex((i) => Math.min(Math.max(0, currentItems.length - 1), i + 1));
      return;
    }

    if (evt.name === "space") {
      evt.preventDefault();
      evt.stopPropagation();
      const currentId = currentItems[selectedIndex()]?.id;
      if (!currentId) return;
      setMultiSelectedIds((prev) => {
        const next = new Set<string>(prev);
        if (next.has(currentId)) {
          next.delete(currentId);
        } else {
          next.add(currentId);
        }
        return next;
      });
      return;
    }

    if (evt.name === "return") {
      evt.preventDefault();
      evt.stopPropagation();
      if (confirming()) return;

      const currentId = currentItems[selectedIndex()]?.id;
      if (!currentId) return;

      const currentMulti = multiSelectedIds();
      const itemIds = currentMulti.size > 0 ? currentMulti : new Set([currentId]);

      const itemsText = currentItems
        .filter((todo) => itemIds.has(todo.id))
        .map(formatTodoForPrompt)
        .join("\n") + "\n";

      setConfirming(true);
      void Promise.resolve(props.onConfirmItems(itemsText))
        .then(() => setMultiSelectedIds(new Set<string>()))
        .finally(() => setConfirming(false));
      return;
    }
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
          <span style={{ fg: props.theme().accent }}>enter</span> confirm{"  "}
          <span style={{ fg: props.theme().accent }}>esc</span> back
        </text>
      </box>
      <TodoListView
        items={items()}
        status={getListStatus(loadState(), loadError(), items().length)}
        selectedIndex={selectedIndex()}
        multiSelectedIds={multiSelectedIds()}
        theme={props.theme}
        onFocusChange={setFocused}
      />
    </box>
  );
}

type RenderedTodoRow = {
  readonly id: string;
  readonly highlighted: boolean;
  readonly multiSelected: boolean;
  readonly selected: boolean;
  readonly checkbox: string;
  readonly checkboxFg: TuiThemeCurrent["primary"] | TuiThemeCurrent["accent"] | undefined;
  readonly marker: string;
  readonly title: string;
  readonly backgroundColor: TuiThemeCurrent["backgroundElement"] | undefined;
  readonly borderColor: TuiThemeCurrent["borderActive"] | undefined;
  readonly fgColor: TuiThemeCurrent["primary"] | TuiThemeCurrent["accent"] | undefined;
  readonly attributes: typeof TextAttributes.BOLD | undefined;
};

type TodoListStatus = {
  readonly title: string;
  readonly error: boolean;
} | undefined;

type TodoListViewProps = {
  readonly items: readonly TodoItem[];
  readonly status: TodoListStatus;
  readonly selectedIndex: number;
  readonly multiSelectedIds: Set<string>;
  readonly theme: () => TuiThemeCurrent;
  readonly onFocusChange: (focused: boolean) => void;
};

function TodoListView(props: TodoListViewProps) {
  let scrollRef: ScrollBoxRenderable | undefined;
  let pendingScrollTimeout: ReturnType<typeof setTimeout> | undefined;

  const handleFocused = () => props.onFocusChange(true);
  const handleBlurred = () => props.onFocusChange(false);

  const renderedItems = createMemo<readonly RenderedTodoRow[]>(() => {
    const theme = props.theme();
    return props.items.map((item, index) => {
      const highlighted = props.selectedIndex === index;
      const multiSelected = props.multiSelectedIds.has(item.id);
      const selected = highlighted || multiSelected;

      return {
        id: item.id,
        highlighted,
        multiSelected,
        selected,
        checkbox: multiSelected ? "\u25FC" : "\u25FB",
        checkboxFg: highlighted && multiSelected ? theme.primary : multiSelected ? theme.accent : undefined,
        marker: highlighted ? "\u203A " : "  ",
        title: item.title,
        backgroundColor: highlighted ? theme.backgroundElement : undefined,
        borderColor: highlighted ? theme.borderActive : undefined,
        fgColor: highlighted && multiSelected ? theme.primary : multiSelected ? theme.accent : undefined,
        attributes: selected ? TextAttributes.BOLD : undefined,
      };
    });
  });

  const selectedRowId = createMemo(() => {
    const items = renderedItems();
    const item = items[props.selectedIndex];
    return item?.id;
  });

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
            <box
              id={row.id}
              width="100%"
              flexDirection="row"
              backgroundColor={row.backgroundColor}
            >
              <text
                wrapMode="none"
                attributes={row.attributes}
                fg={row.fgColor}
              >
                {row.marker}
                <span style={{ fg: row.checkboxFg }}>{row.checkbox}</span>
                {" "}
                {row.title}
              </text>
            </box>
          )}
        </For>
      </box>
    </scrollbox>
  );
}

type TodoCommentPattern = {
  readonly name: string;
  readonly regex: RegExp;
};

const TODO_TAGS = "TODO|FIXME|HACK|XXX";
const TODO_COMMENT_PATTERNS: readonly TodoCommentPattern[] = [
  {
    name: "slash",
    regex: new RegExp(`(?:^|\\s)//\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i"),
  },
  {
    name: "hash",
    regex: new RegExp(`(?:^|\\s)#\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i"),
  },
  {
    name: "block",
    regex: new RegExp(`(?:^|\\s)/(?:\\*)+\\s*@?(${TODO_TAGS})\\b:?\\s*(.*?)(?:\\*/)?\\s*$`, "i"),
  },
  {
    name: "block-continuation",
    regex: new RegExp(`^\\s*\\*\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i"),
  },
  {
    name: "html",
    regex: new RegExp(`<!--\\s*@?(${TODO_TAGS})\\b:?\\s*(.*?)(?:-->)?\\s*$`, "i"),
  },
  {
    name: "dash",
    regex: new RegExp(`(?:^|\\s)--\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i"),
  },
  {
    name: "semicolon",
    regex: new RegExp(`(?:^|\\s);\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i"),
  },
];

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".next",
  ".nuxt",
  ".opencode",
  ".svelte-kit",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "vendor",
]);

const SCANNABLE_EXTENSIONS = new Set([
  ".astro",
  ".c",
  ".cc",
  ".clj",
  ".cljs",
  ".cpp",
  ".cs",
  ".css",
  ".dart",
  ".ex",
  ".exs",
  ".go",
  ".h",
  ".hpp",
  ".html",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".kts",
  ".lua",
  ".md",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scss",
  ".sh",
  ".sql",
  ".svelte",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
  ".yaml",
  ".yml",
  ".zig",
  ".zsh",
]);

const MAX_FILE_BYTES = 1024 * 1024;

function resolveProjectRoot(pathState: { readonly worktree: string; readonly directory: string }): string | undefined {
  const worktree = pathState.worktree.trim();
  if (worktree) return worktree;

  const directory = pathState.directory.trim();
  return directory || undefined;
}

async function scanTodoComments(projectRoot: string): Promise<readonly TodoItem[]> {
  if (path.resolve(projectRoot) === path.parse(path.resolve(projectRoot)).root) {
    throw new Error("Refusing to scan filesystem root for TODO comments");
  }

  const items: TodoItem[] = [];

  for await (const filePath of walkProjectFiles(projectRoot)) {
    const fileStats = await stat(filePath);
    if (fileStats.size > MAX_FILE_BYTES) continue;

    const relativeFile = normalizeRelativePath(path.relative(projectRoot, filePath));
    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((lineText, index) => {
      const match = matchTodoComment(lineText);
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

async function* walkProjectFiles(directory: string): AsyncGenerator<string> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      yield* walkProjectFiles(entryPath);
      continue;
    }

    if (!entry.isFile() || !isScannableFile(entry.name)) continue;
    yield entryPath;
  }
}

function isScannableFile(fileName: string): boolean {
  if (fileName === "Dockerfile" || fileName === "Makefile") return true;
  return SCANNABLE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function matchTodoComment(lineText: string): { readonly tag: string; readonly text: string } | undefined {
  for (const pattern of TODO_COMMENT_PATTERNS) {
    const match = pattern.regex.exec(lineText);
    const tag = match?.[1];
    if (!tag) continue;

    return {
      tag,
      text: match[2] ?? "",
    };
  }

  return undefined;
}

function cleanTodoText(text: string): string {
  return text.replace(/(?:\*\/|-->)\s*$/, "").trim() || "No description";
}

function formatTodoForPrompt(todo: TodoItem): string {
  return `- ${todo.tag}: ${todo.text} (${todo.file}:${todo.line})`;
}

function normalizeRelativePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function getListStatus(loadState: TodoLoadState, loadError: string | undefined, itemCount: number): TodoListStatus {
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

export default {
  id,
  tui,
} satisfies TuiPluginModule & { id: string };
