const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  apiKey: '3931f0ae-064f-41f4-b63d-367dbf249e37', // .env.local의 최신 키 사용
};

async function callTool(tool, args) {
  const response = await fetch(`${EGDESK_CONFIG.apiUrl}/user-data/tools/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': EGDESK_CONFIG.apiKey
    },
    body: JSON.stringify({ tool, arguments: args })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Tool call failed');
  }
  return JSON.parse(result.result.content[0].text);
}

async function setup() {
  console.log('Starting My Workspace 2.0 Database Setup...');

  try {
    // 1. user 테이블 생성
    console.log('Creating table: user...');
    await callTool('user_data_create_table', {
      displayName: '사용자 관리',
      tableName: 'user',
      schema: [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'username', type: 'TEXT', notNull: true },
        { name: 'role', type: 'TEXT', notNull: true },
        { name: 'password', type: 'TEXT' },
        { name: 'fullName', type: 'TEXT' },
        { name: 'employeeId', type: 'TEXT' },
        { name: 'isActive', type: 'INTEGER', defaultValue: 1 },
        { name: 'createdAt', type: 'TEXT' },
        { name: 'updatedAt', type: 'TEXT' }
      ],
      uniqueKeyColumns: ['username']
    });

    // 2. report 테이블 생성
    console.log('Creating table: report...');
    await callTool('user_data_create_table', {
      displayName: '보고서 관리',
      tableName: 'report',
      schema: [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'name', type: 'TEXT', notNull: true },
        { name: 'sheetName', type: 'TEXT' },
        { name: 'tableName', type: 'TEXT' },
        { name: 'columns', type: 'TEXT' },
        { name: 'ownerId', type: 'TEXT' },
        { name: 'slackWebhookUrl', type: 'TEXT' },
        { name: 'createdAt', type: 'TEXT' },
        { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 }
      ]
    });

    // 3. report_access 테이블 생성
    console.log('Creating table: report_access...');
    await callTool('user_data_create_table', {
      displayName: '보고서 접근 권한',
      tableName: 'report_access',
      schema: [
        { name: 'reportId', type: 'TEXT', notNull: true },
        { name: 'userId', type: 'TEXT', notNull: true }
      ]
    });

    // 4. report_row 테이블 생성
    console.log('Creating table: report_row...');
    await callTool('user_data_create_table', {
      displayName: '보고서 데이터 행',
      tableName: 'report_row',
      schema: [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'data', type: 'TEXT' },
        { name: 'contentHash', type: 'TEXT' },
        { name: 'reportId', type: 'TEXT', notNull: true },
        { name: 'creatorId', type: 'TEXT' },
        { name: 'updaterId', type: 'TEXT' },
        { name: 'createdAt', type: 'TEXT' },
        { name: 'updatedAt', type: 'TEXT' },
        { name: 'deletedAt', type: 'TEXT' },
        { name: 'isDeleted', type: 'INTEGER', defaultValue: 0 }
      ]
    });

    // 5. report_row_history 테이블 생성
    console.log('Creating table: report_row_history...');
    await callTool('user_data_create_table', {
      displayName: '데이터 변경 이력',
      tableName: 'report_row_history',
      schema: [
        { name: 'id', type: 'TEXT', notNull: true },
        { name: 'rowId', type: 'TEXT', notNull: true },
        { name: 'oldData', type: 'TEXT' },
        { name: 'newData', type: 'TEXT' },
        { name: 'changeType', type: 'TEXT' },
        { name: 'changedById', type: 'TEXT' },
        { name: 'changedAt', type: 'TEXT' }
      ]
    });

    // 6. ai_studio_session 테이블 생성
    console.log('Creating table: ai_studio_session...');
    await callTool('user_data_create_table', {
      displayName: 'AI 분석 세션',
      tableName: 'ai_studio_session',
      schema: [
        { name: 'userId', type: 'TEXT', notNull: true },
        { name: 'data', type: 'TEXT', notNull: true },
        { name: 'updatedAt', type: 'TEXT', notNull: true }
      ],
      uniqueKeyColumns: ['userId']
    });

    // 7. 기본 관리자 계정 생성
    console.log('Creating default admin user...');
    const adminId = 'admin-uuid-001';
    await callTool('user_data_insert_rows', {
      tableName: 'user',
      rows: [{
        id: adminId,
        username: 'admin_user',
        role: 'ADMIN',
        fullName: '시스템 관리자',
        isActive: 1,
        createdAt: new Date().toISOString()
      }]
    });

    console.log('Setup completed successfully!');
  } catch (e) {
    console.error('Setup failed:', e.message);
    if (e.message.includes('already exists')) {
        console.log('Note: Some tables might already exist. This is fine.');
    } else {
        process.exit(1);
    }
  }
}

setup();
