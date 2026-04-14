import React from 'react';
import { getReportsAction, getGuardrailRulesAction } from '@/app/actions/guardrail';
import GuardrailSettingsClient from '@/components/GuardrailSettingsClient';
import PageHeader from '@/components/PageHeader';
import { ShieldCheck } from 'lucide-react';

export default async function GuardrailSettingsPage() {
    const reports = await getReportsAction();
    const initialRules = await getGuardrailRulesAction();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <PageHeader 
                title="GUARDRAIL SETTINGS" 
                description="데이터 품질 보호를 위한 선제적 입력 검증 규칙 관리"
                icon={ShieldCheck}
            />
            
            <GuardrailSettingsClient 
                reports={reports} 
                initialRules={initialRules} 
            />
        </div>
    );
}
