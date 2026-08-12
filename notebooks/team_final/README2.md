# notebooks/team_final/

팀의 여러 코드 조각을 하나의 **실행 가능한 순서**로 정리한 "정리본"입니다. 원본 조각과 다른 점:
- 실행 순서를 데이터 흐름대로 재배치 (매핑 → 전처리 → 밸런스 → 뉴비 군집)
- 환경 이슈(한글 폰트, 패키지 설치)를 상단에서 한 번만 처리하도록 통합
- 정의되지 않은 변수를 참조하는 깨진 셀은 제외(대신 `../individual/`에 원본 그대로 보존 + 재구성 추정 코드를 주석으로 첨부)

실행 순서:
1. `01_character_mapping_and_dashboard_prep.ipynb`
2. `02_balance_and_newbie_analysis_consolidated.ipynb`

원본과 무엇이 다른지 궁금하면 `../individual/00_source_notebook_original_asis.ipynb`(원본 그대로)와 비교하세요.
