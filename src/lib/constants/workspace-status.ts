/**
 * workspace_item.status 컬럼에 사용되는 상태 상수 정의
 *
 * 각 상태의 의미:
 * - PENDING    : 업로드 직후 AI 분석 대기 중
 * - UNRESOLVED : AI 분류 실패 — 매칭 테이블이 없음
 * - BLOCKED    : 가드레일 BLOCK 정책에 의해 저장 차단됨
 * - COMPLETED  : 정상적으로 DB에 저장 완료
 * - DELETED    : 사용자가 삭제 처리함
 */
export const WORKSPACE_STATUS = {
  PENDING:    'pending',
  UNRESOLVED: 'unresolved',
  BLOCKED:    'blocked',
  COMPLETED:  'completed',
  DELETED:    'deleted',
} as const;

export type WorkspaceStatus = typeof WORKSPACE_STATUS[keyof typeof WORKSPACE_STATUS];

/**
 * 특정 상태가 "처리 필요"(액션이 남은) 상태인지 확인합니다.
 */
export function isActionRequired(status: WorkspaceStatus | string): boolean {
  return status === WORKSPACE_STATUS.PENDING
    || status === WORKSPACE_STATUS.UNRESOLVED
    || status === WORKSPACE_STATUS.BLOCKED;
}

/**
 * 특정 상태가 "최종 확정"(더 이상 편집 불가) 상태인지 확인합니다.
 */
export function isFinalStatus(status: WorkspaceStatus | string): boolean {
  return status === WORKSPACE_STATUS.COMPLETED
    || status === WORKSPACE_STATUS.DELETED;
}
