# KT 유선 정책 자동화 (직원용)

## 1) 실행
- 로컬: index.html 더블클릭
- GitHub Pages: 폴더째 업로드(또는 ZIP 해제 후 그대로 업로드)

## 2) 정책 변경(엑셀 반영)
1. 엑셀 파일을 최신으로 저장(계산값 포함)
2. 아래 명령으로 JSON 재생성:
   python tools/convert_from_excel.py "유선정책 단가도해 함수.xlsx"
3. 생성된 data/wired_policy.json만 GitHub에 올리면 자동 반영

## 3) 표기 규칙
- 외부 노출 단어(공시/지원금) 미사용
- 화면에는 기본정책/결합정책/U정책/합계 형태로만 노출
