function updateStatusBar(statusBarItem, tasks, weeklyBandwidth) {
    const totalTime = tasks.reduce((sum, t) => sum + (t.time || 0), 0);
    const percentage = Math.round((totalTime / weeklyBandwidth) * 100);
    statusBarItem.text = `Tasks: ${totalTime} hrs / ${weeklyBandwidth} hrs (${percentage}%)`;
    statusBarItem.tooltip = `Weekly Bandwidth: ${weeklyBandwidth} hrs, Total Task Time: ${totalTime} hrs`;
    statusBarItem.color = totalTime > weeklyBandwidth ? 'red' : 'inherit';
}

module.exports = { updateStatusBar };