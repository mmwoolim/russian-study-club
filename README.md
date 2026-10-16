# Russian Study Club · Русский клуб

러시아어 A1/A2 단어 200개를 공부하는 웹사이트입니다. 별도 설치나 회원가입 없이 사용할 수 있습니다. 러시아어 단어와 영어 뜻, 예문, 강세 표시, 암기 힌트가 들어 있습니다.

## 사용 방법

- **Flashcards**: 카드를 눌러 뜻을 확인하고, `Learn again` 또는 `I know this word`로 학습합니다.
- **Test yourself**: 러시아어 → 영어 또는 영어 → 러시아어 객관식 퀴즈를 풉니다.
- **Word library**: 단어를 검색하고 예문을 확인합니다.
- **Word links**: 반의어와 유의어를 함께 공부합니다.

방향키 ↑/↓로 학습 결과를 기록하고, ←/→로 카드를 이동합니다. Space로 카드를 뒤집습니다. 퀴즈에서는 1–4로 답을 선택하고 Enter로 다음 문제로 넘어갑니다.

## 진도 저장과 백업

진도는 현재 기기의 브라우저에 저장됩니다. 같은 주소와 브라우저 프로필로 다시 접속하면 이어서 공부할 수 있습니다. GitHub에 개인 진도가 업로드되거나 기기 사이에 자동으로 동기화되지는 않습니다.

- **Download backup**: 진도를 JSON 파일로 저장합니다.
- **Restore backup**: 다른 기기나 브라우저에서 백업을 불러옵니다.
- **Connect progress file**: 지원되는 Chrome/Edge에서 파일에 자동 백업합니다. 다시 열 때 저장 권한을 요청할 수 있습니다.
- **Download study file with my progress**: 현재 진도가 포함된 HTML 파일을 내려받습니다. 인터넷 없이도 열어서 공부할 수 있습니다.

원래 HTML 파일에서 공부한 기록도 `Download backup`으로 내보낸 다음 웹사이트의 `Restore backup`으로 옮길 수 있습니다. 브라우저 데이터를 삭제하기 전에 백업하세요.

## 로컬 실행

이미 만들어진 `index.html`을 브라우저로 열면 됩니다. 소스를 수정한 후에는 Python 3으로 다시 빌드합니다. 외부 Python 패키지는 필요하지 않습니다.

```sh
python3 build.py
python3 -m http.server 8000 --directory dist
```

브라우저에서 `http://localhost:8000`을 엽니다. 빌드는 `index.html`과 배포용 `dist/index.html`을 생성합니다.

## GitHub Pages 배포

저장소의 **Settings → Pages → Source**에서 **GitHub Actions**를 선택합니다. `main` 브랜치에 변경 사항을 올리면 검증 후 자동으로 배포됩니다. Actions 화면에서 수동 실행도 가능합니다. 배포 주소는 Pages 설정 및 배포 작업 결과에 표시됩니다.

```sh
python3 build.py
python3 -m unittest discover -s tests
node --check app.js
node --check persistence.js
node --test tests/app.test.cjs
```

## 파일 구성

| 파일 | 용도 |
| --- | --- |
| `vocabulary.txt` | 카테고리별 단어 데이터. `레벨\|러시아어\|영어 뜻\|예문\|힌트` 형식 |
| `template.html` | 페이지 구조 |
| `style.css` | 화면 디자인과 모바일 레이아웃 |
| `app.js` | 카드, 퀴즈, 검색, 진도 관리 |
| `persistence.js` | 브라우저 및 선택한 파일에 저장 |
| `build.py` | 모든 소스를 하나의 HTML 파일로 빌드 |
| `.github/workflows/pages.yml` | 검증 및 GitHub Pages 자동 배포 |

A1/A2 표시는 학습용 분류이며 공식 시험 전체 어휘 목록은 아닙니다.
