import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined = undefined;
    let activeEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

    // Cria um comando que abre o WebviewPanel
    const openAndReplicate = vscode.commands.registerCommand('extension.tagscheck', () => {
        if (activeEditor) {
            if (panel) {
                // Se o WebviewPanel já estiver aberto, apenas foca nele
                panel.reveal(vscode.ViewColumn.Beside);
            } else {
                // Cria um novo WebviewPanel
                panel = vscode.window.createWebviewPanel(
                    'replicatedCode',
                    'Replicado',
                    vscode.ViewColumn.Beside,
                    { enableScripts: true }
                );

                // Define o conteúdo inicial do Webview
                panel.webview.html = getWebviewContent(filterLines(activeEditor.document.getText()));

                // Atualiza o conteúdo do Webview quando o documento muda
                const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
                    if (event.document === activeEditor?.document) {
                        const updatedText = filterLines(event.document.getText());
                        // Atualiza o HTML do Webview
                        if (panel) {
                            panel.webview.html = getWebviewContent(updatedText);
                        }
                    }
                });

                context.subscriptions.push(onDidChangeTextDocument);

                // Limpeza ao fechar o painel
                panel.onDidDispose(() => {
                    panel = undefined;
                });
            }
        } else {
            vscode.window.showErrorMessage('Nenhuma aba ativa encontrada.');
        }
    });

    context.subscriptions.push(openAndReplicate);

    // Atualiza a referência do editor ativo quando ele mudar
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        activeEditor = editor;
    });
}

function filterLines(text: string): string {
    // Converte o texto em um array de linhas
    const lines = text.split('\n');


    // Remove linhas que começam com '--' (incluindo espaços iniciais) e junta as linhas restantes
    return lines
        .map(line => line.trimStart())
        .filter(line => !line.startsWith('--'))
        .join('\n');
}

function getWebviewContent(code: string): string {
    // Função para destacar palavras-chave SQL
    const highlightSQLKeywords = (code: string): string => {
        // Lista de palavras-chave SQL para destacar
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 
            'HAVING', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 
            'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'COUNT', 'WITH'
        ];
        
        // Expressão regular para encontrar palavras-chave SQL (ignora maiúsculas e minúsculas)
        const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

        // Substitui as palavras-chave por HTML com a classe CSS para cor
        return code.replace(regex, '<hr><span class="keyword">$1</span>');
    };

    // Realiza a coloração das palavras-chave
    const highlightedCode = highlightSQLKeywords(code);

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Replicado</title>
            <style>
                body {
                    font-size: 10px;
                    line-height: 19px;
                    margin: 20px;
                    font-family: monospace;
                }
                hr {
                margin-left:-20px !important;
                    opacity: 0.1;
                }
                pre {
                    padding-left: 20px;
                    border-radius: 5px;
                    overflow: auto;
                    white-space: pre-wrap; /* Mantém o formato do código */
                }
                .keyword {
                margin-left:-20px !important;
                    color: #007acc; /* Azul para palavras-chave SQL */
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>Confira os requisitos</h1>
            <pre id="code">${highlightedCode}</pre>
        </body>
        </html>
    `;
}
