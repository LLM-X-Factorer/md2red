#!/usr/bin/env node
import { Command } from 'commander';
import { parseCommand } from './commands/parse.js';
import { generateCommand } from './commands/generate.js';
import { runCommand } from './commands/run.js';
import { previewCommand } from './commands/preview.js';
import { publishCommand } from './commands/publish.js';
import { authCheckCommand, authLoginCommand, authLogoutCommand } from './commands/auth.js';
import { historyListCommand, historyClearCommand } from './commands/history.js';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('md2red')
  .description('Markdown to Xiaohongshu (RED) image-text note converter')
  .version('0.1.0');

program
  .command('run <file>')
  .description('Full pipeline: parse → strategy → generate → preview')
  .option('-o, --output <dir>', 'Output directory')
  .option('-c, --config <path>', 'Config file path')
  .option('-t, --theme <name>', 'Theme: dark or light')
  .option('--cards <number>', 'Max number of cards')
  .option('--force', 'Force re-generate even if already processed')
  .option('--no-publish', 'Skip publish step')
  .action(runCommand);

program
  .command('parse <file>')
  .description('Parse a Markdown file and output structured data')
  .option('-o, --output <path>', 'Output JSON to file')
  .action(parseCommand);

program
  .command('generate <file>')
  .description('Parse Markdown and generate image cards')
  .option('-o, --output <dir>', 'Output directory')
  .option('-c, --config <path>', 'Config file path')
  .option('-t, --theme <name>', 'Theme: dark or light')
  .option('--cards <number>', 'Max number of cards')
  .option('-s, --strategy', 'Use LLM to generate content strategy')
  .action(generateCommand);

program
  .command('preview <dir>')
  .description('Preview generated cards in browser')
  .action(previewCommand);

program
  .command('publish <dir>')
  .description('Publish to Xiaohongshu from output directory')
  .option('-c, --config <path>', 'Config file path')
  .option('--dry-run', 'Simulate publish without actually posting')
  .option('--force', 'Force publish even if already published')
  .action(publishCommand);

const auth = program.command('auth').description('Manage Xiaohongshu authentication');
auth.command('check').description('Check if login session is valid').option('-c, --config <path>', 'Config file path').action(authCheckCommand);
auth.command('login').description('Login via QR code scan').option('-c, --config <path>', 'Config file path').action(authLoginCommand);
auth.command('logout').description('Clear saved cookies').option('-c, --config <path>', 'Config file path').action(authLogoutCommand);

const history = program.command('history').description('View publish history');
history.command('list').description('List all publish records').action(historyListCommand);
history.command('clear').description('Clear all history').action(historyClearCommand);
history.action(historyListCommand); // default subcommand

program.command('init').description('Generate config file in current directory').action(initCommand);

program.parse();
