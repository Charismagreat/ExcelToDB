const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
    }
});

const apiUrl = env.NEXT_PUBLIC_EGDESK_API_URL;
const apiKey = env.NEXT_PUBLIC_EGDESK_API_KEY;

async function callTool(tool, args = {}) {
    const response = await fetch(`${apiUrl}/financehub/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify({ tool, arguments: args })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return JSON.parse(result.result.content[0].text);
}

async function run() {
    try {
        console.log('--- Inspecting Transaction Time Data (Top 100) ---');
        const txData = await callTool('financehub_query_transactions', { limit: 100 });
        const txs = Array.isArray(txData) ? txData : (txData.transactions || []);
        
        const timeStats = {};
        txs.forEach(t => {
            const bank = t.bankId;
            const time = t.time || 'missing';
            if (!timeStats[bank]) timeStats[bank] = { zeroTime: 0, hasTime: 0, samples: [] };
            
            if (time === '00:00:00' || time === '000000') {
                timeStats[bank].zeroTime++;
            } else {
                timeStats[bank].hasTime++;
                timeStats[bank].samples.push(time);
            }
        });

        console.log('Time Distribution by Bank:');
        Object.keys(timeStats).forEach(bank => {
            const s = timeStats[bank];
            console.log(`Bank: ${bank}`);
            console.log(`  - 00:00:00 count: ${s.zeroTime}`);
            console.log(`  - Non-zero time count: ${s.hasTime}`);
            if (s.samples.length > 0) {
                console.log(`  - Unique sample times: ${[...new Set(s.samples)].slice(0, 5)}`);
            }
        });

        // Also check if transaction_datetime has time
        const dtZero = txs.filter(t => t.transaction_datetime?.includes('00:00:00')).length;
        console.log(`\nTransactions with '00:00:00' in transaction_datetime: ${dtZero} / ${txs.length}`);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
