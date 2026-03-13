import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as vscode from 'vscode';

export async function parseTemplate(inputFile: string, outputFile: string,
                                    data: Record<string, string>):
    Promise<void> {
  try {
    const inputUri = vscode.Uri.file(inputFile);
    const fileContent = await vscode.workspace.fs.readFile(inputUri);
    let content = new TextDecoder().decode(fileContent);

    const template = Handlebars.compile(content);
    content = template(data);

    const outputUri = vscode.Uri.file(outputFile);
    await vscode.workspace.fs.writeFile(outputUri,
                                        new TextEncoder().encode(content));
    await vscode.commands.executeCommand('workbench.action.reloadWindow');

  } catch (error) {
    vscode.window.showErrorMessage(`Error processing the file: ${error}`);
    console.error('Error processing the file:', error);
  }
}

export function mergeDictionaries(substitutions: Record<string, Object>,
                                  overwrites: Record<string, string>):
    Record<string, string> {
  let merged = {...substitutions["Defaults"]} as Record<string, string>;

  for (const [key, value] of Object.entries(overwrites)) {
    if (key === "$inherits") {
      for (const [iKey, iValue] of Object.entries(substitutions)) {
        if (iKey === value) {
          merged = {...merged, ...iValue as Record<string, string>};
        }
      }
    }
    // if (!(key in defaults)) {
    //     vscode.window.showWarningMessage(`Warning: Key '${key}' does not
    //     exist in defaults.`); console.warn(`Warning: Key '${key}' does not
    //     exist in defaults.`);
    // }
    merged[key] = value;
  }

  return merged;
}

// Example usage:
// const inputFile = 'example.txt';
// const outputFile = 'output.txt';
// const data = { 'a_word_to_substitue': 'Something very important' };
// parseTemplate(inputFile, outputFile, data);
