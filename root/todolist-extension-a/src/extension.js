const vscode = require('vscode');
const TodoTreeProvider = require('./todoTree');
const path = require('path');

let tasks = [];
let treeProvider;
let addTaskButton;
let webviewPanel;

function activate(context) {
    const globalState = context.globalState;
    tasks = globalState.get('todoTasks', []);
    console.log('To-Do List Extension A is active!');

    treeProvider = new TodoTreeProvider(tasks);
    vscode.window.registerTreeDataProvider('todoListView', treeProvider);

    addTaskButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 200);
    addTaskButton.text = '$(plus) Add Task';
    addTaskButton.tooltip = 'Add a new task';
    addTaskButton.command = 'todolist-extension-a.addTask';
    addTaskButton.show();
    context.subscriptions.push(addTaskButton);

    // Command: Add Task with Resource
    let addDisposable = vscode.commands.registerCommand('todolist-extension-a.addTask', async () => {
        let description = await vscode.window.showInputBox({ placeHolder: "Enter task (e.g., Write report)" });
        if (!description) return;

        let time = await vscode.window.showInputBox({
            placeHolder: "Estimated time in hours (e.g., 2)",
            validateInput: (value) => (isNaN(value) || value <= 0 ? "Please enter a valid number" : null)
        });
        if (!time) return;
        time = parseFloat(time);

        let priority = await vscode.window.showQuickPick(['High', 'Medium', 'Low'], { placeHolder: "Select priority" });
        if (!priority) return;

        let resourceType = await vscode.window.showQuickPick(
            ['Markdown (.md)', 'Excel (.xlsx)', 'Code (.js)','Code (.py)', 'URL', 'None'],
            { placeHolder: "Select resource type (optional)" }
        );
        let resource = null;
        if (resourceType && resourceType !== 'None') {
            if (resourceType === 'URL') {
                resource = await vscode.window.showInputBox({ placeHolder: "Enter URL (e.g., https://company.portal/training)" });
                if (!resource) resource = null;
            } else {
                resource = `${description.replace(/\s/g, '_')}.${resourceType.split('(')[1].slice(1, -1)}`;
            }
        }

        let task = { description, time, priority, completed: false, resource };
        tasks.push(task);
        globalState.update('todoTasks', tasks);
        console.log(`Added: ${description} (${time} hrs, ${priority}, Resource: ${resource || 'None'})`);
        treeProvider.refresh();
        let incompleteTasks = tasks.filter(task => !task.completed);
        vscode.commands.executeCommand('timetracker-extension-b.planTasks', incompleteTasks);
    });

    // Command: Complete Task
    let completeDisposable = vscode.commands.registerCommand('todolist-extension-a.completeTask', async (taskFromContext) => {
        if (taskFromContext && taskFromContext.description) {
            taskFromContext.completed = true;
            globalState.update('todoTasks', tasks);
            console.log(`Completed: ${taskFromContext.description}`);
            treeProvider.refresh();
            let incompleteTasks = tasks.filter(task => !task.completed);
            vscode.commands.executeCommand('timetracker-extension-b.planTasks', incompleteTasks);
        } else {
            let taskOptions = tasks.map(task => ({
                label: `${task.description} (${task.time} hrs, ${task.priority})`,
                task: task
            }));
            let selected = await vscode.window.showQuickPick(taskOptions, { placeHolder: "Select a task to mark as complete" });
            if (selected) {
                selected.task.completed = true;
                globalState.update('todoTasks', tasks);
                console.log(`Completed: ${selected.task.description}`);
                treeProvider.refresh();
                let incompleteTasks = tasks.filter(task => !task.completed);
                vscode.commands.executeCommand('timetracker-extension-b.planTasks', incompleteTasks);
            }
        }
    });

    // Command: Clear All Tasks
    let clearDisposable = vscode.commands.registerCommand('todolist-extension-a.clearAll', () => {
        tasks.length = 0;
        globalState.update('todoTasks', tasks);
        treeProvider.refresh();
        vscode.commands.executeCommand('timetracker-extension-b.planTasks', []);
        console.log('All tasks cleared!');
        addTaskButton.text = '$(plus) Add Task';
        addTaskButton.tooltip = 'Add a new task';
    });

    // Command: Get Tasks (for B)
    let getTasksDisposable = vscode.commands.registerCommand('todolist-extension-a.getTasks', () => {
        return tasks;
    });

    // Command: Open Task Resource
    let openTaskFileDisposable = vscode.commands.registerCommand('todolist-extension-a.openTaskFile', (task) => {
        if (!task.resource) {
            vscode.window.showInformationMessage(`No resource associated with "${task.description}"`);
            return;
        }

        if (task.resource.startsWith('http://') || task.resource.startsWith('https://')) {
            console.log(`Opening URL: ${task.resource}`);
            vscode.env.openExternal(vscode.Uri.parse(task.resource));
            return;
        }

        if (!vscode.workspace.rootPath) {
            vscode.window.showErrorMessage('No workspace folder open. Please open a folder.');
            console.log('No workspace root path available');
            return;
        }

        const filePath = path.join(vscode.workspace.rootPath, task.resource);
        console.log(`Attempting to open file: ${filePath}`);
        vscode.workspace.openTextDocument(filePath).then(doc => {
            console.log(`File opened: ${filePath}`);
            vscode.window.showTextDocument(doc);
        }, err => {
            console.log(`File not found, creating: ${filePath}`);
            let content = `# ${task.description}\n\nTime: ${task.time} hrs\nPriority: ${task.priority}`;
            if (task.resource.endsWith('.xlsx')) {
                content = 'This is a placeholder for an Excel file. Open in Excel to edit.';
            } else if (task.resource.endsWith('.js')) {
                content = `// Task : ${task.description}\n// Time allocated: ${task.time} hrs`;
            }
             else if (task.resource.endsWith('.py')) {
                content = `# Task : ${task.description}\n# Time allocated: ${task.time} hrs`;
            }
            vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(content))
                .then(() => {
                    vscode.workspace.openTextDocument(filePath).then(doc => {
                        console.log(`File created and opened: ${filePath}`);
                        vscode.window.showTextDocument(doc);
                    });
                }, createErr => {
                    vscode.window.showErrorMessage(`Failed to create file: ${createErr}`);
                    console.log(`Error creating file: ${createErr}`);
                });
        });
    });

    // Command: Show Webview
    let showWebviewDisposable = vscode.commands.registerCommand('todolist-extension-a.showWebview', () => {
        if (!webviewPanel) {
            webviewPanel = vscode.window.createWebviewPanel(
                'taskWebview',
                'Task Details',
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );
            webviewPanel.webview.html = getWebviewContent(tasks);
            webviewPanel.onDidDispose(() => {
                webviewPanel = undefined;
            }, null, context.subscriptions);
        }
        webviewPanel.reveal();
    });

    context.subscriptions.push(addDisposable, completeDisposable, clearDisposable, getTasksDisposable, openTaskFileDisposable, showWebviewDisposable);

    let incompleteTasks = tasks.filter(task => !task.completed);
    vscode.commands.executeCommand('timetracker-extension-b.planTasks', incompleteTasks);
}

function deactivate() {}

function getWebviewContent(tasks) {
    const totalTime = tasks.reduce((sum, task) => sum + (task.time || 0), 0);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Task Details</title>
</head>
<body>
    <h1>Task Summary</h1>
    <p>Total Time: ${totalTime} hrs</p>
    <ul>
        ${tasks.map(task => `<li>${task.description}: ${task.time} hrs, Priority: ${task.priority}${task.completed ? ' (Completed)' : ''}${task.resource ? `, Resource: ${task.resource}` : ''}</li>`).join('')}
    </ul>
</body>
</html>`;
}

module.exports = { activate, deactivate };