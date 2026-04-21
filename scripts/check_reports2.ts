import { executeSQL } from '../egdesk-helpers';

async function run() {
    const res = await executeSQL("SELECT id, name, sheetName, tableName FROM report WHERE name LIKE '%홈택스%' OR name LIKE '%세금계산서%' OR name LIKE '%어음%' OR name LIKE '%계산서%' OR name LIKE '%현금영수증%'");
    console.log(JSON.stringify(res, null, 2));
}
run();
