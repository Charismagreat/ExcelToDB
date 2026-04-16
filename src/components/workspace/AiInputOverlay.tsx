import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { confirmWorkspaceDataAction, deleteWorkspaceItemAction, searchAutocompleteTagsAction } from '@/app/workspace/actions';
import { 
    Trash2, Tag, User as UserIcon, Settings, Package, Hash,
    X, Mic, Camera, Send, Loader2, Check, ArrowLeft, AlertCircle, Plus, FileText 
} from 'lucide-react';

interface AiInputOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string, files: File[], lat?: number, lng?: number) => Promise<any>;
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
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        // 위치 정보 수집 로직 (백그라운드에서 조용히 수행)
        if (typeof window !== 'undefined' && navigator.geolocation && isOpen) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log(`[Geolocation] Location captured: ${pos.coords.latitude}, ${pos.coords.longitude}`);
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    console.warn('[Geolocation] Failed to capture location:', err.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [isOpen]);
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

    // 자동완성 관련 상태
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [triggerChar, setTriggerChar] = useState('#');
    const editorRef = useRef<HTMLDivElement>(null);

    // 태그를 시각적 칩으로 변환하는 헬퍼 (HTML 문자열 반환)
    const getChipHtml = (type: string, name: string) => {
        let colorClass = "bg-blue-100 text-blue-600 border-blue-200";
        if (type === '사원' || type === '거래처직원') colorClass = "bg-amber-100 text-amber-600 border-amber-200";
        else if (type === '부서') colorClass = "bg-indigo-100 text-indigo-600 border-indigo-200";
        else if (type === '거래처') colorClass = "bg-emerald-100 text-emerald-600 border-emerald-200";

        const iconHtml = (type === '사원' || type === '거래처직원') ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' :
                         (type === '부서') ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' :
                         (type === '거래처') ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>' :
                         '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';

        return `<span contenteditable="false" data-tag="true" data-type="${type}" data-name="${name}" class="inline-flex items-center px-2 py-0.5 rounded-md border text-[13px] mx-0.5 shadow-sm align-baseline ${colorClass}">${iconHtml}${name}</span>`;
    };

    const parseTextToHtml = (text: string) => {
        return text.split(/(\[.*?:.*?\])/g).map(part => {
            const match = part.match(/^\[(.*?):(.*?)]$/);
            if (match) return getChipHtml(match[1], match[2]);
            return part;
        }).join('');
    };

    const parseHtmlToText = (html: string) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        let text = '';
        temp.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.dataset.tag === 'true') {
                    text += `[${el.dataset.type}:${el.dataset.name}]`;
                } else {
                    text += el.innerText;
                }
            }
        });
        return text;
    };

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

    useEffect(() => {
        if (isOpen && editorRef.current && !editorRef.current.innerHTML.trim() && inputText) {
            editorRef.current.innerHTML = parseTextToHtml(inputText);
        }
    }, [isOpen, inputText]);

    // 실시간 자동완성 처리 (ContentEditable용)
    useEffect(() => {
        const timer = setTimeout(async () => {
            console.log(`[AiInputOverlay] suggestionQuery changed: "${suggestionQuery}", trigger: "${triggerChar}"`);
            if (suggestionQuery && suggestionQuery.length >= 2) { 
                try {
                    // 기호가 있으면 제외한 순수 검색어, 없으면 단어 전체 사용
                    const query = triggerChar ? suggestionQuery.substring(1) : suggestionQuery;
                    console.log(`[AiInputOverlay] Calling searchAutocompleteTagsAction with query: "${query}", trigger: "${triggerChar}"`);
                    const results = await searchAutocompleteTagsAction(query, triggerChar);
                    console.log(`[AiInputOverlay] Results received: ${results.length}`);
                    setSuggestions(results);
                    setShowSuggestions(results.length > 0);
                    setActiveSuggestionIndex(0);
                } catch (err) {
                    console.error('[AiInputOverlay] searchAutocompleteTagsAction failed:', err);
                }
            } else {
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [suggestionQuery, triggerChar]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!inputText.trim() && selectedFiles.length === 0) return;
        setIsSubmitting(true);
        try {
            const result = await onSubmit(inputText, selectedFiles, location?.lat, location?.lng);
            
            if (result && result.success) {
                if (result.isBatch || result.isUnclassified) {
                    // 일괄 등록 또는 즉시 등록의 경우 즉시 홈 피드로 이동하여 상태 확인
                    router.push('/workspace');
                    setTimeout(() => router.refresh(), 100); // 데이터 갱신 보장
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


    const handleEditorInput = () => {
        if (!editorRef.current) return;
        
        const html = editorRef.current.innerHTML;
        const text = parseHtmlToText(html);
        setInputText(text);

        // 현재 선택(커서) 위치 찾기
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || '';
        
        // '@' 또는 '#' 감지 로직
        const match = textBeforeCursor.match(/([@#][^\s@#]*)$/);
        // 기호가 없는 경우: 한글 기준 2글자 이상의 단어 감지 (암시적 트리거)
        const ambientMatch = textBeforeCursor.match(/([^\s@#]{2,})$/);

        if (match) {
            const fullMatch = match[0];
            const trigger = fullMatch[0];
            setTriggerChar(trigger);
            setSuggestionQuery(fullMatch);
        } else if (ambientMatch) {
            const word = ambientMatch[0];
            setTriggerChar(null); // 기호 없음 표시
            setSuggestionQuery(word);
        } else {
            setSuggestionQuery('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionSelect = (suggestion: any) => {
        if (!editorRef.current) return;
        
        // 1. 데이터(Value) 레벨에서 텍스트 교체 (기존 기호를 새로운 태그로 치환)
        // 현재 제안된 쿼리(@박 등)가 포함된 문장의 마지막 위치를 정확히 교체
        const lastTriggerIndex = inputText.lastIndexOf(suggestionQuery);
        if (lastTriggerIndex === -1) return;

        const textBefore = inputText.substring(0, lastTriggerIndex);
        const textAfter = inputText.substring(lastTriggerIndex + suggestionQuery.length);
        const tagText = `[${suggestion.type}:${suggestion.name}] `;
        const newText = textBefore + tagText + textAfter;

        // 2. 가치 중심의 동기화: 텍스트 상태 업데이트 및 HTML 전체 재랜더링
        setInputText(newText);
        editorRef.current.innerHTML = parseTextToHtml(newText);

        // 3. 커서 위치 복구 (문장 맨 끝으로)
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // UI 상태 초기화
        setShowSuggestions(false);
        setSuggestionQuery('');
        editorRef.current.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSuggestionSelect(suggestions[activeSuggestionIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
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
                            {isReviewing ? (reportName ? `${reportName} 확인` : '데이터 확인') : '새로운 데이터 입력'}
                            {aiData.status === 'completed' && <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">완료</span>}
                            {aiData.status === 'deleted' && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">삭제</span>}
                            {aiData.status === 'blocked' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">차단됨</span>}
                            {aiData.status === 'unresolved' && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">미분류</span>}
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
                            
                            <div className="relative bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                                <div
                                    ref={editorRef}
                                    contentEditable={!isSubmitting}
                                    onInput={handleEditorInput}
                                    onKeyDown={handleKeyDown}
                                    className="w-full min-h-[128px] max-h-64 p-4 bg-transparent outline-none text-gray-800 leading-relaxed overflow-y-auto no-scrollbar relative z-10"
                                    data-placeholder="예: 오늘 @박대리 님이랑 #삼진정밀 다녀옴"
                                />
                                {!inputText && (
                                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none font-medium">
                                        예: 오늘 @박대리 님이랑 #삼진정밀 다녀옴
                                    </div>
                                )}

                                {/* 🏷️ 자동완성 추천 리스트 UI */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-[70] bottom-full left-0 mb-2 w-full max-w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                {!triggerChar ? '✨ 지능형 태그 제안' : '자동 완성 추천'}
                                            </span>
                                            {triggerChar ? <Hash size={12} className="text-blue-400" /> : <Tag size={12} className="text-blue-400" />}
                                        </div>
                                        <div className="max-h-[240px] overflow-y-auto no-scrollbar">
                                            {suggestions.map((s, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => handleSuggestionSelect(s)}
                                                    className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                                                        idx === activeSuggestionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${
                                                            s.type === '사원' ? 'bg-amber-100 text-amber-600' :
                                                            s.type === '부서' ? 'bg-indigo-100 text-indigo-600' :
                                                            s.type === '거래처' ? 'bg-emerald-100 text-emerald-600' :
                                                            'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {s.type === '사원' ? <UserIcon size={14} /> :
                                                             s.type === '부서' ? <Settings size={14} /> :
                                                             s.type === '거래처' ? <Tag size={14} /> :
                                                             <Package size={14} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-800">{s.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{s.sub}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-300 uppercase">{s.type}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
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

                            {/* blocked 상태: 차단 이유 + AI 추천 정보 표시 */}
                            {aiData.status === 'blocked' && (
                                <div className="bg-red-50 p-4 rounded-2xl flex items-start space-x-3 border border-red-100">
                                    <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-red-700 font-bold leading-relaxed">🔴 가드레일 정책에 의해 차단된 항목입니다.</p>
                                        <p className="text-xs text-red-500 mt-1">관리자에게 예외 처리를 요청하거나, 데이터를 수정 후 다시 제출해 주세요.</p>
                                    </div>
                                </div>
                            )}

                            {/* unresolved 상태: 매칭 테이블 없음 안내 */}
                            {aiData.status === 'unresolved' && (
                                <div className="bg-orange-50 p-4 rounded-2xl flex items-start space-x-3 border border-orange-100">
                                    <AlertCircle size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-orange-700 font-bold leading-relaxed">⚠️ 저장할 테이블이 없습니다.</p>
                                        <p className="text-xs text-orange-500 mt-1">관리자에게 테이블 생성을 요청하거나, 직접 올바른 테이블을 선택해 주세요.</p>
                                        {/* AI 추천 표시 */}
                                        {aiData._recommendation && (
                                            <div className="mt-2 bg-white p-2 rounded-lg border border-orange-200">
                                                <p className="text-[10px] text-orange-600 font-black uppercase tracking-wider">🤖 AI 추천</p>
                                                <p className="text-xs text-gray-700 mt-1">"<strong>{aiData._recommendation.tableName}</strong>" 테이블 생성 필요</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{aiData._recommendation.advice}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 일반 AI 분석 안내 (정상 상태) */}
                            {(!aiData.status || (aiData.status !== 'blocked' && aiData.status !== 'unresolved')) && (
                            <div className="bg-blue-50 p-4 rounded-2xl flex items-start space-x-3 border border-blue-100">
                                <AlertCircle size={20} className="text-blue-500 mt-0.5" />
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    AI가 영수증에서 데이터를 추출했습니다.<br/>
                                    <strong>비어있거나 잘못된 내용</strong>이 있다면 직접 수정해 주세요.
                                </p>
                            </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {columns.filter(col => !col.isAutoGenerated).map((col) => (
                                    <div key={col.name} className="flex flex-col space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">{col.name}</label>
                                        <input
                                            type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                            value={aiData[col.name] || ''}
                                            onChange={(e) => handleFieldChange(col.name, e.target.value)}
                                            readOnly={['completed', 'deleted', 'blocked'].includes(aiData.status) || ['completed', 'deleted', 'blocked'].includes(initialData?.status)}
                                            className={`w-full px-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium ${
                                                (['completed', 'deleted', 'blocked'].includes(aiData.status) || ['completed', 'deleted', 'blocked'].includes(initialData?.status))
                                                ? 'bg-gray-100 text-gray-500 cursor-default' 
                                                : 'bg-gray-50 text-gray-800'
                                            }`}
                                            placeholder={`${col.name} 입력`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center space-x-3">
                                {(!aiData.status || (aiData.status !== 'completed' && aiData.status !== 'deleted' && aiData.status !== 'blocked')) ? (
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

