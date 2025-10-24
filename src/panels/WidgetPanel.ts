import * as vscode from 'vscode';


export class WidgetPanel {
    public static currentPanel: WidgetPanel | undefined;
    public static readonly viewType = 'vswidgets.widgetPanel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _widgetTitle: string;

    public static createOrShow(extensionUri: vscode.Uri, widgetTitle: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (WidgetPanel.currentPanel) {
            WidgetPanel.currentPanel._panel.reveal(column);
            return;
        }

        // new panel
        const panel = vscode.window.createWebviewPanel(
            WidgetPanel.viewType,
            widgetTitle,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ]
            }
        );

        WidgetPanel.currentPanel = new WidgetPanel(panel, extensionUri, widgetTitle);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, widgetTitle: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._widgetTitle = widgetTitle;

        
        this._update();

    
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'refresh':
                        vscode.window.showInformationMessage('Refreshing widget...');
                        this._update();
                        return;
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );

    
        setInterval(() => {
            if (this._panel.visible) {
                this._sendUpdate();
            }
        }, 30000);
    }

    private _sendUpdate() {
    
        this._panel.webview.postMessage({
            type: 'update',
            data: {
                time: new Date().toLocaleTimeString(),
                title: this._widgetTitle,
                content: 'Widget content updated!'
            }
        });
    }

    public dispose() {
        WidgetPanel.currentPanel = undefined;

    
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
    
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

    
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
        );

            

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>${this._widgetTitle}</title>
</head>
<body>
        <div class="widget-content">
            <div class="widget-main">
                <h2>Welcome to VSWidgets!</h2>
        <div class="widget-footer">
            <span class="footer-text">VSWidgets Extension</span>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }
}