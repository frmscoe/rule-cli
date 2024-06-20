#!/usr/bin/env node
import { program } from 'commander';
import handleTemplating from './init/template';
import handleModuleManagement from './module/module';
import handleStart from './start/start';
import handleRemove from './common/remove';

program.version('1.0.0');

program
  .command('init')
  .description('Initialize rule project from a template')
  .action(() => {
    handleTemplating();
  });

program
  .command('module')
  .argument(
    '<add|remove|start|env>',
    'Mention action to take on the module either',
  )
  .argument(
    '<modulename>',
    'Specify a module name to add or removed e.g (rule-cli module -a rule-executor)',
  )
  .description(
    'Manage module of rule-cli by adding and removing ,note* every module will connect to default ports',
  )
  .option(
    '-s, --env-source [source-address]',
    'Local address of .env that can be used with this module',
  )
  .action(
    (
      action: string,
      modulename: string,
      options: { envSource?: string | undefined },
    ) => {
      handleModuleManagement(action, modulename, options);
    },
  );

program
  .command('start')
  .option('-r, --repo-name <reponame>', 'Specify a GitHub repository name')
  .option('-b, --branch-name <branchname>', 'Specify a branch to pull')
  .option('-o, --open-vs', 'Open visual studio code')
  .description(
    "Start a rule project, Note you can't start the rule project without rule-executor module, every rule module will listern to default port",
  )
  .action(
    (option: {
      branchName?: string | undefined;
      repoName: string;
      openVs: boolean;
    }) => {
      handleStart(option);
    },
  );

program
  .command('remove')
  .option(
    '-r, --rule-name <rulename@version>',
    'Specify a rule name to remove format: rule-000@1.0.0',
  )
  .option('-m, --module-name <modulename>', 'Specify a module name to remove')
  .description('Remove a rule from the cli host or module')
  .action(
    (option: {
      ruleName?: string | undefined;
      moduleName?: string | undefined;
    }) => {
      handleRemove(option);
    },
  );

program.parse(process.argv);
