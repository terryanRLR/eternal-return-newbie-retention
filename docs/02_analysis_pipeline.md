# 02. 분석 파이프라인

이 문서는 원본 CSV(`EternalReturn_kakaogames_2024.csv`)부터 최종 대시보드 2종까지 데이터가 어떤 단계를 거쳤는지, 실제로 남아있는 코드(`이터널리턴_코드_정리.ipynb`)와 슬라이드/부록에 남은 산출물 근거를 기준으로 역추적한 것입니다.

**중요**: 원본 코드가 팀원별로 정리되지 않고 일부만 남아 있어, 아래 파이프라인은 (a) 실제 코드가 남아있는 구간과 (b) 슬라이드·부록·대시보드에 남은 "결과물"로부터 역산해 구조만 추론한 구간을 **구분해서** 표기합니다. (b)는 실행 가능한 코드가 아니라 "이런 처리가 있었을 것"이라는 재구성이므로 맹신하지 말 것.

```
[원본 CSV: EternalReturn_kakaogames_2024.csv]
        │  (228개 컬럼, 204,425 rows, 11,075 matches, 92,705 users)
        ▼
[1] 캐릭터 매핑 (characterNum → 이름/역할군)          ── 코드 O (노트북 cell 1-6)
        ▼
[2] 역할별 대시보드용 컬럼 필터링                       ── 코드 O (노트북 cell 8)
        ├──▶ [3a] 밸런스팀 분석: Isolation Forest + SHAP   ── 코드 O (노트북 cell 10-15)
        ├──▶ [3b] 기획자 분석: 뉴비 정의 + K-means 행동군집 ── 코드 O (노트북 cell 17-18, 일부 단편)
        └──▶ [3c] 기타 EDA: 사망 원인별 승률/Top3 비교      ── 코드 O (노트북 cell 20, 단편)
        ▼
[4] 대시보드용 집계 JSON 생성                          ── 코드 없음 (결과물 역산, 아래 참고)
        ├──▶ dashboards/eternal_return_dashboard_internal.html  (임원/기획/밸런스 3-tab)
        └──▶ dashboards/eternal_return_dashboard_user.html      (유저용 5-tab 가이드)
        ▼
[5] 발표 자료(PPT/PDF) + Notion 인사이트 문서
```

---

## [1] 캐릭터 매핑 — `notebooks/team_final/01_character_mapping.ipynb`
- **입력**: `EternalReturn_kakaogames_2024.csv` (원본)
- **처리**: `characterNum`(1~74) → `character_name_en`, `character_name_kr`, `character_role` 매핑 딕셔너리(74개 캐릭터 전수) 적용
- **검증 스텝**: `character_name_kr`이 NaN인 행의 `characterNum`을 모아 매핑 누락 여부 확인 (`unmapped` 변수) — 실제 코드에 남아있는 유일한 "자체 검증" 로직
- **출력**: `EternalReturn_kakaogames_2024_character_added.csv` (Google Colab 환경에서 `files.download()`로 반출)
- 이후 모든 분석은 이 파일을 `CSV_PATH`로 재사용함 (cell 10, 11, 17에서 동일 파일명 참조)

## [2] 역할별 대시보드 전처리 — `notebooks/team_final/02_dashboard_column_selection.ipynb`
- **목적**: 228개 원본 컬럼 중 "임원진·실무자 전용 대시보드"에 필요한 컬럼만 추출 (`keep_columns` 리스트, 중복 제거 후 사용)
- 컬럼은 4개 그룹으로 주석 구분되어 있음:
  - 기본 컬럼 (matchingTeamMode, characterLevel, serverName, gameId, userNum, premadeMatchingType, botAdded, characterNum, bestWeapon, gameRank, victory, playerKill, rankPoint, damageToPlayer 등)
  - 밸런스팀 보조 (playerAssistant, teamKill, totalDoubleKill/TripleKill, killDetails, ccTimeToPlayer, healAmount, bestWeaponLevel, tacticalSkillGroup, traitFirstCore 등)
  - 서비스기획자 핵심 (playTime, survivableTime, placeOfStart, placeOfDeath, useHyperLoop, useSecurityConsole, accountLevel, causeOfDeath, craftUncommon/Rare/Epic/Legend 등)
  - 사업팀 보조 (mmrGainInGame)
- 이 컬럼 그룹 구조가 곧 슬라이드 04 "분석 범위" (임원진: 전체 유저 로그 / 기획·밸런스: 일반모드 유저 로그, 코발트 별도 분리)와 대응됨.

## [3a] 밸런스팀: Isolation Forest + SHAP — `notebooks/individual/balance_isolation_forest_shap.ipynb`
- **입력**: `EternalReturn_kakaogames_2024_character_added.csv`, `versionMajor == 23` 필터 (패치 23.0만 사용)
- **1단계 — 캐릭터별 집계**: `character_name_kr` 기준 groupby → 표본수/승률/평균등수/평균생존시간/평균딜/평균킬 6개 지표(`METRICS`), 픽률 = 표본수/전체 매치수. 역할 특성상 이상치로 튀는 탱커(알론소, 일레븐)는 `EXCLUDE`로 제외.
- **2단계 — Isolation Forest**: `StandardScaler`로 6개 지표 정규화 → `IsolationForest(n_estimators=400, contamination=0.10, random_state=42)` → 상위 10%를 "이상치"로 표시, `비정상도`(=-score_samples) 산출. 승률이 전체 평균보다 높으면 "너프 검토", 낮으면 "성능 개선 검토"로 1차 분류.
- **3단계 — 산점도 시각화**: 픽률×승률 산점도에 이상치만 캐릭터명 라벨링, `anomaly_scatter.png`로 저장 (밸런스팀 슬라이드 13의 원본 차트).
- **4단계 — SHAP 분석 (승률 예측 모델)**: 전체 이상치 후보 대상 1회(cell 14, 20,000 샘플, feature=[damageToPlayer, playTime, playerKill, monsterKill, craftRare, craftEpic]), 이어서 캐릭터 단위로 재실행 가능한 파라미터화된 버전(cell 15, `TARGET="다르코"`처럼 캐릭터명만 바꿔 재사용). `XGBClassifier`로 승패(`victory`) 이진분류 모델을 학습한 뒤 `shap.TreeExplainer`로 특성 기여도 계산, 상관관계 부호로 "승률↑/↓" 방향까지 표기.
- **산출물 매핑**: 슬라이드 13(다변량 이상치 탐지 표) · 14(나타폰/다르코/샬럿 SHAP 카드) · 부록22(Isolation Forest 결과표 8개 캐릭터)와 1:1 대응.
- **⚠ 코드에 없는 부분**: 슬라이드 15의 "전체 vs 초보 유저 사분면 비교"(마르티나·버니스·셀린·피올로 부각)와 슬라이드 12의 "1차 승률×픽률 사분면 분류(패치 후 117,551건 기준)"는 노트북에 대응 코드가 없음. cell 11-13 구조를 초보 유저 서브셋(`accountLevel` 필터)에 그대로 재적용한 것으로 추정되나 확인 불가 — `03_issues_and_troubleshooting.md` #4 참고.

## [3b] 기획자: 뉴비 정의 + K-means 행동군집 — `notebooks/individual/planner_newbie_kmeans_clustering.ipynb`
- **범위 제한**: `matchingTeamMode == 3`(일반 스쿼드)만 사용 — 코발트 프로토콜 제외.
- **파생 변수**: `earlyLeave`(playTime<600초), `survive10`(playTime≥600초), `routeNotSelected`(routeIdOfStart가 0 또는 -1).
- **유저 단위 집계**: `userNum` groupby → 게임수, 평균 생존시간, 조기이탈률, 10분생존률, 승률, 평균등수, 평균킬/팀킬/몬스터킬, 등급별 제작 평균, 하이퍼루프/보안콘솔/정찰드론 사용률, 루트미선택률, 포기율, 최고 accountLevel/rankPoint.
- **표본 필터**: 1게임만 플레이한 유저는 행동 패턴이 불안정하다고 판단해 군집 분석에서 제외 (`games >= 2`) — 부록 21 슬라이드의 설명과 일치.
- **군집화**: 17개 피처 표준화(`StandardScaler`) 후 `KMeans`, k=2~7 실루엣 점수 비교 → 수치상 최적은 k=2(0.1915)였지만 **기획 실무상 "뉴비/일반/고인물" 등 세분화가 더 유용하다고 판단해 k=4(0.1398, 2번째로 높은 값)를 채택** (부록20 슬라이드 그대로 인용). 자세한 의사결정 배경은 `03_issues_and_troubleshooting.md` #5.
- **출력**: `user_behavior_clusters.csv`(유저 단위 원본+군집 라벨), `user_cluster_summary.csv`(군집별 요약).
- **⚠ 단편 코드 (cell 18)**: `profile_long`이라는 변수를 참조하지만 이를 만드는 코드(아마 군집별 z-score 계산, `feature`/`z_score`/`abs_z` 컬럼 생성)가 노트북에 없음. 부록 21 슬라이드의 "Cluster 0~3 주요 행동패턴 (z=...)" 표와 "feature/cluster_gap" 표가 이 누락된 코드의 산출물로 추정됨. `notebooks/individual/`에는 원본 그대로(미실행 가능 상태) 보존하고, 상단에 재구성 필요 메모를 남겼습니다.
- **⚠ 계정 기준 뉴비 정의와의 관계**: 슬라이드 07에서 언급된 "`accountLevel ≤ 60 AND rankPoint = 0 AND matchingTeamMode = 3`" 조건(계정 기준 1차 선별)을 이 K-means 코드에 적용한 흔적은 없음 — K-means는 계정 레벨 필터 없이 전체 스쿼드 유저(2게임 이상)를 대상으로 돌린 뒤, "Cluster 0(초반 이탈 위험군)·Cluster 3(포기/비정상 이탈군)"을 계정 기준과 별개로 "행동 기반 뉴비/이상 유저"로 해석한 것으로 보임. 두 기준을 어떻게 최종 결합했는지(교집합? 합집합? 병기?)는 코드로 확인되지 않음 — `03_issues_and_troubleshooting.md` #1 참고.

## [3c] 기타 단편 — `notebooks/individual/misc_death_cause_analysis.ipynb`
- `death_stats`라는 DataFrame(컬럼: `Death_Category`, `Win_Rate`, `Top3_Rate`)이 이미 존재한다고 가정하고 `melt` → `seaborn.barplot`으로 시각화하는 코드만 남아 있음. `death_stats`를 만드는 집계 코드는 없음.
- 이 결과물이 어느 슬라이드/문서에 대응되는지 명확한 1:1 매치를 찾지 못했습니다 — 인사이트 문서의 "사망의 87.2%가 플레이어 교전" 서술과 관련 있을 가능성이 높으나 확정 불가.

## [4] 대시보드 집계 JSON — 코드 근거 없음 (역산)
두 HTML 대시보드에는 전처리 코드 없이 **완성된 집계 JSON이 그대로 박혀 있습니다.** 즉 이 JSON을 만든 Python/SQL 집계 스크립트 자체가 레포에 없습니다.

| 대시보드 | 상수 | 위치 |
|---|---|---|
| 사내 종합 | `const D = {...}` (최상위 키 40개) | `..._internal.html` **259행** — 그 한 줄만 352,045바이트 |
| 유저용 | `const PATCH_DATA` · `EXTRA_DATA` · `PATCH_AVG_RADAR` · `RAW_DATA` | `..._user.html` **2361~2364행** — 한 줄에 하나씩 |

> 변수명이 한 글자(`D`)라서 일반적인 패턴 검색으로는 잡히지 않습니다. "주입 방식이 없다"는
> 오인이 실제로 있었으니, [`06_reconstruction_log.md`](06_reconstruction_log.md)의 주의 상자를 함께 보세요.

각 JSON의 필드 스키마(어떤 groupby·어떤 계산으로 나온 값인지)는 `05_dashboard_architecture.md`에 상세히 정리했습니다 — 이 스키마를 역참조하면 원본 집계 스크립트를 재작성할 수 있을 정도로 필드명을 그대로 남겨두었습니다.

## [5] 발표/문서
- `slides/` : 최종 발표 PDF (Canva 원본 링크는 슬라이드 2페이지에 명시)
- Notion 인사이트 문서 원문(`이터널리턴_초보유저_적응_분석`, `패치_검증_노트`)은 `03_issues_and_troubleshooting.md`에 흡수 정리했습니다.

---

## 데이터 스냅샷 비교 (재현 시 주의)
파이프라인 단계별로 참조하는 "총 유저/매치 수"가 문서마다 다릅니다. 재현 작업 시 어떤 스냅샷인지 반드시 확인하세요.

| 문서/산출물 | 유저 수 | 매치/레코드 수 | 기간 |
|---|---|---|---|
| 기획서 원안 | (미상) | (미상) | 2024-07-08~08-08 (미사용 추정) |
| Notion 인사이트 문서 v2 | 92,705명(표) | 27,601레코드(헤더 표기) | 2024-05-30~06-12 |
| 최종 슬라이드(사내 대시보드) | 92,705명 | 204,425 관측치 / 11,075 매치 | 2024-05-30~06-12 |
| 패치 검증 노트 | - | 86,874(22.1) + 117,551(23.0) = 204,425 | 22.1: ~06-05, 23.0: 06-05~ |

204,425(전체 관측치)와 27,601(인사이트 문서 헤더)의 차이는 미해결 상태입니다. 인사이트 문서의 표 안 레벨 구간별 유저수 합계(2,975+5,839+6,884+8,277+8,031+15,904+11,793+33,002 ≈ 92,705)는 최종 유저수와 일치하므로, "27,601레코드"라는 헤더 문구는 오탈자이거나 다른 정의(예: 뉴비 세그먼트만의 레코드 수)일 가능성이 있습니다. → `03_issues_and_troubleshooting.md` #10.
