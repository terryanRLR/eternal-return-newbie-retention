# notebooks/individual/

원본 `이터널리턴_코드_정리.ipynb`를 주제별로 잘라 보존한 노트북입니다. `team_final/`과 달리 **원본 코드를 수정하지 않고** 그대로 옮겼습니다(환경 이슈, 순서 의존성, 깨진 셀 포함).

| 파일 | 주제 | 원본 위치 | 추정 담당(확인 필요) |
|---|---|---|---|
| `00_source_notebook_original_asis.ipynb` | 원본 전체, 무수정 | cell 0~20 전체 | — |
| `01_balance_isolation_forest_shap.ipynb` | 밸런스 이상치 탐지 + SHAP | cell 9~15 | 황현웅 (추정) |
| `02_planner_newbie_kmeans_clustering.ipynb` | 뉴비 정의 + 행동 군집 | cell 16~18 | 박근우 (추정) |
| `03_misc_death_cause_fragment.ipynb` | 사망 원인별 승률 비교 (단편) | cell 19~20 | 불명 |

## "추정 담당"에 대한 주의
코드 자체에는 작성자 표기가 전혀 없습니다. 위 추정은 KPT 회고 텍스트와 코드의 분석 목적이 일치한다는 **정황적 근거**로만 판단한 것이며, 실제 작성자와 다를 수 있습니다. 팀원들과 함께 확인 후 이 표를 갱신해 주세요.

## 왜 원본을 그대로 남겼는가
- `02_planner_newbie_kmeans_clustering.ipynb`, `03_misc_death_cause_fragment.ipynb`에는 정의되지 않은 변수(`profile_long`, `death_stats`)를 참조하는 셀이 있습니다. 이런 "무엇이 빠졌는지"도 트러블슈팅 기록의 일부이므로(`../../docs/03_issues_and_troubleshooting.md`), 임의로 채워 넣지 않고 원본 그대로 + 추정 재구성(주석)만 덧붙였습니다.
- 바로 실행되는 버전이 필요하면 `../team_final/`을 사용하세요.
