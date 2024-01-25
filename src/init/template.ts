/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as prompts from 'prompts';
import * as fs from 'fs-extra';
import * as shell from 'shelljs';
import { updateLoadingIndicator } from '../common/loader';

const handleTemplating = async (): Promise<void> => {
  // The response from all of the questions
  let response: any = {};

  // Get the script's directory
  const scriptDir = path.dirname(require.main!.filename);

  if (await fs.pathExists('./package.json')) {
    const packageName = (await fs.readJsonSync('./package.json'))
      .name as string;
    if (packageName.includes('rule-')) {
      console.error(
        'Please consider another root directory, this one seems to be a rule directory',
      );
      return;
    }
  }

  // Get of the templates
  const templates = (
    await fs.readdir(path.join(scriptDir, 'init/templates'))
  ).map((template: string) => {
    let info: any = require(
      path.join(scriptDir, 'init/templates', template, 'template.json'),
    );
    if (typeof info === 'undefined') {
      info = require(
        path.join(scriptDir, 'init/templates', template, 'package.json'),
      );
    }

    info.dir = path.join(scriptDir, 'init/templates', template);

    return info;
  });

  // All of the questions
  const questions: any[] = [
    {
      type: 'text',
      name: 'name',
      initial: 'rule-001',
      message: 'Enter Rule name',
      validate: (value: string) =>
        !value.startsWith('rule-')
          ? 'Name of the rule needs to start with rule-'
          : true,
    },
  ];

  questions.push({
    type: 'text',
    name: 'org',
    initial: '@frmscoe',
    message: 'Enter organisation name',
    validate: (value: string) =>
      !value.startsWith('@')
        ? 'Name of the organisation needs to start with @'
        : true,
  });

  // Ask which template to use if there's more than one
  if (templates.length > 1) {
    questions.push({
      type: 'select',
      name: 'template',
      message: 'Pick a template',
      choices: templates.map((template) => ({
        title: template.name,
        description: template.description,
        value: template.dir,
      })),
      initial: 0,
    });
  }

  // On cancel
  const onCancel = (prompt: any) => {
    console.log('Never stop prompting!', prompt);
    return true;
  };

  // The response
  response = await prompts(questions, { onCancel });

  // if there's only one template then set the first template to be the template on the response
  if (typeof response.template === 'undefined') {
    response.template = templates[0].dir;
  }

  // Check if the project already exists
  if (await fs.pathExists(response.name)) {
    // Ask if we should override
    const overwrite = await prompts({
      type: 'confirm',
      name: 'value',
      message:
        'You already have a project with that name do you want to overwrite it?',
      initial: false,
    });

    // Override the project if the user said yes
    if (overwrite.value === true) {
      // Remove old files
      await fs.remove(response.name);

      // Copy the template
      await copyTemplate(response.name, response.template, response.org);
    }
  } else {
    // Copy the template
    await copyTemplate(response.name, response.template, response.org);
  }

  console.log(
    '\nInstalling dependencies has started\nThis might take a minute, Please wait',
  );
  const intervalId = setInterval(
    () => updateLoadingIndicator('Installing dependancies...'),
    150,
  );
  shell.cd(response.name);
  const childProcess = shell.exec('npm i', { async: true });

  // Handle exit event
  childProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('\nInstalling dependencies has completed');
    } else {
      console.error(`\nError installing dependecy err with ${code}`);
    }
    clearInterval(intervalId);
  });
};

// Copy the template
async function copyTemplate(name: string, template: string, orgName: string) {
  // Copy all of the files except the template.json file
  const destFileUrls: string[] = [''];
  await fs
    .copy(template, name, {
      filter: async (srcPath: string, destPath: string) => {
        if (
          srcPath.includes('template.json') ||
          srcPath.includes('package-lock.json')
        ) {
          return false;
        }
        destFileUrls.push(destPath);

        return true;
      },
    })
    .then(() => console.log(''))
    .catch((error) => console.error('Error:', error));

  for (const currentPath of destFileUrls) {
    if (currentPath.includes('rule-000.ts')) {
      const destFileName = currentPath.replace('rule-000.ts', `${name}.ts`);
      await fs.rename(currentPath, destFileName);
    }

    if (
      currentPath.includes('index.ts') ||
      currentPath.includes('publish.yml') ||
      currentPath.includes('rule.test.ts') ||
      currentPath.includes('jest.config.ts') ||
      currentPath.includes('README.md') ||
      currentPath.includes('package.json')
    ) {
      await editContentOfFile(currentPath, name, orgName);
    }
  }
  console.log('Completed copying the template');
}

async function editContentOfFile(
  filePath: string,
  rulename: string,
  orgName: string,
): Promise<void> {
  try {
    // Read the content of the file
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Perform your modifications on the content (example: replace a placeholder with newName)
    let modifiedContent = fileContent.replace(/{{rulename}}/g, rulename);
    modifiedContent = modifiedContent.replace(/{{orgname}}/g, orgName);

    // Write the modified content back to the file
    await fs.writeFile(filePath, modifiedContent, 'utf-8');
  } catch (error) {
    console.error(`Error editing content of ${filePath}:`, error);
  }
}

export default handleTemplating;
