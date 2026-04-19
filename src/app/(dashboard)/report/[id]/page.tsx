import { getSessionAction } from '@/app/actions/auth';
import { queryTable, getTableSchema } from '@/egdesk-helpers';
import { queryTransactions, queryCardTransactions } from '@/financehub-helpers';

/**
 * 컬럼명을 기반으로 적절한 필드 타입을 추론합니다.
 */
function inferColumnType(name: string): string {
  const lowercase = name.toLowerCase();
  if (lowercase.includes('date') || lowercase.includes('at') || lowercase.includes('time')) return 'date';
  if (lowercase.includes('amount') || lowercase.includes('price') || lowercase.includes('cost') || lowercase.includes('fee')) return 'currency';
  if (lowercase.includes('count') || lowercase.includes('quantity') || (lowercase.includes('id') && lowercase !== 'id' && !lowercase.includes('uuid'))) return 'number';
  if (lowercase.startsWith('is') || lowercase.startsWith('has') || lowercase === 'active' || lowercase === 'deleted') return 'boolean';
  if (lowercase.includes('memo') || lowercase.includes('description') || lowercase.includes('data')) return 'textarea';
  if (lowercase.includes('email')) return 'email';
  if (lowercase.includes('phone') || lowercase.includes('tel') || lowercase.includes('mobile')) return 'phone';
  return 'string';
}
import { ReportDetailClient } from '@/components/ReportDetailClient';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;

  // 실제 세션 사용자 정보 가져오기
  const user = await getSessionAction();

  let report: any;
  let rows: any[] = [];
  let columns: any[] = [];

  if (id === 'test-report-id') {
    const { TABLES } = await import('@/egdesk.config');
    const tableDef = TABLES.table1;
    const physicalSchema = await getTableSchema(tableDef.name).catch(() => []);
    
    report = {
      id: 'test-report-id',
      name: tableDef.displayName,
      sheetName: 'Main Database',
      columns: JSON.stringify(tableDef.columns.map((c: string) => {
        const pCol = physicalSchema.find((ps: any) => ps.name === c);
        let type = inferColumnType(c);
        if (pCol) {
          if (pCol.type === 'REAL' || pCol.type === 'INTEGER') type = 'number';
          if (pCol.type === 'DATE') type = 'date';
        }
        return { name: c, type };
      })),
      ownerId: 'system',
    };
    const rowsData = await queryTable(tableDef.name, { limit: 100 });
    rows = rowsData.map((r: any, idx: number) => ({ ...r, id: String(idx), updatedAt: new Date().toISOString() }));
    columns = JSON.parse(report.columns);
  } else if (id === 'finance-hub-card-table' || id === 'finance-hub-bank-table') {
    const isCard = id === 'finance-hub-card-table';
    
    // 1. 필요한 API 함수 임포트 및 호출
    const { 
        queryCardTransactions, 
        queryTransactions, 
        listAccounts,
        listBanks
    } = await import('@/financehub-helpers');

    const txData = isCard 
        ? await queryCardTransactions({ limit: 1000, orderBy: 'date', orderDir: 'desc' })
        : await queryTransactions({ limit: 1000, orderBy: 'date', orderDir: 'desc' });
    
    const transactions = Array.isArray(txData) ? txData : (txData?.transactions || []);

    // 2. 은행/계좌 정보 조인 및 데이터 정규화
    let joinedTransactions = transactions;
    let extraColumns: any[] = [];
    
    try {
        const [accountData, bankData] = await Promise.all([
            listAccounts(),
            listBanks()
        ]);
        
        const accounts = Array.isArray(accountData) ? accountData : (accountData.accounts || []);
        const accountMap = new Map(accounts.map((a: any) => [a.id, a]));
        
        const banks = bankData.banks || [];
        const bankMap = new Map(banks.map((b: any) => [b.id, b.nameKo || b.name]));
        
        joinedTransactions = transactions.map((t: any) => {
            const acc = accountMap.get(t.accountId);
            
            // 날짜 정규화 (YYYYMMDD -> YYYY-MM-DD)
            let displayDate = t.date;
            if (t.date && t.date.length === 8 && !t.date.includes('-')) {
                displayDate = `${t.date.substring(0, 4)}-${t.date.substring(4, 6)}-${t.date.substring(6, 8)}`;
            }

            return {
                ...t,
                date: displayDate, // 원본 date 필드 덮어쓰기 (정렬/표시 일관성)
                _bankName: bankMap.get(t.bankId) || t.bankId,
                accountNumber: acc?.accountNumber || '',
                accountName: acc?.accountName || '',
                customerName: acc?.customerName || '',
            };
        });
        
        if (!isCard && joinedTransactions.length > 0) {
            extraColumns = [
                { name: '_bankName', type: 'string' },
                { name: 'accountNumber', type: 'string' },
                { name: 'accountName', type: 'string' }
            ];
        }
    } catch (err) {
        console.error('Failed to join finance metadata:', err);
    }

    // 3. 결과 행이 있을 경우 첫 번째 행의 키를 기반으로 물리 컬럼 동적 생성
    const sampleRow = joinedTransactions.length > 0 ? joinedTransactions[0] : {};
    
    // UI에서 숨길 필드 (내부 ID 등) 및 이미 추가된 필드 제외
    const hiddenFields = ['id', 'accountId', 'transactionId', 'updatedAt', 'createdAt', 'accountNumber', 'accountName', '_bankName'];
    const physicalKeys = Object.keys(sampleRow).filter(k => !hiddenFields.includes(k));
    
    // 거래일자와 거래내용을 우선 배치
    const priorityKeys = ['date', 'description', 'withdrawal', 'deposit', 'balance'];
    const remainingKeys = physicalKeys.filter(k => !priorityKeys.includes(k));

    const financeColumns = [
        ...extraColumns,
        ...priorityKeys.map(key => ({
            name: key,
            type: (key === 'amount' || key === 'foreignAmountUsd' || key === 'withdrawal' || key === 'deposit' || key === 'balance' || key === 'availableBalance') 
                ? 'currency' 
                : inferColumnType(key)
        })),
        ...remainingKeys.map(key => ({
            name: key,
            type: (key === 'amount' || key === 'foreignAmountUsd' || key === 'withdrawal' || key === 'deposit' || key === 'balance' || key === 'availableBalance') 
                ? 'currency' 
                : inferColumnType(key)
        }))
    ];

    report = {
      id: id,
      name: isCard ? '신용카드 거래 내역 (FinanceHub)' : '은행 계좌 거래 내역 (FinanceHub)',
      sheetName: isCard ? 'FinanceHub Card' : 'FinanceHub Bank',
      columns: JSON.stringify(financeColumns),
      ownerId: 'system',
      isReadOnly: true,
    };

    rows = joinedTransactions.map((t: any, idx: number) => ({
      ...t,
      id: t.id || `tx-${idx}`,
      updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
    }));

    columns = financeColumns;
    
    console.log(`>>> [SERVER DEBUG] FinanceHub ${isCard?'Card':'Bank'} count:`, rows.length);
  } else {
    const { getTableByName } = await import('@/egdesk.config');
    const systemTableDef = getTableByName(id);

    if (systemTableDef) {
      const physicalSchema = await getTableSchema(systemTableDef.name).catch(() => []);
      
      report = {
        id: systemTableDef.name,
        name: systemTableDef.displayName,
        sheetName: 'System Table',
        columns: JSON.stringify(systemTableDef.columns.map((c: string) => {
           const pCol = physicalSchema.find((ps: any) => ps.name === c);
           let type = inferColumnType(c);
           if (pCol) {
             if (pCol.type === 'REAL' || pCol.type === 'INTEGER') {
               type = (c.startsWith('is') || c.startsWith('has') || c === 'active') ? 'boolean' : 'number';
             }
             if (pCol.type === 'DATE') type = 'date';
           }
           return { name: c, type };
        })),
        ownerId: 'system',
        isReadOnly: true,
      };
      
      try {
        const rowsData = await queryTable(systemTableDef.name, { limit: 1000 });
        rows = rowsData.map((r: any, idx: number) => ({
           ...r, 
           id: String(r.id || idx), 
           updatedAt: r.updatedAt || new Date().toISOString() 
        }));
      } catch (err) {
        console.error(`Failed to load system table ${systemTableDef.name}`, err);
        rows = [];
      }
      columns = JSON.parse(report.columns);
    } else {
      const reports = await queryTable('report', { filters: { id } });
      report = reports[0];

      if (!report) {
        // 혹시 가상 보고서가 아니라 시스템에 존재하는 원시 물리 테이블명으로 직접 접근한 경우인지 확인합니다.
        const rawPhysicalSchema = await getTableSchema(id).catch(() => []);
        if (rawPhysicalSchema && rawPhysicalSchema.length > 0) {
            const { listTables } = await import('@/egdesk-helpers');
            const tablesRes = await listTables().catch(() => ({ tables: [] }));
            const matchedTable = tablesRes?.tables?.find((t: any) => t.tableName === id);
            const displayName = matchedTable?.displayName || id;

            report = {
                id: id,
                name: displayName,
                sheetName: 'Raw Physical Table',
                columns: JSON.stringify(rawPhysicalSchema.map((ps: any) => {
                    let type = inferColumnType(ps.name);
                    if (ps.type === 'REAL' || ps.type === 'INTEGER') {
                        type = (ps.name.toLowerCase().startsWith('is') || ps.name.toLowerCase().startsWith('has') || ps.name.toLowerCase() === 'active') ? 'boolean' : 'number';
                    }
                    if (ps.type === 'DATE') type = 'date';
                    return { name: ps.name, type };
                })),
                ownerId: 'system',
                isReadOnly: true,
            };

            try {
                const rowsData = await queryTable(id, { limit: 1000 });
                rows = rowsData.map((r: any, idx: number) => ({
                    ...r,
                    id: String(r.id || r.did || idx),
                    updatedAt: r.updatedAt || new Date().toISOString()
                }));
            } catch (err) {
                console.error(`Failed to load raw physical table ${id}:`, err);
                rows = [];
            }
            columns = JSON.parse(report.columns);
        } else {
            return <div className="p-20 text-center text-gray-500 font-bold">보고서를 찾을 수 없거나 삭제되었습니다.</div>;
        }
      } else {
          const physicalSchema = report.tableName ? await getTableSchema(report.tableName).catch(() => []) : [];
      const columnsData = JSON.parse(report.columns);
      
      columns = columnsData.map((c: any) => {
        let colObj = typeof c === 'string' ? { name: c, type: inferColumnType(c) } : c;
        // 물리적 스키마와 비교하여 타입 보정 (예: DB가 REAL인데 메타데이터가 string인 경우)
        const pCol = physicalSchema.find((ps: any) => ps.name === colObj.name);
        if (pCol) {
          if (pCol.type === 'REAL' && (colObj.type === 'string' || colObj.type === 'TEXT')) colObj.type = 'number';
          if (pCol.type === 'INTEGER' && (colObj.type === 'string' || colObj.type === 'TEXT')) colObj.type = 'number';
          if (pCol.type === 'DATE' && (colObj.type === 'string' || colObj.type === 'TEXT')) colObj.type = 'date';
        }
        return colObj;
      });

      if (report.tableName) {
          // 물리적 테이블이 있는 경우 해당 테이블에서 직접 조회
          try {
              const rowsData = await queryTable(report.tableName, { limit: 1000 });
              const virtualRows = await queryTable('report_row', { filters: { reportId: id }, limit: 10000 });
              
              const idColDef = columnsData.find((c: any) => c.isAutoGenerated || c.name === '데이터ID');
              const idColName = idColDef ? idColDef.name : null;
              
              const usedVirtualIds = new Set();

              rows = rowsData.map((r: any, idx: number) => {
                  let uuid = r.id || r.did || `row-${idx}`;
                  let updatedAt = r.updatedAt || report.createdAt;
                  let isDeleted = false;
                  let creatorId = 'system';
                  
                  // 1. Try to find by unique exact ID
                  let vr = virtualRows.find((v: any) => {
                      if (usedVirtualIds.has(v.id)) return false;
                      try {
                          const d = JSON.parse(v.data);
                          if (idColName && d[idColName] && r[idColName] && String(d[idColName]) === String(r[idColName])) return true;
                          if (d.id && r.id && String(d.id) === String(r.id)) return true;
                          return false;
                      } catch(e) { return false; }
                  });
                  
                  // 2. If no unique ID could match, try to match by all row fields (content match)
                  if (!vr) {
                      vr = virtualRows.find((v: any) => {
                          if (usedVirtualIds.has(v.id)) return false;
                          try {
                              const d = JSON.parse(v.data);
                              // Match every column (excluding dynamically added ones)
                              const matches = columnsData.every((c: any) => {
                                  if (c.isAutoGenerated) return true;
                                  return String(d[c.name] || '') === String(r[c.name] || '');
                              });
                              return matches;
                          } catch(e) { return false; }
                      });
                  }

                  if (vr) {
                      usedVirtualIds.add(vr.id);
                      uuid = vr.id;
                      updatedAt = vr.updatedAt;
                      isDeleted = (vr.isDeleted === 1 || String(vr.isDeleted) === '1' || vr.isDeleted === true);
                      creatorId = vr.creatorId;
                  }

                  return {
                      ...r,
                      id: uuid,
                      _physicalId: r.id, 
                      updatedAt,
                      isDeleted,
                      creatorId
                  };
              });

              // Append soft-deleted virtual rows that have been removed from the physical table
              virtualRows.forEach((v: any) => {
                  if (!usedVirtualIds.has(v.id)) {
                      const isDeleted = (v.isDeleted === 1 || String(v.isDeleted) === '1' || v.isDeleted === true);
                      if (isDeleted) {
                          try {
                              const d = JSON.parse(v.data);
                              rows.push({
                                  ...d,
                                  id: v.id,
                                  updatedAt: v.updatedAt,
                                  isDeleted: true,
                                  creatorId: v.creatorId
                              });
                          } catch(e) {}
                      }
                  }
              });
          } catch (err) {
              console.error(`Physical table ${report.tableName} query failed:`, err);
              // Fallback to report_row if physical table fails
              const rowsData = await queryTable('report_row', {
                  filters: { reportId: id },
                  orderBy: 'updatedAt',
                  orderDirection: 'DESC'
              });
              rows = rowsData.map((r: any) => ({
                  ...JSON.parse(r.data),
                  id: r.id,
                  updatedAt: r.updatedAt,
                  isDeleted: r.isDeleted === 1,
                  creatorId: r.creatorId
              }));
          }
      } else {
          // 기존 가상 테이블(report_row) 방식 유지
          const rowsData = await queryTable('report_row', {
            filters: { reportId: id },
            orderBy: 'updatedAt',
            orderDirection: 'DESC'
          });

          rows = rowsData.map((r: any) => ({
            ...JSON.parse(r.data),
            id: r.id,
            updatedAt: r.updatedAt,
            isDeleted: r.isDeleted === 1,
            creatorId: r.creatorId
          }));
      }
      }
    }
  }

  const isOwner = report.ownerId === user?.id || report.ownerId === 'system';
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = (isOwner || isAdmin || user?.role === 'EDITOR') && !report.isReadOnly;

  // 일반 사용자(VIEWER)인 경우 전용 입력 페이지로 리다이렉트
  if (user?.role === 'VIEWER' && !isOwner) {
    redirect(`/report/${id}/input`);
  }

  return (
    <div className="px-8 pt-6 pb-12 font-[family-name:var(--font-geist-sans)]">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white px-4 py-2 border rounded-full shadow-sm text-sm font-medium text-gray-700">
            <User size={18} className="text-blue-500" />
            <span>{user?.username || 'GUEST'} ({user?.role || 'NONE'})</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <ReportDetailClient
        id={id}
        report={report}
        user={user}
        columns={columns}
        rows={rows}
        isOwner={isOwner && !report.isReadOnly}
        isAdmin={isAdmin && !report.isReadOnly}
        canEdit={canEdit}
      />
    </div>
  );
}
