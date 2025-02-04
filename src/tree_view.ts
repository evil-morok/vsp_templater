import * as vscode from 'vscode';

import { Section, processYamlFile } from './parse_yaml';
import path from 'path';
import { parseTemplate } from './parse_template';

let sectionDataProvider: SectionTreeDataProvider;

export class SectionTreeDataProvider implements vscode.TreeDataProvider<SectionItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SectionItem | undefined | null | void> = new vscode.EventEmitter<SectionItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SectionItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private root: Section;

  constructor(root: Section) {
    this.root = root;
  }

  getTreeItem(element: SectionItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.name, element.isLeaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);

    // If it's a leaf node, we can display additional section data in the tooltip or description
    if (element.isLeaf) {
      treeItem.tooltip = `Section Data: ${JSON.stringify(element.section, null, 2)}`;
      treeItem.contextValue = "leafItem";
    } else {
      treeItem.tooltip = element.name;
    }

    return treeItem;
  }

  getChildren(element?: SectionItem): Thenable<SectionItem[]> {
    if (element) {
      // If the element is a subsection, show its children
      return Promise.resolve(this.createSubsections(element.section));
    } else {
      // If the element is the root, show the top-level sections
      return Promise.resolve(this.createSubsections(this.root));
    }
  }

  private createSubsections(section: Section): SectionItem[] {
    const subsections: SectionItem[] = [];

    // Iterate over the section's properties
    Object.keys(section).forEach(key => {
      if (key !== "name" && section[key]?.name) {  // Ensure the section has a "name" before adding to tree
        const subsection: SectionItem = {
          name: section[key].name,  // Only add the name if it exists
          section: section[key],
          isLeaf: !this.hasChildren(section[key]), // Mark it as a leaf if it has no children
        };
        subsections.push(subsection);
      }
    });

    return subsections;
  }

  private hasChildren(section: Section): boolean {
    // Check if the section has any other properties besides "name"
    return Object.keys(section).some(key => key !== "name" && section[key]?.name);
  }

  // Add a refresh function to trigger a tree update
  refresh(): void {
    this._onDidChangeTreeData.fire(); // This will notify VSCode to refresh the tree view
  }

  // Optionally, you can also update the root object if needed
  updateRoot(newRoot: Section): void {
    this.root = newRoot;
    this.refresh(); // Refresh after updating the root
  }
}

export interface SectionItem {
  name: string;
  section: Section;
  isLeaf: boolean;  // Flag to indicate if the item is a leaf node
}

// To register the view in the extension's activation function
export function activate(context: vscode.ExtensionContext, filePath: string) {

  var root = processYamlFile(filePath);
  sectionDataProvider = new SectionTreeDataProvider(root);
  vscode.window.registerTreeDataProvider('vsp_templaterView', sectionDataProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('vs-templater.refreshTree', () => {
      var root = processYamlFile(filePath);
      sectionDataProvider.updateRoot(root);
      sectionDataProvider.refresh(); // Call refresh on the provider
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vs-templater.applyTemplate', (item: SectionItem) => {
      vscode.window.showInformationMessage(`Executing action for: ${item.name}`);
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return;
      }

      if (item.section.file_mappings) {
        for (const key in item.section.file_mappings) {
          let inputFile = path.join(workspaceFolders[0].uri.fsPath, key);
          let outputFile = path.join(workspaceFolders[0].uri.fsPath, item.section.file_mappings[key]);
          parseTemplate(inputFile, outputFile, { ...item.section.substitutions } );
        }
      }
    })
  );
}

