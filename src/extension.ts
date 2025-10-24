import * as vscode from 'vscode';
import { WidgetPanel } from './panels/WidgetPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('VSWidgets is now active!');

    // command.
    let openWidgetCommand = vscode.commands.registerCommand('vswidgets.openWidget', () => {
        WidgetPanel.createOrShow(context.extensionUri, 'Basic Widget');
    });

    context.subscriptions.push(openWidgetCommand);
}

export function deactivate() {}