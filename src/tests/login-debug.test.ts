import { describe, it, expect, vi } from 'vitest';
import { queryTable, listTables } from '@/egdesk-helpers';

describe('Login Debug Test', () => {
  it('should list tables and check user table', async () => {
    try {
      const tables = await listTables();
      console.log('TABLES:', JSON.stringify(tables, null, 2));
      
      const users = await queryTable('user', { filters: { username: 'admin_user' } });
      console.log('ADMIN_USER QUERY RESULT TYPE:', typeof users);
      console.log('ADMIN_USER QUERY RESULT:', JSON.stringify(users, null, 2));
      
      if (Array.isArray(users)) {
        console.log('YES, it is an array!');
      } else {
        console.log('NO, it is NOT an array!');
      }
    } catch (error) {
      console.error('ERROR in test:', error);
    }
  });
});
