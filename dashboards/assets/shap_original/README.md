# SHAP 플롯 원본 (팀 발표 당시 산출물)

이 폴더의 PNG 3장은 **사내 종합 대시보드에 base64로 박혀 있던 이미지를 그대로 디코딩한
바이트 단위 원본**입니다. 팀이 실제로 발표에 사용한 산출물이고, 현재 이 저장소에서
**유일한 사본**입니다.

| 파일 | 크기 | md5 (앞 12자) | 해상도 |
|---|---|---|---|
| `나타폰.png` | 79,769 B | `833f62f45d0b` | 765×435 |
| `다르코.png` | 75,149 B | `ea13c082d51d` | 765×435 |
| `샬럿.png` | 77,814 B | `4fcf94169705` | 765×434 |

## ⚠️ `notebooks/` 의 SHAP PNG 와 혼동하지 마세요

`notebooks/individual/shap_다르코.png`(106,363 B)와
`notebooks/team_final/shap_다르코.png`(105,035 B)는 **재구성 과정에서 노트북을 다시
실행해 새로 그린 그림**입니다. 크기도 md5도 이 폴더의 원본과 다릅니다 — 같은 캐릭터의
같은 분석이지만 **동일한 이미지가 아닙니다.**

즉 세 개의 다르코 SHAP 이 서로 다른 파일로 존재합니다.

| 출처 | 크기 | 성격 |
|---|---|---|
| `dashboards/assets/shap_original/다르코.png` | 75,149 B | **발표에 쓰인 원본** |
| `notebooks/team_final/shap_다르코.png` | 105,035 B | 재실행 산출물 |
| `notebooks/individual/shap_다르코.png` | 106,363 B | 재실행 산출물 |

## 대시보드에 박혀 있는 것은 무엇인가

대시보드(`eternal_return_dashboard_internal.html`)의 `D.shapimg` 에는 이제
**64색 팔레트로 양자화한 버전**이 들어 있습니다. 원본 3장이 base64 로 303KB 를 차지해
파일의 **81.8%** 가 이미지였기 때문입니다.

- 양자화 후: 장당 약 19~20KB (원본의 25%)
- 파일 크기: **387,832 B → 157,799 B (−59%)**
- 해상도·구도·색 그대로. 확대 비교해도 컬러바 밴딩이나 텍스트 열화가 없습니다
  (원본 고유색 5,983개 → 64색으로도 육안 차이 없음)

**외부 이미지 파일로 분리하지 않은 이유**는 두 대시보드가 "빌드 도구 없이 단일 HTML
파일로 완결"되도록 만들어졌기 때문입니다([`docs/05_dashboard_architecture.md`](../../../docs/05_dashboard_architecture.md)).
분리하면 76KB 까지 줄지만 HTML 만 복사했을 때 그림이 사라집니다.

## 원본으로 되돌리려면

```python
import base64, json, io
from PIL import Image

F = "dashboards/eternal_return_dashboard_internal.html"
lines = open(F, encoding="utf-8").read().split("\n")
D = json.loads(lines[258].strip()[len("const D="):].rstrip(";"))

for name in D["shapimg"]:
    raw = open(f"dashboards/assets/shap_original/{name}.png", "rb").read()
    D["shapimg"][name] = "data:image/png;base64," + base64.b64encode(raw).decode()

lines[258] = "const D=" + json.dumps(D, ensure_ascii=False) + ";"
open(F, "w", encoding="utf-8", newline="").write("\n".join(lines))
```
