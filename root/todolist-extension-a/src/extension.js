const vscode = require('vscode');
const TodoTreeProvider = require('./todoTree');
const { exportTasks, importTasks } = require('./utils/fileUtils');
const { getDashboardContent } = require('./webview/dashboard');
const { startPomodoro } = require('./pomodoro');
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

    addTaskButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
    addTaskButton.text = '$(plus) Add Task';
    addTaskButton.tooltip = 'Add a new task';
    addTaskButton.command = 'todolist-extension-a.addTask';
    addTaskButton.show();
    context.subscriptions.push(addTaskButton);

    // Add Task
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.addTask', async () => {
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
            ['Markdown (.md)', 'Excel (.xlsx)', 'Code (.js)', 'URL', 'None'],
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

        let task = { description, time, priority, completed: false, resource, createdAt: Date.now(), completedAt: null };
        tasks.push(task);
        globalState.update('todoTasks', tasks);
        console.log(`Added: ${description} (${time} hrs, ${priority}, Resource: ${resource || 'None'})`);
        treeProvider.refresh();
        vscode.commands.executeCommand('timetracker-extension-b.planTasks', tasks.filter(t => !t.completed));
    }));

    // Complete Task
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.completeTask', async (taskFromContext) => {
        const task = taskFromContext || (await vscode.window.showQuickPick(
            tasks.map(t => ({ label: `${t.description} (${t.time} hrs, ${t.priority})`, task: t })),
            { placeHolder: "Select a task to mark as complete" }
        ))?.task;
        if (task) {
            task.completed = true;
            task.completedAt = Date.now();
            globalState.update('todoTasks', tasks);
            console.log(`Completed: ${task.description}`);
            treeProvider.refresh();
            vscode.commands.executeCommand('timetracker-extension-b.planTasks', tasks.filter(t => !t.completed));
        }
    }));

    // Clear All Tasks
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.clearAll', () => {
        tasks.length = 0;
        globalState.update('todoTasks', tasks);
        treeProvider.refresh();
        vscode.commands.executeCommand('timetracker-extension-b.planTasks', []);
        console.log('All tasks cleared!');
        addTaskButton.text = '$(plus) Add Task';
    }));

    // Get Tasks
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.getTasks', () => tasks));

    // Open Task Resource
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.openTaskFile', (task) => {
        if (!task.resource) {
            vscode.window.showInformationMessage(`No resource associated with "${task.description}"`);
            return;
        }
        if (task.resource.startsWith('http://') || task.resource.startsWith('https://')) {
            vscode.env.openExternal(vscode.Uri.parse(task.resource));
            return;
        }
        if (!vscode.workspace.rootPath) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const filePath = path.join(vscode.workspace.rootPath, task.resource);
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc);
        }, () => {
            let content = `# ${task.description}\n\nTime: ${task.time} hrs\nPriority: ${task.priority}`;
            if (task.resource.endsWith('.xlsx')) content = 'Placeholder for Excel.';
            else if (task.resource.endsWith('.js')) content = `// ${task.description}\nconsole.log("Task: ${task.description}");`;
            vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(content))
                .then(() => vscode.workspace.openTextDocument(filePath).then(doc => vscode.window.showTextDocument(doc)));
        });
    }));

    // Show Webview Dashboard
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.showWebview', () => {
        if (!webviewPanel) {
            webviewPanel = vscode.window.createWebviewPanel('taskDashboard', 'Task Dashboard', vscode.ViewColumn.Beside, { enableScripts: true });
            webviewPanel.webview.html = getDashboardContent(tasks);
            webviewPanel.onDidDispose(() => webviewPanel = undefined, null, context.subscriptions);
        }
        webviewPanel.reveal();
    }));

    // Export Tasks
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.exportTasks', () => exportTasks(tasks)));

    // Import Tasks
    context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.importTasks', async () => {
        const newTasks = await importTasks();
        if (newTasks) {
            tasks = newTasks;
            globalState.update('todoTasks', tasks);
            treeProvider.refresh();
            vscode.commands.executeCommand('timetracker-extension-b.planTasks', tasks.filter(t => !t.completed));
        }
    }));

    // Start Pomodoro (moved to pomodoro.js)
    // Inside activate(context), replace the existing startPomodoro registration:
context.subscriptions.push(vscode.commands.registerCommand('todolist-extension-a.startPomodoro', (task) => startPomodoro(tasks, task)));

    vscode.commands.executeCommand('timetracker-extension-b.planTasks', tasks.filter(t => !t.completed));
}

function deactivate() {}

module.exports = { activate, deactivate };