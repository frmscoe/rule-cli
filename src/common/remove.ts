/* eslint-disable @typescript-eslint/no-explicit-any */
import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs-extra';
import { updateLoadingIndicator } from '../common/loader';
import * as prompts from 'prompts';

const handleRemove = async (options: {
  ruleName?: string;
  moduleName?: string;
}): Promise<void> => {
  const scriptDir = path.dirname(require.main!.filename);

  if (options.moduleName) {
    const deleteLoader = setInterval(
      () => updateLoadingIndicator('Deleting...'),
      150,
    );
    await fs.remove(`${scriptDir}/module/modules/${options.moduleName}`);
    clearInterval(deleteLoader);
    console.log(`\nDone removing module ${options.moduleName} from modules`);
    return;
  }

  if (options.ruleName) {
    console.log(`You are about to delete ${options.ruleName.split('@')[0]}`);
    const questions: any[] = [
      {
        type: 'select',
        name: 'continue',
        message: 'Are you sure you would like to continue?',
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

    const deleteLoader = setInterval(
      () => updateLoadingIndicator('Deleting...'),
      150,
    );

    const nameVersion = options.ruleName.split('@');
    await fs.remove(
      `${scriptDir}/start/local-rules/frmscoe-${nameVersion[0]}-${nameVersion[1]}.tgz`,
    );
    await fs.remove(`${scriptDir}/start/remote-rules/${nameVersion[0]}`);
    shell.cd(`${scriptDir}/module/modules/rule-executer`);

    shell.sed(
      '-i',
      /FUNCTION_NAME.*/,
      `FUNCTION_NAME='rule-901'`,
      `${scriptDir}/module/modules/rule-executer/.env`,
    );
    shell.sed(
      '-i',
      /RULE_NAME=.*/,
      `RULE_NAME='901'`,
      `${scriptDir}/module/modules/rule-executer/.env`,
    );

    shell.exec(`npm install @frmscoe/rule-901@latest`);

    clearInterval(deleteLoader);
    console.log(`\nDone removing module ${options.moduleName} from modules`);
  }
};

export default handleRemove;
