# 05. 대시보드 구현 아키텍처

이 문서는 (Notion/코드와 달리) **실제 파일이 남아있는** 두 대시보드를 직접 열어서 역공학한 결과입니다. 즉 아래 내용은 추정이 아니라 `dashboards/` 폴더의 실제 소스코드 기준입니다. 기능별 원본 코드는 `dashboards/features/*.js`에 그대로 추출해 두었습니다.

두 대시보드는 **완전히 다른 기술 스택**을 씁니다.

| | 사내 종합 대시보드 | 유저용 대시보드 |
|---|---|---|
| 파일 | `dashboards/eternal_return_dashboard_internal.html` | `dashboards/eternal_return_dashboard_user.html` |
| 원본 타이틀 | 이터널리턴 — 사내 종합 대시보드 | 이터널 리턴 쌩뉴비 가이드 v25.1 |
| 대상 | 임원진 / 기획자 / 밸런스팀 (PDF 슬라이드 Part1~3) | 초보 유저 (PDF 슬라이드 Part4) |
| 탭 구조 | 3-tab (exec / plan / bal) | 5-tab (실험체·지역·능력·파티·추천) + 설정 |
| 차트 엔진 | **Chart.js 4.4.1** (CDN) | **직접 구현한 Canvas 2D 차트** (외부 차트 라이브러리 없음) |
| 폰트 | Pretendard (CDN) | GmarketSans + Noto Sans KR (CDN) |
| 데이터 로딩 | `fetch()` 없음. 모든 데이터가 `<script>` 내 JS 상수로 하드코딩 (`const D`, 259행 한 줄) | 동일하게 하드코딩 (`RAW_DATA`/`PATCH_DATA`/`EXTRA_DATA`/`PATCH_AVG_RADAR`, 2361~2364행) |
| 접근성 | `role="tablist"`/`tab`/`tabpanel` · 방향키·Home/End 로 탭 이동 · 로빙 tabindex | `aria-*` 92 · `role` 34 · 시맨틱 버튼 39 |
| 특수 기능 | 없음(정적 리포트형) | Web Speech API 기반 TTS 내레이션, 다국어(KOR/ENG/JPN), 다크모드 |
| 파일 크기 | **약 158KB** (원래 388KB — SHAP 이미지 3장이 81.8%를 차지해 64색 양자화로 −59%) | 약 409KB (대부분 데이터) |

두 파일 모두 **빌드 도구 없이 단일 HTML 파일로 완결**되어 있습니다(번들러/프레임워크 없음, 순수 vanilla JS). 데이터 소스인 CSV → 이 JS 상수로 어떻게 변환됐는지의 스크립트는 레포에 남아있지 않습니다 (`02_analysis_pipeline.md` [4]절, `03_issues_and_troubleshooting.md` 참고).

---

## A. 사내 종합 대시보드 (`eternal_return_dashboard_internal.html`)

### A-1. 구조
```html
<header class="hd">           <!-- 타이틀 + 3개 탭(exec/plan/bal) -->
<div id="exec" class="page">  <!-- PART 1. 임원진 -->
<div id="plan" class="page">  <!-- PART 2. 기획자 -->
<div id="bal"  class="page">  <!-- PART 3. 밸런스팀 -->
<footer id="ftteam">
```
탭 전환은 `document.querySelectorAll('.tab')`에 리스너를 걸어 `.page.on` 클래스를 토글하는 단순한 방식입니다(라우터 없음).
처음에는 `<div>` 에 **클릭 리스너만** 걸려 있어 키보드로는 탭을 바꿀 수 없었고 `aria-*` 속성도 0개였습니다 — 지금은 `activateTab()` 이 `aria-selected` 와 로빙 `tabindex` 를 함께 갱신하고, `keydown` 에서 ←→↑↓·Home·End·Enter·Space 를 처리합니다. → `dashboards/features/internal_dashboard_01_tabs_and_chart_helpers.js`

### A-2. 데이터 스키마 — `const D = {...}`
전체 대시보드가 단 하나의 최상위 객체 `D`를 참조합니다. 실제로 파싱해 확인한 최상위 키:

| 키 | 내용 | 사용 탭 |
|---|---|---|
| `proj` | 총 매치수/유저수/평균플레이횟수/평균시간 | exec |
| `mode` | [모드명, 비중%] 목록 (일반 스쿼드 94.28%, 코발트 5.72%) | exec |
| `premade` | [구성유형, 비중%] (솔로큐/듀오/풀 프리메이드) | exec |
| `premade_time` | 구성별 평균 플레이시간 | exec |
| `playcount` | [구간, 비중%, 유저수] (1회/2~3회/4~5회/6회+) | exec |
| `retention` | [레벨구간, 재방문율%] (1~10 ~ 100+) | exec |
| `top10` | [캐릭터명, 선택유저수] TOP10 | exec |
| `newbie` | 뉴비 요약(유저수/비중/평균순위/시간/승률/포기율) | plan |
| `newtime` | 뉴비 플레이타임 구간별 유저수 | plan |
| `shap` | SHAP-유사 기여도 목록(몬스터처치/제작/보안콘솔 등) | plan(이탈 원인 순위) |
| `clusterTable` | K-means 4개 군집 요약(id/type/n/early/win/rank/note/color/improve) | plan |
| `craft_rank` | 제작 횟수 구간별 평균등수/생존시간/승률 | plan |
| `death_area` | 지역별 사망수/비중/평균생존시간/주요사망원인 | plan |
| `bchars` | **캐릭터 74종 전체**의 세부 스탯(pick/win/top3/kda/rank/surv) | plan/bal 공용 |
| `cbal` | 밸런스 분류 결과(픽률/승률/`flag`=너프후보(OP)/숙련자형/신중검토/버프후보/정상) | bal |
| `shap_cards` | 캐릭터별 SHAP 해석 카드(무엇이 이상한가/해석/처방) + `shapimg`(사전 렌더링된 SHAP 플롯, data URI 인라인) | bal |
| `cmeta` | 밸런스 분석 메타(매치수 등, `m1`~`m3` 카드) | bal |

> `D.cbal[i].flag` 값이 곧 `03_issues_and_troubleshooting.md` #6에서 설명한 "이상치 ≠ 즉시 너프" 4분류(너프 후보(OP) / 숙련자형 / 신중 검토 / 버프 후보)의 실제 구현입니다.

### A-3. 탭별 차트 목록 (Chart.js canvas id)
- **PART1 임원진**: `cPlay`(플레이횟수 분포) · `cRet`(재방문율 라인) · `cPre`/`cPreTime`(팀 구성 비율/시간) · `cTop`(캐릭터 TOP10 바) → `dashboards/features/internal_dashboard_02_exec_charts.js`
- **PART2 기획자**: `cNewt`(뉴비 플레이타임 구간) · `cCraft510`/`cCraft1015`(제작 구간 비교, `craftChart()` 공용 헬퍼 재사용) · `cStart`(출발구역별 생존성과) · `cDeath`(출발×사망 히트맵) · `cParty`(파티 규모별 생존) · `cUtil`(보조장치 사용 생존) · `clusTab`(K-means 군집 요약, Chart.js가 아니라 순수 HTML 테이블로 렌더링) → `dashboards/features/internal_dashboard_03_planner_charts.js`, `internal_dashboard_03b_craft_chart_helper.js`
- **PART3 밸런스팀**: `cQuad`(승률×픽률 사분면 산점도, 커스텀 배경 밴드 플러그인 `band` + 포인트 라벨 플러그인 `ptLabel`) · `grpWrap`/`qleg`(사분면 그룹별 캐릭터 칩) · `nerfRow`/`buffRow`(너프·버프 후보 카드, 공용 템플릿 함수 `chq()`) · `shapWrap`(SHAP 해석 카드) → `dashboards/features/internal_dashboard_04_balance_quadrant_and_shap.js`, `_04b_balance_quadrant_chart.js`, `_04c_quadrant_chart_plugins.js`

### A-4. 공용 Chart.js 커스터마이징
기본 Chart.js에 없는 표현(막대 위 값 라벨, 격자선 색 통일, 사분면 배경 밴드)은 전부 **커스텀 플러그인**으로 구현되어 있습니다:
- `gx`/`ny` : 공통 축 스타일 상수
- `valLabel(fmt)` : 막대 차트 위에 값을 그려주는 `afterDatasetsDraw` 플러그인 (모든 바 차트가 재사용)
- `band` : 사분면 배경을 4색으로 나눠 그리는 플러그인 (`cQuad` 전용)
- `ptLabel` : 산점도 포인트 옆에 캐릭터명을 그려주는 플러그인 (`cQuad` 전용)

---

## B. 유저용 대시보드 (`eternal_return_dashboard_user.html`)

### B-1. 구조 (5탭 + 설정)
```
실험체(char) │ 지역(place) │ 능력(ability) │ 파티(party) │ 추천(rec)       [⚙ 설정]
```
`switchTab(name)`이 `data-tab` 속성 매칭으로 패널을 전환하고, 탭이 처음 열릴 때만 렌더링하는 지연 렌더링(`renderTabIfNeeded`)을 씁니다. → `dashboards/features/user_dashboard_05_tabs_filters_i18n.js`

전역 필터 2종이 모든 탭에 공통 적용됩니다:
- **범위 필터**: 전체 / 초보자 (`App.filter`) — 모든 데이터 필드에 `beg_` 접두사 버전이 쌍으로 존재 (예: `winRate` vs `beg_winRate`)
- **패치 필터**: 전체 / 22.1 / 23.0 (`getPatchData()`가 `RAW_DATA` 또는 `PATCH_DATA["22.1"|"23.0"]`을 선택)

### B-2. 데이터 스키마
네 개의 최상위 상수를 사용합니다.

**`RAW_DATA` / `PATCH_DATA["22.1"|"23.0"]`** (동일 스키마, 패치별로 중복 저장):
| 키 | 내용 |
|---|---|
| `chars[]` | 캐릭터 74종 × (승률/Top3율/KDA/픽률/표본수 + 초보자 버전 `beg_*` + 능력치 12종: HP/SP/공격력/방어력/공속/이동속도/사거리/쿨감/대인딜/팀회복) |
| `places[]` | 시작지역별 승률/Top3율/표본수 (+ 초보자 버전) |
| `premade[]` | 파티 규모(1/2/3인)별 승률/Top3율 |
| `ability[]` | 능력치별 승률·Top3율 상관계수(`win_corr`/`top3_corr` + 초보자 버전) — 능력 탭의 "핵심 능력치 가이드"·기여도 계산 원천 |
| `overall_wr` | 전체 평균 승률 (기준선) |

**`EXTRA_DATA = {F, D, T}`** (각각 `{all, "22.1", "23.0"}` 로 패치별 저장, 배열 내부는 `[전체, 초보자]` 순서):
| 키 | 내용 | 사용처 |
|---|---|---|
| `F` (Flow) | `[시작지역, 사망지역, 표본수, 승수, Top3수]` 격자 데이터 | 지역 탭의 이동 경로 화살표(`getFlowsForStart`) |
| `D` (Death) | 지역코드 → 사망률(dict) | 지역 탭 히트 도트 색상(`getExtraDeathRates`) |
| `T` (Tendency) | 캐릭터ID → `[전투,방어,회복,지원,시야,사냥,성장,금전,제작,이동, 표본수, 승률, Top3율]` 13개 값 배열 | 추천 탭 성향 스코어링(`getExtraTendency`) |

**`PATCH_AVG_RADAR = {"22.1", "23.0", "all"}`** — 각 키에 **10개 값 배열**이 들어 있고, 순서가
`RADAR_KEYS`(2321행)와 1:1로 대응합니다:

```js
const RADAR_KEYS = ['maxHp','maxSp','attackPower','defense','attackSpeed',
                    'moveSpeed','attackRange','coolDownReduction',
                    'damageToPlayer','teamRecover'];
```

실험체 탭 레이더 차트가 **비교 기준선(전체 평균)** 으로 쓰는 값입니다 —
`const patchAvg = PATCH_AVG_RADAR[App.patch] || PATCH_AVG_RADAR.all;` (2769행).
즉 패치 필터를 바꾸면 캐릭터 다각형뿐 아니라 **기준선도 함께 갈립니다.**

### B-3. 탭별 핵심 기능 → 코드 위치
| 탭/기능 | 설명 | 코드 파일 |
|---|---|---|
| 설정 › TTS 내레이션 | KOR/ENG/JPN 음성 선택, 속도/음량 조절, Web Speech API로 탭 설명을 읽어줌 | `dashboards/features/user_dashboard_01_tts_narration.js` |
| 실험체 탭 › 레이더 차트 | 캐릭터 능력치를 **10각** 레이더로 시각화 (`PATCH_AVG_RADAR` 기준선과 겹쳐 비교), **Chart.js 없이 canvas에 직접 그림** · `prefers-reduced-motion` 존중 | `dashboards/features/user_dashboard_02_charts_radar_pie.js` |
| 능력 탭 › 파이 차트 | 승률/Top3율 기여도를 도넛형 파이로 표시, 커스텀 툴팁 | `dashboards/features/user_dashboard_02_charts_radar_pie.js` |
| 지역 탭 › 지도 상호작용 | 지역별 승률 도트(초록→빨강), 클릭 시 주요 이동 경로를 실선/점선 화살표로 표시 | `dashboards/features/user_dashboard_03_map_interaction.js` |
| 추천 탭 › 성향별 추천 | 10개 성향(⚔전투/🛡방어/💚회복/🎯지원/👁시야/🐾사냥/📈성장/💰금전/🔧제작/💨이동) 중 선택 시 TOP5 캐릭터 스코어링 | `dashboards/features/user_dashboard_04_recommendation_engine.js` |
| 공통 › 탭/필터/다국어 | 5탭 전환, 전체·초보자/패치 필터, KOR·ENG·JPN 화면 언어(`t()` 라벨 딕셔너리) | `dashboards/features/user_dashboard_05_tabs_filters_i18n.js` |

### B-4. 추천 스코어링 공식 (실제 코드 기준)
```js
score = normalize(성향지표) * 0.40 + normalize(승률) * 0.35 + normalize(Top3율) * 0.25
```
`computeTiers()`가 이 점수로 S/A/B/C 등 티어를 매기고, `renderRecTab()`이 선택된 성향(`_selectedTendency`)에 따라 TOP5를 뽑아 카드로 렌더링합니다.

---

## C. 두 대시보드가 공유하는 것 / 공유하지 않는 것

- **공유함**: 캐릭터 74종 매핑(한글명/영문명/역할군), 패치 22.1·23.0 구분, 뉴비=초보자 세그먼트 개념.
- **공유하지 않음**: 데이터 스키마가 완전히 다릅니다 (`D.bchars[]` vs `RAW_DATA.chars[]`는 필드명도 다름 — 예: 내부용은 `char`/`en`, 유저용은 `id` 기반). 즉 **동일 소스 CSV에서 각 대시보드용으로 별도 집계 스크립트가 두 번 돌았을 가능성이 높습니다** (하나의 공용 ETL 산출물을 재사용한 흔적이 없음). 이는 유지보수 관점에서 리스크입니다 — 두 대시보드의 캐릭터 통계가 향후 미세하게 어긋날 수 있음. `03_issues_and_troubleshooting.md`에 후속 이슈로 등록해도 좋습니다.

## D. 이 데이터를 재생성하려면
`dashboards/features/`의 필드 목록을 참고해 원본 CSV(`EternalReturn_kakaogames_2024_character_added.csv`, `02_analysis_pipeline.md` [1] 산출물)에서 아래 순서로 재현을 시도할 수 있습니다:
1. `matchingTeamMode==3`(일반 스쿼드) / 코발트 분리 → `D.mode`, `RAW_DATA` 등 계산
2. `versionMajor`로 패치별 분리 → `PATCH_DATA["22.1"/"23.0"]`
3. `accountLevel≤60 & rankPoint==0`(또는 K-means Cluster 0·3) → `beg_*` 필드
4. `placeOfStart`×`placeOfDeath` 교차표 → `EXTRA_DATA.D`, `F`
5. 캐릭터별 능력치 스탯(HP/SP/공격력 등)은 원본 CSV에 없다면 별도의 캐릭터 스탯 마스터 테이블과 조인이 필요합니다 — 원본 CSV 구조가 없어 이 부분 소스는 확인 불가.

이 재현 스크립트 자체는 아직 작성되지 않았습니다. 필요하면 `notebooks/team_final/`에 `03_dashboard_data_export.ipynb` 같은 이름으로 추가하는 것을 권장합니다.
