import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;
const keywords = ['maça', 'uva', 'abacate']; // Lista de palavras a procurar

export function activate(context: vscode.ExtensionContext) {
    // Registra o comando para abrir o Webview
    let disposable = vscode.commands.registerCommand('extension.checkForOi', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
        } else {
            createWebviewPanel(context);
        }
    });
    context.subscriptions.push(disposable);

    // Atualiza o Webview quando o texto no documento é alterado
    vscode.workspace.onDidChangeTextDocument(() => {
        if (panel) {
            updateWebview();
        }
    });
}

export function deactivate() {
    if (panel) {
        panel.dispose();
    }
}

function createWebviewPanel(context: vscode.ExtensionContext) {
    panel = vscode.window.createWebviewPanel(
        'statusWebview',
        'Palavras Encontradas',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    panel.onDidDispose(() => {
        panel = undefined;
    });

    updateWebview();
}

function updateWebview() {
    if (!panel) {
        return;
    }

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        panel.webview.html = getWebviewContent([]);
        return;
    }

    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');

    const foundKeywords = new Set<string>();

    for (const line of lines) {
        if (!line.trim().startsWith('--')) {
            for (const keyword of keywords) {
                if (line.includes(keyword)) {
                    foundKeywords.add(keyword);
                }
            }
        }
    }

    panel.webview.html = getWebviewContent(Array.from(foundKeywords));
}

function getWebviewContent(foundKeywords: string[]): string {
    const items = foundKeywords.map(keyword => `<li>${keyword}</li>`).join('');
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Palavras Encontradas</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 10px; }
            ul { list-style-type: none; padding: 0; }
            li { font-size: 16px; color: green; }
        </style>
    </head>
    <body>
        <h1>Palavras Encontradas:</h1>
        <ul>
            ${items}
        </ul>
    </body>
    </html>`;
}
