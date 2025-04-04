# 🚀 Cursor MCP 安装工具

> 为 Cursor 设计的 MCP 服务器安装程序，轻松扩展 AI 能力

## 📋 功能简介

这是一个元服务器，专为 Cursor 用户设计，可帮助您一键安装和配置其他 MCP 服务器。支持从 npm 或 PyPi 安装服务器，并自动处理配置过程。

**技术要求**：
- 需安装 `npx` 用于 Node.js 服务器
- 需安装 `uv` 用于 Python 服务器

## 🔧 安装方法

将以下配置添加到 Cursor MCP 配置文件：

- **Windows**: `C:\Users\用户名\.cursor\mcp.json`
- **macOS**: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "cursor-mcp-installer": {
      "command": "npx",
      "args": [
        "@maotouy/cursor-mcp-installer"
      ]
    }
  }
}
```

## 📊 兼容性

该工具兼容所有标准 MCP 服务器，包括 npm 包和本地开发的服务器。
