import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Gherkin Runner is now active!');

    const disposable = vscode.languages.registerCodeLensProvider(
        { language: 'feature', scheme: 'file' },
        new GherkinCodeLensProvider()
    );

    context.subscriptions.push(disposable);
}

class GherkinCodeLensProvider implements vscode.CodeLensProvider {
    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const codeLenses = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('Feature:') || line.startsWith('Scenario:')) {
                const range = new vscode.Range(i, 0, i, line.length);
                const codeLens = new vscode.CodeLens(range, {
                    title: '▶️ Run',
                    command: 'gherkin-runner.runTest',
                    arguments: [document.uri, line]
                });
                codeLenses.push(codeLens);
            }
        }

        return codeLenses;
    }
}

vscode.commands.registerCommand('gherkin-runner.runTest', (uri: vscode.Uri, line: string) => {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Unable to determine workspace folder');
        return;
    }

    const config = vscode.workspace.getConfiguration('playwright-bdd-runner');
    const commandArgs = config.get('command-args', '--headed');

    const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
    const grepPattern = line.split(':')[1].trim();
    const command = `npx bddgen && npx playwright test "${relativePath}" --grep "${grepPattern}" ${commandArgs}`;

    const terminal = vscode.window.createTerminal('Gherkin Runner');
    terminal.sendText(`cd "${workspaceFolder.uri.fsPath}"`);
    terminal.sendText(command);
    terminal.show();
});

export function deactivate() {}