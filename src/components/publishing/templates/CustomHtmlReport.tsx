import React, { useMemo } from 'react';

interface CustomHtmlReportProps {
  data: any;
  mapping: any;
  uiSettings: {
    customHtml?: string;
    customCss?: string;
    theme?: string;
    tags?: string[];
  };
  appName: string;
}

export function CustomHtmlReport({ data, mapping, uiSettings, appName }: CustomHtmlReportProps) {
  const { customHtml, customCss } = uiSettings;

  // 데이터 가공 로직 (변수 치환용)
  const processedData = useMemo(() => {
    if (!data) return {};
    
    let accounts: any[] = [];
    let transactions: any[] = [];
    
    if (Array.isArray(data)) {
      transactions = data;
    } else {
      transactions = data.transactions || [];
      accounts = data.accounts || [];
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalInflow = transactions.filter((t: any) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = transactions.filter((t: any) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      appName,
      currentTime: new Date().toLocaleString(),
      totalBalance: totalBalance.toLocaleString(),
      totalInflow: totalInflow.toLocaleString(),
      totalOutflow: totalOutflow.toLocaleString(),
      accountCount: accounts.length,
      accounts: accounts.map(acc => ({
        name: acc.name,
        balance: (acc.balance || 0).toLocaleString()
      })),
      transactions: transactions.slice(0, 30).map((t: any) => ({
        description: t.description || '거래내역',
        date: t.date || '',
        bankName: t.bankName || t.bank || '',
        amount: Math.abs(t.amount || 0).toLocaleString(),
        inflow: (t.amount || 0) > 0
      }))
    };
  }, [data, appName]);

  // 간이 Handlebars 스타일 엔진 (RegExp 기반)
  const renderedHtml = useMemo(() => {
    if (!customHtml) return '<div class="p-10 text-center text-slate-400 font-bold">커스텀 HTML 코드가 없습니다.</div>';

    let html = customHtml;

    // 1. 단일 변수 치환 ({{appName}}, {{totalBalance}} 등)
    Object.entries(processedData).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, String(value));
      }
    });

    // 2. 루프 처리 ({{#each accounts}} ... {{/each}}) - 매우 심플한 버전
    // 실제 운영 시에는 정밀한 파서가 필요하지만, 테스트용으로 핵심 기능만 구현
    const loopRegex = /{{\s*#each\s+(\w+)\s*}}([\s\S]*?){{\s*\/each\s*}}/g;
    html = html.replace(loopRegex, (_, listKey, innerHtml) => {
      const list = (processedData as any)[listKey];
      if (!Array.isArray(list)) return '';
      
      return list.map(item => {
        let itemHtml = innerHtml;
        Object.entries(item).forEach(([k, v]) => {
          const r = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
          itemHtml = itemHtml.replace(r, String(v));
        });
        return itemHtml;
      }).join('');
    });

    // 3. 조건문 처리 ({{#if inflow}} ... {{else}} ... {{/if}})
    const ifRegex = /{{\s*#if\s+(\w+)\s*}}([\s\S]*?)(?:{{\s*else\s*}}([\s\S]*?))?{{\s*\/if\s*}}/g;
    html = html.replace(ifRegex, (_, conditionKey, trueContent, falseContent = '') => {
      // 이 부분은 루프 내부에서 처리되어야 하므로 위 루프 로직에 통합하거나 더 정교하게 수정 필요
      // 현재는 전역 변수에 대해서만 작동
      return (processedData as any)[conditionKey] ? trueContent : falseContent;
    });

    return html;
  }, [customHtml, processedData]);

  return (
    <div className="custom-html-container w-full min-h-screen">
      {customCss && <style>{customCss}</style>}
      <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </div>
  );
}
