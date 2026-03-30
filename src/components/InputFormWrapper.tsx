'use client';

import React, { useState } from 'react';
import DynamicForm from './DynamicForm';
import { addRowAction } from '@/app/actions';
import StatusModal from './StatusModal';

interface InputFormWrapperProps {
  reportId: string;
  columns: any[];
}

export default function InputFormWrapper({ reportId, columns }: InputFormWrapperProps) {
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });

  const handleSubmit = async (data: any) => {
    try {
      const result = await addRowAction(reportId, data);
      setModal({
        isOpen: true,
        title: '데이터 저장 완료',
        message: '데이터가 성공적으로 저장되었습니다. 계속해서 다음 데이터를 입력할 수 있습니다.',
        type: 'success'
      });
      // DynamicForm 내부에서 setFormData(initialData)를 호출하므로 여기서 별도 처리는 필요 없음
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: '저장 실패',
        message: error.message || '데이터 저장 중 오류가 발생했습니다.',
        type: 'error'
      });
      // 에러를 던져서 DynamicForm의 로딩 상태가 해제되도록 함
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <DynamicForm 
        columns={columns} 
        onSubmit={handleSubmit}
        onStatusShow={(title, message, type) => setModal({ isOpen: true, title, message, type })}
      />
      
      <StatusModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />
    </div>
  );
}
