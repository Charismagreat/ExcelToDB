import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mic, Camera, Send, Loader2, Check, ArrowLeft, AlertCircle, Plus, FileText } from 'lucide-react';
import { confirmWorkspaceDataAction, deleteWorkspaceItemAction } from '@/app/workspace/actions';
import { Trash2 } from 'lucide-react';

interface AiInputOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string, files: File[]) => Promise<any>;
    initialMode?: 'camera' | 'mic' | 'file' | null;
    initialData?: Record<string, any> | null;
    initialReportId?: string | null;
    initialReportName?: string | null;
    initialColumns?: any[] | null;
    workspaceItemId?: string | null;
}

export function AiInputOverlay({ 
    isOpen, 
    onClose, 
    onSubmit, 
    initialMode,
    initialData,
    initialReportId,
    initialReportName,
    initialColumns,
    workspaceItemId
}: AiInputOverlayProps) {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI 리뷰 관련 상태
    const [isReviewing, setIsReviewing] = useState(false);
    const [aiData, setAiData] = useState<Record<string, any>>({});
    const [reportId, setReportId] = useState<string | null>(null);
    const [reportName, setReportName] = useState<string | null>(null);
    const [columns, setColumns] = useState<any[]>([]);

    // 초기 데이터/모드 처리
    React.useEffect(() => {
        if (!isOpen) return;

        if (initialData && !isReviewing) {
            // 외부에서 데이터가 주입된 경우 바로 리뷰 모드로 진입
            // 1. 데이터 평탄화: 중첩된 aiData 필드들을 최상위로 끌어올림
            const updatedData = { 
                ...initialData,
                ...(typeof initialData.aiData === 'object' ? initialData.aiData : {})
            };
            const currentColumns = initialColumns || [];

            // 2. 날짜 형식 보정 (YYYY-MM-DD HH:MM:SS -> YYYY-MM-DD)
            currentColumns.forEach(col => {
                if (col.type === 'date' && updatedData[col.name]) {
                    const dateStr = String(updatedData[col.name]);
                    const match = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
                    if (match) updatedData[col.name] = match[0];
                }
            });

            // 3. 사진 필드 매핑 강화
            const imageField = currentColumns.find(c => c.name === '영수증사진' || c.name === '사진' || c.name === '이미지');
            if (imageField && !updatedData[imageField.name] && updatedData.imageUrl) {
                updatedData[imageField.name] = updatedData.imageUrl;
            }

            console.log(`[AiInputOverlay] Initializing with status: ${updatedData.status || 'unknown'}`);
            setAiData(updatedData);
            setReportId(initialReportId || null);
            setReportName(initialReportName || null);
            setColumns(currentColumns);
            setIsReviewing(true);
            
            // 이미지 정보가 있는데 selectedFiles가 비어있으면 (보통 피드 확인용)
            // handleConfirm에서 workspaceItemId가 필요하므로 상태 유지
        } else if (initialMode && !isReviewing) {
            if (initialMode === 'mic') {
                toggleListening();
            } else if (initialMode === 'camera' || initialMode === 'file') {
                setTimeout(() => {
                    fileInputRef.current?.click();
                }, 100);
            }
        }
    }, [isOpen, initialMode, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!inputText.trim() && selectedFiles.length === 0) return;
        setIsSubmitting(true);
        try {
            const result = await onSubmit(inputText, selectedFiles);
            
            if (result && result.success) {
                if (result.isBatch || result.isUnclassified) {
                    // 일괄 등록 또는 즉시 등록의 경우 즉시 종료 (알림 생략)
                    router.refresh();
                    resetAndClose();
                    return;
                }

                if (result.data) {
                    // 단일 파일 AI 분석 성공 (review 모드를 유지하는 경우) -> 리뷰 모드로 전환
                    setAiData(result.data);
                    setReportId(result.reportId);
                    setReportName(result.reportName);
                    setColumns(result.columns || []);
                    setIsReviewing(true);
                }
            } else {
                alert(result?.message || '보고서를 식별할 수 없습니다.');
            }
        } catch (error) {
            console.error('Submission failed:', error);
            alert('입력 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!reportId) return;
        setIsSubmitting(true);
        try {
            // workspaceItemId가 있으면 최종 승인 시 함께 전달하여 상태 업데이트 유도
            const result = await confirmWorkspaceDataAction(reportId, aiData, workspaceItemId || undefined);
            if (result.success) {
                // 햅틱 피드백 (지원되는 기기에서)
                if (window.navigator.vibrate) {
                    window.navigator.vibrate([100, 50, 100]);
                }
                
                alert(result.message);
                router.refresh();
                resetAndClose();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Final save failed:', error);
            alert('데이터 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!workspaceItemId) return;
        
        if (!confirm('문서와 이미지 파일을 영구적으로 삭제하시겠습니까?')) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await deleteWorkspaceItemAction(workspaceItemId);
            if (result.success) {
                alert(result.message);
                resetAndClose();
            } else {
                alert(result.message || '삭제에 실패했습니다.');
            }
        } catch (err: any) {
            console.error('Delete error:', err);
            alert(err.message || '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setInputText('');
        setSelectedFiles([]);
        setIsReviewing(false);
        setAiData({});
        setReportId(null);
        setReportName(null);
        setColumns([]);
        onClose();
    };

    const toggleListening = () => {
        setIsListening(!isListening);
        if (!isListening) {
            setTimeout(() => {
                setInputText('[음성 인식 모의 테스트] ' + inputText);
                setIsListening(false);
            }, 2000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFieldChange = (key: string, value: any) => {
        setAiData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
            <div className="flex-1" onClick={resetAndClose} />
            
            <div className={`bg-white rounded-t-3xl w-full max-w-lg mx-auto shadow-2xl overflow-hidden transition-all duration-300 ${isReviewing ? 'h-[85vh]' : 'h-auto'}`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                        {isReviewing && (
                            <button onClick={() => setIsReviewing(false)} className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {isReviewing ? `${reportName} 확인` : '새로운 데이터 입력'}
                            {aiData.status === 'completed' && <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">완료</span>}
                            {aiData.status === 'deleted' && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">삭제</span>}
                        </h3>
                    </div>
                    <button onClick={resetAndClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full bg-gray-50">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 h-full overflow-y-auto pb-32 no-scrollbar">
                    {!isReviewing ? (
                        <>
                            <p className="text-sm text-gray-500 mb-4 font-medium">
                                어떤 작업을 도와드릴까요?
                            </p>
                            
                            <div className="relative">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="예: 오늘 신용카드 영수증 찍었어"
                                    className="w-full h-32 p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/50 resize-none outline-none text-gray-800 leading-relaxed transition-all placeholder:text-gray-400"
                                    disabled={isSubmitting}
                                />
                                
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedFiles.map((file, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className="w-16 h-16 bg-blue-50 rounded-lg border border-blue-100 overflow-hidden flex items-center justify-center">
                                                    {file.type.startsWith('image/') ? (
                                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileText size={20} className="text-blue-400" />
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-5 flex items-center justify-between space-x-3">
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={toggleListening}
                                        disabled={isSubmitting}
                                        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all shadow-sm ${
                                            isListening ? 'bg-red-50 text-red-500 ring-2 ring-red-500/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Mic size={22} className={isListening ? 'animate-pulse' : ''} />
                                    </button>
                                    
                                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} multiple />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSubmitting}
                                        className="flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        <Camera size={22} />
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (!inputText.trim() && selectedFiles.length === 0)}
                                    className="flex-1 max-w-[140px] flex items-center justify-center space-x-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><span>분석하기</span><Send size={18} /></>}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-5">
                            {/* 이미지 미리보기 영역 (단일 분석 성공 또는 피드 항목 리뷰 시) */}
                            {(selectedFiles[0] || aiData.imageUrl) && (
                                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 h-52 sm:h-64 flex items-center justify-center">
                                    <img 
                                        src={selectedFiles[0] ? URL.createObjectURL(selectedFiles[0]) : aiData.imageUrl} 
                                        alt="Receipt Preview" 
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center">
                                        <Camera size={10} className="mr-1" />
                                        원본 사진
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 p-4 rounded-2xl flex items-start space-x-3 border border-blue-100">
                                <AlertCircle size={20} className="text-blue-500 mt-0.5" />
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    AI가 영수증에서 데이터를 추출했습니다.<br/>
                                    <strong>비어있거나 잘못된 내용</strong>이 있다면 직접 수정해 주세요.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {columns.filter(col => !col.isAutoGenerated).map((col) => (
                                    <div key={col.name} className="flex flex-col space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">{col.name}</label>
                                        <input
                                            type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                            value={aiData[col.name] || ''}
                                            onChange={(e) => handleFieldChange(col.name, e.target.value)}
                                            readOnly={aiData.status === 'completed' || aiData.status === 'deleted' || initialData?.status === 'completed' || initialData?.status === 'deleted'}
                                            className={`w-full px-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium ${
                                                (aiData.status === 'completed' || aiData.status === 'deleted' || initialData?.status === 'completed' || initialData?.status === 'deleted') 
                                                ? 'bg-gray-100 text-gray-500 cursor-default' 
                                                : 'bg-gray-50 text-gray-800'
                                            }`}
                                            placeholder={`${col.name} 입력`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center space-x-3">
                                {(!aiData.status || (aiData.status !== 'completed' && aiData.status !== 'deleted')) ? (
                                    <>
                                        {workspaceItemId && (
                                            <button 
                                                onClick={handleDelete}
                                                disabled={isSubmitting}
                                                className="flex-1 max-w-[120px] flex items-center justify-center space-x-2 h-14 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 hover:bg-red-100 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={20} />
                                                <span>삭제</span>
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleConfirm}
                                            disabled={isSubmitting}
                                            className="flex-[2] max-w-sm flex items-center justify-center space-x-2 h-14 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><span>제출하기</span><Check size={20} /></>}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={resetAndClose}
                                        className="flex-1 max-w-sm flex items-center justify-center h-14 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 active:scale-95 transition-all"
                                    >
                                        닫기
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

