# cursor-mcp-installer - 一个用于安装MCP服务器的MCP服务器

这个服务器是一个可以为您安装其他MCP服务器的服务器。安装它后，您可以让Claude帮您安装托管在npm或PyPi上的MCP服务器。要求安装`npx`和`uv`分别用于Node和Python服务器。

![image](https://github.com/user-attachments/assets/d082e614-b4bc-485c-a7c5-f80680348793)

### 如何安装:

将以下内容放入您的Cursor MCP配置文件 `C:\Users\用户名\.cursor\mcp.json`（Windows）或 `~/.cursor/mcp.json`（macOS）:

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

### 示例提示

> 嘿Claude，安装名为mcp-server-fetch的MCP服务器

> 嘿Claude，将@modelcontextprotocol/server-filesystem包安装为MCP服务器。参数使用['/Users/username/Desktop']

> 你好Claude，请安装位于/Users/username/code/mcp-youtube的MCP服务器，我懒得自己做。

> 安装服务器@modelcontextprotocol/server-github。设置环境变量GITHUB_PERSONAL_ACCESS_TOKEN为'1234567890'
