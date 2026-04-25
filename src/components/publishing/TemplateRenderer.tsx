'use client';

import React, { useEffect, useState } from 'react';
import { queryTable } from '@/egdesk-helpers';
import { fetchPublishingDataAction, getAISuggestedProjectSetupAction } from '@/app/actions/publishing';
import { CashReport } from './templates/CashReport';
import { GenericReport } from './templates/GenericReport';
import { CustomHtmlReport } from './templates/CustomHtmlReport';

interface TemplateRendererProps {
  templateId: string;
  sourceTableId: string | string[];
  mappingConfig: any;
  uiSettings: any;
  appName: string;
}

export function TemplateRenderer({
  templateId,
  sourceTableId,
  mappingConfig,
  uiSettings,
  appName,
}: TemplateRendererProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!sourceTableId || sourceTableId === 'undefined') return;
        setLoading(true);

        // 콤마로 구분된 소스 ID들을 배열로 변환
        const ids = typeof sourceTableId === 'string' 
          ? sourceTableId.split(',').map(id => id.trim()).filter(id => id)
          : sourceTableId;

        const results = await fetchPublishingDataAction(ids, { limit: 100 });
        setData(results);
      } catch (err: any) {
        console.error('Failed to fetch data for micro-app:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sourceTableId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">데이터를 분석하고 있습니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
        <p className="text-red-600 font-bold mb-2">오류 발생</p>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Template Routing
  switch (templateId) {
    case 'cash-report':
      return (
        <CashReport 
          data={data} 
          mapping={mappingConfig} 
          uiSettings={uiSettings} 
          appName={appName} 
        />
      );

    case 'custom-app':
      return (
        <GenericReport
          data={data}
          mapping={mappingConfig}
          uiSettings={uiSettings}
          appName={appName}
        />
      );

    case 'custom-html':
      return (
        <CustomHtmlReport
          data={data}
          mapping={mappingConfig}
          uiSettings={uiSettings}
          appName={appName}
        />
      );
    
    default:
      return (
        <div className="text-center py-20">
          <p className="text-slate-400">지원되지 않는 템플릿입니다: {templateId}</p>
        </div>
      );
  }
}
