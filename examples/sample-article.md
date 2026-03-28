---
title: 用 TypeScript 构建 CLI 工具的完整指南
author: md2red
tags: [TypeScript, CLI, Node.js]
---

# 用 TypeScript 构建 CLI 工具的完整指南

现代开发中，CLI 工具无处不在。从 `npm` 到 `git`，再到各种自动化脚本，命令行工具是开发者最亲密的伙伴。今天我们来聊聊如何用 TypeScript 从零构建一个专业级的 CLI 工具。

## 为什么选择 TypeScript

TypeScript 为 CLI 开发带来了显著优势：

- **类型安全**：参数解析、配置文件加载等环节都能得到类型检查的保护
- **更好的 IDE 支持**：自动补全和重构让开发效率翻倍
- **生态丰富**：npm 上有大量高质量的 TypeScript 库可以直接使用
- **维护性强**：类型就是最好的文档，半年后回来看代码也不会懵

选择 TypeScript 不仅仅是跟风，而是实实在在地提升开发体验和代码质量。

## 项目初始化

首先创建项目并安装必要的依赖：

```bash
mkdir my-cli && cd my-cli
npm init -y
npm install commander chalk ora
npm install -D typescript @types/node
```

配置 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "outDir": "./dist",
    "strict": true
  }
}
```

## 编写入口文件

创建 `src/index.ts` 作为 CLI 的入口点：

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('my-cli')
  .description('A sample CLI tool')
  .version('1.0.0');

program
  .command('greet <name>')
  .description('Greet someone')
  .option('-l, --loud', 'Say it loudly')
  .action((name: string, opts: { loud?: boolean }) => {
    const msg = `Hello, ${name}!`;
    console.log(opts.loud ? msg.toUpperCase() : msg);
  });

program.parse();
```

关键点在于第一行的 shebang（`#!/usr/bin/env node`），它告诉系统用 Node.js 来执行这个脚本。

## 添加交互式功能

有时候我们需要在运行时询问用户输入。可以使用 `inquirer` 或更轻量的 `prompts` 库来实现交互式 CLI。

用户交互是 CLI 工具的灵魂——好的交互设计能让工具从"能用"变成"好用"。记住：少即是多，只在必要时才询问用户。

## 错误处理与日志

一个专业的 CLI 工具需要优雅地处理错误：

```typescript
import chalk from 'chalk';

function handleError(err: Error): never {
  console.error(chalk.red('Error:'), err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
}

process.on('uncaughtException', handleError);
process.on('unhandledRejection', (reason) => {
  handleError(reason instanceof Error ? reason : new Error(String(reason)));
});
```

好的错误信息应该告诉用户发生了什么、为什么发生、以及如何解决。

## 发布到 npm

最后一步是将工具发布到 npm，让全世界都能使用：

1. 确保 `package.json` 中配置了 `bin` 字段
2. 添加 `.npmignore` 排除源码和测试文件
3. 运行 `npm publish` 发布

记得在发布前做好测试，毕竟 CLI 工具直接影响用户的终端体验。
