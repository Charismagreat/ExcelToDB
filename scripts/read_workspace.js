const fs = require('fs');
const data = JSON.parse(fs.readFileSync('workspace_items.json', 'utf8'));
const matching = data.filter(r => r.displayName && r.displayName.includes('홈택스')).map(r => ({ id: r.id, name: r.displayName }));
console.log(matching);
