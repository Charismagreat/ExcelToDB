/**
 * Calendar Service for EGDesk
 * Handles fetching and mapping action_task data to calendar events with RBAC filtering.
 */

import { queryTable } from '@/egdesk-helpers';

export type CalendarEventType = 'TASK' | 'NOTICE' | 'EVENT' | 'VACATION';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // From dueAt (YYYY-MM-DD or ISO string)
  type: CalendarEventType;
  status: string;
  assigneeId?: number;
  assigneeName?: string;
  reportId?: string;
}

/**
 * Fetch calendar events based on user role and date range.
 * 
 * RBAC Logic:
 * - Admin (CEO): Sees everything.
 * - Employee: Sees 'NOTICE', 'EVENT' and their own 'TASK' or 'VACATION'.
 */
export async function getCalendarEvents(options: {
  userId?: number;
  userRole?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { userId, userRole, startDate, endDate } = options;

  try {
    // 1. Fetch all relevant action_tasks
    // Note: We leverage queryTable which internally calls user_data_query
    const tasks = await queryTable('action_task', {
      limit: 1000,
      orderBy: 'dueAt',
      orderDirection: 'ASC'
    });

    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }

    // 2. Map and Filter
    const isAdmin = userRole === 'ADMIN' || userRole === 'CEO';
    
    return tasks
      .filter((task: any) => {
        // Essential: Must have a due date
        if (!task.dueAt) return false;

        // Date range filtering (simple string comparison if YYYY-MM-DD)
        if (startDate && task.dueAt < startDate) return false;
        if (endDate && task.dueAt > endDate) return false;

        // RBAC Filtering
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
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return [];
  }
}
