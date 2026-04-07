const { getTableSchema } = require('./src/egdesk-helpers');

async function test() {
    process.env.NEXT_PUBLIC_EGDESK_API_URL = 'http://localhost:8080';
    process.env.NEXT_PUBLIC_EGDESK_API_KEY = '7a406902-a90d-4aef-a983-c64320c77084';
    
    try {
        console.log("Checking report_row schema...");
        const schema = await getTableSchema('report_row');
        console.log("Schema:", JSON.stringify(schema, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
