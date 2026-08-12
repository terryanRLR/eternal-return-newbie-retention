# data/

⚠️ **원본 CSV 파일(`EternalReturn_kakaogames_2024.csv`, `EternalReturn_kakaogames_2024_character_added.csv`)은 용량 문제로 이 레포에 포함되어 있지 않습니다.** 이 폴더는 데이터를 재현하기 위한 스키마 문서만 담고 있습니다.

## 원본 파일
- `EternalReturn_kakaogames_2024.csv` — 원본 (228개 컬럼, 204,425 rows, 11,075 matches, 92,705 users, 기간 2024-05-30~06-12)
- `EternalReturn_kakaogames_2024_character_added.csv` — `notebooks/team_final/01_character_mapping_and_dashboard_prep.ipynb`의 산출물. 원본 + `character_name_en`/`character_name_kr`/`character_role` 3개 컬럼 추가.

원본을 구했다면 이 두 파일을 이 폴더(또는 노트북과 같은 작업 폴더)에 두고 `notebooks/`의 노트북들을 순서대로 실행하면 됩니다.

## 분석에서 실제로 참조된 컬럼 (역할별)

> 출처: `이터널리턴_코드_정리.ipynb` cell 8 (`keep_columns`) + 기획서 + 대시보드 데이터 스키마(`docs/05_dashboard_architecture.md`)를 종합.

### 식별/기본
| 컬럼 | 의미 |
|---|---|
| `gameId` | 매치 식별자 |
| `userNum` | 유저 식별자 (**닉네임 대신 항상 이걸 키로 사용** — `docs/03_issues_and_troubleshooting.md` #2) |
| `nickname` | 표시용 닉네임 (개명/동명 이슈 있음, 집계 키로 쓰지 말 것) |
| `characterNum` | 캐릭터 번호 (1~74) → `character_name_kr` 등으로 매핑 |
| `accountLevel` | 계정 레벨 (뉴비 정의에 사용) |
| `rankPoint` | 랭크 포인트 (뉴비 정의에 사용, 0이면 미랭크) |
| `matchingTeamMode` | 매칭 팀 모드 (3 = 일반 스쿼드) |
| `matchingMode` | 매칭 모드(솔로/듀오/스쿼드/코발트 등) |
| `premadeMatchingType` | 사전 팀 구성 유형(솔로큐/듀오프리메이드/풀프리메이드) |
| `botAdded` | 봇 매칭 포함 여부 |
| `serverName` | 서버 |
| `startDtm` | 게임 시작 시각 |
| `versionMajor`, `versionMinor` | 패치 버전 (22.1 / 23.0 구분에 사용, 트러블슈팅 #3) |

### 성과/전투
| 컬럼 | 의미 |
|---|---|
| `gameRank` | 최종 순위 |
| `victory` | 승리 여부 |
| `playerKill`, `playerAssistant`, `teamKill` | 킬/어시스트/팀킬 |
| `totalDoubleKill`, `totalTripleKill`, `killDetails` | 멀티킬 상세 |
| `monsterKill` | 몬스터 처치 수 |
| `damageToPlayer`, `damageToPlayer_skill`, `damageToPlayer_basic` | 대인 피해량(스킬/기본 분리) |
| `ccTimeToPlayer` | CC기 적중 시간 |
| `healAmount` | 회복량 |
| `killerCharacter`, `causeOfDeath` | 사망 관련 |
| `mmrGainInGame` | 인게임 MMR 변화 |

### 생존/이동/제작
| 컬럼 | 의미 |
|---|---|
| `playTime`, `survivableTime` | 플레이(생존) 시간 |
| `placeOfStart`, `placeOfDeath` | 시작/사망 지역 코드 (→ 대시보드 `start_areaName`/`death_areaName`으로 매핑) |
| `routeIdOfStart` | 시작 루트 ID (0 또는 -1이면 루트 미선택으로 간주) |
| `craftUncommon`, `craftRare`, `craftEpic`, `craftLegend` | 등급별 제작 횟수 |
| `bestWeapon`, `bestWeaponLevel` | 주무기 및 강화 레벨 |
| `tacticalSkillGroup`, `traitFirstCore` | 전술 스킬/특성 |
| `useHyperLoop`, `useSecurityConsole`, `useReconDrone`, `addSurveillanceCamera` | 보조 장치/설비 사용 여부 |
| `crGetAnimal` | 동물 포획 여부 |
| `giveUp`, `teamSpectator` | 포기/관전 전환 |
| `creditRevivalCount` | 부활 크레딧 사용 횟수 |
| `characterLevel` | 인게임 캐릭터(실험체) 레벨 |

## 캐릭터 매핑 (74종)
`notebooks/team_final/01_character_mapping_and_dashboard_prep.ipynb`의 `character_info` 딕셔너리에 `characterNum`(1~74) → `{name_en, name_kr, role}` 전수 매핑이 있습니다. 예: `1: Jackie/재키/전사`, `65: Debi & Marlene/데비&마를렌/전사` 등. 전체 목록은 해당 노트북 참고.

## 파생 변수 (분석 과정에서 생성됨)
| 변수 | 정의 | 생성 위치 |
|---|---|---|
| `character_name_en/kr`, `character_role` | characterNum 매핑 | `01_character_mapping...ipynb` |
| `earlyLeave` | `playTime < 600`(초) | `individual/02_planner_newbie_kmeans_clustering.ipynb` |
| `survive10` | `playTime >= 600`(초) | 〃 |
| `routeNotSelected` | `routeIdOfStart in {0, -1}` | 〃 |
| KDA | `(playerKill + playerAssistant) / max(playerDeaths, 1)` | 기획서 원안(코드 미발견, 재구현 필요) |

## 뉴비(초보 유저) 정의 — 최종 버전
```
accountLevel <= 60  AND  rankPoint == 0  AND  matchingTeamMode == 3
```
자세한 배경은 `../docs/03_issues_and_troubleshooting.md` #1 참고. 이 조건과, K-means 행동 군집(Cluster 0·3)을 병행 사용했습니다(정확한 결합 방식은 `../docs/02_analysis_pipeline.md` [3b]절의 미해결 메모 참고).


---

## 배치 방법과 실행 순서

노트북은 `data/` 아래 두 파일을 기대합니다.

| 파일 | 출처 | 크기 |
|---|---|---|
| `EternalReturn_kakaogames_2024.csv` | `원본/` 에서 복사 | 437MB · 204,425행 × 228컬럼 |
| `EternalReturn_kakaogames_2024_character_added.csv` | **`team_final/01` 을 실행하면 생성** | — |

```bash
cp "원본/EternalReturn_kakaogames_2024.csv" data/
jupyter notebook notebooks/team_final/01_character_mapping_and_dashboard_prep.ipynb   # 먼저 실행
```

> ⚠️ **`01` 을 먼저 돌리지 않으면 나머지 노트북이 파일을 못 찾습니다.**
> `_character_added.csv` 는 `01` 이 캐릭터 매핑(74종)을 붙여 만드는 중간 산출물입니다.

`.gitignore` 로 제외되므로 커밋되지 않습니다 — 원본 CSV 는 437MB 라
**GitHub 단일 파일 한도(100MB)를 넘어 push 자체가 실패합니다.**

> 노트북 출력 복원 내역은 [`docs/06_reconstruction_log.md`](../docs/06_reconstruction_log.md) 참조.
