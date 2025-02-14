// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as treeView from './tree_view';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vs-templater" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vs-templater.refresh', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vs_templater!');
	});

	context.subscriptions.push(disposable);

	const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }
	const filePath = path.join(workspaceFolders[0].uri.fsPath, 'templates.yaml');

	const initContent = `
my_first_template:
  name: My First Template
  substitutions:
  - key: value
  file_mappings:
  - source_file: target_file
`;

	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, initContent, 'utf8');
		console.log('File created');
	}

	treeView.activate(context, filePath);
}

// This method is called when your extension is deactivated
export function deactivate() {}
