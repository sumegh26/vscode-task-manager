# VS Code Task Manager

A practice project featuring two VS Code extensions designed to streamline task management within the VS Code environment. Built as a learning exercise, this project demonstrates sidebar, editor, webview, and status bar integrations.

## Extensions Overview

### To-Do List Extension A
- **Purpose**: Serves as the core task management hub, allowing users to create, organize, and interact with tasks.
- **Role**: Provides a primary sidebar Tree View for task listing, integrates with the editor for task-specific file handling, and offers a webview dashboard for visual insights.
- **Key Features**:
  - Add tasks with details (description, time, priority, resource type).
  - Mark tasks as complete.
  - Open task-related files or URLs in the editor or browser.
  - Export/import tasks to/from `tasks.json`.
  - Display an interactive dashboard with priority charts and completion stats.

### Time Tracker Extension B
- **Purpose**: Focuses on task planning and bandwidth monitoring, ensuring users stay within time constraints.
- **Role**: Complements Extension A by consuming its task data, sorting tasks by priority, and presenting a real-time status bar for quick feedback.
- **Key Features**:
  - Plans tasks based on a 9-hour weekly bandwidth.
  - Updates a clickable status bar showing total task time and percentage of bandwidth used.
  - Displays a prioritized task list with warnings for overload.
    
## Features

- **Task Management**:
  - Add tasks with descriptions, estimated time, priority, and optional resources (Markdown, Excel, JavaScript files, or URLs).
  - Mark tasks as complete with a single click.
  - Clear all tasks when needed.
  - Open task resources directly (e.g., open a Markdown file or URL).
  - Export tasks to a JSON file and import them later.

- **Tree View**:
  - View all tasks in a dedicated sidebar with a clean, hierarchical display.
  - Right-click tasks to mark them as complete or start a Pomodoro session (for incomplete tasks).

- **Dashboard**:
  - A webview dashboard to visualize task statistics, including completion status and priority breakdown.

- **Pomodoro Timer**:
  - Start a 25-minute work session followed by a 5-minute break to enhance focus.
  - Visual progress bar and countdown timer in a webview panel.
  - Notifications at the end of work and break phases to keep you on track.
  - Start the timer via the Command Palette or by right-clicking a task in the Tree View.

- **Time Tracking**:
  - Integrates with a companion extension (`timetracker-extension-b`) to plan and track task durations.

## Interactions

### Available via Clicks
- **Tree View (Extension A)**:
  - **Left-Click a Task**: Opens the associated resource (e.g., `.md`, `.js`, URL) in the editor or browser, with editor decorations applied.
  - **Left-Click a Task**: Shows a context menu with “Complete Task (A)” to mark it done.
- **Status Bar (Extension B)**:
  - **Left-click the Status Bar**: Triggers the “Plan Tasks (B)” command, showing a prioritized task list.

### Command Palette Only (Ctrl+Shift+P)
- **Extension A**:
  - `Add Task (A)`: Creates a new task with user inputs.
  - `Edit Task (A)`: Edits an existing task.
  - `Complete Task (A)`: Marks a task as complete (alternative to left-click).
  - `Clear All Tasks (A)`: Deletes all tasks.
  - `Show Task Dashboard (A)`: Opens the interactive webview with priority charts and stats.
  - `Export Tasks (A)`: Saves tasks to `tasks.json` in the workspace root.
  - `Import Tasks (A)`: Loads tasks from `tasks.json`.
- **Extension B**:
  - `Plan Tasks (B)`: Displays the task planning list (also triggered by status bar click).

## Why Two Separate Extensions?

The project splits functionality into two extensions to:
- **Demonstrate Modularity**: Showcases how multiple extensions can collaborate via VS Code’s command API, mimicking real-world scenarios where extensions share data (e.g., Extension A as the data provider, Extension B as the consumer).
- **Practice Communication**: Highlights inter-extension communication (e.g., `getTasks` and `planTasks` commands), a key skill for complex extension development.
- **Simplify Development**: Separates concerns—task creation/management (A) versus planning/tracking (B)—making each extension easier to maintain and test individually.
- **Flexibility**: Allows independent use or extension (e.g., B could work with other task sources in the future).

## Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sumegh26/vscode-task-manager.git
2. **Open in VS Code**:
   ```bash
    Open task_management_workspace.code-workspace as a multi-root workspace.
3. **Install Dependencies**:
   ```bash
    Run npm install in todolist-extension-a and timetracker-extension-b folders.
4. **Debug**:
   ```bash
    Press F5 to launch the Extension Development Host with both extensions loaded.

## Debugging

The .vscode/launch.json configuration in the workspace launches both extensions simultaneously:
    
    {
      "version": "0.2.0",
      "configurations": [
        {
          "type": "extensionHost",
          "request": "launch",
          "name": "Launch Both Extensions",
          "runtimeExecutable": "${execPath}",
          "args": [
            "--extensionDevelopmentPath=${workspaceFolder:todolist-extension-a}",
            "--extensionDevelopmentPath=${workspaceFolder:timetracker-extension-b}"
          ],
          "outFiles": [
            "${workspaceFolder:todolist-extension-a}/out/**/*.js",
            "${workspaceFolder:timetracker-extension-b}/out/**/*.js"
          ]
        }
      ]
    }

 **VS Code runs an Extension Development Host instance, loading both extensions as if installed**
