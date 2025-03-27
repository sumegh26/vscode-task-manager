function getDashboardContent(tasks) {
    const totalTime = tasks.reduce((sum, t) => sum + (t.time || 0), 0);
    const completedTime = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.time || 0), 0);
    const priorityData = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach(t => priorityData[t.priority] = (priorityData[t.priority] || 0) + 1);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Task Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style> body { font-family: Arial; padding: 20px; } canvas { max-width: 400px; } </style>
</head>
<body>
    <h1>Task Dashboard</h1>
    <p>Total Time: ${totalTime} hrs | Completed Time: ${completedTime} hrs</p>
    <canvas id="priorityChart"></canvas>
    <h2>Tasks</h2>
    <ul>${tasks.map(t => `<li>${t.description}: ${t.time} hrs, ${t.priority}${t.completed ? ' (Completed)' : ''}${t.resource ? `, ${t.resource}` : ''}</li>`).join('')}</ul>
    <script>
        const ctx = document.getElementById('priorityChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{ data: [${priorityData.High}, ${priorityData.Medium}, ${priorityData.Low}], backgroundColor: ['#ff6384', '#36a2eb', '#ffce56'] }]
            },
            options: { responsive: true }
        });
    </script>
</body>
</html>`;
}

module.exports = { getDashboardContent };