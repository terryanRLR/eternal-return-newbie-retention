# dashboards/

두 개의 완결형 정적 HTML 대시보드입니다. 빌드 과정 없이 브라우저에서 파일을 직접 열면 바로 동작합니다 (`open eternal_return_dashboard_internal.html` 또는 더블클릭).

| 파일 | 용도 | 대상 |
|---|---|---|
| `eternal_return_dashboard_internal.html` | 사내 종합 대시보드 (3-tab: 임원진/기획자/밸런스팀) | 슬라이드 Part 1~3 |
| `eternal_return_dashboard_user.html` | 초보 유저용 가이드 (5-tab: 실험체/지역/능력/파티/추천 + TTS 내레이션) | 슬라이드 Part 4 |

전체 구현 방식(기술 스택, 데이터 스키마, 탭별 기능)은 **[`../docs/05_dashboard_architecture.md`](../docs/05_dashboard_architecture.md)** 에 상세히 정리되어 있습니다.

## features/
두 대시보드의 JS를 **기능 단위로 잘라 정리한 코드 참조 파일들**입니다. 원본 HTML은 빌드 없는 단일 파일이라 압축/한 줄 스타일로 되어 있는데, 여기서는 기능별로 실제 함수/차트 정의 코드를 그대로 추출해 주석과 함께 재배치했습니다 (내용 수정 없음, 괄호/중괄호 매칭으로 잘라낸 원본 그대로).

- `user_dashboard_01_tts_narration.js` — TTS 내레이션 (Web Speech API)
- `user_dashboard_02_charts_radar_pie.js` — 캔버스 기반 레이더/파이 차트
- `user_dashboard_03_map_interaction.js` — 지역 지도 상호작용 (승률 도트 + 이동 경로 화살표)
- `user_dashboard_04_recommendation_engine.js` — 성향별 캐릭터 추천 스코어링
- `user_dashboard_05_tabs_filters_i18n.js` — 탭/필터/다국어
- `internal_dashboard_01_tabs_and_chart_helpers.js` — 탭 전환 + Chart.js 공용 헬퍼(`valLabel` 등)
- `internal_dashboard_02_exec_charts.js` — 임원진 탭 차트 5종
- `internal_dashboard_03_planner_charts.js` / `_03b_craft_chart_helper.js` — 기획자 탭 차트
- `internal_dashboard_04_balance_quadrant_and_shap.js` / `_04b_balance_quadrant_chart.js` / `_04c_quadrant_chart_plugins.js` — 밸런스팀 탭(사분면 산점도 + SHAP 카드)

이 파일들은 실행 가능한 독립 스크립트가 아니라 **원본 HTML 안의 코드를 읽기 좋게 잘라낸 레퍼런스**입니다. 실제로 동작을 보려면 원본 `.html` 파일을 브라우저에서 열어야 합니다.
