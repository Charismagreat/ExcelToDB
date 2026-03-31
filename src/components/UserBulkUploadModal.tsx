'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2, 
  Table as TableIcon,
  ChevronsRight,
  Info
} from 'lucide-react';
import { bulkCreateUsersAction } from '@/app/actions';

interface UserBulkUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserBulkUploadModal({ onClose, onSuccess }: UserBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    createdCount: number;
    skippedCount: number;
    skippedItems: any[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // JSON으로 변환 (헤더 포함)
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 우리 시스템 필드명에 맞게 매핑 시도
      const mappedData = jsonData.map((row: any) => {
        return {
          username: row['아이디'] || row['ID'] || row['Username'] || '',
          fullName: row['성명'] || row['이름'] || row['Name'] || '',
          role: row['역할'] || row['Role'] || row['권한'] || 'VIEWER',
          password: row['비밀번호'] || row['Password'] || row['암호'] || '',
          employeeId: row['사번'] || row['사원번호'] || row['EmployeeID'] || ''
        };
      });
      
      setPreviewData(mappedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await bulkCreateUsersAction(previewData);
      setResult(response as any);
      if (response.success && response.createdCount > 0) {
        onSuccess();
      }
    } catch (err: any) {
      alert(err.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [['아이디', '성명', '역할', '비밀번호', '사번']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'user_bulk_upload_template.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <TableIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">사용자 엑셀 일괄 등록</h3>
              <p className="text-gray-500 text-sm font-medium mt-0.5">엑셀 파일을 업로드하여 다수의 계정을 한 번에 생성합니다.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-gray-600 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {!result ? (
            <div className="space-y-8">
              {/* Template Info */}
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                <Info className="text-blue-500 shrink-0" size={20} />
                <div className="flex-1 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-blue-800 underline decoration-blue-200 decoration-2 underline-offset-4">엑셀 양식 안내</p>
                    <button 
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-200"
                    >
                      <FileText size={12} />
                      양식 다운로드
                    </button>
                  </div>
                  <ul className="text-blue-700 space-y-1 list-disc list-inside">
                    <li>필수 컬럼: <span className="font-black text-blue-900">아이디</span>, <span className="font-black text-blue-900">비밀번호</span> (비어있을 시 123456으로 자동 설정)</li>
                    <li>선택 컬럼: 성명, 역할(ADMIN/EDITOR/VIEWER), 사번</li>
                    <li>헤더 행의 명칭이 일치해야 자동으로 인식됩니다.</li>
                  </ul>
                </div>
              </div>

              {/* Upload Area */}
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-gray-100 rounded-[32px] p-20 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileChange} 
                  />
                  <div className="p-6 bg-gray-50 text-gray-400 rounded-[28px] mb-6 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all group-hover:scale-110 shadow-sm">
                    <Upload size={48} />
                  </div>
                  <p className="text-lg font-black text-gray-900 mb-2">엑셀 파일을 선택하거나 끌어오세요</p>
                  <p className="text-gray-500 font-medium">.xlsx, .xls 형식의 파일을 지원합니다.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <span className="font-black text-gray-900">{file.name}</span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button 
                      onClick={() => {
                        setFile(null);
                        setPreviewData([]);
                      }}
                      className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-all uppercase tracking-wider"
                    >
                      파일 변경
                    </button>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-gray-50/80 px-4 py-3 border-b text-xs font-black text-gray-500 flex items-center gap-2">
                        <TableIcon size={14} />
                        데이터 미리보기 ({previewData.length}행)
                    </div>
                    <div className="max-h-[300px] overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b shadow-sm">
                          <tr>
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase">아이디</th>
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase">성명</th>
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase">역할</th>
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase">비밀번호</th>
                            <th className="px-4 py-3 text-left font-black text-gray-400 uppercase">사번</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {previewData.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-black text-indigo-600">{row.username || '-'}</td>
                              <td className="px-4 py-3 text-gray-700 font-bold">{row.fullName || '-'}</td>
                              <td className="px-4 py-3">
                                <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                    {row.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400 font-mono italic">
                                {row.password ? '********' : <span className="text-blue-400 text-[10px] font-black">123456 (기본)</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-600 font-medium">{row.employeeId || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewData.length > 10 && (
                      <div className="p-3 bg-gray-50/50 text-center text-[10px] font-black text-gray-400 italic">
                        외 {previewData.length - 10}개의 데이터가 더 있습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center">
              {result.success ? (
                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100 animate-bounce">
                      <Check size={40} strokeWidth={4} />
                    </div>
                    <h4 className="text-3xl font-black text-gray-900 mb-2">일괄 등록 완료</h4>
                    <p className="text-gray-500 font-medium mb-12">사용자 계정 생성 작업이 마무리되었습니다.</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full mb-10">
                      <div className="bg-green-50/50 border border-green-100 p-6 rounded-3xl text-center">
                        <p className="text-[11px] font-black text-green-600 uppercase tracking-widest mb-1">Created</p>
                        <p className="text-4xl font-black text-green-700">{result.createdCount}</p>
                      </div>
                      <div className="bg-red-50/50 border border-red-100 p-6 rounded-3xl text-center">
                        <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1">Skipped</p>
                        <p className="text-4xl font-black text-red-700">{result.skippedCount}</p>
                      </div>
                    </div>

                    {result.skippedItems.length > 0 && (
                      <div className="w-full border border-red-50 rounded-2xl overflow-hidden mb-10">
                        <div className="bg-red-50/50 px-4 py-3 text-[11px] font-black text-red-600 flex items-center gap-2">
                          <AlertCircle size={14} />
                          중복 또는 오류로 제외된 항목
                        </div>
                        <div className="max-h-[150px] overflow-auto divide-y divide-red-50">
                          {result.skippedItems.map((item, idx) => (
                            <div key={idx} className="px-4 py-2.5 flex justify-between items-center bg-white">
                              <span className="text-[11px] font-black text-gray-700">{item.username}</span>
                              <span className="text-[10px] font-bold text-red-400 bg-red-50/50 px-2 py-0.5 rounded-full">{item.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100">
                    <AlertCircle size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">등록 실패</h4>
                  <p className="text-gray-500 mb-8">서버 통신 중 문제가 발생했습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t bg-gray-50/50 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-gray-500 font-bold hover:bg-white hover:shadow-sm rounded-2xl transition-all active:scale-95"
          >
            {result ? '닫기' : '취소'}
          </button>
          {!result && file && (
            <button 
              disabled={isProcessing}
              onClick={handleUpload}
              className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 group"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  처리 중...
                </>
              ) : (
                <>
                  일괄 등록 시작
                  <ChevronsRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
