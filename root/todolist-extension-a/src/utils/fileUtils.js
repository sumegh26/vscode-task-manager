const vscode = require('vscode');
const path = require('path');

async function exportTasks(tasks) {
    if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
    }
    const filePath = path.join(vscode.workspace.rootPath, 'tasks.json');
    const content = JSON.stringify(tasks, null, 2);
    await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(content));
    vscode.window.showInformationMessage(`Tasks exported to ${filePath}`);
}

async function importTasks() {
    if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return null;
    }
    const filePath = path.join(vscode.workspace.rootPath, 'tasks.json');
    try {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
        const tasks = JSON.parse(content.toString());
        vscode.window.showInformationMessage(`Imported ${tasks.length} tasks`);
        return tasks;
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to import tasks: ${err.message}`);
        return null;
    }
}

module.exports = { exportTasks, importTasks };