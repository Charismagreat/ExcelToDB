'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { 
    queryTable, 
    insertRows, 
    updateRows, 
    deleteRows, 
    aggregateTable,
    createTable,
    listTables,
    deleteTable
} from '@/egdesk-helpers';
import { EGDESK_CONFIG } from '@/egdesk.config';
import { parseExcelWorkbook } from '@/lib/excel-parser';
import { analyzeExcelImage, extractDataFromImage, recommendSchemaFromSample } from '@/lib/ai-vision';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { notifyNewDataRow, notifyBulkUpload } from '@/lib/notifications';
import { getVisualizationRecommendation } from '@/lib/dashboard-ai';
import { runAITool } from '@/lib/ai-tools';
import { normalizeTableName, mapToPhysicalType, castToPhysicalValue } from '@/lib/db-utils';

// Password Security Utilities
const SALT_SIZE = 16;
const KEY_LEN = 64;

/**
 * 외부 의존성 없이 작동하는 안전한 ID 생성기
 */
function generateSafeId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
}

/**
 * 프록시 Prisma 백엔드의 Int 제약을 피하기 위한 숫자형 ID 생성기
 */
function generateNumericId() {
    return Math.floor(Math.random() * 2147483647);
}

/**
 * 필수 시스템 테이블 스키마 정의 (Self-Healing 용)
 */
const SYSTEM_TABLES = [
    {
        tableName: 'user', displayName: 'System Users', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'email', type: 'TEXT', notNull: true },
            { name: 'passwordHash', type: 'TEXT', notNull: true },
            { name: 'salt', type: 'TEXT', notNull: true },
            { name: 'role', type: 'TEXT', notNull: true, defaultValue: 'USER' },
            { name: 'fullName', type: 'TEXT', notNull: true },
            { name: 'createdAt', type: 'TEXT', notNull: true }
        ] as any[]
    },
    {
        tableName: 'report', displayName: 'System Reports', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'sheetName', type: 'TEXT' },
            { name: 'description', type: 'TEXT' },
            { name: 'tableName', type: 'TEXT', notNull: true },
            { name: 'columns', type: 'TEXT', notNull: true },
            { name: 'uiConfig', type: 'TEXT' },
            { name: 'aiConfig', type: 'TEXT' },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 },
            { name: 'deletedAt', type: 'TEXT' },
            { name: 'ownerId', type: 'TEXT', notNull: true },
            { name: 'lastSerial', type: 'INTEGER', defaultValue: 0 },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT' }
        ] as any[]
    },
    {
        tableName: 'report_row', displayName: 'Virtual Report Rows', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'data', type: 'TEXT', notNull: true },
            { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 },
            { name: 'deletedAt', type: 'TEXT' },
            { name: 'creatorId', type: 'TEXT' },
            { name: 'updaterId', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT', notNull: true }
        ] as any[]
    },
    {
        tableName: 'report_access', displayName: 'Report Access Controls', schema: [
            { name: 'reportId', type: 'TEXT', notNull: true },
            { name: 'userId', type: 'TEXT', notNull: true },
            { name: 'role', type: 'TEXT', notNull: true },
            { name: 'grantedAt', type: 'TEXT', notNull: true },
            { name: 'grantedBy', type: 'TEXT', notNull: true }
        ] as any[]
    },
    {
        tableName: 'report_row_history', displayName: 'Report Row History', schema: [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'rowId', type: 'TEXT', notNull: true },
            { name: 'oldData', type: 'TEXT' },
            { name: 'newData', type: 'TEXT' },
            { name: 'changeType', type: 'TEXT' },
            { name: 'changedById', type: 'TEXT' },
            { name: 'changedAt', type: 'TEXT' }
        ] as any[]
    }
];

/**
 * 특정 시스템 테이블의 물리적 손상(고스트 상태)을 감지하고 강제 재생성합니다.
 */
export async function repairGhostTable(tableName: string) {
    const tableDef = SYSTEM_TABLES.find(t => t.tableName === tableName);
    if (!tableDef) return;

    try {
        await queryTable(tableName, { limit: 1 });
    } catch (err: any) {
        const msg = String(err.message || err);
        if (msg.includes('no such table')) {
            console.warn(`[Self-Healing] Ghost table detected or table missing: ${tableName}. Force recreating...`);
            try {
                // 고스트 메타데이터 삭제 시도 (에러 무시)
                await fetch(`${EGDESK_CONFIG.apiUrl}/user-data/tools/call`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Api-Key': EGDESK_CONFIG.apiKey || '' },
                    body: JSON.stringify({ tool: 'user_data_delete_table', arguments: { tableName } })
                }).catch(() => {});
                
                await createTable(tableDef.displayName, tableDef.schema, { tableName });
                console.log(`[Self-Healing] Successfully recreated table: ${tableName}`);
            } catch (createErr) {
                console.error(`[Self-Healing] Failed to recreate table ${tableName}:`, createErr);
            }
        }
    }
}

/**
 * 모든 필수 시스템 테이블의 건전성을 검사합니다.
 */
export async function ensureSystemTables() {
    for (const table of SYSTEM_TABLES) {
        await repairGhostTable(table.tableName);
    }
}

/**
 * 이력 테이블 전용 레지던트 체크 함수 (보존용 래퍼)
 */
async function ensureHistoryTable() {
    await repairGhostTable('report_row_history');
}

/**
 * 전역에서 사용할 수 있는 안전한 ID 생성기
 */
function generateId(): string {
    try {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch (e) {}
    // Fallback for older Node versions or environments
    return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_SIZE).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
    return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash) return false;
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
    return derivedKey.toString('hex') === hash;
}

/**
 * 보고서에 대한 사용자의 접근 권한을 확인합니다.
 * ADMIN, EDITOR는 모든 권한을 가지며, VIEWER는 명시적으로 권한이 부여되었거나 소유자인 경우에만 허용합니다.
 */
async function checkReportAuthorization(reportId: string, userId: string, role: string) {
    if (role === 'ADMIN' || role === 'EDITOR') return true;
    
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    
    if (!report) return false;
    if (report.ownerId === userId) return true;
    
    // report_access 테이블 확인
    const accessList = await queryTable('report_access', { 
        filters: { reportId: String(reportId), userId: String(userId) } 
    });
    
    return accessList.length > 0;
}

export async function uploadFileAction(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('파일이 없습니다.');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    return { url: `/uploads/${uniqueName}`, name: file.name };
}

export async function getSchemaRecommendationAction(reportId: string) {
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    if (!report) throw new Error('보고서를 찾을 수 없습니다.');

    const currentColumns = JSON.parse(report.columns);
    const sampleRows = await queryTable('report_row', { 
        filters: { reportId: String(reportId) },
        limit: 20
    });

    const rowsData = sampleRows.map((r: any) => JSON.parse(r.data));
    const recommendation = await recommendSchemaFromSample(currentColumns, rowsData);
    
    return recommendation.columns;
}

/**
 * 데이터 행의 중복 여부를 판단하기 위한 해시값을 생성합니다.
 * @param rowData 객체 형태의 행 데이터
 * @param columns 컬럼 정의 배열
 */
export async function generateContentHash(rowData: any, columns: any[]) {
    // 자동 생성 필드(데이터 ID 등)는 중복 체크에서 제외
    // 사용자가 'isUnique'로 설정한 필드가 있다면 해당 필드들만 조합, 없으면 모든 일반 필드 조합
    const isUnique = (col: any) => col.isUnique === true || String(col.isUnique) === 'true' || Number(col.isUnique) === 1 || String(col.isUnique) === '1';
    
    const uniqueCols = columns.filter(c => isUnique(c));
    const targetCols = uniqueCols.length > 0 ? uniqueCols : columns.filter(c => !c.isAutoGenerated);
    
    const sortedKeys = targetCols.map(c => c.name).sort();
    const hashSource = sortedKeys.map(key => `${key}:${rowData[key] === undefined || rowData[key] === null ? '' : rowData[key]}`).join('|');
    
    return crypto.createHash('sha256').update(hashSource).digest('hex');
}

export async function uploadExcelAction(formData: FormData, userId: string) {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  const file = formData.get('file') as File;
  const configsJson = formData.get('configsJson') as string;
  if (!file) throw new Error('파일이 없습니다.');

  const buffer = Buffer.from(await file.arrayBuffer());
  const configs = configsJson ? JSON.parse(configsJson) : [];
  
  // Use the advanced parser with user-defined configs (header row index, selected fields)
  const sheetResults = parseExcelWorkbook(buffer, configs);
  console.log(`[Parser] Parsed ${sheetResults.length} sheets from workbook.`);

  // 시스템에 이미 존재하는 물리적 테이블 목록 조회 (중복 방지 용도)
  let existingTables: string[] = [];
  try {
      // 1. EGDesk 시스템 물리 테이블 목록 조회
      const res = await listTables();
      const sysTables = (res?.tables || []).map((t: any) => t.tableName.toLowerCase());
      
      // 2. 가상 보고서 메타데이터(report 테이블)에 등록된 테이블 목록 조회
      const reportRes = await queryTable('report', { limit: 10000 });
      const reportRows = Array.isArray(reportRes) ? reportRes : (reportRes?.rows || []);
      const virtualTables = reportRows
        .map((r: any) => r.tableName?.toLowerCase())
        .filter(Boolean);

      // 3. 중복 방지를 위한 통합 목록 생성
      existingTables = Array.from(new Set([...sysTables, ...virtualTables]));
  } catch (err) {
      console.error('Failed to list tables for duplicate check:', err);
  }

  // Store each sheet/table as a separate report
  const uploadStats = {
    totalRejected: 0,
    rejectedReasons: [] as string[]
  };

  for (const sheet of sheetResults) {
    for (const table of sheet.tables) {
      if (table.columns.length === 0) continue; // Skip if no columns selected

      // UUID 대신 숫자형 ID 생성 (DB INTEGER 타입 제약 준수)
      const reportId = String(generateNumericId());
      
      // 베이스 이름 생성 (특수문자 및 공백 제거)
      const basePhysicalName = normalizeTableName(table.name);
      let physicalTableName = basePhysicalName;
      let counter = 1;
      
      // 사용 중인 테이블 이름 중복 체크 및 순번 추가
      while (existingTables.includes(physicalTableName)) {
          physicalTableName = `${basePhysicalName}_${counter}`;
          counter++;
      }
      // 이번 업로드 루프 내에서 처리된 이름도 리스트에 추가 (시트 이름끼리 중복될 경우 방지)
      existingTables.push(physicalTableName);

      // 1. Create a physical table in EGDesk
      try {
        const schema = table.columns.map(col => {
          // 각 컬럼에 고유 ID 부여 (필드명 변경 추적용)
          if (!col.id) {
            col.id = `col_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
          }
          return {
            name: col.name,
            type: mapToPhysicalType(col.type),
            notNull: col.isRequired
          };
        });

        const uniqueKeys = table.columns
          .filter(col => col.isAutoGenerated || col.isUnique)
          .map(col => col.name);

        await createTable(table.name, schema, {
          tableName: physicalTableName,
          description: `Created from Excel: ${file.name} - ${sheet.sheetName}`,
          uniqueKeyColumns: uniqueKeys.length > 0 ? uniqueKeys : undefined
        });
        console.log(`[Step 1/3] Physically created table: ${physicalTableName}`);
      } catch (err: any) {
        console.error(`Failed to create physical table ${physicalTableName}:`, err);
        // 물리적 테이블 생성이 이지데스크에 의해 거부되거나 실패할 경우, 가상 테이블 또한 생성되지 않도록 에러를 던져 중단합니다.
        throw new Error(`물리적 테이블('${physicalTableName}') 생성에 실패하여 업로드가 취소되었습니다. 원인: ${err.message || '알 수 없음'}`);
      }

      // --- 추가: 물리 DB NOT NULL 제약조건 통과 여부 사전 검증 ---
      const validRows: any[] = [];
      table.rows.forEach((row, idx) => {
        let isRowValid = true;
        const missingFields: string[] = [];
        
        table.columns.forEach(col => {
           if (col.isRequired) {
              const val = row[col.name];
              if (val === undefined || val === null || val === '') {
                 isRowValid = false;
                 // __data_id__는 내부 처리용이므로 안내 제외
                 if (col.name !== '__data_id__') {
                    missingFields.push(col.name);
                 }
              }
           }
        });
        
        if (isRowValid) {
           validRows.push(row);
        } else {
           uploadStats.totalRejected++;
           if (uploadStats.rejectedReasons.length < 10) {
              uploadStats.rejectedReasons.push(`[${table.name}] 엑셀 ${idx + 2}번째 줄 - 누락: ${missingFields.length > 0 ? missingFields.join(', ') : '필수값'}`);
           }
        }
      });

      // 검증을 통과한 유효한 데이터만 가상/물리 DB에 삽입되도록 교체
      table.rows = validRows;

      let maxSerial = table.rows.length;
      const autoCol = table.columns.find((c: any) => c.isAutoGenerated);
      if (autoCol) {
          table.rows.forEach(r => {
              const val = r[autoCol.name];
              if (val && typeof val === 'string') {
                  const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num) && num > maxSerial) {
                      maxSerial = num;
                  }
              }
          });
      }

      // 2. Insert metadata into 'report' table
      console.log(`[Step 2/3] Inserting metadata into 'report' table for ${table.name} (UUID: ${reportId})`);
      const rRes = await insertRows('report', [{
        id: reportId,
        name: table.name,
        sheetName: sheet.sheetName,
        tableName: physicalTableName, // Save the physical table name
        columns: JSON.stringify(table.columns),
        ownerId: userId,
        createdAt: new Date().toISOString(),
        isDeleted: 0, // Explicitly set to 0 to match database integer type
        lastSerial: maxSerial // Initialize lastSerial with max numeric ID found
      }]);
      console.log(`[Step 2/3] Metadata insertion result:`, rRes);

      // 3. Insert data into 'report_row' (virtual) AND the NEW physical table
      if (table.rows.length > 0) {
        const vRes = await insertRows('report_row', table.rows.map(row => ({
          id: generateNumericId(),
          reportId: reportId,
          data: JSON.stringify(row),
          creatorId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: 0
        })));
        console.log(`[Step 3/3] Virtual rows insertion result:`, vRes);

        if (!vRes?.success) {
            console.error("Virtual insert failed:", vRes);
            throw new Error(`Virtual table insertion failed: ${vRes?.error || JSON.stringify(vRes)}`);
        }

        // Physical storage
        try {
          const pRes = await insertRows(physicalTableName, table.rows);
          if(!pRes?.success) {
              console.error(`Physical table insertion returned error:`, pRes);
          } else {
              console.log(`Inserted ${table.rows.length} rows into physical table ${physicalTableName}`);
          }
        } catch (err) {
          console.error(`Failed to insert rows into physical table ${physicalTableName}:`, err);
        }

        // 슬랙 알림 발송 - 신규 보고서 생성 및 초기 데이터 알림
        notifyBulkUpload(table.name, user.fullName || user.username, table.rows.length, table.rows[0], table.columns, null).catch(console.error);
      }
    }
  }

  revalidatePath('/');
  return { 
    success: true, 
    totalRejected: uploadStats.totalRejected, 
    rejectedReasons: uploadStats.rejectedReasons 
  };
}

export async function addRowAction(reportId: string, rowData: any) {
  // 4. 세션 사용자 확인 및 권한 체크
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');
  
  const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
  if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

  const reportsResult: any = await queryTable('report', { filters: { id: String(reportId) } });
  const reports = reportsResult.rows || reportsResult;
  const report = reports[0];
  if (!report) throw new Error('보고서를 찾을 수 없습니다.');

  const columns = JSON.parse(report.columns);
  
  // 1. 중복 체크
  const hash = await generateContentHash(rowData, columns);
  const isUnique = (col: any) => col.isUnique === true || String(col.isUnique) === 'true' || Number(col.isUnique) === 1 || String(col.isUnique) === '1';
  const uniqueCols = columns.filter((c: any) => isUnique(c));
  
  if (uniqueCols.length > 0) {
    const existingRowsResult: any = await queryTable('report_row', {
        filters: { reportId: String(reportId), contentHash: String(hash), isDeleted: '0' }
    });
    const existingRows = existingRowsResult.rows || existingRowsResult;
    
    if (existingRows.length > 0) {
        throw new Error('이미 동일한 내용의 데이터가 존재합니다. (중복 방지)');
    }
  }

  let currentSerial = 0;
  const idCol = columns.find((c: any) => c.isAutoGenerated);

  // 1. 물리적 테이블이 최우선 (가장 정확한 최신 데이터 상태)
  if (idCol && report.tableName) {
      try {
          const allPhysicalRows: any = await queryTable(report.tableName, { limit: 100000 });
          const rows = allPhysicalRows?.rows || allPhysicalRows || [];
          if (Array.isArray(rows)) {
              rows.forEach((r: any) => {
                  const did = r[idCol.name];
                  if (did && typeof did === 'string') {
                      const num = parseInt(did.replace(/[^0-9]/g, ''), 10);
                      if (!isNaN(num) && num > currentSerial) currentSerial = num;
                  }
              });
          }
      } catch (e) {
          console.warn("Failed to fetch physical rows for max ID:", e);
      }
  }

  // 2. 물리적 테이블에서 찾지 못한 경우 (또는 가상 전용 테이블인 경우) fallback
  if (currentSerial === 0) {
      if (report.lastSerial !== undefined && report.lastSerial !== null && Number(report.lastSerial) > 0) {
          currentSerial = Number(report.lastSerial);
      } else if (idCol) {
          try {
              const allRowsResult: any = await queryTable('report_row', { filters: { reportId: String(reportId) }, limit: 100000 });
              const allRows = allRowsResult?.rows || allRowsResult || [];
              if (Array.isArray(allRows)) {
                  allRows.forEach((r: any) => {
                      try {
                          const data = JSON.parse(r.data);
                          const did = data[idCol.name];
                          if (did && typeof did === 'string') {
                              const num = parseInt(did.replace(/[^0-9]/g, ''), 10);
                              if (!isNaN(num) && num > currentSerial) currentSerial = num;
                          }
                      } catch (e) {}
                  });
              }
          } catch (e) {}
      }
  }

  const nextSerial = (currentSerial + 1).toString().padStart(6, '0');
  
  const finalData = { ...rowData };
  columns.forEach((col: any) => {
    if (col.isAutoGenerated) {
        const prefix = col.autoPrefix || 'DID-';
        finalData[col.name] = `${prefix}${nextSerial}`;
    }
  });

  // 3. Server-side Validation
  for (const col of columns) {
    if (col.isAutoGenerated) continue;
    const val = finalData[col.name];

    if (col.isRequired && (val === undefined || val === null || val === '')) {
        throw new Error(`'${col.name}' 필드는 필수입니다.`);
    }

    if (col.type === 'select' && col.options && val !== '' && val !== null && val !== undefined) {
      const rawOptions = col.options;
      const optionsList = Array.isArray(rawOptions) 
          ? rawOptions 
          : String(rawOptions).split(',').map(s => s.trim()).filter(Boolean);
      
      if (!optionsList.includes(String(val).trim())) {
          throw new Error(`'${col.name}' 필드의 값 '${val}'은(는) 허용된 목록(${optionsList.join(', ')})에 없습니다.`);
      }
    }

    if ((col.type === 'number' || col.type === 'currency') && val !== '' && val !== null && val !== undefined) {
        const sVal = String(val);
        const cleanVal = sVal.replace(/[^0-9.-]/g, '').trim();
        if (isNaN(Number(cleanVal))) {
            throw new Error('필드 ' + col.name + '에는 숫자만 입력 가능합니다.');
        }
        finalData[col.name] = Number(cleanVal);
    }
  }

  // 5. 물리적 테이블 동기화 (원칙 준수: 물리 우선 반영)
  let syncWarning: string | undefined;
  if (report.tableName) {
      try {
        // 물리적 DB 속성에 맞춰 타입 캐스팅 적용
        const physicalData: any = {};
        columns.forEach((col: any) => {
          physicalData[col.name] = castToPhysicalValue(finalData[col.name], col.type);
        });

        await insertRows(report.tableName, [physicalData]);
        console.log(`Physically sync'd new row to ${report.tableName}`);
      } catch (err: any) {
        console.error(`Failed to sync new row to physical table ${report.tableName}:`, err);
        throw new Error(`물리적 테이블(${report.tableName}) 반영에 실패하여 처리가 중단되었습니다. (원인: ${err.message || '알 수 없음'})`);
      }
  }

  const creatorId = user.id;

  // 6. 저장 (가상 테이블)
  await insertRows('report_row', [{
    id: generateNumericId(),
    reportId,
    data: JSON.stringify(finalData),
    contentHash: hash,
    creatorId: creatorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: 0
  }]);
    
  // 7. 최대 일련번호 업데이트
  try {
      await updateRows('report', { lastSerial: currentSerial + 1 }, { filters: { id: String(reportId) } });
  } catch (err) {
      console.warn(`Failed to update lastSerial for report ${reportId}. This may happen if the column does not exist.`, err);
  }
    
  // 슬랙 알림 발송 - 비동기로 처리하여 사용자 응답 속도에 영향을 주지 않음
  notifyNewDataRow(report.name, user.fullName || user.username, finalData, columns, report.slackWebhookUrl).catch(console.error);

  revalidatePath(`/report/${reportId}`);
  revalidatePath(`/report/${reportId}/input`);
  return { success: true, syncWarning };
}

export async function getRowHistoryAction(rowId: string) {
    try {
        const rows = await queryTable('report_row', { filters: { id: String(rowId) } });
        const row = rows[0];
        if (!row) throw new Error('데이터를 찾을 수 없습니다.');

        const creatorUsers = await queryTable('user', { filters: { id: String(row.creatorId) } });
        const updaterUsers = await queryTable('user', { filters: { id: String(row.updaterId) } });

        // 히스토리 조회
        let histories: any[] = [];
        try {
            histories = await queryTable('report_row_history', { 
                filters: { rowId: String(rowId) },
                orderBy: 'changedAt',
                orderDirection: 'DESC'
            });
        } catch (e) {
            console.error('Failed to query report_row_history (table might be missing):', e);
            histories = [];
        }

        // 히스토리 작성자 정보를 위해 한꺼번에 사용자 정보 조회 (N+1 문제 해결)
        const distinctUserIds = Array.from(new Set(histories.map((h: any) => h.changedById).filter(id => !!id)));
        let userMap: Record<string, any> = {};
        if (distinctUserIds.length > 0) {
            try {
                const users = await Promise.all(
                    distinctUserIds.map(id => queryTable('user', { filters: { id: String(id) } }).then(res => res[0]).catch(() => null))
                );
                users.forEach(u => { if(u) userMap[u.id] = u; });
            } catch (e) {
                console.error('Failed to pre-fetch users for history:', e);
            }
        }

        const historyWithUsers = histories.map((h: any) => ({
            ...h,
            changedBy: userMap[h.changedById] || (h.changedById === 'system' ? { id: 'system', fullName: '시스템', username: 'system' } : null)
        }));

        return {
            id: row.id,
            data: row.data,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            creator: creatorUsers[0] || null,
            updater: updaterUsers[0] || null,
            histories: historyWithUsers
        };
    } catch (err: any) {
        console.error('getRowHistoryAction error:', err);
        throw new Error(err.message || '이력을 불러오는 중 서버 오류가 발생했습니다.');
    }
}

export async function restoreRowsAction(reportId: string, rowIds: string[]) {
    try {
        const user = await getSessionAction();
        if (!user) return { success: false, error: '인증이 필요합니다.' };
        const updaterId = user.id;

        const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
        if (!isAuthorized) return { success: false, error: '해당 보고서에 대한 접근 권한이 없습니다.' };

        const sReportId = String(reportId);
        
        // 1. 대상 행 개별 로드 (안정성을 위해 하나씩 조회)
        const validRows: any[] = [];
        for (const id of rowIds) {
            try {
                const results: any = await queryTable('report_row', { filters: { id: String(id) } });
                const rows = (results?.rows || results || []);
                const row = rows[0];
                if (row && (Number(row.isDeleted) === 1 || String(row.isDeleted) === '1' || row.isDeleted === true)) {
                    validRows.push(row);
                }
            } catch (e) {
                console.warn(`Row ${id} lookup failed:`, e);
            }
        }

        if (validRows.length === 0) return { success: true, restoredCount: 0, syncWarning: '복구할 대상을 찾을 수 없거나 이미 복구되었습니다.' };

        const reportsResult: any = await queryTable('report', { filters: { id: sReportId } });
        const reports = reportsResult?.rows || reportsResult || [];
        const report = reports[0];

        let successCount = 0;
        let failCount = 0;

        // 2. 순차적 서비스 처리 (안정성 최우선)
        for (const row of validRows) {
            try {
                // A. 물리 복구
                if (report?.tableName) {
                    try {
                        console.log(`[Restore] Step A: Physically restoring row into ${report.tableName}`);
                        const rowData = JSON.parse(row.data);
                        const pRes = await insertRows(report.tableName, [rowData]);
                        console.log(`[Restore] Step A result:`, pRes);
                    } catch (pErr: any) {
                        const msg = String(pErr.message || pErr);
                        console.warn(`[Restore] Physical restore warning for row ${row.id}:`, msg);
                        if (!(msg.includes('unique') || msg.includes('Duplicate') || msg.includes('exists'))) {
                            throw pErr;
                        }
                    }
                }

                // B. 가상 상태 업데이트
                console.log(`[Restore] Step B: Updating virtual status for row ${row.id}`);
                const vRes = await updateRows('report_row', {
                    isDeleted: 0,
                    deletedAt: null,
                    updaterId: updaterId,
                    updatedAt: new Date().toISOString()
                }, { filters: { id: String(row.id) } });
                console.log(`[Restore] Step B result:`, vRes);

                // C. 이력 기록 (실패해도 중단하지 않음)
                try {
                    await ensureHistoryTable();
                    await insertRows('report_row_history', [{
                        id: generateNumericId(),
                        rowId: row.id,
                        oldData: row.data,
                        newData: row.data,
                        changeType: 'RESTORE',
                        changedById: updaterId || 'system',
                        changedAt: new Date().toISOString()
                    }]);
                } catch (hErr) {
                    console.warn('History log failed for row:', row.id);
                }

                successCount++;
            } catch (rowErr: any) {
                console.error(`Restore failed for row ${row.id}:`, rowErr);
                failCount++;
            }
        }

        revalidatePath(`/report/${sReportId}`);
        return { 
            success: successCount > 0, 
            restoredCount: successCount,
            error: failCount > 0 ? `${failCount}건의 데이터 복구에 실패했습니다.` : undefined,
            message: failCount > 0 ? `${successCount}건 성공, ${failCount}건 실패` : '성공적으로 복구되었습니다.'
        };
    } catch (err: any) {
        console.error('restoreRowsAction error:', err);
        return { success: false, error: '서버 내부 오류가 발생했습니다. (직렬화 방지)' };
    }
}

export async function deleteReportAction(reportId: string) {
    await updateRows('report', { 
        isDeleted: 1,
        deletedAt: new Date().toISOString()
    }, { filters: { id: String(reportId) } });
    revalidatePath('/');
    revalidatePath('/archive');
}

export async function restoreReportAction(reportId: string) {
    await updateRows('report', { 
        isDeleted: 0,
        deletedAt: null
    }, { filters: { id: String(reportId) } });
    revalidatePath('/');
    revalidatePath('/archive');
}

export async function permanentDeleteReportAction(reportId: string) {
    // 0. 보고서 정보 로드 (물리 테이블 삭제를 위해)
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];

    // 1. 데이터(행) 먼저 삭제 (Virtual)
    await deleteRows('report_row', { filters: { reportId: String(reportId) } });

    // 2. 물리적 테이블 삭제 (Physical)
    if (report?.tableName) {
        try {
            await deleteTable(report.tableName);
            console.log(`[Cleanup] Deleted physical table: ${report.tableName}`);
        } catch (err: any) {
            console.warn(`[Cleanup Warning] Failed to delete physical table ${report.tableName}:`, err.message);
        }
    }

    // 3. 보고서 본체 삭제
    await deleteRows('report', { filters: { id: String(reportId) } });
    
    revalidatePath('/');
    revalidatePath('/archive');
}

export async function deleteRowsAction(reportId: string, rowIds: string[]) {
    try {
        const user = await getSessionAction();
        if (!user) throw new Error('인증이 필요합니다.');
        const updaterId = user.id;

        const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
        if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

        // 1. 대상 행 로드
        const rows = await Promise.all(
            rowIds.map(async (id) => {
                const results = await queryTable('report_row', { filters: { id: String(id) } });
                return results[0];
            })
        );
        const validRows = rows.filter(r => r);
        if (validRows.length === 0) throw new Error('삭제할 데이터를 찾을 수 없습니다.');

        // 일반 사용자(VIEWER) 권한 일 때 타인의 데이터 삭제 시도 차단
        if (user.role === 'VIEWER') {
            const hasUnauthorized = validRows.some(r => r.creatorId !== user.id);
            if (hasUnauthorized) {
                throw new Error('본인이 작성하지 않은 데이터는 삭제할 수 없습니다.');
            }
        }

        // 2. 물리적 테이블 정보 미리 로드
        const reports = await queryTable('report', { filters: { id: String(reportId) } });
        const report = reports[0];
        let idColName: string | null = null;
        
        if (report?.tableName) {
            try {
                const columns = JSON.parse(report.columns);
                const idCol = columns.find((c: any) => c.name === '데이터ID');
                if (idCol) idColName = idCol.name;
            } catch (e) {
                console.error(`Failed to parse columns for report ${reportId}:`, e);
            }
        }

        // 3. 대상 행들을 순회하며 논리적/물리적 삭제 진행
        let syncWarning: string | undefined;
        for (const row of validRows) {
            try {
                // 논리적 삭제 및 이력 생성
                await updateRows('report_row', {
                    isDeleted: 1, // Ensure integer type to match SQLite schema
                    deletedAt: new Date().toISOString(),
                    updaterId: updaterId
                }, { filters: { id: String(row.id) } });

                try {
                    await insertRows('report_row_history', [{
                        id: generateNumericId(),
                        rowId: String(row.id),
                        oldData: row.data,
                        newData: JSON.stringify({ ...JSON.parse(row.data), _deleted: true }),
                        changeType: 'DELETE',
                        changedById: String(updaterId || 'system'),
                        changedAt: new Date().toISOString()
                    }]);
                } catch (historyErr) {
                    console.error('Failed to insert history log:', historyErr);
                }

                // 물리적 테이블 동기화 (실제 삭제) 시도
                if (report?.tableName) {
                    try {
                        const rowData = JSON.parse(row.data);
                        const filters: any = {};
                        
                        // DID(자동 생성 키)를 최우선 식별자로 사용
                        if (idColName && rowData[idColName]) {
                            filters[idColName] = String(rowData[idColName]);
                        } else {
                            // DID가 없거나 찾을 수 없는 경우 전체 데이터 매칭
                            const columns = JSON.parse(report.columns);
                            columns.forEach((c: any) => {
                                if (rowData[c.name] !== undefined) {
                                    filters[c.name] = String(rowData[c.name]);
                                }
                            });
                        }

                        if (Object.keys(filters).length > 0) {
                            await deleteRows(report.tableName, { filters });
                            console.log(`Deleted row from physical table ${report.tableName}`);
                        }
                    } catch (err) {
                        console.error(`Failed to delete from physical table ${report?.tableName} (row: ${row.id}):`, err);
                        syncWarning = `데이터는 삭제되었지만 물리적 테이블(${report?.tableName}) 동기화에 실패했습니다.`;
                    }
                }
            } catch (err) {
                console.error(`Error during deletion of row ${row.id}:`, err);
            }
        }

        revalidatePath(`/report/${reportId}`);
        revalidatePath('/archive');
        return { success: true, syncWarning };
    } catch (err: any) {
        console.error('deleteRowsAction error:', err);
        throw new Error(err.message || '데이터 삭제 중 서버 오류가 발생했습니다.');
    }
}

export async function bulkUpdateRowsAction(
    reportId: string, 
    rowIds: string[], 
    fieldName: string, 
    actionType: 'OVERWRITE' | 'FIND_REPLACE', 
    params: { value?: any; find?: string; replace?: string }
) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    
    const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
    if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

    // 1. 보고서 메타데이터 한 번만 로드
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    if (!report) throw new Error('보고서를 찾을 수 없습니다.');

    const columns = JSON.parse(report.columns);
    const colDef = columns.find((c: any) => c.name === fieldName);
    if (!colDef) throw new Error('컬럼 정의를 찾을 수 없습니다.');

    let idColName: string | null = null;
    if (report.tableName) {
        const idCol = columns.find((c: any) => c.name === '데이터ID');
        if (idCol) idColName = idCol.name;
    }

    // 2. 대상 행들 로드
    const rows = await Promise.all(
        rowIds.map(async (id) => {
            const results = await queryTable('report_row', { filters: { id: String(id), reportId: String(reportId) } });
            return results[0];
        })
    );
    const validRows = rows.filter(r => r);
    if (validRows.length === 0) throw new Error('수정할 데이터가 없습니다.');

    const updaterId = user.id;

    // 일반 사용자(VIEWER) 권한 일 때 타인의 데이터 수정 시도 차단
    if (user.role === 'VIEWER') {
        const hasUnauthorized = validRows.some(r => r.creatorId !== user.id);
        if (hasUnauthorized) {
            throw new Error('본인이 작성하지 않은 데이터는 일괄 수정할 수 없습니다.');
        }
    }

    // 3. 업데이트 루프
    for (const row of validRows) {
        const oldDataStr = row.data;
        const parsedOldData = JSON.parse(oldDataStr);
        const rowData = { ...parsedOldData };
        let newValue = params.value;

        if (actionType === 'FIND_REPLACE' && params.find !== undefined && params.replace !== undefined) {
            const currentVal = String(rowData[fieldName] || '');
            newValue = currentVal.replace(new RegExp(params.find, 'g'), params.replace);
            
            // 타입 복원 (숫자/통화인 경우)
            if (colDef.type === 'number' || colDef.type === 'currency') {
                const cleanVal = newValue.replace(/[^0-9.-]/g, '').trim();
                newValue = isNaN(Number(cleanVal)) ? newValue : Number(cleanVal);
            }
        }

        // 유효성 검사 (Overwrite인 경우 포함)
        if ((colDef.type === 'number' || colDef.type === 'currency') && newValue !== undefined) {
            const sVal = String(newValue);
            const cleanVal = sVal.replace(/[^0-9.-]/g, '').trim();
            if (newValue !== '' && isNaN(Number(cleanVal))) {
                throw new Error(`${fieldName} 필드에는 숫자만 입력 가능합니다.`);
            }
            if (newValue !== '') newValue = Number(cleanVal);
        }

        rowData[fieldName] = newValue;

        // 중복 체크용 해시 재생성
        const newHash = await generateContentHash(rowData, columns);
        
        // 가상 DB 업데이트 필드 준비
        const virtualUpdates: any = {
            data: JSON.stringify(rowData),
            contentHash: newHash,
            updaterId: updaterId,
            updatedAt: new Date().toISOString()
        };

        // 가상 DB 업데이트
        await updateRows('report_row', virtualUpdates, { filters: { id: String(row.id) } });

        // 이력 생성
        try {
            await insertRows('report_row_history', [{
                id: generateId(),
                rowId: String(row.id),
                oldData: oldDataStr,
                newData: virtualUpdates.data,
                changeType: 'UPDATE',
                changedById: String(updaterId || 'system'),
                changedAt: new Date().toISOString()
            }]);
        } catch (historyErr) {
            console.error('Failed to insert history log:', historyErr);
        }

        // 물리적 테이블 동기화
        if (report.tableName) {
            try {
                const filters: any = {};
                // DID(자동 생성 키)를 최우선 식별자로 사용
                if (idColName && parsedOldData[idColName]) {
                    filters[idColName] = String(parsedOldData[idColName]);
                } else {
                    // DID가 없는 경우 모든 컬럼 원본 데이터 매칭
                    columns.forEach((c: any) => {
                        if (parsedOldData[c.name] !== undefined) {
                            filters[c.name] = String(parsedOldData[c.name]);
                        }
                    });
                }
                
                // 업데이트할 데이터 (idCol 제외) 및 물리적 캐스팅 적용
                const physicalUpdates: any = {};
                columns.forEach((col: any) => {
                    if (col.name !== idColName && rowData[col.name] !== undefined) {
                        physicalUpdates[col.name] = castToPhysicalValue(rowData[col.name], col.type);
                    }
                });

                await updateRows(report.tableName, physicalUpdates, { filters });
            } catch (err) {
                console.error(`Failed to sync bulk update to physical table ${report.tableName}:`, err);
            }
        }
    }

    revalidatePath(`/report/${reportId}`);
    return { success: true, count: validRows.length };
}

export async function updateSingleRowAction(
    reportId: string, 
    rowId: string, 
    newData: any
) {
    try {
        const user = await getSessionAction();
        if (!user) throw new Error('인증이 필요합니다.');
        
        const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
        if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

        const reports = await queryTable('report', { filters: { id: String(reportId) } });
        const report = reports[0];
        if (!report) throw new Error('보고서를 찾을 수 없습니다.');

        const columns = JSON.parse(report.columns);
        
        // 1. 기존 데이터 로드
        const rows = await queryTable('report_row', { filters: { id: String(rowId) } });
        const row = rows[0];
        if (!row) throw new Error('수정할 데이터를 찾을 수 없습니다.');

        const updaterId = user.id;

        // 일반 사용자(VIEWER) 권한 일 때 타인의 데이터 수정 시도 차단
        if (user.role === 'VIEWER' && row.creatorId !== user.id) {
            throw new Error('본인이 작성하지 않은 데이터는 수정할 수 없습니다.');
        }

        // 2. 가상 DB 업데이트
        let syncWarning: string | undefined;
        const updatedDataStr = JSON.stringify(newData);
        await updateRows('report_row', {
            data: updatedDataStr,
            updatedAt: new Date().toISOString(),
            updaterId: updaterId
        }, { filters: { id: String(rowId) } });

        // 3. 이력 생성
        try {
            await insertRows('report_row_history', [{
                id: generateId(),
                rowId: String(rowId),
                oldData: row.data,
                newData: updatedDataStr,
                changeType: 'UPDATE',
                changedById: String(updaterId || 'system'),
                changedAt: new Date().toISOString()
            }]);
        } catch (historyErr) {
            console.error('Failed to insert update history log:', historyErr);
        }

        // 4. 물리적 테이블 동기화
        if (report.tableName) {
            try {
                const oldRowData = JSON.parse(row.data);
                const filters: any = {};
                
                // 식별자 컬럼 찾기 (DID 등)
                const idCol = columns.find((c: any) => c.name === '데이터ID');
                let idColName = idCol ? idCol.name : null;

                if (idColName && oldRowData[idColName]) {
                    filters[idColName] = String(oldRowData[idColName]);
                } else {
                    // 식별자가 없는 경우 전체 일치 (동기화 신뢰도 낮음)
                    columns.forEach((c: any) => {
                        if (oldRowData[c.name] !== undefined) {
                            filters[c.name] = String(oldRowData[c.name]);
                        }
                    });
                }

                if (Object.keys(filters).length > 0) {
                    // 물리적 DB 속성에 맞춰 타입 캐스팅 적용
                    const physicalData: any = {};
                    columns.forEach((col: any) => {
                        if (newData[col.name] !== undefined) {
                            physicalData[col.name] = castToPhysicalValue(newData[col.name], col.type);
                        }
                    });

                    await updateRows(report.tableName, physicalData, { filters });
                }
            } catch (err) {
                console.error(`Physical table sync failed during update (row: ${rowId}):`, err);
                syncWarning = `데이터는 수정되었지만 물리적 테이블(${report.tableName}) 동기화에 실패했습니다.`;
            }
        }

        revalidatePath(`/report/${reportId}`);
        return { success: true, syncWarning };
    } catch (err: any) {
        console.error('updateSingleRowAction error:', err);
        throw new Error(err.message || '데이터 수정 중 서버 오류가 발생했습니다.');
    }
}

export async function renameReportAction(reportId: string, newName: string) {
    await updateRows('report', { name: newName }, { filters: { id: String(reportId) } });
    revalidatePath(`/report/${reportId}`);
    revalidatePath('/');
}

export async function updateReportWebhookAction(reportId: string, webhookUrl: string | null) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
    if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

    await updateRows('report', { slackWebhookUrl: webhookUrl }, { filters: { id: String(reportId) } });
    
    revalidatePath(`/report/${reportId}`);
    return { success: true };
}

export async function updateReportSchemaAction(
    reportId: string, 
    columns: any[], 
    convertExistingData: boolean = false,
    newName?: string
) {
    // 1. 기존 리포트의 컬럼 정보 로드 (변경 확인용)
    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    if (!report) throw new Error('보고서를 찾을 수 없습니다.');
    const oldColumns = JSON.parse(report.columns || '[]');

    // 2.5 물리적 테이블 스키마 동기화 (Blue-Green Migration 전략)
    if (report.tableName && Array.isArray(oldColumns)) {
        const logPath = 'schema_sync_trace.log';
        const logInfo = (msg: string) => fs.appendFile(logPath, `[${new Date().toISOString()}] [INFO] ${msg}\n`).catch(() => {});
        const logError = (msg: string) => fs.appendFile(logPath, `[${new Date().toISOString()}] [ERROR] ${msg}\n`).catch(() => {});

        try {
            const oldColNames = new Set(oldColumns.map((c: any) => c.name));
            const newCols = columns.filter((c: any) => !oldColNames.has(c.name));
            const deletedCols = oldColumns.filter((c: any) => !columns.some((nc: any) => nc.name === c.name));

            if (newCols.length > 0 || deletedCols.length > 0) {
                await logInfo(`Schema change detected. Starting Blue-Green Migration for report ${reportId}.`);
                
                // 1) 신규 테이블명 생성 (고유성 보장)
                const suffix = Date.now().toString(36).slice(-5);
                const newTableName = `tb_${reportId}_${suffix}`;
                await logInfo(`Step 1: Generating new table name: ${newTableName}`);

                // 2) 신규 테이블 생성 (target schema 적용)
                await logInfo(`Step 2: Creating new table with updated schema...`);
                // createTable(displayName, schema, options)
                // columns 를 TableDefinition.schema 형식으로 변환 (필요 시)
                const tableSchema = columns.map((c: any) => ({
                    name: c.name,
                    type: ((c.type === 'number' || c.type === 'currency') ? 'INTEGER' : 'TEXT') as 'TEXT' | 'INTEGER'
                }));
                await createTable(report.name + ' (Sync)', tableSchema, { tableName: newTableName });
                await logInfo(`Step 2: Successfully created new table ${newTableName}.`);

                // 3) 기존 데이터 읽기 및 이관
                await logInfo(`Step 3: Migrating existing data from ${report.tableName}...`);
                const existingData = await queryTable(report.tableName, { limit: 100000 }); // 대량 데이터 고려
                
                if (existingData && existingData.length > 0) {
                    // 데이터 매핑 (ID 기반으로 이전 필드 찾기)
                    const migratedData = existingData.map((row: any) => {
                        const newRow: any = {};
                        columns.forEach((newCol: any) => {
                            // 1. ID 매핑 시도 (최우선)
                            // 2. ID가 없는 경우 이름 매핑 시도 (기존 데이터 호환성)
                            const oldCol = oldColumns.find((oc: any) => 
                                (newCol.id && oc.id === newCol.id) || 
                                (!newCol.id && oc.name === newCol.name)
                            );
                            
                            if (oldCol) {
                                newRow[newCol.name] = row[oldCol.name] ?? null;
                            } else {
                                newRow[newCol.name] = null;
                            }
                        });
                        return newRow;
                    });
                    
                    await insertRows(newTableName, migratedData);
                    await logInfo(`Step 3: Successfully migrated ${existingData.length} rows using ID mapping.`);
                } else {
                    await logInfo(`Step 3: No existing data found to migrate.`);
                }

                // 4) 메타데이터 연결 스위칭 (DB 업데이트)
                await logInfo(`Step 4: Swapping table reference in metadata...`);
                const updateValues: any = { 
                    tableName: newTableName,
                    columns: JSON.stringify(columns)
                };
                if (newName) updateValues.name = newName;

                await updateRows('report', updateValues, { filters: { id: String(reportId) } });
                await logInfo(`Step 4: Metadata pointed to ${newTableName}.`);

                // 5) 구 테이블 삭제 (Cleanup)
                await logInfo(`Step 5: Cleaning up old table ${report.tableName}...`);
                try {
                    await deleteTable(report.tableName);
                    await logInfo(`Step 5: Successfully deleted old table.`);
                } catch (delErr: any) {
                    await logError(`Step 5 Warning: Failed to delete old table: ${delErr.message}. Manual cleanup may be required.`);
                }

                await logInfo(`Blue-Green Migration COMPLETED successfully for report ${reportId}.`);
            } else {
                await logInfo(`No schema structure change detected. Metadata only update.`);
            }
        } catch (err: any) {
            await logError(`CRITICAL: Blue-Green Migration FAILED: ${err.message}`);
            // 마이그레이션 실패 시 메타데이터는 구 테이블을 유지함 (트랜잭션 효과)
            throw new Error(`물리 스키마 동기화 중 오류가 발생했습니다: ${err.message}`);
        }
    } else if (newName) {
        // 이름만 바뀌는 경우 (물리 테이블 변경 없음)
        await updateRows('report', { name: newName }, { filters: { id: String(reportId) } });
    }

    // 3. 기존 데이터 변환 로직 (사용자가 선택한 경우)
    if (convertExistingData && Array.isArray(oldColumns)) {
        console.log(`>>> Starting data migration for report ${reportId}...`);
        
        // 이름 변경 맵핑 (oldName -> newName) 구성
        const renameMap: Record<string, string> = {};
        const renamedCols = columns.filter(newCol => newCol.originalName && newCol.originalName !== newCol.name);
        renamedCols.forEach(col => {
             renameMap[col.originalName] = col.name;
        });

        // 파싱된 타입 매핑 생성을 위해 모든 새로운 컬럼 정의 저장
        const currentSchemaMap: Record<string, any> = {};
        columns.forEach(col => currentSchemaMap[col.name] = col);
        
        const allRows = await queryTable('report_row', { filters: { reportId: String(reportId) } });
        console.log(`>>> Migrating ${allRows.length} rows...`);

        // 삭제된 컬럼 데이터를 정리(가비지 컬렉션)하기 위해 새로운 스키마의 name 리스트 준비
        const validNewKeys = new Set(columns.map(c => c.name));

        for (const row of allRows) {
            const oldRowData = JSON.parse(row.data);
            const newRowData: any = {};
            let hasChanged = false;

            // 1) 기존 데이터 키 순회 및 이름 변경 적용
            for (const oldKey in oldRowData) {
                const val = oldRowData[oldKey];
                
                // 만약 이 기존 키가 새로운 이름으로 변경되었다면 새로운 키 사용, 아니면 그대로
                const targetKey = renameMap[oldKey] || oldKey;
                
                // 만약 새로운 스키마에 targetKey가 존재하지 않는다면 이 컬럼은 "삭제된 컬럼"입니다.
                if (!validNewKeys.has(targetKey)) {
                     hasChanged = true; // 삭제되었으므로 원본과 다름
                     continue; // newRowData에 담지 않고 버림
                }

                newRowData[targetKey] = val;
                if (targetKey !== oldKey) {
                    hasChanged = true;
                }
            }

            // 2) 새로운 스키마를 기준으로 타입 캐스팅 (기존 컬럼들 중 이름 안바뀐 것도 포함)
            for (const col of columns) {
                const val = newRowData[col.name];
                if (val === undefined || val === null || val === '') continue;

                let newVal = val;
                
                try {
                    if (col.type === 'number' || col.type === 'currency') {
                        const sVal = String(val);
                        const cleanVal = sVal.replace(/[^0-9.-]/g, '').trim();
                        if (!isNaN(Number(cleanVal)) && cleanVal !== '') {
                            newVal = Number(cleanVal);
                        }
                    } else if (col.type === 'date') {
                        // 엑셀 날짜 일련번호(Serial Date) 대응 로직
                        if (!isNaN(Number(val)) && String(val).trim() !== '') {
                            const serialNum = Number(val);
                            // 일반적인 엑셀 범위 (예: 30000 ~ 90000, 1980년대부터 2100년대까지 대략 커버)
                            if (serialNum > 10000 && serialNum < 100000) {
                                // 1900 날짜 시스템 기준 변환: 25569 = 1970-01-01 까지의 일수
                                const utcDays  = Math.floor(serialNum - 25569);
                                const utcValue = utcDays * 86400;                                        
                                const dateInfo = new Date(utcValue * 1000);
                                if (!isNaN(dateInfo.getTime())) {
                                    // YYYY-MM-DD 형식으로 클린업
                                    newVal = dateInfo.toISOString().split('T')[0];
                                }
                            } else {
                                // Unix timestamp 인 경우 등을 대비하여 폴백
                                const d = new Date(serialNum);
                                if (!isNaN(d.getTime())) newVal = d.toISOString();
                            }
                        } else {
                            // 일반 날짜 문자열인 경우
                            const d = new Date(val);
                            if (!isNaN(d.getTime())) {
                                newVal = d.toISOString();
                            }
                        }
                    } else if (col.type === 'boolean') {
                        newVal = (val === 'true' || val === '1' || val === 1 || val === true);
                    } else if (col.type === 'string' || col.type === 'textarea') {
                        newVal = String(val);
                    }
                } catch (e) {
                    console.error(`Failed to convert ${col.name} value "${val}" to ${col.type}`);
                }

                // 타입 변환 또는 포맷팅에 의해 값이 변경되었는지 감지
                const oldKeyName = col.originalName || col.name;
                if (oldRowData[oldKeyName] !== newVal) {
                    hasChanged = true;
                }
                newRowData[col.name] = newVal;
            }

            if (hasChanged) {
                const updatedDataStr = JSON.stringify(newRowData);
                // 가상 테이블 업데이트
                await updateRows('report_row', { data: updatedDataStr, updatedAt: new Date().toISOString() }, { filters: { id: String(row.id) } });

                // 물리적 테이블 동기화
                if (report.tableName) {
                    try {
                        const idCol = columns.find((c: any) => c.isAutoGenerated);
                        const filters: any = {};
                        if (idCol && newRowData[idCol.name]) {
                            filters[idCol.name] = String(newRowData[idCol.name]);
                            
                            // 물리적 DB 속성에 맞춰 타입 캐스팅 적용
                            const physicalData: any = {};
                            columns.forEach((col: any) => {
                                if (newRowData[col.name] !== undefined) {
                                    physicalData[col.name] = castToPhysicalValue(newRowData[col.name], col.type);
                                }
                            });

                            await updateRows(report.tableName, physicalData, { filters });
                        }
                    } catch (err) {
                        console.error(`Physical sync failed during migration for row ${row.id}`, err);
                    }
                }
            }
        }
        console.log(`>>> Data migration completed for report ${reportId}`);
    }

    revalidatePath(`/report/${reportId}`);
    return { success: true };
}

export async function analyzeExcelScreenshotAction(formData: FormData) {
  const image = formData.get('image') as File;
  if (!image) throw new Error('이미지 파일이 없습니다.');

  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const mimeType = image.type;

  return await analyzeExcelImage(base64, mimeType);
}

export async function addRowsAction(reportId: string, rows: any[]) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    const isAuthorized = await checkReportAuthorization(reportId, user.id, user.role);
    if (!isAuthorized) throw new Error('해당 보고서에 대한 접근 권한이 없습니다.');

    const creatorId = user.id;

    const reports = await queryTable('report', { filters: { id: String(reportId) } });
    const report = reports[0];
    if (!report) throw new Error('보고서를 찾을 수 없습니다.');
  
    const columns = JSON.parse(report.columns);
    
    // 1. 최대 일련번호(lastSerial) 확인
    let currentSerial = 0;
    // Use lastSerial if it is tracked and > 0, else fallback to max DID parsing
    if (report.lastSerial !== undefined && report.lastSerial !== null && Number(report.lastSerial) > 0) {
        currentSerial = Number(report.lastSerial);
    } else {
        const idCol = columns.find((c: any) => c.isAutoGenerated);
        if (idCol) {
            const allRows = await queryTable('report_row', { filters: { reportId: String(reportId) }, limit: 100000 });
            let maxNum = 0;
            const rowsArray = allRows.rows || allRows;
            if (Array.isArray(rowsArray)) {
                rowsArray.forEach((r: any) => {
                    try {
                        const data = JSON.parse(r.data);
                        const did = data[idCol.name];
                        if (did && typeof did === 'string') {
                            const num = parseInt(did.replace(/[^0-9]/g, ''), 10);
                            if (!isNaN(num) && num > maxNum) maxNum = num;
                        }
                    } catch (e) {}
                });
            }
            currentSerial = maxNum;
        }
    }
    let skippedCount = 0;
    
    // 1. 기존 데이터의 해시값 로드 (중복 체크용) - 삭제되지 않은 행만 대상
    const rawExistingRows = await queryTable('report_row', {
        filters: { reportId: String(reportId) }
    });
    const existingRows = rawExistingRows.filter((r: any) => String(r.isDeleted) === '0');
    const existingHashes = new Set(existingRows.map((r: any) => r.contentHash).filter((h: any) => h));

    // 2. 각 행당 유효성 검사 및 정제
    const cleanedRowsToInsert = [];
    
    for (const rowData of rows) {
        const finalData: any = {};
        
        // 매핑
        columns.forEach((col: any) => {
            if (!col.isAutoGenerated) {
                finalData[col.name] = rowData[col.name];
            }
        });

        const hash = await generateContentHash(finalData, columns);
        const isUnique = (col: any) => col.isUnique === true || String(col.isUnique) === 'true' || Number(col.isUnique) === 1 || String(col.isUnique) === '1';
        const uniqueCols = columns.filter((c: any) => isUnique(c));
        
        // 고유 컬럼이 정의되지 않은 경우, 같은 파일 내에서의 중복 행(동일인물이 동시에 구매 등)은 허용
        // DB에 이미 존재하는 데이터와의 중복만 체크 (existingHashes는 현재 DB에 있는 값들만 preload해두는 방식으로 변경 검토 가능하나
        // 일단 uniqueCols가 없을 때는 세션 내 중복 허용)
        if (uniqueCols.length > 0 && existingHashes.has(hash)) {
            skippedCount++;
            continue; 
        }
        
        // DB 전수 체크 (uniqueCols가 있거나, 완벽히 동일한 데이터가 DB에 이미 있을 때만 스킵)
        // 여기서는 기존 로직 유지하되, screenshot 케이스처럼 동일행 2개 있는 파일 지원을 위해
        // '세션 전용 해시맵'을 별도 운영하거나 완화함
        const dataKey = hash;
        if (uniqueCols.length === 0) {
            // 고유컬럼 없을 때는 파일 내 중복 허용 -> existingHashes에서 제외하거나 매번 체크 안함
            // 단, DB에 이미 있는 데이터와 겹치면? (사용자가 업로드버튼 또 누른 경우)
            // 이를 위해 DB 레벨 중복만 체크하는 로직이 필요하나, 일단 screenshot의 '동일파일 내 2행' 문제 해결을 위해
            // 세션 내 체크를 생략함
        } else if (existingHashes.has(dataKey)) {
            skippedCount++;
            continue;
        }

        // 유효성 검사 및 정제
        let isRowDataValid = true;
        for (const col of columns) {
            if (col.isAutoGenerated) continue;
            const val = finalData[col.name];

            if (col.isRequired && (val === undefined || val === null || val === '')) {
                if (val !== 0) {
                    isRowDataValid = false;
                    break;
                }
            }

            if (col.type === 'select' && col.options && val !== '' && val !== null && val !== undefined) {
                const rawOptions = col.options;
                const optionsList = Array.isArray(rawOptions) 
                    ? rawOptions 
                    : String(rawOptions).split(',').map(s => s.trim()).filter(Boolean);
                
                if (!optionsList.includes(String(val).trim())) {
                    isRowDataValid = false;
                    break;
                }
            }

            if ((col.type === 'number' || col.type === 'currency') && val !== '' && val !== null && val !== undefined) {
                const sVal = String(val);
                const cleanVal = sVal.replace(/[^0-9.-]/g, '').trim();
                const numericVal = Number(cleanVal);
                if (!isNaN(numericVal)) {
                    finalData[col.name] = numericVal;
                }
            }
        }

        if (!isRowDataValid) {
            skippedCount++;
            continue;
        }

        // 인서트 데이터 구성
        currentSerial++;
        const nextSerial = currentSerial.toString().padStart(6, '0');
        const rowWithMetadata: any = { ...finalData };
        
        columns.forEach((col: any) => {
            if (col.isAutoGenerated) {
                rowWithMetadata[col.name] = 'DID-' + nextSerial;
            }
        });

        cleanedRowsToInsert.push({
            id: generateNumericId(),
            data: JSON.stringify(rowWithMetadata),
            contentHash: hash,
            reportId: String(reportId),
            creatorId: creatorId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: 0
        });
        
        existingHashes.add(hash);
    }
    if (cleanedRowsToInsert.length > 0) {
        // 3. 물리적 테이블이 있으면 데이터 삽입 (원칙 준수: 물리 우선)
        if (report.tableName) {
            try {
                const physicalRows = cleanedRowsToInsert.map(r => {
                    const rowWithMetadata = JSON.parse(r.data);
                    const physicalData: any = {};
                    columns.forEach((col: any) => {
                        physicalData[col.name] = castToPhysicalValue(rowWithMetadata[col.name], col.type);
                    });
                    return physicalData;
                });
                await insertRows(report.tableName, physicalRows);
                console.log(`Inserted ${physicalRows.length} rows into physical table ${report.tableName}`);
            } catch (err: any) {
                console.error(`Failed to insert into physical table ${report.tableName}:`, err);
                throw new Error(`물리적 테이블 데이터 일괄 삽입에 실패하였습니다. (사유: ${err.message || '알 수 없음'})`);
            }
        }

        // 4. 가상 테이블 (report_row) 저장
        const vRes = await insertRows('report_row', cleanedRowsToInsert);
        if (!vRes?.success) {
            console.error("Virtual insert failed:", vRes);
            throw new Error(`가상 테이블 데이터 일괄 삽입에 실패하였습니다. (사유: ${vRes?.error || '알 수 없음'})`);
        }

        // 5. 최대 일련번호 업데이트
        try {
            await updateRows('report', { lastSerial: currentSerial }, { filters: { id: String(reportId) } });
        } catch (err) {
            console.warn(`Failed to update lastSerial in bulk for report ${reportId}.`, err);
        }
    }
  
    if (cleanedRowsToInsert.length > 0) {
        // 슬랙 알림 발송 - 첫 번째 행을 대표 데이터로 사용
        const firstRowData = JSON.parse(cleanedRowsToInsert[0].data);
        notifyBulkUpload(report.name, user.fullName || user.username, cleanedRowsToInsert.length, firstRowData, columns, report.slackWebhookUrl).catch(console.error);
    }

    revalidatePath('/report/' + reportId);
    return { 
        success: true, 
        addedCount: cleanedRowsToInsert.length, 
        skippedCount 
    };
}

export async function createManualReportAction(name: string, sheetName: string, columns: any[]) {
    // 1. 유저 확인
    const users = await queryTable('user', { filters: { username: 'admin_user' } });
    let user = users[0];
    if (!user) {
        const newUserId = generateId();
        await insertRows('user', [{
            id: newUserId,
            username: 'admin_user',
            role: 'ADMIN',
            isActive: 1
        }]);
        user = { id: newUserId };
    }

    // 2. 컬럼 준비 (Data ID 가 없으면 첫 번째로 자동 추가)
    const hasAutoId = columns.some(c => c.isAutoGenerated);
    let finalColumns = [...columns];
    if (!hasAutoId) {
        finalColumns = [
            { id: 'did', name: '데이터 ID', type: 'string', isRequired: true, isAutoGenerated: true },
            ...columns
        ];
    }

    // 3. 보고서 생성
    const reportId = generateId();
    await insertRows('report', [{
        id: reportId,
        name,
        sheetName,
        columns: JSON.stringify(finalColumns),
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        lastSerial: 0 // New manual report starts with 0
    }]);

    revalidatePath('/');
    redirect(`/report/${reportId}?action=new`);
}

export async function analyzeImageAndExtractDataAction(formData: FormData, columnsJson: string) {
    try {
        const image = formData.get('image') as File;
        if (!image) throw new Error('이미지 파일이 없습니다.');
        
        console.log(`Analyzing image: ${image.name}, size: ${Math.round(image.size / 1024)} KB, type: ${image.type}`);

        const columns = JSON.parse(columnsJson);
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = image.type;

        const extractedData = await extractDataFromImage(base64, mimeType, columns);
        return { success: true, data: extractedData };
    } catch (error: any) {
        console.error("AI Analysis Action Error:", error);
        // 에러 메시지를 가공하여 사용자에게 친숙하게 전달
        let errorMessage = error.message || '이미지를 분석하는 중 오류가 발생했습니다.';
        if (errorMessage.includes('413')) {
            errorMessage = '이미지 용량이 너무 큽니다. 더 작은 이미지를 사용해 주세요.';
        }
        return { success: false, error: errorMessage };
    }
}


export async function loginAction(username: string, password?: string) {
    const trimmedUsername = username.trim();

    // Check if admin_user exists, create if not
    const admins = await queryTable('user', { filters: { username: 'admin_user' } });
    const existingAdmin = admins[0];
    
    if (!existingAdmin) {
        await insertRows('user', [{ 
            id: generateId(),
            username: 'admin_user', 
            role: 'ADMIN', 
            fullName: '초기 관리자', 
            isActive: 1,
            password: hashPassword('admin123!') // 기본 비밀번호 설정
        }]);
    } else if (!existingAdmin.isActive && trimmedUsername === 'admin_user') {
        // Emergency reactivate admin_user if it's the target login and is deactivated
        await updateRows('user', { isActive: 1 }, { filters: { username: 'admin_user' } });
    }

    // Check if employee_user exists, create if not
    const employees = await queryTable('user', { filters: { username: 'employee_user' } });
    const existingEmployee = employees[0];

    if (!existingEmployee) {
        await insertRows('user', [{ 
            id: generateId(),
            username: 'employee_user', 
            role: 'EMPLOYEE', 
            fullName: '테스트 사원', 
            isActive: 1,
            password: hashPassword('employee123!') // 기본 비밀번호 설정
        }]);
    } else if (!existingEmployee.isActive && trimmedUsername === 'employee_user') {
        await updateRows('user', { isActive: 1 }, { filters: { username: 'employee_user' } });
    }

    const users = await queryTable('user', { filters: { username: trimmedUsername } });
    const user = users[0];
    
    if (!user || user.isActive === 0) {
        throw new Error('존재하지 않거나 비활성화된 계정입니다.');
    }

    // 비밀번호 검증 (이미 설정된 비밀번호가 있는 경우)
    if (user.password && password) {
        const isValid = verifyPassword(password, user.password);
        if (!isValid) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }
    } else if (user.password && !password) {
        throw new Error('비밀번호를 입력해 주세요.');
    }

    const cookieStore = await cookies();
    cookieStore.set('session_user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
    });

    cookieStore.set('session_user_role', user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
    });

    return { success: true, user };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete('session_user_id');
    redirect('/login');
}

export async function getVisualizationRecommendationAction(tableIds: string[], messages: any[]) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');
    
    try {
        return await getVisualizationRecommendation(tableIds, messages);
    } catch (error: any) {
        console.error('[AI Dashboard Error]:', error);
        
        // Error 객체의 message 
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        const combinedMessage = errorMessage + " " + errorStack;
        
        if (combinedMessage.includes('429') || combinedMessage.toLowerCase().includes('quota')) {
            return {
                content: "죄송합니다. 현재 AI 분석 서비스의 허용 한도(Quota)를 초과하여 이용이 일시적으로 제한되었습니다. 시간이 조금 지난 후 다시 시도해 주시거나 결제 및 프로젝트 상태를 점검해 주세요. 😢",
                chartConfigs: []
            };
        }
        
        return {
            content: `AI 분석 도중 쿼리나 네트워크 관련 오류가 발생했습니다:\n\n\`\`\`\n${errorMessage}\n\`\`\`\n\n잠시 후 다시 대화를 시도해 주시거나, 질문을 조금 더 단순하게 바꿔서 요청해 보세요.`,
            chartConfigs: []
        };
    }
}

export async function getSessionAction() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    
    if (!userId) return null;

    const users = await queryTable('user', { filters: { id: String(userId) } });
    const user = users[0];

    if (!user || user.isActive === 0) {
        return null;
    }

    return user;
}


export async function getUsersAction() {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    const users = await queryTable('user', { 
        orderBy: 'username',
        orderDirection: 'ASC'
    });

    return users.map((user: any) => ({
        ...user,
        hasPassword: !!user.password,
        password: undefined
    }));
}

export async function updateUserAction(userId: string, data: any) {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    // admin_user 본인의 역할이나 활성화 상태 변경은 제한 (안전장치)
    const targetUsers = await queryTable('user', { filters: { id: String(userId) } });
    const targetUser = targetUsers[0];
    if (targetUser?.username === 'admin_user') {
        if (data.role !== 'ADMIN' || data.isActive === false) {
            throw new Error('기본 관리자 계정의 권한이나 활성 상태는 변경할 수 없습니다.');
        }
    }

    const { username, role, fullName, employeeId, isActive, password } = data;
    const finalEmployeeId = employeeId?.trim() || null;

    // 아이디 중복 체크 (수정 시 본인 제외)
    if (username) {
        const trimmedUsername = username.trim();
        const existingUsers = await queryTable('user', { filters: { username: trimmedUsername } });
        if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
            throw new Error('이미 사용 중인 아이디입니다.');
        }
    }

    // 사번 중복 체크 (수정 시 본인 제외)
    if (finalEmployeeId) {
        const existingEmps = await queryTable('user', { filters: { employeeId: finalEmployeeId } });
        if (existingEmps.length > 0 && existingEmps[0].id !== userId) {
            throw new Error('이미 다른 사용자가 사용 중인 사번입니다.');
        }
    }
    
    await updateRows('user', { 
        username: username?.trim(), 
        role, 
        fullName: fullName?.trim(), 
        employeeId: finalEmployeeId, 
        isActive: isActive === undefined ? 1 : (isActive ? 1 : 0),
        ...(password ? { password: hashPassword(password) } : {})
    }, { filters: { id: String(userId) } });

    revalidatePath('/users');
    revalidatePath('/');
    return { success: true };
}

export async function createUserAction(data: any) {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    const { username, role, fullName, employeeId, password } = data;
    const trimmedUsername = username.trim();
    const finalEmployeeId = employeeId?.trim() || null;
    
    // 아이디 중복 체크
    const existingUsers = await queryTable('user', { filters: { username: trimmedUsername } });
    if (existingUsers.length > 0) throw new Error('이미 존재하는 아이디입니다.');

    // 사번 중복 체크
    if (finalEmployeeId) {
        const existingEmps = await queryTable('user', { filters: { employeeId: finalEmployeeId } });
        if (existingEmps.length > 0) throw new Error('이미 존재하는 사번입니다.');
    }

    await insertRows('user', [{ 
        id: generateId(),
        username: trimmedUsername, 
        role, 
        fullName: fullName?.trim(), 
        employeeId: finalEmployeeId, 
        isActive: 1,
        password: password ? hashPassword(password) : undefined
    }]);

    revalidatePath('/users');
    revalidatePath('/');
    return { success: true };
}

/**
 * 엑셀 데이터를 통해 다수의 사용자를 일괄 등록합니다.
 * @param usersData 사용자 데이터 배열
 */
export async function bulkCreateUsersAction(usersData: any[]) {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    let createdCount = 0;
    let skippedCount = 0;
    const skippedItems: any[] = [];

    for (const data of usersData) {
        try {
            const { username, role, fullName, employeeId, password } = data;
            if (!username) {
                skippedCount++;
                skippedItems.push({ username: 'N/A', reason: '아이디 누락' });
                continue;
            }

            const trimmedUsername = String(username).trim();
            const finalEmployeeId = employeeId ? String(employeeId).trim() : null;
            const finalRole = (role && ['ADMIN', 'EDITOR', 'VIEWER'].includes(String(role).toUpperCase())) 
                ? String(role).toUpperCase() 
                : 'VIEWER';
            
            // 아이디 중복 체크
            const existingUsers = await queryTable('user', { filters: { username: trimmedUsername } });
            if (existingUsers.length > 0) {
                skippedCount++;
                skippedItems.push({ username: trimmedUsername, reason: '아이디 중복' });
                continue;
            }

            // 사번 중복 체크
            if (finalEmployeeId) {
                const existingEmps = await queryTable('user', { filters: { employeeId: finalEmployeeId } });
                if (existingEmps.length > 0) {
                    skippedCount++;
                    skippedItems.push({ username: trimmedUsername, reason: '사번 중복' });
                    continue;
                }
            }

            // 비밀번호 설정 (비어있으면 123456)
            const finalPassword = (password && String(password).trim()) ? String(password).trim() : '123456';

            await insertRows('user', [{ 
                id: crypto.randomUUID(),
                username: trimmedUsername, 
                role: finalRole, 
                fullName: fullName ? String(fullName).trim() : null, 
                employeeId: finalEmployeeId, 
                isActive: 1,
                password: hashPassword(finalPassword)
            }]);
            createdCount++;
        } catch (err) {
            console.error('Bulk upload error for item:', data, err);
            skippedCount++;
            skippedItems.push({ username: data.username || 'Unknown', reason: '알 수 없는 오류' });
        }
    }

    revalidatePath('/users');
    revalidatePath('/');
    
    return { 
        success: true, 
        createdCount, 
        skippedCount, 
        skippedItems 
    };
}

export async function deleteUserAction(userId: string) {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    // 자기 자신 삭제 방지
    if (session.id === userId) {
        throw new Error('본인의 계정은 삭제할 수 없습니다.');
    }

    // 기본 관리자 계정 삭제 방지
    const targetUsers = await queryTable('user', { filters: { id: userId } });
    const targetUser = targetUsers[0];
    if (targetUser?.username === 'admin_user') {
        throw new Error('기본 관리자 계정은 삭제할 수 없습니다.');
    }

    await deleteRows('user', { filters: { id: userId } });

    revalidatePath('/users');
    revalidatePath('/');
    return { success: true };
}

/**
 * 보고서에 대한 사용자 접근 권한을 업데이트합니다.
 */
export async function updateReportAccessAction(reportId: string, userIds: string[]) {
    const session = await getSessionAction();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
        throw new Error('접근 권한이 없습니다.');
    }

    // 기존 권한 삭제
    await deleteRows('report_access', { filters: { reportId } });
    
    // 신규 권한 삽입
    if (userIds.length > 0) {
        await insertRows('report_access', userIds.map(userId => ({
            reportId,
            userId
        })));
    }

    revalidatePath(`/report/${reportId}`);
    revalidatePath(`/report/${reportId}/input`);
    revalidatePath('/');
    return { success: true };
}

/**
 * 보고서에 접근 권한이 있는 사용자 목록을 가져옵니다.
 */
export async function getAuthorizedUsersForReportAction(reportId: string) {
    const accessList = await queryTable('report_access', { filters: { reportId } });
    const userIds = accessList.map((a: any) => a.userId);
    
    if (userIds.length === 0) return [];
    
    const users = await Promise.all(
        userIds.map(async (id: string) => {
            const results = await queryTable('user', { filters: { id } });
            return results[0];
        })
    );
    
    return users.filter(u => u);
}



/**
 * 핀 고정된 차트 목록을 관리하기 위한 영구 저장소 경로
 */
const PINNED_CHARTS_PATH = path.join(process.cwd(), 'pinned_charts.json');

/**
 * 핀 고정된 차트 설정을 저장합니다.
 */
export async function savePinnedChartAction(chartId: string, config: any) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    let pinned: any[] = [];
    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        pinned = JSON.parse(fileContent);
    } catch (e) {
        // 파일이 없으면 빈 배열로 시작
    }

    // 기존에 있으면 업데이트, 없으면 추가
    const existingIndex = pinned.findIndex(p => p.id === chartId);
    if (existingIndex > -1) {
        pinned[existingIndex] = { ...pinned[existingIndex], config, updatedAt: new Date().toISOString() };
    } else {
        pinned.push({
            id: chartId,
            userId: user.id,
            config,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * 동적 플레이스홀더($TODAY, $TODAY-N 등)를 실제 날짜 값으로 변환합니다.
 */
function resolveDynamicValue(val: any): any {
    if (typeof val !== 'string') return val;
    
    const today = new Date();
    // sv-SE(스웨덴) 로케일은 항상 YYYY-MM-DD 형식을 보장하며, KST 타임존을 명시합니다.
    const kstTodayStr = today.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    
    if (val === '$TODAY') return kstTodayStr;
    
    const match = val.match(/^\$TODAY-(\d+)$/);
    if (match) {
        const days = parseInt(match[1], 10);
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - days);
        return targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    }
    
    return val;
}

/**
 * 인자 객체 전체를 순회하며 동적 플레이스홀더를 치환합니다.
 */
function resolveDynamicArgs(args: any): any {
    if (!args || typeof args !== 'object') return args;
    
    const resolvedArgs: any = Array.isArray(args) ? [] : {};
    for (const [key, value] of Object.entries(args)) {
        if (value && typeof value === 'object') {
            resolvedArgs[key] = resolveDynamicArgs(value);
        } else {
            resolvedArgs[key] = resolveDynamicValue(value);
        }
    }
    return resolvedArgs;
}

/**
 * 차트 설명 내의 날짜 정보를 동적으로 변환합니다.
 */
function resolveDynamicDescription(desc: string, args: any): string {
    if (!desc) return desc;
    let resolvedDesc = desc;
    
    // 설명 내에 "$TODAY[-N]" 형태의 플레이스홀더가 있으면 직접 치환
    resolvedDesc = resolvedDesc.replace(/\$TODAY(?:-(\d+))?/g, (match) => {
        return resolveDynamicValue(match);
    });

    // 기존의 YYYY-MM-DD 형태 텍스트 치환 로직 (백업)
    if (args?.startDate && args?.endDate) {
        const sDate = resolveDynamicValue(args.startDate);
        const eDate = resolveDynamicValue(args.endDate);
        
        resolvedDesc = resolvedDesc.replace(/\d{4}-\d{2}-\d{2}/g, (match, offset) => {
            return offset < resolvedDesc.indexOf('부터') ? sDate : eDate;
        });
    }
    
    return resolvedDesc;
}

/**
 * 툴 호출 결과를 차트 데이터 형식으로 변환합니다.
 */
function mapRefreshedData(rawData: any, mapping: any): any[] {
    let newData: any[] = [];
    
    // 1. 결과 객체 내에 배열이 있는 경우 우선 처리 (상세 내역 또는 요약 내역)
    // 'result', 'transactions', 'summary' 키를 유연하게 지원
    const records = (rawData && rawData.result && Array.isArray(rawData.result)) ? rawData.result :
                  (rawData && rawData.transactions && Array.isArray(rawData.transactions)) ? rawData.transactions : 
                  (rawData && rawData.summary && Array.isArray(rawData.summary)) ? rawData.summary : null;

    if (records) {
        newData = records.map((row: any) => {
            if (mapping && typeof mapping === 'object' && !mapping.label && !mapping.value) {
                const mappedRow: any = {};
                for (const [targetKey, sourceKey] of Object.entries(mapping)) {
                    mappedRow[targetKey] = row[sourceKey as string] ?? row[targetKey] ?? '';
                }
                return mappedRow;
            }
            return {
                label: mapping?.label && row[mapping.label] !== undefined ? row[mapping.label] : (row.yearMonth || row.month || row.name || row.label || row.date || Object.values(row)[0]),
                value: mapping?.value && row[mapping.value] !== undefined ? row[mapping.value] : (row.totalWithdrawals || row.amount || row.value || row.count || row.total || Object.values(row)[1])
            };
        });
    }
    // 2. 배열 형태의 결과 처리
    else if (Array.isArray(rawData)) {
        newData = rawData.map(row => {
            if (mapping && typeof mapping === 'object' && !mapping.label && !mapping.value) {
                const mappedRow: any = {};
                for (const [targetKey, sourceKey] of Object.entries(mapping)) {
                    mappedRow[targetKey] = row[sourceKey as string] ?? row[targetKey] ?? '';
                }
                return mappedRow;
            }
            return {
                label: mapping?.label && row[mapping.label] !== undefined ? row[mapping.label] : (row.yearMonth || row.month || row.name || row.label || row.date),
                value: mapping?.value && row[mapping.value] !== undefined ? row[mapping.value] : (row.totalWithdrawals || row.amount || row.value || row.count || row.total)
            };
        });
    } 
    // 3. 카테고리 요약 형태 처리
    else if (rawData && rawData.categorySummary) {
        newData = Object.entries(rawData.categorySummary).map(([label, value]) => ({ label, value }));
    } 
    
    return newData;
}

/**
 * 핀 고정된 차트 목록을 가져옵니다.
 */
export async function getPinnedChartsAction() {
    const user = await getSessionAction();
    if (!user) return [];

    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        const pinned = JSON.parse(fileContent);
        const userPinned = pinned.filter((p: any) => String(p.userId) === String(user.id));

        // 실시간 데이터 동기화 (병렬 처리)
        let hasChanges = false;
        const refreshedCharts = await Promise.all(userPinned.map(async (item: any) => {
            if (item.config.refreshMetadata) {
                try {
                    const { tool, args: originalArgs, mapping } = item.config.refreshMetadata;
                    const args = resolveDynamicArgs(originalArgs);
                    
                    if (item.config.sourceDescription) {
                        item.config.sourceDescription = resolveDynamicDescription(item.config.sourceDescription, originalArgs);
                    }
                    
                    const rawData = await runAITool(tool, args);
                    const newData = mapRefreshedData(rawData, mapping);

                    if (newData.length > 0) {
                        item.config.data = newData;
                        item.refreshedAt = new Date().toISOString();
                        hasChanges = true;
                    }
                } catch (e) {
                    console.error(`[Refresh Error] Chart ${item.id}:`, e);
                }
            }
            return item;
        }));

        // 변경된 내용이 있으면 전체 목록 파일에 영구 저장 (Consistency 보장)
        if (hasChanges) {
            // 원본 목록 중 현재 사용자의 것만 업데이트하여 다시 저장
            const updatedPinned = pinned.map((p: any) => {
                const refreshed = refreshedCharts.find((rc: any) => rc.id === p.id);
                return refreshed || p;
            });
            await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(updatedPinned, null, 2));
        }

        return refreshedCharts;
    } catch (e) {
        return [];
    }
}

/**
 * 핀 고정된 차트를 삭제합니다.
 */
export async function deletePinnedChartAction(chartId: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        let pinned = JSON.parse(fileContent);
        pinned = pinned.filter((p: any) => p.id !== chartId);
        await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

/**
 * 특정 차트의 데이터를 즉시 새로고침합니다.
 */
export async function refreshIndividualChartAction(chartId: string) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        let pinned = JSON.parse(fileContent);
        const chartIndex = pinned.findIndex((p: any) => p.id === chartId);
        if (chartIndex === -1) throw new Error('차트를 찾을 수 없습니다.');

        const item = pinned[chartIndex];
        if (!item.config.refreshMetadata) return { success: true, item };

        const { tool, args: originalArgs, mapping } = item.config.refreshMetadata;
        
        // 동적 인자 처리
        const args = resolveDynamicArgs(originalArgs);
        
        // 설명 정보 업데이트
        if (item.config.sourceDescription) {
            item.config.sourceDescription = resolveDynamicDescription(item.config.sourceDescription, originalArgs);
        }

        const rawData = await runAITool(tool, args);
        const newData = mapRefreshedData(rawData, mapping);

        if (newData.length > 0) {
            item.config.data = newData;
            item.refreshedAt = new Date().toISOString();
            pinned[chartIndex] = item;
            await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
        }

        revalidatePath('/dashboard');
        return { success: true, item };
    } catch (e) {
        console.error('Refresh Action Error:', e);
        return { success: false };
    }
}

/**
 * 차트의 레이아웃(너비 등) 설정을 업데이트합니다.
 */
export async function updateChartLayoutAction(chartId: string, layout: any) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    try {
        const fileContent = await fs.readFile(PINNED_CHARTS_PATH, 'utf-8');
        let pinned = JSON.parse(fileContent);
        const chartIndex = pinned.findIndex((p: any) => p.id === chartId);
        if (chartIndex === -1) throw new Error('차트를 찾을 수 없습니다.');

        pinned[chartIndex].layout = layout;
        pinned[chartIndex].updatedAt = new Date().toISOString();

        await fs.writeFile(PINNED_CHARTS_PATH, JSON.stringify(pinned, null, 2));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        console.error('Update Layout Action Error:', e);
        return { success: false };
    }
}

// AI 분석 스튜디오 세션 테이블 초기화 여부를 서버 메모리에 캐싱
let isAIStudioSessionTableInitialized = false;

/**
 * AI 분석 스튜디오의 세션 상태를 서버에 저장합니다.
 */
export async function saveAIStudioSessionAction(data: any) {
    const user = await getSessionAction();
    if (!user) throw new Error('인증이 필요합니다.');

    const tableName = 'ai_studio_session';
    
    try {
        const sessionData = {
            userId: user.id,
            data: JSON.stringify(data),
            updatedAt: new Date().toISOString()
        };

        // 1. 초기 1회 또는 오류 발생 시 테이블 생성 시도 (Lazy Creation)
        if (!isAIStudioSessionTableInitialized) {
            try {
                await queryTable(tableName, { limit: 1 });
                isAIStudioSessionTableInitialized = true;
            } catch (e) {
                // 테이블이 없으면 생성
                await createTable('AI Studio Session', [
                    { name: 'userId', type: 'TEXT', notNull: true },
                    { name: 'data', type: 'TEXT', notNull: true },
                    { name: 'updatedAt', type: 'TEXT', notNull: true }
                ], { tableName, uniqueKeyColumns: ['userId'] });
                isAIStudioSessionTableInitialized = true;
            }
        }

        // 2. Upsert (userId 기준)
        const existing = await queryTable(tableName, { filters: { userId: user.id } });
        
        if (existing && existing.length > 0) {
            await updateRows(tableName, {
                data: sessionData.data,
                updatedAt: sessionData.updatedAt
            }, { filters: { userId: user.id } });
        } else {
            await insertRows(tableName, [sessionData]);
        }

        return { success: true };
    } catch (e) {
        console.error('Save AI Studio Session Error:', e);
        // 오류 발생 시 다음 재시도에서 테이블 체크를 다시 하도록 플래그 리셋
        isAIStudioSessionTableInitialized = false;
        return { success: false };
    }
}

/**
 * 서버에서 AI 분석 스튜디오의 세션 상태를 불러옵니다.
 */
export async function getAIStudioSessionAction() {
    const user = await getSessionAction();
    if (!user) return null;

    const tableName = 'ai_studio_session';
    
    try {
        const results = await queryTable(tableName, { filters: { userId: user.id } });
        if (results && results.length > 0) {
            return JSON.parse(results[0].data);
        }
    } catch (e) {
        // 테이블이 없거나 데이터가 없는 경우 무시 (새로운 분석을 위해 null 반환)
    }
    return null;
}

/**
 * 서버의 AI 분석 스튜디오 세션 상태를 초기화합니다.
 */
export async function clearAIStudioSessionAction() {
    const user = await getSessionAction();
    if (!user) return { success: false };

    const tableName = 'ai_studio_session';
    
    try {
        await deleteRows(tableName, { filters: { userId: user.id } });
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

/**
 * 가상 테이블과 물리적 테이블의 동기화 상태를 확인하는 서버 액션
 * 행 수와 데이터ID를 비교하여 불일치를 감지합니다.
 */
export async function checkSyncStatusAction(reportId: string) {
    try {
        // 1. 보고서 메타데이터 조회
        const reports = await queryTable('report', { filters: { id: String(reportId) } });
        const report = reports[0];
        if (!report) return { status: 'error' as const, message: '보고서를 찾을 수 없습니다.' };

        // 2. 물리적 테이블이 없는 경우
        if (!report.tableName) {
            return { status: 'no-physical' as const, message: '물리적 테이블 없음' };
        }

        // 3. 가상 테이블 행 조회 (isDeleted 필터링을 로컬에서 안전하게 처리)
        const virtualRowsResponse = await queryTable('report_row', {
            filters: { reportId: String(reportId) },
            limit: 10000
        });
        const allVirtualList = Array.isArray(virtualRowsResponse) ? virtualRowsResponse : (virtualRowsResponse?.rows || []);
        // isDeleted 값이 false, 0, '0', null, undefined 인 경우 정상 데이터로 간주 (삭제되지 않음)
        const virtualList = allVirtualList.filter((r: any) => !r.isDeleted || r.isDeleted === '0' || r.isDeleted === 0 || r.isDeleted === false);
        const virtualCount = virtualList.length;

        // 4. 물리적 테이블 행 조회
        let physicalRows: any[] = [];
        let physicalCount = 0;
        try {
            const pRows = await queryTable(report.tableName, { limit: 10000 });
            physicalRows = Array.isArray(pRows) ? pRows : (pRows?.rows || []);
            physicalCount = physicalRows.length;
        } catch (err) {
            return { status: 'error' as const, message: '물리적 테이블 조회 실패', virtualCount };
        }

        // 5. 데이터ID 비교 (컬럼 스키마에서 autoGenerated 컬럼 찾기)
        let idColName: string | null = null;
        try {
            const columns = JSON.parse(report.columns);
            const idCol = columns.find((c: any) => c.isAutoGenerated);
            if (idCol) idColName = idCol.name;
        } catch (e) {}

        let missingInPhysical: string[] = [];
        let missingInVirtual: string[] = [];

        if (idColName) {
            // 가상 테이블의 데이터ID 목록
            const virtualIds = new Set<string>();
            virtualList.forEach((row: any) => {
                try {
                    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                    if (data?.[idColName!]) virtualIds.add(String(data[idColName!]));
                } catch (e) {}
            });

            // 물리적 테이블의 데이터ID 목록
            const physicalIds = new Set<string>();
            physicalRows.forEach((row: any) => {
                if (row[idColName!]) physicalIds.add(String(row[idColName!]));
            });

            // 차이 계산
            virtualIds.forEach(id => { if (!physicalIds.has(id)) missingInPhysical.push(id); });
            physicalIds.forEach(id => { if (!virtualIds.has(id)) missingInVirtual.push(id); });
        }

        const isSynced = virtualCount === physicalCount && missingInPhysical.length === 0 && missingInVirtual.length === 0;

        return {
            status: isSynced ? 'synced' as const : 'mismatch' as const,
            virtualCount,
            physicalCount,
            diff: physicalCount - virtualCount,
            missingInPhysical: missingInPhysical.slice(0, 10),
            missingInVirtual: missingInVirtual.slice(0, 10),
            tableName: report.tableName
        };
    } catch (err: any) {
        console.error('checkSyncStatusAction error:', err);
        return { status: 'error' as const, message: err.message || '동기화 상태 확인 실패' };
    }
}

/**
 * 물리적 테이블을 기준으로 가상 테이블(report_row)의 데이터를 강제로 정합합니다.
 * 물리에 없는 데이터는 가상에서 삭제하고, 가상에 없는 데이터는 새로 가져옵니다.
 */
export async function repairVirtualTableAction(reportId: string) {
    try {
        const session = await getSessionAction();
        if (!session || (session.role !== 'ADMIN' && session.role !== 'EDITOR')) {
            return { success: false, error: '접근 권한이 없습니다.' };
        }

        const sReportId = String(reportId);
        // 1. 보고서 정보 로드
        const reportsResult: any = await queryTable('report', { filters: { id: sReportId } });
        const reports = reportsResult?.rows || reportsResult || [];
        const report = reports[0];
        if (!report || !report.tableName) return { success: false, message: '보고서 또는 물리 테이블 정보를 찾을 수 없습니다.' };

        let columns: any[] = [];
        try {
            columns = typeof report.columns === 'string' ? JSON.parse(report.columns) : (report.columns || []);
        } catch (e) {
            return { success: false, message: '보고서 컬럼 설정 형식이 올바르지 않습니다.' };
        }

        // 데이터 구분을 위한 기준 키 식별 (단순화: '데이터ID' 컬럼만 사용)
        const idCol = columns.find((c: any) => c.name === '데이터ID');
        const idColName = idCol?.name;
        
        if (!idColName) return { success: false, message: '기준이 될 "데이터ID" 컬럼을 찾을 수 없습니다.' };

        if (!idColName) return { success: false, message: '기준이 될 데이터ID(AutoGenerated) 컬럼을 찾을 수 없습니다.' };

        // 2. 데이터 통합 로드 (안정적인 병렬 호출)
        const [pRowsResponse, vRowsResponse]: any[] = await Promise.all([
            queryTable(report.tableName, { limit: 10000 }).catch(() => ({ rows: [] })),
            queryTable('report_row', { filters: { reportId: sReportId }, limit: 10000 }).catch(() => ({ rows: [] }))
        ]);
        
        const physicalRows = Array.isArray(pRowsResponse) ? pRowsResponse : (pRowsResponse?.rows || []);
        const virtualRows = Array.isArray(vRowsResponse) ? vRowsResponse : (vRowsResponse?.rows || []);

        // 3. 맵핑 생성 (ID 기준)
        const physicalMap = new Map();
        physicalRows.forEach((row: any) => {
            const pk = row[idColName];
            if (pk !== undefined && pk !== null) physicalMap.set(String(pk), row);
        });

        const virtualMap = new Map();
        virtualRows.forEach((row: any) => {
            try {
                const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                const pk = data?.[idColName];
                if (pk !== undefined && pk !== null) virtualMap.set(String(pk), { rowId: row.id, data });
            } catch (e) {}
        });

        const toInsert: any[] = [];
        const toUpdateItems: any[] = [];
        const toDeleteIds: string[] = [];

        // 4. 동기화 데이터 분류
        const matchedVirtualRowIds = new Set<string>();

        for (const [pId, pData] of physicalMap.entries()) {
            const vEntry = virtualMap.get(pId);
            if (!vEntry) {
                toInsert.push(pData);
            } else {
                matchedVirtualRowIds.add(vEntry.rowId);
                if (JSON.stringify(vEntry.data) !== JSON.stringify(pData)) {
                    toUpdateItems.push({ id: vEntry.rowId, data: JSON.stringify(pData) });
                }
            }
        }

        // 매칭되지 않은 모든 가상 행(중복 포함)을 삭제 대상으로 추가
        virtualRows.forEach((row: any) => {
            if (!matchedVirtualRowIds.has(row.id)) {
                toDeleteIds.push(row.id);
            }
        });

        let successCount = 0;
        let failCount = 0;

        // 5. 정합 실행 (순차적 처리로 타임아웃 방지)
        
        // A. 삽입 작업
        if (toInsert.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < toInsert.length; i += batchSize) {
                const chunk = toInsert.slice(i, i + batchSize).map(pData => ({
                    id: generateNumericId(),
                    reportId: sReportId,
                    data: JSON.stringify(pData),
                    isDeleted: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));
                try {
                    await insertRows('report_row', chunk);
                    successCount += chunk.length;
                } catch (e) { 
                    console.error("DEBUG_INSERT_ERROR:", e);
                    failCount += chunk.length; 
                }
            }
        }

        // B. 업데이트 작업 (순차)
        for (const item of toUpdateItems) {
            try {
                await updateRows('report_row', {
                    data: item.data,
                    isDeleted: 0,
                    updatedAt: new Date().toISOString()
                }, { filters: { id: String(item.id) } });
                successCount++;
            } catch (e) { failCount++; }
        }

        // C. 삭제 작업 (순차)
        for (const id of toDeleteIds) {
            try {
                await deleteRows('report_row', { filters: { id: String(id) } });
                successCount++;
            } catch (e) { failCount++; }
        }

        // 6. 이력 기록
        try {
            await ensureHistoryTable();
            await insertRows('report_row_history', [{
                id: generateNumericId(),
                rowId: 'SYSTEM_REPAIR',
                oldData: JSON.stringify({ reportId: sReportId, beforeCount: virtualRows.length }),
                newData: JSON.stringify({ added: toInsert.length, deleted: toDeleteIds.length, updated: toUpdateItems.length, successCount, failCount }),
                changeType: 'UPDATE',
                changedById: session.id,
                changedAt: new Date().toISOString()
            }]);
        } catch (hErr) {}

        revalidatePath(`/report/${sReportId}`);
        revalidatePath('/');
        
        return { 
            success: true, 
            message: `데이터 정합이 완료되었습니다. (처리: ${successCount}건, 실패: ${failCount}건)`
        };
    } catch (err: any) {
        console.error('repairVirtualTableAction error:', err);
        return { success: false, message: err?.message || '서버 내부 오류가 발생했습니다.' };
    }
}
