'use server';

import { revalidatePath } from 'next/cache';
import { 
  queryTable, 
  insertRows, 
  updateRows, 
  deleteRows,
  listTables,
  getTableSchema
} from '@/egdesk-helpers';
import { generateId } from './shared';
import { getSessionAction } from './auth';

/**
 * AI가 워크스페이스 테이블을 스캔하여 발행 가능한 마이크로 앱을 추천합니다.
 */
export async function getProactivePublishingSuggestionsAction() {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  try {
    const tables = await listTables();
    const suggestions = [];

    for (const table of tables) {
      const name = table.displayName || table.name;
      
      // Heuristic discovery (could be replaced by LLM scan later)
      if (name.includes('은행') || name.includes('계좌') || name.includes('거래') || name.includes('통장')) {
        suggestions.push({
          tableId: table.name,
          tableName: name,
          templateId: 'cash-report',
          reason: `'${name}' 테이블에서 금융 거래 패턴이 감지되었습니다. 실시간 자금 흐름을 한눈에 파악할 수 있는 자금일보 앱 발행을 추천합니다.`
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Failed to get publishing suggestions:', error);
    return [];
  }
}

/**
 * 새로운 마이크로 앱을 발행합니다.
 */
export async function publishMicroAppAction(data: {
  name: string;
  templateId: string;
  sourceTableId: string;
  mappingConfig: any;
  uiSettings: any;
}) {
  const user = await getSessionAction();
  if (!user) throw new Error('인증이 필요합니다.');

  const id = generateId();
  const now = new Date().toISOString();

  const config = {
    id,
    name: data.name,
    templateId: data.templateId,
    sourceTableId: data.sourceTableId,
    mappingConfig: JSON.stringify(data.mappingConfig),
    uiSettings: JSON.stringify(data.uiSettings),
    rbacRoles: JSON.stringify(['CEO', 'ACCOUNTANT']),
    createdBy: user.id,
    createdAt: now,
    updatedAt: now
  };

  await insertRows('micro_app_config', [config]);
  
  revalidatePath('/dashboard/publishing');
  return { success: true, id };
}

/**
 * 마이크로 앱 설정을 가져옵니다.
 */
export async function getMicroAppConfigAction(id: string) {
  const results = await queryTable('micro_app_config', {
    filters: { id }
  });

  if (!results || results.length === 0) return null;

  const config = results[0];
  return {
    ...config,
    mappingConfig: JSON.parse(config.mappingConfig),
    uiSettings: JSON.parse(config.uiSettings),
    rbacRoles: JSON.parse(config.rbacRoles)
  };
}

/**
 * 마이크로 앱 목록을 가져옵니다.
 */
export async function listMicroAppsAction() {
  const user = await getSessionAction();
  if (!user) return [];

  const results = await queryTable('micro_app_config', {
    orderBy: 'createdAt',
    orderDirection: 'DESC'
  });

  return results.map((config: any) => ({
    ...config,
    mappingConfig: JSON.parse(config.mappingConfig),
    uiSettings: JSON.parse(config.uiSettings),
    rbacRoles: JSON.parse(config.rbacRoles)
  }));
}
