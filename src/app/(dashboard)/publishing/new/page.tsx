import React from 'react';
import { PublishingWizard } from '@/components/publishing/PublishingWizard';

export const metadata = {
  title: '새 마이크로 앱 발행 | CEO Dashboard',
  description: 'AI를 활용하여 테이블 데이터를 전용 마이크로 앱으로 발행합니다.',
};

export default function NewPublishingPage() {
  return (
    <div className="p-4 sm:p-8">
      <PublishingWizard />
    </div>
  );
}
