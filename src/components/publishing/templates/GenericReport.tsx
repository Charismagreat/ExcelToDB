'use client';

import React, { useState } from 'react';
import { DynamicTable } from '@/components/DynamicTable';

interface GenericReportProps {
  data: any;
  mapping: any;
  uiSettings: any;
  appName: string;
  id: string;
}

export function GenericReport({ id, data, mapping, uiSettings, appName }: GenericReportProps) {
  const datasets = data?.datasets || null;
  const rawRows = data?.transactions || data || [];
  
  // AI 매핑 설정 및 DynamicTable 형식으로 변환
  const getTableColumns = (sourceData: any) => {
    if (mapping && mapping.length > 0) {
      return mapping.map((m: any) => ({
        name: m.sourceColumn,
        displayName: m.displayName || m.sourceColumn,
        type: m.type || 'string'
      }));
    }
    return sourceData?.columns || (sourceData?.transactions?.length > 0 ? Object.keys(sourceData.transactions[0]).map(k => ({ name: k, displayName: k, type: 'string' })) : []);
  };

  const defaultColumns = getTableColumns(data);

  return (
    <div className="flex flex-col bg-white animate-in fade-in duration-700">
      <div className="p-0 space-y-12">
        {datasets && datasets.length > 0 ? (
          datasets.map((dataset: any, idx: number) => (
            <div key={dataset.id || idx} className="space-y-4">
              <div className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    {dataset._sourceName || `Source ${idx + 1}`}
                  </h3>
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                  {dataset.transactions?.length || 0} RECORDS
                </div>
              </div>
              <DynamicTable 
                reportId={`${id}-${dataset.id}`} 
                columns={getTableColumns(dataset)} 
                data={dataset.transactions} 
                isReadOnly={true}
                canEdit={false}
                isOwner={false}
                userRole="VIEWER"
                initialSortConfig={uiSettings?.multiSortConfig}
                initialItemsPerPage={uiSettings?.itemsPerPage}
              />
            </div>
          ))
        ) : (
          <DynamicTable 
            reportId={id} 
            columns={defaultColumns} 
            data={rawRows} 
            isReadOnly={true}
            canEdit={false}
            isOwner={false}
            userRole="VIEWER"
            initialSortConfig={uiSettings?.multiSortConfig}
            initialItemsPerPage={uiSettings?.itemsPerPage}
          />
        )}
      </div>
    </div>
  );
}
