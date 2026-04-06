/**
 * Reproduction test for mapRefreshedData logic
 */
function mapRefreshedData(rawData: any, mapping: any): any[] {
    let newData: any[] = [];
    
    // 1. Result object with array
    const records = (rawData && rawData.result && Array.isArray(rawData.result)) ? rawData.result :
                  (rawData && rawData.transactions && Array.isArray(rawData.transactions)) ? rawData.transactions : 
                  (rawData && rawData.summary && Array.isArray(rawData.summary)) ? rawData.summary : null;

    if (records) {
        newData = records.map((row: any) => {
            return {
                label: mapping?.label && row[mapping.label] !== undefined ? row[mapping.label] : (row.yearMonth || row.month || Object.values(row)[0]),
                value: mapping?.value && row[mapping.value] !== undefined ? row[mapping.value] : (row.totalWithdrawals || row.amount || Object.values(row)[1])
            };
        });
    }
    return newData;
}

// Dummy response from FinanceHub
const dummyResponse = {
  "totalMonths": 4,
  "summary": [
    {
      "yearMonth": "2026-04",
      "bankId": "bc-card",
      "totalWithdrawals": 931133
    }
  ]
};

const mapping = {
  "label": "month",
  "value": "amount"
};

console.log('Old logic result (no summary check):', mapRefreshedData(dummyResponse, mapping));
