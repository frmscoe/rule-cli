// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-misused-promises -- return Promise void where void are expected due to promise shelljs functions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs-extra';
import { updateLoadingIndicator } from '../common/loader';

const handleModuleManagement = async (
  action: string,
  modulename: any,
  options: { envSource?: string },
): Promise<void> => {
  const scriptDir = path.dirname(require.main!.filename);

  if (
    action !== 'remove' &&
    action !== 'add' &&
    action !== 'env' &&
    action !== 'start'
  ) {
    console.log(
      'Please specify the action, e.g rule-cli module <add|remove|env> modulename',
    );
    return;
  }

  if (options.envSource) {
    const envPath = options.envSource?.substring(1, options.envSource.length);

    if (!fs.existsSync(envPath)) {
      console.log('The supplied source url is not valid it does not exist');
      return;
    }

    if (!envPath?.includes('.env')) {
      console.log(
        'The supplied source url is not valid please confirm that the file name is included e.g .env',
      );
      return;
    }

    if (fs.existsSync(envPath) && options.envSource?.includes('.env')) {
      shell.cp('-f', `${envPath}`, `${scriptDir}/common`);
    }
  }

  if (action === 'start') {
    shell.cd(`${scriptDir}/module/modules/${modulename}`);
    console.log(`\n\nBuiling module ${modulename}`);
    shell.exec('npm run build', { async: true });
    console.log(`\n\nStarting up module ${modulename}`);
    shell.exec('npm run start', { async: true });
  }

  if (action === 'env') {
    if (options.envSource) {
      shell.cd(`${scriptDir}/module/modules/${modulename}`);
      shell.cp(
        '-f',
        `${scriptDir}/common/.env`,
        `${scriptDir}/module/modules/${modulename}`,
      );
      console.log(`\n\nBuiling module ${modulename}`);
      shell.exec('npm run build', { async: true });
      console.log(`\n\nStarting up module ${modulename}`);
      shell.exec('npm run start', { async: true });
    } else {
      console.log(
        `Please supply env file address to --env-source option to config your environment file for your ${modulename}`,
      );
      return;
    }
  }

  if (action === 'remove') {
    const deleteLoader = setInterval(() => {
      updateLoadingIndicator('Deleting...');
    }, 150);
    await fs.remove(`${scriptDir}/module/modules/${modulename}`);
    clearInterval(deleteLoader);
    console.log(`\nDone removing module ${modulename} from modules`);
  }

  if (action === 'add') {
    // Check if git is available
    if (!shell.which('git')) {
      shell.echo('Sorry, this script requires git');
      shell.exit(1);
    }

    console.log(
      'Please ensure stable internet so cli can install successfully 🟢',
    );

    shell.mkdir(`${scriptDir}/module/modules`);

    shell.cd(`${scriptDir}/module/modules`);

    console.log(`Started Cloning ${modulename} as a module of rule-cli`);

    shell.exec(`git clone https://github.com/frmscoe/${modulename}.git`);

    console.log(`Completed Cloning ${modulename} as a module of rule-cli`);

    shell.cd(modulename as string);

    shell.cp(
      '-f',
      `${scriptDir}/common/.env`,
      `${scriptDir}/module/modules/${modulename}`,
    );

    console.log(`Started Install dependancy for ${modulename}`);

    const intervalId = setInterval(() => {
      updateLoadingIndicator('Installing dependancies...');
    }, 150);

    const childProcessInstall = shell.exec('npm ci', { async: true });

    childProcessInstall.on('exit', async (code) => {
      if (code === 0) {
        console.log(`Finished Installing module ${modulename}`);

        const intervalIdBuild = setInterval(() => {
          updateLoadingIndicator('Building...');
        }, 150);
        const childProcessBuild = shell.exec('npm run build', { async: true });

        childProcessBuild.on('exit', async (code) => {
          clearInterval(intervalIdBuild);
          if (code === 0) {
            console.log(`\n\nStarting up module ${modulename}`);
            shell.exec('npm run start &', { async: true });
          }
        });
      } else {
        console.error(`\nError installing dependecy err with ${code}`);
      }
      clearInterval(intervalId);
    });
  }
};

export default handleModuleManagement;
