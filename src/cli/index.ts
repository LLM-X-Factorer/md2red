#!/usr/bin/env node
import { Command } from 'commander';
import { parseCommand } from './commands/parse.js';
import { generateCommand } from './commands/generate.js';
import { runCommand } from './commands/run.js';
import { previewCommand } from './commands/preview.js';
import { historyListCommand, historyClearCommand } from './commands/history.js';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('md2red')
  .description('Markdown to Xiaohongshu (RED) image card generator')
  .version('0.3.1');

program
  .command('run <file>')
  .description('Full pipeline: parse → strategy → generate → preview')
  .option('-o, --output <dir>', 'Output directory')
  .option('-c, --config <path>', 'Config file path')
  .option('-t, --theme <name>', 'Theme: dark or light')
  .option('--cards <number>', 'Max number of cards')
  .option('--force', 'Force re-generate even if already processed')
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
  .description('Preview and edit cards in browser')
  .option('-p, --port <number>', 'Server port (0 = auto)')
  .action(previewCommand);

const history = program.command('history').description('View generation history');
history.command('list').description('List all generation records').action(historyListCommand);
history.command('clear').description('Clear all history').action(historyClearCommand);
history.action(historyListCommand); // default subcommand

program.command('init').description('Generate config file in current directory').action(initCommand);

program.parse();
