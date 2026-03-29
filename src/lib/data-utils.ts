/**
 * 엑셀 데이터 중에서 소계, 합계, 총계 등 집계 행인지 여부를 판별합니다.
 */
export function isSubtotalRow(row: any): boolean {
  if (!row) return false;

  // 행의 모든 값을 문자열로 합쳐서 키워드가 포함되어 있는지 확인
  const rowString = typeof row === 'object' 
    ? Object.values(row).join(' ').toLowerCase() 
    : JSON.stringify(row).toLowerCase();

  const keywords = [
    '소계', 
    '합계', 
    '총계', 
    '계', 
    '누계', 
    'total', 
    'subtotal', 
    'grand total', 
    'sum',
    'g.total'
  ];

  // 단독으로 '계'만 있는 경우나 '소계', '합계' 등이 포함된 경우를 체크
  // 하지만 '계좌', '계획' 등의 단어에 '계'가 포함될 수 있으므로 주의가 필요함.
  // 보통 집계 행은 해당 셀에 해당 키워드만 있거나 공백과 함께 있음.
  
  return keywords.some(keyword => {
    // 공백 제거하고 소문자로 변환하여 비교
    const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();

    if (typeof row === 'object') {
      return Object.values(row).some(val => {
        if (!val) return false;
        const s = String(val).replace(/\s+/g, '').toLowerCase();
        
        // '계' 같은 짧은 키워드는 정확히 일치하거나 특정 접두사/접미사와 결합된 경우만 확인
        if (normalizedKeyword === '계') {
          return s === '계' || s === '합계' || s === '총계' || s === '소계' || s === '누계';
        }
        
        // 그 외 키워드는 포함 여부 확인
        return s.includes(normalizedKeyword);
      });
    }
    
    const s = JSON.stringify(row).replace(/\s+/g, '').toLowerCase();
    return s.includes(normalizedKeyword);
  });
}
