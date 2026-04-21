/**
 * Calendar Service for EGDesk
 * Handles fetching and mapping action_task data to calendar events with RBAC filtering.
 * Now expanded to aggregate events from various industry-standard template tables.
 */

import { queryTable, listTables } from '@/egdesk-helpers';

export type CalendarEventType = 'TASK' | 'NOTICE' | 'EVENT' | 'VACATION';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD or ISO string
  type: CalendarEventType;
  status: string;
  assigneeId?: number;
  assigneeName?: string;
  reportId?: string;
  sourceTable?: string; // To track where the event came from
}

// 📅 Configuration for additional calendar sources from template tables
const EXTRA_SOURCES = [
  { 
    tableName: 'tpl_mfg_production_order', 
    dateField: 'target_date', 
    titleField: 'product_name', 
    type: 'TASK' as CalendarEventType,
    prefix: '[생산]' 
  },
  { 
    tableName: 'tpl_ops_meeting_minutes', 
    dateField: 'date', 
    titleField: 'title', 
    type: 'EVENT' as CalendarEventType,
    prefix: '[회의]'
  },
  { 
    tableName: 'tpl_hr_vacation', 
    dateField: 'start_date', 
    titleField: 'emp_name', 
    type: 'VACATION' as CalendarEventType,
    prefix: '[휴가]'
  },
  { 
    tableName: 'tpl_leg_contracts', 
    dateField: 'end_date', 
    titleField: 'partner', 
    type: 'NOTICE' as CalendarEventType,
    prefix: '[계약만료]'
  },
  {
    tableName: 'tpl_pur_purchase_orders',
    dateField: 'createdAt',
    titleField: 'vendor',
    type: 'TASK' as CalendarEventType,
    prefix: '[발주]'
  }
];

/**
 * Fetch calendar events based on user role and date range.
 */
export async function getCalendarEvents(options: {
  userId?: number;
  userRole?: string;
  startDate?: string; // Optional filtering (YYYY-MM-DD)
  endDate?: string;
}) {
  const { userId, userRole, startDate, endDate } = options;
  const isAdmin = userRole === 'ADMIN' || userRole === 'CEO';

  try {
    // 0. Get list of existing tables to avoid 500 errors on missing template tables
    let existingTableNames = new Set<string>();
    try {
      const tableList: any = await listTables();
      const tables = Array.isArray(tableList) ? tableList : (tableList?.tables || []);
      tables.forEach((t: any) => {
        const name = typeof t === 'string' ? t : (t.tableName || t.name);
        if (name) existingTableNames.add(name.toLowerCase());
      });
    } catch (e) {
      console.warn('[CalendarService] Failed to list tables, continuing with core tasks only.');
    }

    // 1. Fetch core action_tasks (Standard way)
    const taskFetch = existingTableNames.has('action_task') 
      ? queryTable('action_task', {
          limit: 100,
          orderBy: 'dueAt',
          orderDirection: 'ASC'
        }).catch(() => [])
      : Promise.resolve([]);

    // 2. Fetch from industry template tables (Dynamic way) - FILTERED BY EXISTENCE
    const extraFetches = EXTRA_SOURCES
      .filter(source => existingTableNames.has(source.tableName.toLowerCase()))
      .map(source => 
        queryTable(source.tableName, { 
          limit: 50, 
          orderBy: source.dateField, 
          orderDirection: 'ASC' 
        })
        .then(res => {
           const rows = Array.isArray(res) ? res : (res?.rows || []);
           console.log(`Source: ${source.tableName}, Rows found: ${rows.length}`);
           return rows.map((row: any): CalendarEvent => ({
              id: `${source.tableName}-${row.id || Math.random()}`,
              title: `${source.prefix} ${row[source.titleField] || '미지정'}`,
              description: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata).description : row.metadata.description) : undefined,
              date: row[source.dateField] || '',
              type: source.type,
              status: 'OPEN',
              sourceTable: source.tableName,
              reportId: source.tableName // Used for linking to the report
           }));
        })
        .catch((err) => {
          console.error(`Fetch failed for ${source.tableName}:`, err.message);
          return [];
        })
      );

    // 3. Resolve all fetches
    const allResults = await Promise.all([taskFetch, ...extraFetches]);
    
    // Process core tasks
    const rawCoreTasks = Array.isArray(allResults[0]) ? allResults[0] : (allResults[0]?.rows || []);
    const coreEvents = rawCoreTasks
      .filter((task: any) => {
        if (!task.dueAt) return false;
        if (isAdmin) return true;
        const isPublicType = task.type === 'NOTICE' || task.type === 'EVENT';
        const isAssignedToMe = userId && task.assigneeId === userId;
        return isPublicType || isAssignedToMe;
      })
      .map((task: any): CalendarEvent => ({
        id: String(task.id),
        title: task.title || 'Untitled',
        description: task.description,
        date: task.dueAt,
        type: (task.type as CalendarEventType) || 'TASK',
        status: task.status,
        assigneeId: task.assigneeId,
        reportId: task.reportId
      }));

    // Process extra events (already mapped)
    const extraEvents = allResults.slice(1).flat();
    console.log('Core Events Count:', coreEvents.length);
    console.log('Extra Events Count:', extraEvents.length);

    // 4. Combine, Filter by Date Range, and Sort
    const now = new Date().toISOString().split('T')[0];
    console.log('Current Date (Local):', now);

    const finalEvents = [...coreEvents, ...extraEvents]
      .filter(event => {
        if (!event.date) {
            console.log(`Filtering out event ${event.title} because date is empty`);
            return false;
        }
        // If no range provided, show upcoming events (today onwards)
        if (!startDate && !endDate) {
          const isUpcoming = event.date >= now;
          console.log(`Checking Event: ${event.title}, Date: ${event.date}, Upcoming? ${isUpcoming}`);
          return isUpcoming;
        }
        if (startDate && event.date < startDate) return false;
        if (endDate && event.date > endDate) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 50); // Limit total display

    console.log('Final Events Count:', finalEvents.length);
    return finalEvents;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return [];
  }
}
