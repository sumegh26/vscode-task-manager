const { TreeItem, TreeItemCollapsibleState } = require('vscode');

class TodoTreeProvider {
    constructor(tasks) {
        this.tasks = tasks;
        this._onDidChangeTreeData = new class {
            constructor() {
                this.listeners = [];
            }
            fire() {
                this.listeners.forEach(l => l());
            }
            event() {
                return (listener) => {
                    this.listeners.push(listener);
                    return () => {
                        this.listeners = this.listeners.filter(l => l !== listener);
                    };
                };
            }
        }();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event();
    }

    getTreeItem(element) {
        const treeItem = new TreeItem(
            element.completed ? `✓ ${element.description} (${element.time} hrs)` : `${element.description} (${element.time} hrs)`,
            TreeItemCollapsibleState.None
        );
        treeItem.tooltip = `Priority: ${element.priority}${element.completed ? ', Completed' : ''}${element.resource ? `, Resource: ${element.resource}` : ''}`;
        treeItem.command = {
            command: 'todolist-extension-a.openTaskFile',
            title: 'Open Task Resource',
            arguments: [element]
        };
        treeItem.contextValue = 'task';
        return treeItem;
    }

    getChildren(element) {
        if (!element) {
            return this.tasks;
        }
        return [];
    }

    refresh() {
        this._onDidChangeTreeData.fire();
        if (global.webviewPanel) {
            global.webviewPanel.webview.html = global.getWebviewContent(this.tasks);
        }
    }
}

module.exports = TodoTreeProvider;