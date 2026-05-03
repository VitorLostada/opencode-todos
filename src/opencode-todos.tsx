import { createComponent } from "solid-js";
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { TodoRoute } from "./components/todo-route";
import { parseTodosPluginOptions } from "./config/plugin";
import { resolveProjectRoot } from "./project/root";

const id = "opencode.todos";
const routeName = "todos";

const tui: TuiPlugin = async (api, options) => {
  const pluginOptions = parseTodosPluginOptions(options);

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
        return createComponent(TodoRoute, {
          theme: () => api.theme.current,
          projectRoot: resolveProjectRoot(api.state.path),
          scannerOptions: pluginOptions,
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

export default {
  id,
  tui,
} satisfies TuiPluginModule & { id: string };
