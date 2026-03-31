/**
 * FinanceHub Helper Functions for Next.js
 *
 * Type-safe helpers for accessing FinanceHub data.
 * Works in both client and server components.
 * 
 * Accesses http://localhost:8080/financehub/...
 */

import { EGDESK_CONFIG } from './egdesk.config';

/**
 * Call FinanceHub MCP tool
 */
export async function callFinanceHubTool(
  toolName: string,
  args: Record<string, any> = {}
): Promise<any> {
  const body = JSON.stringify({ tool: toolName, arguments: args });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const isServer = typeof window === 'undefined';

  let response: Response;
  if (isServer) {
    // API routes: call financehub directly
    const apiUrl =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_EGDESK_API_URL) ||
      EGDESK_CONFIG.apiUrl;
    const apiKey =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_EGDESK_API_KEY) ||
      EGDESK_CONFIG.apiKey;
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
    response = await fetch(`${apiUrl}/financehub/tools/call`, {
      method: 'POST',
      headers,
      body
    });
  } else {
    // Browser: use proxy for CORS and tunnel base path
    const basePath = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_EGDESK_BASE_PATH) || '';
    // NOTE: If using a proxy, it must support /financehub as well.
    // For now, we assume the environment handles the proxy or that it's accessible.
    const proxyUrl = `/__financehub_proxy`.startsWith('/') && !`/__financehub_proxy`.startsWith('//')
      ? `${basePath}/__financehub_proxy`
      : `/__financehub_proxy`;

    response = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body
    });
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Tool call failed');
  }

  // Parse MCP response format
  const content = result.result?.content?.[0]?.text;
  if (!content) return null;

  try {
     return JSON.parse(content);
  } catch (e) {
     return content;
  }
}

/**
 * List all registered banks/cards
 */
export async function listBanks() {
  return callFinanceHubTool('financehub_list_banks', {});
}

/**
 * List bank accounts with balances
 */
export async function listAccounts(options: { bankId?: string; isActive?: boolean } = {}) {
  return callFinanceHubTool('financehub_list_accounts', options);
}

/**
 * Query transactions with filtering, sorting, and pagination
 */
export async function queryTransactions(options: {
  accountId?: string;
  bankId?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  searchText?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'date' | 'amount' | 'balance';
  orderDir?: 'asc' | 'desc';
} = {}) {
  return callFinanceHubTool('financehub_query_transactions', options);
}

/**
 * Get transaction statistics
 */
export async function getStatistics(options: {
  accountId?: string;
  bankId?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return callFinanceHubTool('financehub_get_statistics', options);
}

/**
 * Get monthly summary of deposits/withdrawals
 */
export async function getMonthlySummary(options: {
  accountId?: string;
  bankId?: string;
  year?: number;
  months?: number;
} = {}) {
  return callFinanceHubTool('financehub_get_monthly_summary', options);
}

/**
 * Get high-level overview
 */
export async function getOverallStats() {
  return callFinanceHubTool('financehub_get_overall_stats', {});
}

/**
 * Get sync operation history
 */
export async function getSyncHistory(limit: number = 50) {
  return callFinanceHubTool('financehub_get_sync_history', { limit });
}
