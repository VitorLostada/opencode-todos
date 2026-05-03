import type { TodosPluginOptions } from "../config/plugin";

type TodoCommentPattern = {
  readonly name: string;
  readonly regex: RegExp;
};

export function matchTodoComment(
  lineText: string,
  options: Pick<TodosPluginOptions, "tags">,
): { readonly tag: string; readonly text: string } | undefined {
  for (const pattern of createTodoCommentPatterns(options.tags)) {
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

export function cleanTodoText(text: string): string {
  return text.replace(/(?:\*\/|-->)\s*$/, "").trim() || "No description";
}

function createTodoCommentPatterns(tags: readonly string[]): readonly TodoCommentPattern[] {
  const tagExpression = tags.map(escapeRegExp).join("|");
  return [
    {
      name: "slash",
      regex: new RegExp(`(?:^|\\s)//\\s*@?(${tagExpression})\\b:?\\s*(.*)$`, "i"),
    },
    {
      name: "hash",
      regex: new RegExp(`(?:^|\\s)#\\s*@?(${tagExpression})\\b:?\\s*(.*)$`, "i"),
    },
    {
      name: "block",
      regex: new RegExp(
        `(?:^|\\s)/(?:\\*)+\\s*@?(${tagExpression})\\b:?\\s*(.*?)(?:\\*/)?\\s*$`,
        "i",
      ),
    },
    {
      name: "block-continuation",
      regex: new RegExp(`^\\s*\\*\\s*@?(${tagExpression})\\b:?\\s*(.*)$`, "i"),
    },
    {
      name: "html",
      regex: new RegExp(`<!--\\s*@?(${tagExpression})\\b:?\\s*(.*?)(?:-->)?\\s*$`, "i"),
    },
    {
      name: "dash",
      regex: new RegExp(`(?:^|\\s)--\\s*@?(${tagExpression})\\b:?\\s*(.*)$`, "i"),
    },
    {
      name: "semicolon",
      regex: new RegExp(`(?:^|\\s);\\s*@?(${tagExpression})\\b:?\\s*(.*)$`, "i"),
    },
  ];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
