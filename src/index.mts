#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { spawnPromise } from "spawn-rx";

const server = new Server(
  {
    name: "cursor-mcp-installer",
    version: "0.5.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "install_repo_mcp_server",
        description: "Install an MCP server via npx or uvx",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The package name of the MCP server",
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "The arguments to pass along",
            },
            env: {
              type: "array",
              items: { type: "string" },
              description: "The environment variables to set, delimited by =",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "install_local_mcp_server",
        description:
          "Install an MCP server whose code is cloned locally on your computer",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "The path to the MCP server code cloned on your computer",
            },
            args: {
              type: "array",
              items: { type: "string" },
              description: "The arguments to pass along",
            },
            env: {
              type: "array",
              items: { type: "string" },
              description: "The environment variables to set, delimited by =",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

async function hasNodeJs() {
  try {
    await spawnPromise("node", ["--version"]);
    return true;
  } catch (e) {
    return false;
  }
}

async function hasUvx() {
  try {
    await spawnPromise("uvx", ["--version"]);
    return true;
  } catch (e) {
    return false;
  }
}

async function isNpmPackage(name: string) {
  try {
    await spawnPromise("npm", ["view", name, "version"]);
    return true;
  } catch (e) {
    return false;
  }
}

function installToCursor(
  name: string,
  cmd: string,
  args: string[],
  env?: string[]
) {
  const configPath = path.join(os.homedir(), ".cursor", "mcp.json");

  let config: any;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    config = {};
  }

  const envObj = (env ?? []).reduce((acc, val) => {
    const [key, value] = val.split("=");
    acc[key] = value;

    return acc;
  }, {} as Record<string, string>);

  const newServer = {
    command: cmd,
    args: args,
    ...(env ? { env: envObj } : {}),
  };

  const mcpServers = config.mcpServers ?? {};
  mcpServers[name] = newServer;
  config.mcpServers = mcpServers;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function installRepoWithArgsToCursor(
  name: string,
  npmIfTrueElseUvx: boolean,
  args?: string[],
  env?: string[]
) {
  // If the name is in a scoped package, we need to remove the scope
  const serverName = /^@.*\//i.test(name) ? name.split("/")[1] : name;

  installToCursor(
    serverName,
    npmIfTrueElseUvx ? "npx" : "uvx",
    [name, ...(args ?? [])],
    env
  );
}

async function attemptNodeInstall(
  directory: string
): Promise<Record<string, string>> {
  await spawnPromise("npm", ["install"], { cwd: directory });

  // Run down package.json looking for bins
  const pkg = JSON.parse(
    fs.readFileSync(path.join(directory, "package.json"), "utf-8")
  );

  if (pkg.bin) {
    return Object.keys(pkg.bin).reduce((acc, key) => {
      acc[key] = path.resolve(directory, pkg.bin[key]);
      return acc;
    }, {} as Record<string, string>);
  }

  if (pkg.main) {
    return { [pkg.name]: path.resolve(directory, pkg.main) };
  }

  return {};
}

async function installLocalMcpServer(
  dirPath: string,
  args?: string[],
  env?: string[]
) {
  if (!fs.existsSync(dirPath)) {
    return {
      content: [
        {
          type: "text",
          text: `路径 ${dirPath} 在本地不存在！`,
        },
      ],
      isError: true,
    };
  }

  if (fs.existsSync(path.join(dirPath, "package.json"))) {
    const servers = await attemptNodeInstall(dirPath);

    Object.keys(servers).forEach((name) => {
      installToCursor(
        name,
        "node",
        [servers[name], ...(args ?? [])],
        env
      );
    });

    return {
      content: [
        {
          type: "text",
          text: `通过npm成功安装了以下服务器！${Object.keys(
            servers
          ).join(";")} 请通知用户重启Cursor应用`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `无法确定如何安装 ${dirPath}`,
      },
    ],
    isError: true,
  };
}

async function installRepoMcpServer(
  name: string,
  args?: string[],
  env?: string[]
) {
  if (!(await hasNodeJs())) {
    return {
      content: [
        {
          type: "text",
          text: `未安装Node.js，请先安装！`,
        },
      ],
      isError: true,
    };
  }

  if (await isNpmPackage(name)) {
    installRepoWithArgsToCursor(name, true, args, env);

    return {
      content: [
        {
          type: "text",
          text: "通过npx成功安装MCP服务器！请通知用户重启Cursor应用",
        },
      ],
    };
  }

  if (!(await hasUvx())) {
    return {
      content: [
        {
          type: "text",
          text: `未安装Python uv，请先安装！请告知用户访问 https://docs.astral.sh/uv`,
        },
      ],
      isError: true,
    };
  }

  installRepoWithArgsToCursor(name, false, args, env);

  return {
    content: [
      {
        type: "text",
        text: "通过uvx成功安装MCP服务器！请通知用户重启Cursor应用",
      },
    ],
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "install_repo_mcp_server") {
      const { name, args, env } = request.params.arguments as {
        name: string;
        args?: string[];
        env?: string[];
      };

      return await installRepoMcpServer(name, args, env);
    }

    if (request.params.name === "install_local_mcp_server") {
      const dirPath = request.params.arguments!.path as string;
      const { args, env } = request.params.arguments as {
        args?: string[];
        env?: string[];
      };

      return await installLocalMcpServer(dirPath, args, env);
    }

    throw new Error(`未知工具: ${request.params.name}`);
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `设置包时出错: ${err}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);
