// @bun
// src/tui.tsx
import { memo as _$memo } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { readdir, readFile, stat } from "fs/promises";
import * as path from "path";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/solid";
import { createComponent, createEffect, createMemo, createSignal, For, on, onCleanup, onMount } from "solid-js";
var id = "opencode.todos";
var routeName = "todos";
var tui = async (api, _options, _meta) => {
  api.command.register(() => [{
    title: "Todos",
    value: "todos.open",
    category: "Plugin",
    slash: {
      name: "todos"
    },
    onSelect: () => {
      const current = api.route.current;
      if (current.name === "session") {
        api.route.navigate(routeName, {
          fromSessionID: current.params?.sessionID
        });
      } else {
        api.route.navigate(routeName);
      }
    }
  }]);
  api.route.register([{
    name: routeName,
    render: ({
      params
    }) => {
      const p = params;
      const fromSessionID = p?.fromSessionID;
      return createComponent(TodoList, {
        theme: () => api.theme.current,
        projectRoot: resolveProjectRoot(api.state.path),
        fromSessionID,
        navigateBack: () => {
          if (fromSessionID) {
            api.route.navigate("session", {
              sessionID: fromSessionID
            });
          } else {
            api.route.navigate("home");
          }
        },
        onConfirmItems: async (itemsText) => {
          if (fromSessionID) {
            api.route.navigate("session", {
              sessionID: fromSessionID
            });
          } else {
            api.route.navigate("home");
          }
          await new Promise((resolve2) => setTimeout(resolve2, 0));
          await api.client.tui.appendPrompt({
            directory: api.state.path.directory,
            text: itemsText
          });
        }
      });
    }
  }]);
};
function TodoList(props) {
  const [items, setItems] = createSignal([]);
  const [loadState, setLoadState] = createSignal("loading");
  const [loadError, setLoadError] = createSignal();
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [multiSelectedIds, setMultiSelectedIds] = createSignal(new Set);
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
        if (cancelled)
          return;
        setItems(scannedItems);
        setSelectedIndex(0);
        setMultiSelectedIds(new Set);
        setLoadState("ready");
      } catch (error) {
        if (cancelled)
          return;
        setItems([]);
        setLoadError(error instanceof Error ? error.message : "Unable to scan TODO comments");
        setLoadState("error");
      }
    };
    loadTodos();
    onCleanup(() => {
      cancelled = true;
    });
  });
  useKeyboard((evt) => {
    if (evt.defaultPrevented)
      return;
    if (!focused())
      return;
    const currentItems = items();
    if (evt.name === "escape" || evt.ctrl && evt.name === "c") {
      evt.preventDefault();
      evt.stopPropagation();
      setMultiSelectedIds(new Set);
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
      if (!currentId)
        return;
      setMultiSelectedIds((prev) => {
        const next = new Set(prev);
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
      if (confirming())
        return;
      const currentId = currentItems[selectedIndex()]?.id;
      if (!currentId)
        return;
      const currentMulti = multiSelectedIds();
      const itemIds = currentMulti.size > 0 ? currentMulti : new Set([currentId]);
      const itemsText = currentItems.filter((todo) => itemIds.has(todo.id)).map(formatTodoForPrompt).join(`
`) + `
`;
      setConfirming(true);
      Promise.resolve(props.onConfirmItems(itemsText)).then(() => setMultiSelectedIds(new Set)).finally(() => setConfirming(false));
      return;
    }
  });
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("text"), _el$4 = _$createElement("span"), _el$6 = _$createTextNode(` navigate  `), _el$8 = _$createElement("span"), _el$0 = _$createTextNode(` toggle  `), _el$10 = _$createElement("span"), _el$12 = _$createTextNode(` confirm  `), _el$14 = _$createElement("span"), _el$16 = _$createTextNode(` back`);
    _$insertNode(_el$, _el$2);
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "width", "100%");
    _$setProp(_el$, "height", "100%");
    _$setProp(_el$, "paddingLeft", 1);
    _$setProp(_el$, "paddingRight", 1);
    _$setProp(_el$, "paddingTop", 0);
    _$setProp(_el$, "paddingBottom", 1);
    _$insertNode(_el$2, _el$3);
    _$setProp(_el$2, "flexDirection", "row");
    _$setProp(_el$2, "gap", 1);
    _$setProp(_el$2, "paddingLeft", 1);
    _$setProp(_el$2, "paddingRight", 1);
    _$setProp(_el$2, "paddingTop", 1);
    _$setProp(_el$2, "paddingBottom", 2);
    _$insertNode(_el$3, _el$4);
    _$insertNode(_el$3, _el$6);
    _$insertNode(_el$3, _el$8);
    _$insertNode(_el$3, _el$0);
    _$insertNode(_el$3, _el$10);
    _$insertNode(_el$3, _el$12);
    _$insertNode(_el$3, _el$14);
    _$insertNode(_el$3, _el$16);
    _$insertNode(_el$4, _$createTextNode(`\u2191\u2193/jk`));
    _$insertNode(_el$8, _$createTextNode(`space`));
    _$insertNode(_el$10, _$createTextNode(`enter`));
    _$insertNode(_el$14, _$createTextNode(`esc`));
    _$insert(_el$, _$createComponent(TodoListView, {
      get items() {
        return items();
      },
      get status() {
        return getListStatus(loadState(), loadError(), items().length);
      },
      get selectedIndex() {
        return selectedIndex();
      },
      get multiSelectedIds() {
        return multiSelectedIds();
      },
      get theme() {
        return props.theme;
      },
      onFocusChange: setFocused
    }), null);
    _$effect((_p$) => {
      var _v$ = props.theme().textMuted, _v$2 = {
        fg: props.theme().accent
      }, _v$3 = {
        fg: props.theme().accent
      }, _v$4 = {
        fg: props.theme().accent
      }, _v$5 = {
        fg: props.theme().accent
      };
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "fg", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$4, "style", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$8, "style", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp(_el$10, "style", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp(_el$14, "style", _v$5, _p$.i));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined
    });
    return _el$;
  })();
}
function TodoListView(props) {
  let scrollRef;
  let pendingScrollTimeout;
  const handleFocused = () => props.onFocusChange(true);
  const handleBlurred = () => props.onFocusChange(false);
  const renderedItems = createMemo(() => {
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
        attributes: selected ? TextAttributes.BOLD : undefined
      };
    });
  });
  const selectedRowId = createMemo(() => {
    const items = renderedItems();
    const item = items[props.selectedIndex];
    return item?.id;
  });
  const clearPendingScroll = () => {
    if (pendingScrollTimeout === undefined)
      return;
    clearTimeout(pendingScrollTimeout);
    pendingScrollTimeout = undefined;
  };
  const scheduleScrollIntoView = (rowId) => {
    clearPendingScroll();
    const scrollIntoViewWhenReady = () => {
      pendingScrollTimeout = undefined;
      if (!scrollRef)
        return;
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
    if (!rowId)
      return;
    scheduleScrollIntoView(rowId);
  });
  createEffect(on(selectedRowId, (rowId) => {
    if (!rowId)
      return;
    scheduleScrollIntoView(rowId);
  }, {
    defer: true
  }));
  onCleanup(() => {
    clearPendingScroll();
    scrollRef?.off("focused", handleFocused);
    scrollRef?.off("blurred", handleBlurred);
    props.onFocusChange(false);
  });
  return (() => {
    var _el$17 = _$createElement("scrollbox"), _el$18 = _$createElement("box");
    _$insertNode(_el$17, _el$18);
    _$use((renderable) => scrollRef = renderable, _el$17);
    _$setProp(_el$17, "flexGrow", 1);
    _$setProp(_el$17, "minHeight", 0);
    _$setProp(_el$17, "width", "100%");
    _$setProp(_el$17, "focusable", true);
    _$setProp(_el$17, "scrollbarOptions", {
      visible: false
    });
    _$setProp(_el$18, "flexDirection", "column");
    _$setProp(_el$18, "gap", 0);
    _$setProp(_el$18, "width", "100%");
    _$insert(_el$18, (() => {
      var _c$ = _$memo(() => !!props.status);
      return () => _c$() ? (() => {
        var _el$19 = _$createElement("text");
        _$insert(_el$19, () => props.status.title);
        _$effect((_$p) => _$setProp(_el$19, "fg", props.status.error ? props.theme().error : props.theme().textMuted, _$p));
        return _el$19;
      })() : null;
    })(), null);
    _$insert(_el$18, _$createComponent(For, {
      get each() {
        return renderedItems();
      },
      children: (row) => (() => {
        var _el$20 = _$createElement("box"), _el$21 = _$createElement("text"), _el$22 = _$createElement("span"), _el$23 = _$createTextNode(` `);
        _$insertNode(_el$20, _el$21);
        _$setProp(_el$20, "width", "100%");
        _$setProp(_el$20, "flexDirection", "row");
        _$insertNode(_el$21, _el$22);
        _$insertNode(_el$21, _el$23);
        _$setProp(_el$21, "wrapMode", "none");
        _$insert(_el$21, () => row.marker, _el$22);
        _$insert(_el$22, () => row.checkbox);
        _$insert(_el$21, () => row.title, null);
        _$effect((_p$) => {
          var { id: _v$6, backgroundColor: _v$7, attributes: _v$8, fgColor: _v$9 } = row, _v$0 = {
            fg: row.checkboxFg
          };
          _v$6 !== _p$.e && (_p$.e = _$setProp(_el$20, "id", _v$6, _p$.e));
          _v$7 !== _p$.t && (_p$.t = _$setProp(_el$20, "backgroundColor", _v$7, _p$.t));
          _v$8 !== _p$.a && (_p$.a = _$setProp(_el$21, "attributes", _v$8, _p$.a));
          _v$9 !== _p$.o && (_p$.o = _$setProp(_el$21, "fg", _v$9, _p$.o));
          _v$0 !== _p$.i && (_p$.i = _$setProp(_el$22, "style", _v$0, _p$.i));
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined,
          o: undefined,
          i: undefined
        });
        return _el$20;
      })()
    }), null);
    return _el$17;
  })();
}
var TODO_TAGS = "TODO|FIXME|HACK|XXX";
var TODO_COMMENT_PATTERNS = [{
  name: "slash",
  regex: new RegExp(`(?:^|\\s)//\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i")
}, {
  name: "hash",
  regex: new RegExp(`(?:^|\\s)#\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i")
}, {
  name: "block",
  regex: new RegExp(`(?:^|\\s)/(?:\\*)+\\s*@?(${TODO_TAGS})\\b:?\\s*(.*?)(?:\\*/)?\\s*$`, "i")
}, {
  name: "block-continuation",
  regex: new RegExp(`^\\s*\\*\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i")
}, {
  name: "html",
  regex: new RegExp(`<!--\\s*@?(${TODO_TAGS})\\b:?\\s*(.*?)(?:-->)?\\s*$`, "i")
}, {
  name: "dash",
  regex: new RegExp(`(?:^|\\s)--\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i")
}, {
  name: "semicolon",
  regex: new RegExp(`(?:^|\\s);\\s*@?(${TODO_TAGS})\\b:?\\s*(.*)$`, "i")
}];
var IGNORED_DIRECTORIES = new Set([".git", ".hg", ".next", ".nuxt", ".opencode", ".svelte-kit", "build", "coverage", "dist", "node_modules", "out", "target", "vendor"]);
var SCANNABLE_EXTENSIONS = new Set([".astro", ".c", ".cc", ".clj", ".cljs", ".cpp", ".cs", ".css", ".dart", ".ex", ".exs", ".go", ".h", ".hpp", ".html", ".java", ".js", ".jsx", ".kt", ".kts", ".lua", ".md", ".mjs", ".php", ".py", ".rb", ".rs", ".scss", ".sh", ".sql", ".svelte", ".swift", ".ts", ".tsx", ".vue", ".yaml", ".yml", ".zig", ".zsh"]);
var MAX_FILE_BYTES = 1024 * 1024;
function resolveProjectRoot(pathState) {
  const worktree = pathState.worktree.trim();
  if (worktree)
    return worktree;
  const directory = pathState.directory.trim();
  return directory || undefined;
}
async function scanTodoComments(projectRoot) {
  if (path.resolve(projectRoot) === path.parse(path.resolve(projectRoot)).root) {
    throw new Error("Refusing to scan filesystem root for TODO comments");
  }
  const items = [];
  for await (const filePath of walkProjectFiles(projectRoot)) {
    const fileStats = await stat(filePath);
    if (fileStats.size > MAX_FILE_BYTES)
      continue;
    const relativeFile = normalizeRelativePath(path.relative(projectRoot, filePath));
    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, index) => {
      const match = matchTodoComment(lineText);
      if (!match)
        return;
      const line = index + 1;
      const text = cleanTodoText(match.text);
      const tag = match.tag.toUpperCase();
      items.push({
        id: `${relativeFile}:${line}:${items.length}`,
        title: text,
        file: relativeFile,
        line,
        tag,
        text
      });
    });
  }
  return items;
}
async function* walkProjectFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true
  });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github")
      continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name))
        continue;
      yield* walkProjectFiles(entryPath);
      continue;
    }
    if (!entry.isFile() || !isScannableFile(entry.name))
      continue;
    yield entryPath;
  }
}
function isScannableFile(fileName) {
  if (fileName === "Dockerfile" || fileName === "Makefile")
    return true;
  return SCANNABLE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}
function matchTodoComment(lineText) {
  for (const pattern of TODO_COMMENT_PATTERNS) {
    const match = pattern.regex.exec(lineText);
    const tag = match?.[1];
    if (!tag)
      continue;
    return {
      tag,
      text: match[2] ?? ""
    };
  }
  return;
}
function cleanTodoText(text) {
  return text.replace(/(?:\*\/|-->)\s*$/, "").trim() || "No description";
}
function formatTodoForPrompt(todo) {
  return `- ${todo.tag}: ${todo.text} (${todo.file}:${todo.line})`;
}
function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join("/");
}
function getListStatus(loadState, loadError, itemCount) {
  if (loadState === "loading") {
    return {
      title: "Scanning TODO comments...",
      error: false
    };
  }
  if (loadState === "error") {
    return {
      title: loadError ?? "Unable to scan TODO comments",
      error: true
    };
  }
  if (itemCount === 0) {
    return {
      title: "No TODO comments found",
      error: false
    };
  }
  return;
}
var tui_default = {
  id,
  tui
};
export {
  tui_default as default
};
