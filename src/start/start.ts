// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs-extra';
import { updateLoadingIndicator } from '../common/loader';
import * as prompts from 'prompts';

const handleStart = async (options: {
  branchName?: string;
  repoName: string;
  openVs: boolean;
}): Promise<void> => {
  const scriptDir = path.dirname(require.main!.filename);

  if (
    !(await fs.pathExists(
      `${scriptDir}/module/modules/rule-executer/build/index.js`,
    ))
  ) {
    console.log(
      'Please ensure module rule-executer is install properly to start up the rule',
    );
    return;
  }

  if (options.repoName) {
    if (options.repoName && options.branchName) {
      const repositoryName = options.repoName;
      const branchName = options.branchName;
      console.log(
        `Please ensure stable internet so cli can install successfully 🟢`,
      );
      shell.mkdir(`${scriptDir}/start/remote-rules`);

      shell.cd(`${scriptDir}/start/remote-rules`);

      console.log(`Started Cloning ${repositoryName} as a module of rule-cli`);

      shell.exec(`git clone https://github.com/frmscoe/${repositoryName}.git`);

      shell.cd(repositoryName);

      shell.exec(`git checkout ${branchName}`);

      shell.exec(`git pull`);

      console.log(`Completed Cloning ${repositoryName} for testing`);

      console.log(`Started Install dependancy for ${repositoryName}`);

      const intervalId = setInterval(
        () => updateLoadingIndicator('Installing dependancies...'),
        150,
      );

      const childProcessInstall = shell.exec('npm ci', { async: true });

      childProcessInstall.on('exit', async (code) => {
        clearInterval(intervalId);
        console.log(`\n\nCompleted Install dependancy for ${repositoryName}`);
        if (code === 0) {
          console.log(`Started building ${repositoryName}`);
          const childProcessBuild = shell.exec('npm run build', {
            async: true,
          });

          childProcessBuild.on('exit', async (code) => {
            if (code === 0) {
              shell.exec(`npm pack`);

              const ruleVersion = (await fs.readJsonSync('./package.json'))
                .version as string;

              console.log(`Completed building ${repositoryName}`);

              shell.cd(`${scriptDir}/module/modules/rule-executer`);

              shell.sed(
                '-i',
                /FUNCTION_NAME.*/,
                `FUNCTION_NAME='${repositoryName}'`,
                `${scriptDir}/module/modules/rule-executer/.env`,
              );

              const rulename = repositoryName.replace('rule-', '');
              shell.sed(
                '-i',
                /RULE_NAME=.*/,
                `RULE_NAME='${rulename}'`,
                `${scriptDir}/module/modules/rule-executer/.env`,
              );

              shell.exec(
                `npm i rule@file:${scriptDir}/start/remote-rules/${repositoryName}/frmscoe-${repositoryName}-${ruleVersion}.tgz`,
              );

              shell.exec(`npm run build`);

              shell.exec(`npm run start`);
            }
          });
        }
      });
    } else {
      console.log(
        'Please supply --repo-name and --branch-name to use for testing',
      );
    }
  } else {
    if (!(await fs.pathExists('./package.json'))) {
      console.error(
        'Please consider another root directory, this one seems to be a rule directory',
      );
      return;
    }

    const packageName = (await fs.readJsonSync('./package.json'))
      .name as string;
    if (!packageName.includes('rule-')) {
      console.error(
        'Please consider another root directory, this one seems to be a rule directory',
      );
      return;
    }

    const currentCliDir = process.cwd();

    console.log(
      'This proccess will build and pack your rule for testing reason',
    );
    const questions: any[] = [
      {
        type: 'select',
        name: 'continue',
        message: 'Would you like to continue?',
        choices: [
          {
            title: 'No',
            description: 'Disagree to continue with the proccess',
            value: 0,
          },
          {
            title: 'Yes',
            description: 'Agree to continue with the proccess',
            value: 1,
          },
        ],
        initial: 1,
      },
    ];

    const onCancel = (prompt: any) => {
      console.log('Never stop prompting!', prompt);
      return true;
    };

    const response = await prompts(questions, { onCancel });

    if (!response.continue) {
      return;
    }

    shell.mkdir(`${scriptDir}/start/local-rules`);

    shell.exec(`npm run build`);

    shell.exec(`npm pack`);

    const ruleVersion = (await fs.readJsonSync('./package.json'))
      .version as string;
    const ruleName = (
      (await fs.readJsonSync('./package.json')).name as string
    ).replace('@frmscoe/', '');

    shell.mv(
      `-f`,
      `${currentCliDir}/frmscoe-${ruleName}-${ruleVersion}.tgz`,
      `${scriptDir}/start/local-rules`,
    );

    shell.cd(`${scriptDir}/module/modules/rule-executer`);

    shell.sed(
      '-i',
      /FUNCTION_NAME.*/,
      `FUNCTION_NAME='${ruleName}'`,
      `${scriptDir}/module/modules/rule-executer/.env`,
    );

    const rulename = ruleName.replace('rule-', '');
    shell.sed(
      '-i',
      /RULE_NAME=.*/,
      `RULE_NAME='${rulename}'`,
      `${scriptDir}/module/modules/rule-executer/.env`,
    );

    shell.exec(
      `npm i rule@file:${scriptDir}/start/local-rules/frmscoe-${ruleName}-${ruleVersion}.tgz`,
    );

    shell.exec(`npm run build`);

    if (options.openVs) shell.exec(`code .`);

    shell.exec(`npm run start`);
  }
};

export default handleStart;
