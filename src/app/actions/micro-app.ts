'use server';

import { revalidatePath } from 'next/cache';
import { 
  queryTable, 
  createTable, 
  insertRows, 
  updateRows, 
  deleteRows, 
  deleteTable,
  getTableSchema, 
  executeSQL 
} from '@/egdesk-helpers';
import { generateId } from './shared';
import { getSessionAction } from './auth';

const PROJECT_TABLE = 'micro_app_projects';

/**
 * 마이크로 앱 프로젝트 테이블이 없는 경우 생성합니다.
 */
async function ensureProjectTable() {
  // 1. micro_app_config 테이블 독립적 관리
  try {
    const configSchema = await getTableSchema('micro_app_config');
    const hasProjectId = (configSchema as any[]).some((c: any) => c.name === 'projectId');
    if (!hasProjectId) {
      await deleteTable('micro_app_config');
      throw new Error('recreate');
    }
  } catch (err) {
    try {
      await createTable('Micro App Config', [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'projectId', type: 'TEXT', notNull: true },
        { name: 'templateId', type: 'TEXT' },
        { name: 'sourceTableId', type: 'TEXT' },
        { name: 'mappingConfig', type: 'TEXT' },
        { name: 'uiSettings', type: 'TEXT' },
        { name: 'rbacRoles', type: 'TEXT' },
        { name: 'createdBy', type: 'TEXT' },
        { name: 'createdAt', type: 'TEXT' },
        { name: 'updatedAt', type: 'TEXT' }
      ], { tableName: 'micro_app_config', uniqueKeyColumns: ['id'] });
    } catch (e: any) {
      if (e.message?.includes('UNIQUE') || e.message?.includes('exists')) {
        try {
          await deleteTable('micro_app_config');
          await createTable('Micro App Config', [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'projectId', type: 'TEXT', notNull: true },
            { name: 'templateId', type: 'TEXT' },
            { name: 'sourceTableId', type: 'TEXT' },
            { name: 'mappingConfig', type: 'TEXT' },
            { name: 'uiSettings', type: 'TEXT' },
            { name: 'rbacRoles', type: 'TEXT' },
            { name: 'createdBy', type: 'TEXT' },
            { name: 'createdAt', type: 'TEXT' },
            { name: 'updatedAt', type: 'TEXT' }
          ], { tableName: 'micro_app_config', uniqueKeyColumns: ['id'] });
        } catch (r) {}
      }
    }
  }

  // 2. micro_app_projects 테이블 독립적 관리
  try {
    await queryTable(PROJECT_TABLE, { limit: 1 });
    const cols = ['tags', 'templateId', 'mappingConfig', 'uiSettings'];
    for (const col of cols) {
      try { await executeSQL(`ALTER TABLE ${PROJECT_TABLE} ADD COLUMN ${col} TEXT`); } catch (err) {}
    }
  } catch (e: any) {
    try {
      await createTable('Micro App Projects', [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'name', type: 'TEXT', notNull: true },
        { name: 'description', type: 'TEXT' },
        { name: 'sources', type: 'TEXT', notNull: true },
        { name: 'tags', type: 'TEXT' },
        { name: 'templateId', type: 'TEXT' },
        { name: 'mappingConfig', type: 'TEXT' },
        { name: 'uiSettings', type: 'TEXT' },
        { name: 'status', type: 'TEXT', notNull: true },
        { name: 'createdBy', type: 'TEXT', notNull: true },
        { name: 'createdAt', type: 'TEXT', notNull: true },
        { name: 'updatedAt', type: 'TEXT', notNull: true }
      ], { tableName: PROJECT_TABLE, uniqueKeyColumns: ['id'] });
    } catch (e2: any) {
      if (e2.message?.includes('UNIQUE') || e2.message?.includes('exists')) {
        try {
          await deleteTable(PROJECT_TABLE);
          await createTable('Micro App Projects', [
            { name: 'id', type: 'TEXT', notNull: true },
            { name: 'name', type: 'TEXT', notNull: true },
            { name: 'description', type: 'TEXT' },
            { name: 'sources', type: 'TEXT', notNull: true },
            { name: 'tags', type: 'TEXT' },
            { name: 'templateId', type: 'TEXT' },
            { name: 'mappingConfig', type: 'TEXT' },
            { name: 'uiSettings', type: 'TEXT' },
            { name: 'status', type: 'TEXT', notNull: true },
            { name: 'createdBy', type: 'TEXT', notNull: true },
            { name: 'createdAt', type: 'TEXT', notNull: true },
            { name: 'updatedAt', type: 'TEXT', notNull: true }
          ], { tableName: PROJECT_TABLE, uniqueKeyColumns: ['id'] });
        } catch (r) {}
      }
    }
  }
}


/**
 * 새로운 마이크로 앱 프로젝트(초안)를 생성합니다.
 */
export async function createMicroAppProjectAction(name: string) {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  await ensureProjectTable();

  const id = generateId();
  const now = new Date().toISOString();

  const project = {
    id,
    name,
    description: '',
    sources: JSON.stringify([]),
    tags: JSON.stringify([]),
    templateId: 'custom-app',
    mappingConfig: JSON.stringify([]),
    uiSettings: JSON.stringify({ theme: 'blue' }),
    status: 'DRAFT',
    createdBy: user.id,
    createdAt: now,
    updatedAt: now
  };

  await insertRows(PROJECT_TABLE, [project]);
  revalidatePath('/publishing');
  return { success: true, id };
}

/**
 * 프로젝트 목록을 조회합니다.
 */
export async function listMicroAppProjectsAction() {
  const user = await getSessionAction();
  if (!user) return [];

  await ensureProjectTable();

  const results = await queryTable(PROJECT_TABLE, {
    orderBy: 'updatedAt',
    orderDirection: 'DESC'
  });

  return (results || []).map((p: any) => ({
    ...p,
    sources: JSON.parse(p.sources || '[]'),
    tags: JSON.parse(p.tags || '[]'),
    mappingConfig: p.mappingConfig ? JSON.parse(p.mappingConfig) : [],
    uiSettings: p.uiSettings ? JSON.parse(p.uiSettings) : { theme: 'blue' }
  }));
}

/**
 * 특정 프로젝트의 상세 정보를 조회합니다.
 */
export async function getMicroAppProjectAction(id: string) {
  await ensureProjectTable();
  const results = await queryTable(PROJECT_TABLE, {
    filters: { id }
  });

  if (!results || results.length === 0) return null;
  const p = results[0];
  return {
    ...p,
    sources: JSON.parse(p.sources || '[]'),
    tags: JSON.parse(p.tags || '[]'),
    mappingConfig: p.mappingConfig ? JSON.parse(p.mappingConfig) : [],
    uiSettings: p.uiSettings ? JSON.parse(p.uiSettings) : { theme: 'blue' }
  };
}

/**
 * 프로젝트에 여러 데이터 소스(테이블)를 한 번에 추가합니다.
 */
export async function addSourcesToProjectAction(appId: string, newSources: Array<{ id: string, name: string }>) {
  const project = await getMicroAppProjectAction(appId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const sources = [...project.sources];
  
  for (const source of newSources) {
    if (!sources.some(s => s.id === source.id)) {
      sources.push(source);
    }
  }
  
  await updateRows(PROJECT_TABLE, { sources: JSON.stringify(sources), updatedAt: new Date().toISOString() }, { filters: { id: appId } });
  revalidatePath(`/publishing/edit/${appId}`);
  return { success: true };
}

/**
 * 프로젝트에 데이터 소스(테이블)를 추가합니다. (단일 처리 - 하위 호환용)
 */
export async function addSourceToProjectAction(appId: string, source: { id: string, name: string }) {
  return addSourcesToProjectAction(appId, [source]);
}

/**
 * 프로젝트에서 데이터 소스를 제거합니다.
 */
export async function removeSourceFromProjectAction(appId: string, sourceId: string) {
  const project = await getMicroAppProjectAction(appId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  const sources = project.sources.filter((s: any) => s.id !== sourceId);
  
  await updateRows(PROJECT_TABLE, { sources: JSON.stringify(sources), updatedAt: new Date().toISOString() }, { filters: { id: appId } });
  revalidatePath(`/publishing/edit/${appId}`);
  return { success: true };
}

/**
 * 프로젝트를 삭제합니다.
 */
export async function deleteMicroAppProjectAction(id: string) {
  await ensureProjectTable();
  await deleteRows(PROJECT_TABLE, { filters: { id } });
  revalidatePath('/publishing');
  return { success: true };
}

/**
 * 프로젝트 정보를 업데이트합니다.
 */
export async function updateMicroAppProjectAction(id: string, data: { 
  name?: string, 
  description?: string, 
  tags?: string[],
  templateId?: string,
  mappingConfig?: any,
  uiSettings?: any
}) {
  await ensureProjectTable();
  const updateData: any = { ...data, updatedAt: new Date().toISOString() };
  if (data.tags) updateData.tags = JSON.stringify(data.tags);
  if (data.mappingConfig) updateData.mappingConfig = JSON.stringify(data.mappingConfig);
  if (data.uiSettings) updateData.uiSettings = JSON.stringify(data.uiSettings);
  
  try {
    console.log(`[DB 업데이트 시도] 프로젝트 ID: ${id}, 데이터:`, JSON.stringify(updateData));
    await updateRows(PROJECT_TABLE, updateData, { filters: { id } });
    
    revalidatePath(`/publishing/edit/${id}`);
    revalidatePath('/publishing');
    return { success: true };
  } catch (error: any) {
    console.error('[DB 업데이트 오류]:', error);
    return { success: false, error: error.message || '데이터베이스 저장 중 오류가 발생했습니다.' };
  }
}

/**
 * 프로젝트를 최종 발행합니다.
 */
export async function publishProjectAction(projectId: string) {
  const project = await getMicroAppProjectAction(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');

  // micro_app_config 테이블 형식에 맞춰 변환
  // 모든 소스 ID를 콤마로 결합하여 저장
  const allSourceIds = project.sources.map((s: any) => s.id).join(',');
  
  const config = {
    id: generateId(),
    projectId,
    templateId: project.templateId || 'custom-app',
    sourceTableId: allSourceIds,
    mappingConfig: typeof project.mappingConfig === 'string' ? project.mappingConfig : JSON.stringify(project.mappingConfig || []),
    uiSettings: typeof project.uiSettings === 'string' ? project.uiSettings : JSON.stringify(project.uiSettings || { theme: 'blue' }),
    rbacRoles: JSON.stringify(['CEO', 'ADMIN']),
    createdBy: project.createdBy,
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString()
  };

  try {
    // 동일한 projectId로 이미 발행된 설정이 있는지 확인
    const existing = await queryTable('micro_app_config', { filters: { projectId } });
    const existingRows = Array.isArray(existing) ? existing : (existing?.rows || []);

    if (existingRows.length > 0) {
      // 기존 설정 업데이트
      const existingId = existingRows[0].id;
      await updateRows('micro_app_config', {
        ...config,
        id: existingId, // 기존 ID 유지
        createdAt: existingRows[0].createdAt // 최초 생성일 유지
      }, { filters: { id: existingId } });
      console.log(`[발행] 기존 앱 업데이트 완료 (ID: ${existingId})`);
    } else {
      // 신규 발행
      await insertRows('micro_app_config', [config]);
      console.log(`[발행] 신규 앱 발행 완료 (ID: ${config.id})`);
    }
    
    // 프로젝트 상태를 PUBLISHED로 변경
    await updateRows(PROJECT_TABLE, { status: 'PUBLISHED', updatedAt: new Date().toISOString() }, { filters: { id: projectId } });
    
    revalidatePath('/publishing');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('[발행 오류]:', error);
    return { success: false, error: error.message || '발행 중 오류가 발생했습니다.' };
  }
}

/**
 * 발행된 마이크로 앱을 삭제합니다.
 */
export async function deleteMicroAppAction(id: string) {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  // micro_app_config에서 제거
  await deleteRows('micro_app_config', { filters: { id } });
  
  // 메인 대시보드와 스튜디오 화면 갱신
  revalidatePath('/publishing');
  revalidatePath('/dashboard');
  
  return { success: true };
}
