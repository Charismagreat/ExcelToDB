// fix_pinned.js
const fs = require('fs');

async function run() {
    const data = JSON.parse(fs.readFileSync('./pinned_charts.json', 'utf8'));
    data.forEach(d => {
        d.userId = '1'; // Force assignment to user 1
    });
    fs.writeFileSync('./pinned_charts.json', JSON.stringify(data, null, 2), 'utf8');
    console.log("Fixed pinned charts userId.");
}
run();
