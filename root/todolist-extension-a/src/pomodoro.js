const vscode = require('vscode');
const path = require('path');

let pomodoroPanel;

function startPomodoro(tasks, taskFromContext) {
    const start = (task) => {
        if (!task) return;

        if (pomodoroPanel) pomodoroPanel.dispose();
        pomodoroPanel = vscode.window.createWebviewPanel(
            'pomodoroTimer',
            `Pomodoro: ${task.description}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(__dirname, '../resources'))] }
        );
        const pomodoroDuration = 25 * 60 * 1000; // 25 minutes
        const breakDuration = 5 * 60 * 1000;    // 5 minutes
        const startTime = Date.now();

        pomodoroPanel.webview.html = getPomodoroContent(task.description, pomodoroDuration, breakDuration, startTime);
        pomodoroPanel.webview.onDidReceiveMessage(message => {
            if (message.type === 'phaseEnd') {
                vscode.window.showInformationMessage(message.text);
            }
        });
        pomodoroPanel.onDidDispose(() => pomodoroPanel = undefined);
    };

    if (taskFromContext) {
        start(taskFromContext);
    } else {
        vscode.window.showQuickPick(
            tasks.filter(t => !t.completed).map(t => ({ label: `${t.description} (${t.time} hrs, ${t.priority})`, task: t })),
            { placeHolder: "Select a task for a 25-minute Pomodoro" }
        ).then(selection => start(selection?.task));
    }
}

function getPomodoroContent(taskDescription, pomodoroDuration, breakDuration, startTime) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Pomodoro Timer</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f0f0f0; }
        #progress { width: 80%; height: 20px; margin: 20px auto; transition: value 0.5s ease; }
        #timer { font-size: 2em; }
        #phase { font-size: 1.2em; margin: 10px; }
        button { padding: 10px 20px; font-size: 1em; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <h1>Pomodoro Timer</h1>
    <p>Task: ${taskDescription}</p>
    <div id="phase">Work Time</div>
    <div id="timer">25:00</div>
    <progress id="progress" value="0" max="${pomodoroDuration}"></progress>
    <br>
    <button id="startButton">Start Timer</button>
    <script>
        const pomodoroDuration = ${pomodoroDuration};
        const breakDuration = ${breakDuration};
        let phaseStartTime = ${startTime};
        let isWorkPhase = true;
        let timerRunning = false;

        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            if (!timerRunning) {
                timerRunning = true;
                phaseStartTime = Date.now();
                startButton.textContent = 'Timer Running...';
                startButton.disabled = true;
                updateTimer();
            }
        });

        function updateTimer() {
            if (!timerRunning) return;

            const now = Date.now();
            const elapsed = now - phaseStartTime;
            let remaining, total;

            if (isWorkPhase) {
                remaining = pomodoroDuration - elapsed;
                total = pomodoroDuration;
                if (remaining <= 0) {
                    isWorkPhase = false;
                    document.getElementById('phase').textContent = 'Break Time';
                    phaseStartTime = now;
                }
            } else {
                remaining = breakDuration - elapsed;
                total = breakDuration;
                if (remaining <= 0) {
                    isWorkPhase = true;
                    document.getElementById('phase').textContent = 'Work Time';
                    phaseStartTime = now;
                }
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
            document.getElementById('timer').textContent = \`\${minutes}:\${seconds}\`;
            document.getElementById('progress').value = total - remaining;
            document.getElementById('progress').max = total;

            requestAnimationFrame(updateTimer);
        }
    </script>
</body>
</html>`;
}

module.exports = { startPomodoro };