'use client';

import React from 'react';
import { ClipboardList, LayoutGrid } from 'lucide-react';

export default function TodoPage() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <ClipboardList size={40} className="text-gray-300 mb-4" />
            <h3 className="text-gray-500 font-bold text-xl">할 일 목록</h3>
            <p className="text-gray-400 text-sm mt-1 text-center">
                아직 등록된 할 일이 없습니다.<br/>
                새로운 업무가 배정되면 여기에 나타납니다.
            </p>
        </div>
    );
}
