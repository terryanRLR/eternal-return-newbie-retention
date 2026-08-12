# 06. 복원 로그 — 노트북 출력을 되살린 기록

이 저장소의 노트북 6개는 분리 시점에 **실행 출력이 전부 초기화**돼 있었습니다.
원본 통합 노트북(`원본/이터널리턴 코드 정리.ipynb`)조차 출력이 16건뿐이었습니다.

**데이터가 없는 사람은 결과를 아예 볼 수 없는 상태**였습니다. 그것을 되살린 기록입니다.

---

## 결과

| 노트북 | 출력 | 그래프 | 방식 |
|---|---|---|---|
| [`individual/00_source_notebook_original_asis`](../notebooks/individual/00_source_notebook_original_asis.ipynb) | 17 | 3 | 원본 순서 실행 |
| [`individual/01_balance_isolation_forest_shap`](../notebooks/individual/01_balance_isolation_forest_shap.ipynb) | 7 | 3 | 독립 실행 |
| [`individual/02_planner_newbie_kmeans_clustering`](../notebooks/individual/02_planner_newbie_kmeans_clustering.ipynb) | 3 | 0 | 독립 실행 |
| [`individual/03_misc_death_cause_fragment`](../notebooks/individual/03_misc_death_cause_fragment.ipynb) | 1 | 0 | ⚠ 조각 — 실행 불가 |
| [`team_final/01_character_mapping_and_dashboard_prep`](../notebooks/team_final/01_character_mapping_and_dashboard_prep.ipynb) | 7 | 0 | 독립 실행 |
| [`team_final/02_balance_and_newbie_analysis_consolidated`](../notebooks/team_final/02_balance_and_newbie_analysis_consolidated.ipynb) | 8 | 2 | 독립 실행 |

실행 환경: Python 3.11 · pandas 3.0 · scikit-learn 1.9 · shap 0.51 · xgboost 3.2
입력: `data/EternalReturn_kakaogames_2024.csv` (437MB · **204,425행 × 228컬럼**)

---

## 🐛 발견 1 — `profile_long` 이 원본 어디에도 정의돼 있지 않다

`02_planner_newbie_kmeans_clustering.ipynb` 의 군집 해석 셀은
`profile_long` 을 **쓰기만** 합니다.

```python
for c in sorted(profile_long["cluster"].unique()):
    tmp = profile_long[profile_long["cluster"] == c].copy()
    tmp = tmp.sort_values("abs_z", ascending=False).head(8)
    ...
```

원본 통합 노트북을 전수 검색해도 **정의하는 코드가 없습니다.**
그대로 실행하면 `NameError: name 'profile_long' is not defined` 가 납니다.

> 포트폴리오 4의 `_composite_cols` 와 **같은 유형**입니다 —
> 세션에서만 정의하고 노트북에 저장하지 않은 변수.

### 복원

사용처 스키마(`cluster` · `feature` · `z_score` · `abs_z`)와
[`03_issues_and_troubleshooting.md`](03_issues_and_troubleshooting.md) #8 의
*"`cluster_gap`(피처별 군집간 z-score 격차)"* 서술로 미루어,
**군집 요약(`summary`)을 피처 축으로 z-표준화한 뒤 롱포맷으로 편 것**으로 판단해 재구성했습니다.

```python
feat_cols = [c for c in summary.columns if c not in ('cluster', 'users')]
_z = summary.set_index('cluster')[feat_cols].astype(float)
_z = (_z - _z.mean()) / _z.std(ddof=0)
profile_long = (_z.reset_index()
                  .melt(id_vars='cluster', var_name='feature', value_name='z_score'))
profile_long['abs_z'] = profile_long['z_score'].abs()
```

### 복원이 맞다는 방증

실행 결과가 **문서에 이미 적혀 있던 군집 해석과 정확히 일치**합니다.

| 군집 | 재구성 실행 결과 (상위 z-score) | 문서의 군집명 |
|---|---|---|
| 0 | `earlyLeaveRate` 높음(+1.54) · `survive10Rate` 낮음(−1.54) · `avg_playTime` 낮음 | **초반 이탈 위험군** |
| 1 | `avg_games` 높음(+1.71) · `survive10Rate` 높음 · `earlyLeaveRate` 낮음 | **일반 안정군** |
| 3 | `giveUpRate` 0.412 (다른 군집은 0.0003 수준) | **포기·비정상 이탈군** |

> ⚠️ 그래도 **팀이 의도한 계산과 다를 수 있습니다.** 확인 후 갱신해 주세요.

---

## 🐛 발견 2 — 문서의 실루엣 점수가 잘못 적혀 있었다

[`03_issues_and_troubleshooting.md`](03_issues_and_troubleshooting.md) #7 이
*"실루엣 점수 2위인 k=4(0.1398)"* 라고 적고 있었는데, 재실행 결과 **0.1398은 k=3의 값**입니다.

| k | 실루엣 |
|---|---|
| **2** | **0.1915** ← 최고 |
| 3 | 0.1398 |
| **4** | **0.1448** ← 2위 (채택) |
| 5 | 0.1411 |
| 6 | 0.1181 |
| 7 | 0.1086 |

**"k=4가 2위"라는 결론 자체는 맞고, 숫자만 k=3 것으로 잘못 적혀 있었습니다.**
문서를 정정했습니다.

---

## ⚠️ 복원하지 못한 것 — `03_misc_death_cause_fragment.ipynb`

이 노트북은 `death_stats` 를 쓰는데 **원본 어디에도 정의가 없습니다.**
`profile_long` 과 달리 **사용처만으로 스키마를 추정할 근거가 부족**합니다
(`Death_Category` · `Win_Rate` · `Top3_Rate` 컬럼을 쓰는 것만 확인됨).

파일명이 이미 `fragment` 이고
[`notebooks/individual/README.md`](../notebooks/individual/README.md) 도 조각으로 표시하고 있어,
**억지로 복원하지 않고 그대로 두었습니다.**

---

## 함께 고친 것

| 항목 | 내용 |
|---|---|
| **데이터 경로** | `/content/…` (Colab) → `../../data/…` — 8셀 |
| **폰트 경로** | 나눔고딕 → `C:/Windows/Fonts/malgun.ttf` |
| **`google.colab.files`** | 주석 처리 (로컬에서는 다운로드 불필요) |
| **`!apt-get` / `%pip install`** | 주석 처리 + 안내 |
| **`00_source_notebook_original_asis`** | ⚠️ **소스는 그대로 두었습니다.** 출력만 채웠고, 그 사실을 노트북 상단에 명시 |

---

## 중간 산출물 의존 관계

```
data/EternalReturn_kakaogames_2024.csv           437MB · 204,425행 × 228컬럼
        │
        │  team_final/01_character_mapping_and_dashboard_prep.ipynb
        │    · characterNum → 캐릭터명·역할군 매핑 (74종)
        │    · 매핑 누락 검증 (unmapped 목록 출력)
        ▼
data/EternalReturn_kakaogames_2024_character_added.csv     ← 생성물
        │
        ├─→ team_final/02_balance_and_newbie_analysis_consolidated.ipynb
        ├─→ individual/01_balance_isolation_forest_shap.ipynb
        └─→ individual/02_planner_newbie_kmeans_clustering.ipynb
```

> **`_character_added.csv` 는 저장소에 없습니다.** `01` 을 먼저 실행하면 생성됩니다.
> 이 의존 관계가 이전에는 어디에도 적혀 있지 않아, `02` 부터 열면 파일이 없어 막혔습니다.

---

## 재현 방법

```bash
pip install pandas numpy matplotlib seaborn scikit-learn shap xgboost
# data/ 에 EternalReturn_kakaogames_2024.csv 배치 (원본/ 에서 복사)

jupyter notebook notebooks/team_final/01_character_mapping_and_dashboard_prep.ipynb   # 먼저!
jupyter notebook notebooks/team_final/02_balance_and_newbie_analysis_consolidated.ipynb
```

---

## 아직 비어 있는 것

| 항목 | 상태 |
|---|---|
| `death_stats` 정의 | ❌ 복원 불가 — 추정 근거 부족 |
| 대시보드 집계 JSON 을 만든 ETL 스크립트 | ❌ 원본 못 찾음. [`02_analysis_pipeline.md`](02_analysis_pipeline.md) [4]절 · [`05_dashboard_architecture.md`](05_dashboard_architecture.md) §D 참고 (재현 절차는 적어 뒀으나 스크립트는 미작성) |
| `profile_long` 재구성의 정확성 | 🔲 팀 확인 필요 |
| 뉴비 컷오프 60레벨의 근거 | 🔲 [`03`](03_issues_and_troubleshooting.md) #1 에 기록된 기존 미해결 항목 |

> ⚠️ **혼동 주의 — "데이터 주입 방식"은 비어 있는 항목이 아닙니다.**
> 이 표에 한때 *"`fetch()` 도 인라인 JSON 도 없음"* 이라고 적혀 있었지만 **사실과 다릅니다.**
> 두 대시보드 모두 데이터가 `<script>` 안의 JS 상수로 박혀 있고, 스키마까지
> [`05_dashboard_architecture.md`](05_dashboard_architecture.md) §A-2·§B-2 에 정리돼 있습니다.
>
> | 대시보드 | 주입 방식 | 위치 |
> |---|---|---|
> | 사내 종합 | `const D = {…}` — 최상위 키 40개 | `eternal_return_dashboard_internal.html` **259행** (그 한 줄만 352,045바이트 ≈ 344KB) |
> | 유저용 | `const PATCH_DATA` · `EXTRA_DATA` · `PATCH_AVG_RADAR` · `RAW_DATA` | `eternal_return_dashboard_user.html` 2361~2364행 (한 줄에 하나씩) |
>
> 변수명이 **한 글자(`D`)** 라서 `const [A-Z_]{3,}` 류의 패턴 검색에 걸리지 않습니다 —
> 이 때문에 "주입 방식 불명"으로 오인된 적이 있으니, 검색으로 없다고 판단하기 전에
> 최장 라인을 먼저 확인하세요.
>
> ```bash
> awk '{print NR"\t"length($0)}' dashboards/eternal_return_dashboard_internal.html | sort -k2 -rn | head -3
> ```
>
> **여전히 없는 것**은 그 JSON 을 만든 **집계 스크립트**입니다 (위 표 첫 줄).
