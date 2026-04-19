import React from 'react';
import { getReportsAction, getGuardrailRulesAction } from '@/app/actions/guardrail';
import GuardrailSettingsClient from '@/components/GuardrailSettingsClient';
import PageHeader from '@/components/PageHeader';
import { ShieldCheck } from 'lucide-react';

export default async function GuardrailSettingsPage() {
    const reports = await getReportsAction();
    const initialRules = await getGuardrailRulesAction();

    return (
        <div className="px-8 md:px-12 pt-6 pb-12">
            <PageHeader 
                title="GUARDRAIL SETTINGS" 
                description="데이터 품질 보호를 위한 선제적 입력 검증 규칙 관리"
                icon={ShieldCheck}
            />
            
            <main className="max-w-[1600px] mx-auto mt-12 space-y-12">
            
            <GuardrailSettingsClient 
                reports={reports} 
                initialRules={initialRules} 
            />
            </main>
        </div>
    );
}
