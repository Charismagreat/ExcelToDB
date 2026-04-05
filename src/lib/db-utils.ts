/**
 * SQL-safe table name generator
 * Converts sheet names/titles to safe database table names.
 */
export function normalizeTableName(name: string): string {
    // 1. 소문자 변환
    let normalized = name.trim().toLowerCase();
    
    // 2. 한글, 대문자, 대시(-), 특수기호 등 [a-z0-9]가 아닌 모든 문자를 제거 (언더스코어로 치환)
    normalized = normalized.replace(/[^a-z0-9]/g, '_');
    
    // 3. 연속된 언더스코어 제거 및 앞뒤 공백/언더스코어 정리
    normalized = normalized.replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    // 4. 고유 식별자(해시) 생성
    // 데이터 웨어하우스(DWH) 스타일의 유니크한 타임스탬프 + 랜덤 난수 부여
    const nowHex = Math.floor(Date.now() / 1000).toString(16); // 현재 시간 Unix Timestamp 헥사 (예: 66100a)
    const randomHash = Math.random().toString(36).substring(2, 5); // 랜덤 영숫자 3자리
    const uniqueSuffix = `${nowHex}_${randomHash}`;

    // 5. 최종 형식 조합
    if (normalized) {
        // Ex: 원본이 "Revenue Data(2024)" 였다면 -> tb_revenue_data_2024_66100a_x1z
        return `tb_${normalized}_${uniqueSuffix}`;
    } else {
        // Ex: 원본 시트명이 전부 한글 ("발주내역") 라서 모두 날아갔다면 -> tb_66100a_x1z
        return `tb_${uniqueSuffix}`;
    }
}

/**
 * Maps application data types to EGDesk physical column types
 */
export function mapToPhysicalType(appType: string): 'TEXT' | 'INTEGER' | 'REAL' | 'DATE' {
    switch (appType.toLowerCase()) {
        case 'number':
        case 'currency':
        case 'percent':
        case 'rating':
            return 'REAL';
        case 'date':
        case 'datetime':
        case 'time':
            return 'DATE';
        case 'boolean':
        case 'checkbox':
            return 'INTEGER';
        case 'email':
        case 'phone':
        case 'textarea':
        case 'select':
        case 'file':
        default:
            return 'TEXT';
    }
}

/**
 * Casts a JavaScript value to a database-safe value based on the application data type.
 * Ensures consistent data storage in physical tables.
 */
export function castToPhysicalValue(value: any, appType: string): any {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const type = appType.toLowerCase();

    // 1. Number types (REAL in DB)
    if (type === 'number' || type === 'currency' || type === 'percent' || type === 'rating') {
        const sVal = String(value).replace(/[^0-9.-]/g, '').trim();
        const nVal = Number(sVal);
        return isNaN(nVal) ? null : nVal;
    }

    // 2. Boolean types (INTEGER in DB: 0 or 1)
    if (type === 'boolean' || type === 'checkbox') {
        return (value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value) === '1') ? 1 : 0;
    }

    // 3. Date types (DATE/TEXT in DB)
    if (type === 'date' || type === 'datetime') {
        // Excel serial date detection (e.g., 45000+)
        if (typeof value === 'number' && value > 10000 && value < 100000) {
            const utcDays = Math.floor(value - 25569);
            const date = new Date(utcDays * 86400 * 1000);
            return !isNaN(date.getTime()) ? date.toISOString() : null;
        }
        
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date.toISOString() : String(value);
    }

    // 4. Default: String/TEXT
    return String(value);
}

