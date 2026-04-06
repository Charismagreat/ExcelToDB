import React, { useState, useRef } from 'react';
import { X, Mic, Camera, Send, Loader2, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { confirmWorkspaceDataAction } from '@/app/workspace/actions';

interface AiInputOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string, file?: File | null) => Promise<any>;
    initialMode?: 'camera' | 'mic' | 'file' | null;
}

export default function AiInputOverlay({ isOpen, onClose, onSubmit, initialMode }: AiInputOverlayProps) {
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI 리뷰 관련 상태
    const [isReviewing, setIsReviewing] = useState(false);
    const [aiData, setAiData] = useState<Record<string, any>>({});
    const [reportId, setReportId] = useState<string | null>(null);
    const [reportName, setReportName] = useState<string | null>(null);
    const [columns, setColumns] = useState<any[]>([]);

    // 초기 모드 처리
    React.useEffect(() => {
        if (isOpen && initialMode && !isReviewing) {
            if (initialMode === 'mic') {
                toggleListening();
            } else if (initialMode === 'camera' || initialMode === 'file') {
                setTimeout(() => {
                    fileInputRef.current?.click();
                }, 100);
            }
        }
    }, [isOpen, initialMode, isReviewing]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!inputText.trim() && !selectedFile) return;
        setIsSubmitting(true);
        try {
            const result = await onSubmit(inputText, selectedFile);
            
            if (result && result.success && result.data) {
                // AI 분석 성공 -> 리뷰 모드로 전환
                setAiData(result.data);
                setReportId(result.reportId);
                setReportName(result.reportName);
                setColumns(result.columns || []);
                setIsReviewing(true);
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
            const result = await confirmWorkspaceDataAction(reportId, aiData);
            if (result.success) {
                // 햅틱 피드백 (지원되는 기기에서)
                if (window.navigator.vibrate) {
                    window.navigator.vibrate([100, 50, 100]);
                }
                
                alert(result.message);
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

    const resetAndClose = () => {
        setInputText('');
        setSelectedFile(null);
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
            setSelectedFile(e.target.files[0]);
        }
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
                        <h3 className="font-bold text-gray-800">
                            {isReviewing ? `${reportName} 확인` : '새로운 데이터 입력'}
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
                                
                                {selectedFile && (
                                    <div className="absolute bottom-3 left-3 text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-md flex items-center shadow-sm">
                                        <Camera size={12} className="mr-1.5" />
                                        {selectedFile.name.length > 20 ? selectedFile.name.substring(0, 20) + '...' : selectedFile.name}
                                        <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-red-500 transition-colors">
                                            <X size={12} />
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
                                    
                                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
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
                                    disabled={isSubmitting || (!inputText.trim() && !selectedFile)}
                                    className="flex-1 max-w-[140px] flex items-center justify-center space-x-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><span>분석하기</span><Send size={18} /></>}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-5">
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
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                                            placeholder={`${col.name} 입력`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center">
                                <button 
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="w-full max-w-lg flex items-center justify-center space-x-2 h-14 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><span>데이터 저장하기</span><Check size={20} /></>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
