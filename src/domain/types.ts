export type TodoItem = {
  readonly id: string;
  readonly title: string;
  readonly file: string;
  readonly line: number;
  readonly tag: string;
  readonly text: string;
};

export type TodoLoadState = "loading" | "ready" | "error";

export type TodoTreeRow =
  | {
      readonly kind: "folder";
      readonly id: string;
      readonly depth: number;
      readonly name: string;
    }
  | {
      readonly kind: "file";
      readonly id: string;
      readonly depth: number;
      readonly name: string;
      readonly file: string;
    }
  | {
      readonly kind: "todo";
      readonly id: string;
      readonly depth: number;
      readonly item: TodoItem;
    };
