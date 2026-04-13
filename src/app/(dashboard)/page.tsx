import React from 'react';
import { getSessionAction } from '@/app/actions';
import DeleteReportButton from '@/components/DeleteReportButton';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  LayoutDashboard, 
  User, 
  Trash2, 
  ExternalLink, 
  Plus, 
  ShieldCheck, 
  Wallet, 
  Database,
  BarChart3,
  Sparkles,
  ArrowRight,
  Star,
  Compass
} from 'lucide-react';
import NewTableSection from '@/components/NewTableSection';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { queryTable, aggregateTable, listTables } from '@/egdesk-helpers';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import PageHeader from '@/components/PageHeader';
import DashboardHubClient from './DashboardHubClient';

export default async function DashboardPage() {
  // 실제 세션 사용자 정보 가져오기
  const user = await getSessionAction();

  if (!user) {
    redirect('/login');
  }

  // 1. 물리적 시스템 테이블 목록 가져오기
  let systemTables: any[] = [];
  try {
    const res = await listTables();
    systemTables = res?.tables || [];
  } catch (err) {
    console.error('Failed to list system tables:', err);
  }

  // 2. 권한에 따른 보고서 필터링 (가상 테이블)
  const rawAllReports = await queryTable('report', {
    limit: 1000,
    orderBy: 'createdAt',
    orderDirection: 'DESC'
  });
  let allReports = rawAllReports.filter((r: any) => String(r.isDeleted) === '0');

  // VIEWER 필터링: 본인 소유이거나 접근 권한이 부여된 보고서만
  if (user.role === 'VIEWER') {
    const accessList = await queryTable('report_access', { filters: { userId: String(user.id) } });
    const authorizedIds = new Set(accessList.map((a: any) => a.reportId));
    allReports = allReports.filter((r: any) => r.ownerId === user.id || authorizedIds.has(r.id));
  }

  // 보고서별 데이터 행 개수 추가
  let virtualReports = await Promise.all(allReports.map(async (r: any) => {
    let count: number | string = 0;
    if (r.id === 'test-report-id') {
      count = 133;
    } else if (r.tableName) {
      try {
        const aggr = await aggregateTable(r.tableName, 'id', 'COUNT');
        count = Number(aggr?.value ?? aggr) || 0; 
      } catch (err) {}
    } else {
      try {
        const aggr = await aggregateTable('report_row', 'id', 'COUNT', {
          filters: { reportId: String(r.id), isDeleted: '0' }
        });
        count = Number(aggr?.value ?? aggr) || 0;
      } catch (err) { count = 0; }
    }
    return {
      ...r,
      _count: { rows: count },
      isVirtualReport: true,
      isDirectTable: r.id === 'test-report-id'
    };
  }));

  // 관리자/에디터 권한 판별
  const isAdminOrEditor = user.role === 'ADMIN' || user.role === 'EDITOR';
  let reports: any[] = [];

  // FinanceHub 테이블 추가 (항상 상단)
  if (isAdminOrEditor) {
    reports.push({
      id: 'finance-hub-table',
      name: '금융거래 통합 내역 (FinanceHub)',
      sheetName: 'FinanceHub External',
      _count: { rows: '연동 중' },
      isFinanceTable: true,
      isSystemTable: true,
      isReadOnly: true
    });
  }

  // 1. 물리적 시스템 테이블 목록 가져오기 및 2. 가상 리포트 필터링 로직이 위쪽에 있습니다.
  // ... 생략 ...

  // 가상 리포트 중에서 사용 중인 물리적 테이블(tableName) 리스트 추출
  const mappedTableNames = new Set(virtualReports.map(r => r.tableName?.toLowerCase()).filter(Boolean));

  // 시스템 물리 테이블 통합 (어드민/에디터만)
  if (isAdminOrEditor) {
    const mappedSystemTables = systemTables
      .filter((t: any) => !mappedTableNames.has(t.tableName?.toLowerCase())) // 이미 가상 보고서와 연결된 물리 테이블은 중복 방지를 위해 제외
      .map((t: any) => ({
        id: t.tableName,
        name: t.displayName || t.tableName,
        sheetName: 'System Table',
        _count: { rows: t.rowCount !== null && t.rowCount !== undefined ? t.rowCount : 'N/A' },
        isSystemTable: true,
        ownerId: 'system',
        isReadOnly: t.tableName === 'user' ? false : true // user 테이블은 관리 가능하도록 예외 처리
      }));
    reports = [...reports, ...mappedSystemTables];
  }

  // 가상 리포트 병합
  reports = [...reports, ...virtualReports];

  const isStaff = user.role === 'VIEWER';

  return (
    <DashboardHubClient 
      user={user} 
      isStaff={isStaff} 
      reports={reports} 
    />
  );
}
