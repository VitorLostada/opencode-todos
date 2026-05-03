# opencode-todos

`opencode-todos` adds a `/todos` route for the OpenCode TUI. It scans the current worktree for TODO-style comments, shows them as a file tree, and lets you send selected TODOs back into the current session prompt.

## Installation

```bash
opencode plugin install opencode-todos --global
```

## Usage

Run `/todos` from the OpenCode TUI command palette or slash command input.

## Keybindings

- `up` / `down` or `k` / `j`: move between TODO rows
- `space`: toggle the current TODO selection
- `a`: select all TODOs
- `d`: clear selection
- `enter`: append selected TODOs to the prompt
- `esc` or `ctrl+c`: go back

## Supported Tags

- `TODO`
- `FIXME`
- `HACK`
- `XXX`

## Supported Comment Styles

- `// TODO: ...`
- `# TODO: ...`
- `/* TODO: ... */`
- `* TODO: ...` inside block comments
- `<!-- TODO: ... -->`
- `-- TODO: ...`
- `; TODO: ...`

## Supported Languages

Ada, Astro, C, C++, C#, Clojure, Crystal, CSS, Dart, Elm, Elixir, Go, Groovy, GraphQL, Haskell, HTML, INI, Java, JSON/JSONC, Julia, Kotlin, Lua, Nim, Nix, Objective-C, Perl, PHP, Prisma, Protobuf, Python, R, Raku, Reason, ReScript, Ruby, Rust, Scala, SCSS, Shell, Solidity, SQL, Starlark, Svelte, SVG, Swift, Terraform, TOML, TypeScript, V, Vue, XML, YAML, Zig, Zsh — plus `Dockerfile` and `Makefile`.

## Scanning Rules

The scanner reads source and config file extensions for all supported languages plus `Dockerfile` and `Makefile`. It skips large files over 1 MiB and ignores generated or dependency directories such as `.git`, `.opencode`, `dist`, `build`, `coverage`, and `node_modules`.

The plugin refuses to scan the filesystem root.

## Configuration

Defaults are equivalent to:

```json
{
  "plugin": [
    [
      "opencode-todos",
      {
        "tags": ["TODO", "FIXME", "HACK", "XXX"],
        "ignoredDirectories": [
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
          "vendor"
        ],
        "includeExtensions": [".ts", ".tsx", ".js", ".jsx", ".md"],
        "includeFilenames": ["Dockerfile", "Makefile"],
        "maxFileBytes": 1048576
      }
    ]
  ]
}
```

`includeExtensions` in the example is shortened for readability. The built-in default includes many common source/config file extensions.

Custom tags are case-insensitive and normalized to uppercase in prompt output:

```json
{
  "plugin": [["opencode-todos", { "tags": ["TODO", "FOLLOWUP"] }]]
}
```

## Development

```bash
bun run test
bun run typecheck
bun run fmt:check
bun run build
```
