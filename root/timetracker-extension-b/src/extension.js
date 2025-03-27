const vscode = require('vscode');
const { updateStatusBar } = require('./utils/statusBar');

let weeklyBandwidth = 9;
let receivedTasks = [];
let statusBarItem;

function activate(context) {
    vscode.window.showInformationMessage('Time Tracker Extension B is active!');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'Tasks: 0 hrs / 9 hrs (0%)';
    statusBarItem.tooltip = 'Weekly Bandwidth: 9 hrs, Total Task Time: 0 hrs';
    statusBarItem.command = 'timetracker-extension-b.planTasks'; // Clickable status bar
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    let disposable = vscode.commands.registerCommand('timetracker-extension-b.planTasks', (input) => {
        if (Array.isArray(input)) {
            receivedTasks = input.filter(task => !task.completed);
        } else if (input && typeof input.time !== 'undefined' && !input.completed) {
            if (!receivedTasks.some(t => t.description === input.description && t.time === input.time && t.priority === input.priority)) {
                receivedTasks.push(input);
            }
        } else if (receivedTasks.length === 0) {
            vscode.window.showInformationMessage('No tasks to plan yet!');
            updateStatusBar(statusBarItem, receivedTasks, weeklyBandwidth);
            return;
        }

        receivedTasks = receivedTasks.filter(task => task && typeof task.time !== 'undefined' && !task.completed);
        receivedTasks.sort((a, b) => {
            const priorityOrder = { High: 0, Medium: 1, Low: 2 };
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) || (a.time - b.time);
        });

        updateStatusBar(statusBarItem, receivedTasks, weeklyBandwidth);

        let planItems = receivedTasks.map((task, index) => ({
            label: `${index + 1}. ${task.description || 'Unknown'}`,
            detail: `${task.time || 0} hrs, Priority: ${task.priority || 'N/A'}`
        }));

        vscode.window.showQuickPick(planItems, {
            placeHolder: `Weekly Bandwidth: ${weeklyBandwidth} hrs | Total Task Time: ${receivedTasks.reduce((sum, t) => sum + (t.time || 0), 0)} hrs`,
            canPickMany: false
        }).then(() => {
            const totalTime = receivedTasks.reduce((sum, t) => sum + (t.time || 0), 0);
            if (totalTime > weeklyBandwidth) {
                vscode.window.showWarningMessage(`Overloaded! ${totalTime} hrs exceeds ${weeklyBandwidth} hrs.`);
            } else {
                vscode.window.showInformationMessage(`Plan fits! ${totalTime} hrs of ${weeklyBandwidth} hrs used.`);
            }
        });
    });

    context.subscriptions.push(disposable);

    vscode.commands.executeCommand('todolist-extension-a.getTasks').then((fetchedTasks) => {
        if (fetchedTasks && Array.isArray(fetchedTasks)) {
            receivedTasks = fetchedTasks.filter(task => !task.completed);
            updateStatusBar(statusBarItem, receivedTasks, weeklyBandwidth);
        }
    });
}

function deactivate() {}

module.exports = { activate, deactivate };