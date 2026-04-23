import { createTable, queryTable } from '../egdesk-helpers';

async function initPublishingDb() {
  const tableName = 'micro_app_config';
  console.log(`Checking if table '${tableName}' exists...`);
  
  try {
    await queryTable(tableName, { limit: 1 });
    console.log(`Table '${tableName}' already exists.`);
  } catch (error) {
    console.log(`Creating table '${tableName}'...`);
    await createTable('Micro App Config', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'templateId', type: 'TEXT', notNull: true },
      { name: 'sourceTableId', type: 'TEXT', notNull: true },
      { name: 'mappingConfig', type: 'TEXT', notNull: true }, // JSON string
      { name: 'uiSettings', type: 'TEXT', notNull: true },    // JSON string
      { name: 'rbacRoles', type: 'TEXT', notNull: true },     // JSON string
      { name: 'createdBy', type: 'TEXT', notNull: true },
      { name: 'createdAt', type: 'TEXT', notNull: true },
      { name: 'updatedAt', type: 'TEXT', notNull: true }
    ], { 
      tableName, 
      uniqueKeyColumns: ['id'] 
    });
    console.log(`Table '${tableName}' created successfully.`);
  }
}

initPublishingDb().catch(console.error);
