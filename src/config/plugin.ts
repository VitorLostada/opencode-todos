import { z } from "zod";

export const DEFAULT_TODO_TAGS = ["TODO", "FIXME", "HACK", "XXX"] as const;

export const DEFAULT_IGNORED_DIRECTORIES = [
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
] as const;

export const DEFAULT_SCANNABLE_EXTENSIONS = [
  ".adb",
  ".ads",
  ".astro",
  ".bzl",
  ".c",
  ".cc",
  ".cfg",
  ".clj",
  ".cljs",
  ".cmake",
  ".cpp",
  ".cr",
  ".cs",
  ".css",
  ".dart",
  ".elm",
  ".ex",
  ".exs",
  ".go",
  ".gql",
  ".graphql",
  ".groovy",
  ".gsh",
  ".gvy",
  ".gy",
  ".h",
  ".hpp",
  ".hs",
  ".html",
  ".ini",
  ".java",
  ".jl",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".kt",
  ".kts",
  ".lhs",
  ".lua",
  ".m",
  ".md",
  ".mjs",
  ".mm",
  ".nim",
  ".nims",
  ".nix",
  ".php",
  ".pl",
  ".pm",
  ".prisma",
  ".proto",
  ".py",
  ".r",
  ".raku",
  ".rakumod",
  ".rb",
  ".re",
  ".rei",
  ".res",
  ".resi",
  ".rs",
  ".sc",
  ".scala",
  ".scss",
  ".sh",
  ".sol",
  ".sql",
  ".star",
  ".svg",
  ".svelte",
  ".swift",
  ".tf",
  ".tfvars",
  ".toml",
  ".ts",
  ".tsx",
  ".v",
  ".vue",
  ".xml",
  ".yaml",
  ".yml",
  ".zig",
  ".zsh",
] as const;

export const DEFAULT_SPECIAL_FILENAMES = ["Dockerfile", "Makefile"] as const;

export const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

const todoTagSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/);
const extensionSchema = z
  .string()
  .trim()
  .min(2)
  .regex(/^\.[A-Za-z0-9][A-Za-z0-9._-]*$/);
const directoryNameSchema = z.string().trim().min(1);
const fileNameSchema = z.string().trim().min(1);

const todosPluginOptionsSchema = z
  .object({
    tags: z
      .array(todoTagSchema)
      .min(1)
      .default([...DEFAULT_TODO_TAGS]),
    ignoredDirectories: z.array(directoryNameSchema).default([...DEFAULT_IGNORED_DIRECTORIES]),
    includeExtensions: z.array(extensionSchema).default([...DEFAULT_SCANNABLE_EXTENSIONS]),
    includeFilenames: z.array(fileNameSchema).default([...DEFAULT_SPECIAL_FILENAMES]),
    maxFileBytes: z.number().int().positive().default(DEFAULT_MAX_FILE_BYTES),
  })
  .passthrough();

export type TodosPluginOptions = {
  readonly tags: readonly string[];
  readonly ignoredDirectories: readonly string[];
  readonly includeExtensions: readonly string[];
  readonly includeFilenames: readonly string[];
  readonly maxFileBytes: number;
};

export function parseTodosPluginOptions(options: unknown): TodosPluginOptions {
  const parsed = todosPluginOptionsSchema.parse(options ?? {});
  return {
    tags: normalizeUniqueUppercase(parsed.tags),
    ignoredDirectories: normalizeUnique(parsed.ignoredDirectories),
    includeExtensions: normalizeUnique(
      parsed.includeExtensions.map((extension) => extension.toLowerCase()),
    ),
    includeFilenames: normalizeUnique(parsed.includeFilenames),
    maxFileBytes: parsed.maxFileBytes,
  };
}

function normalizeUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeUniqueUppercase(values: readonly string[]): readonly string[] {
  return normalizeUnique(values.map((value) => value.toUpperCase()));
}
