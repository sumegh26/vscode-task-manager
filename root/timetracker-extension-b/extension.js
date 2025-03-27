const vscode = require('vscode');

let weeklyBandwidth = 9;
let receivedTasks = [];
let statusBarItem;

function activate(context) {
    vscode.window.showInformationMessage('Time Tracker Extension B is active!');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'Tasks: 0 hrs / 9 hrs (0%)';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    let disposable = vscode.commands.registerCommand('timetracker-extension-b.planTasks', (input) => {
        if (Array.isArray(input)) {
            receivedTasks = input.filter(task => !task.completed);
        } else if (input && typeof input.time !== 'undefined' && !input.completed) {
            const exists = receivedTasks.some(t => 
                t.description === input.description && 
                t.time === input.time && 
                t.priority === input.priority
            );
            if (!exists) {
                receivedTasks.push(input);
            }
        } else if (receivedTasks.length === 0) {
            vscode.window.showInformationMessage('No tasks to plan yet!');
            statusBarItem.text = 'Tasks: 0 hrs / 9 hrs (0%)';
            statusBarItem.color = 'inherit';
            return;
        }

        receivedTasks = receivedTasks.filter(task => task && typeof task.time !== 'undefined' && !task.completed);

        receivedTasks.sort((a, b) => {
            const priorityOrder = { High: 0, Medium: 1, Low: 2 };
            if (!a || !b || !a.priority || !b.priority) return 0;
            if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.time - b.time;
        });

        let totalTime = receivedTasks.reduce((sum, task) => sum + (task.time || 0), 0);
        let percentage = Math.round((totalTime / weeklyBandwidth) * 100);
        statusBarItem.text = `Tasks: ${totalTime} hrs / ${weeklyBandwidth} hrs (${percentage}%)`;
        statusBarItem.tooltip = `${receivedTasks.length} active tasks`;
        if (totalTime > weeklyBandwidth) {
            statusBarItem.color = 'red';
        } else {
            statusBarItem.color = 'inherit';
        }

        let planItems = receivedTasks.map((task, index) => ({
            label: `${index + 1}. ${task.description || 'Unknown'}`,
            detail: `${task.time || 0} hrs, Priority: ${task.priority || 'N/A'}`
        }));

        vscode.window.showQuickPick(planItems, {
            placeHolder: `Weekly Bandwidth: ${weeklyBandwidth} hrs | Total Task Time: ${totalTime} hrs`,
            canPickMany: false
        }).then(() => {
            if (totalTime > weeklyBandwidth) {
                vscode.window.showWarningMessage(`Overloaded! ${totalTime} hrs exceeds ${weeklyBandwidth} hrs.`);
            } else {
                vscode.window.showInformationMessage(`Plan fits! ${totalTime} hrs of ${weeklyBandwidth} hrs used.`);
            }
        });
    });

    context.subscriptions.push(disposable);

    // Initial sync with A
    vscode.commands.executeCommand('todolist-extension-a.getTasks').then((fetchedTasks) => {
        if (fetchedTasks && Array.isArray(fetchedTasks)) {
            receivedTasks = fetchedTasks.filter(task => !task.completed);
            let totalTime = receivedTasks.reduce((sum, task) => sum + (task.time || 0), 0);
            let percentage = Math.round((totalTime / weeklyBandwidth) * 100);
            statusBarItem.text = `Tasks: ${totalTime} hrs / ${weeklyBandwidth} hrs (${percentage}%)`;
            statusBarItem.tooltip = `${receivedTasks.length} active tasks`;
            if (totalTime > weeklyBandwidth) {
                statusBarItem.color = 'red';
            }
        }
    });
}

function deactivate() {}

module.exports = { activate, deactivate };