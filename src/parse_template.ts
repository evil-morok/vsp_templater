import * as fs from 'fs';
import * as vscode from 'vscode';

export function parseTemplate(inputFile: string, outputFile: string, data: Record<string, string>): void {
    try {
        let content = fs.readFileSync(inputFile, 'utf-8');
        
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`\{\{\{${key}\}\}\}`, 'g');
            content = content.replace(regex, value);
        }
        
        fs.writeFileSync(outputFile, content, 'utf-8');
    } catch (error) {
        vscode.window.showErrorMessage(`Error processing the file: ${error}`);
        console.error('Error processing the file:', error);
    }
}

export function mergeDictionaries(substitutions: Record<string, Object>, overwrites: Record<string, string>): Record<string, string> {
    let merged = { ...substitutions["Defaults"] } as Record<string, string>;
    
    for (const [key, value] of Object.entries(overwrites)) {
        if ( key === "$inherits" ) {
            for (const [iKey, iValue ] of Object.entries(substitutions)) {
                if (iKey === value) {
                    merged = {...merged, ...iValue as Record<string, string>};
                }
            }
        }
        // if (!(key in defaults)) {
        //     vscode.window.showWarningMessage(`Warning: Key '${key}' does not exist in defaults.`);
        //     console.warn(`Warning: Key '${key}' does not exist in defaults.`);
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
