# Quadrillion Shorts

React, Remotion, SVG chart, TradingView Lightweight Charts로 만드는 9:16 데이터 영상 제작 프로젝트입니다. 목표는 YouTube Shorts, Reels, TikTok 같은 세로형 플랫폼에 바로 올릴 수 있는 데이터 기반 모션 그래픽 영상을 코드로 생성하는 것입니다.

현재 Remotion 주요 컴포지션은 다음과 같습니다.

- `QuadrillionShort`: 남자 FIFA/Coca-Cola 국가대표 랭킹 변화를 보여주는 순위 라인 레이스 영상
- `BitcoinHistory`: 비트코인 3일봉 가격 흐름과 주요 이벤트를 보여주는 캔들 차트 영상
- `NasdaqHistory`: 나스닥 월봉 가격 흐름과 변동성 이벤트 뉴스카드를 보여주는 캔들 차트 영상
- `WorldCupSquadValues`: 월드컵 연도별 국가 버블 안에 선수 버블을 중첩한 스쿼드 가치 프록시 영상

## 실행 명령

```bash
yarn install
yarn dev
yarn typecheck
yarn data:fifa
yarn poster
yarn render
yarn poster:race
yarn render:race
yarn poster:bitcoin
yarn render:bitcoin
yarn poster:nasdaq
yarn render:nasdaq
yarn data:world-cup-values
yarn poster:world-cup-values
yarn render:world-cup-values
```

- `yarn dev`: Remotion Studio를 엽니다.
- `yarn typecheck`: TypeScript 타입 검사를 실행합니다.
- `yarn data:fifa`: FIFA 랭킹 데이터를 다시 받아 `data/fifa-ranking-race/`와 `src/projects/fifa-ranking-race/generated/`에 저장합니다.
- `yarn poster`, `yarn render`: `QuadrillionShort` 산출물을 `out/fifa-ranking-race/`에 렌더링합니다.
- `yarn poster:race`, `yarn render:race`: 랭킹 레이스 대표 산출물을 `out/fifa-ranking-race/`에 렌더링합니다.
- `yarn poster:bitcoin`, `yarn render:bitcoin`: 비트코인 산출물을 `out/bitcoin-history/`에 렌더링합니다.
- `yarn poster:nasdaq`, `yarn render:nasdaq`: 나스닥 산출물을 `out/nasdaq-history/`에 렌더링합니다.
- `yarn data:world-cup-values`: 기존 축구 선수 가치 CSV에서 월드컵 출전국별 상위 선수 프록시 데이터를 생성합니다.
- `yarn poster:world-cup-values`, `yarn render:world-cup-values`: 월드컵 스쿼드 가치 버블 영상을 `out/world-cup-squad-values/`에 렌더링합니다.

`out/`은 렌더 결과물 폴더이며 `.gitignore`에 포함되어 있습니다.

## 기본 설정

공통 영상 크기와 FPS는 `src/shared/video.ts`에 정의되어 있습니다.

- 해상도: `1080 x 1920`
- 비율: `9:16`
- FPS: `30`
- `QuadrillionShort` 길이: `50초`
- `BitcoinHistory` 길이: `112초`
- `NasdaqHistory` 길이: `60초`
- `WorldCupSquadValues` 길이: `58초`

상단 UI는 YouTube Shorts 버튼에 가려지지 않도록 `SHORTS_PLATFORM_TOP_CLEARANCE`를 기준으로 배치합니다. 새 영상도 헤더, 날짜, 차트, 이벤트 배지처럼 위쪽에 붙는 요소는 이 공통 값을 반영해야 합니다.

## 디렉터리 구조

```text
src/
  index.ts
  Root.tsx
  shared/
    video.ts
  projects/
    fifa-ranking-race/
      config.ts
      chartRace.ts
      ShortsVideo.tsx
      generated/
    bitcoin-history/
      data.ts
      BitcoinHistoryVideo.tsx
    nasdaq-history/
      data.ts
      NasdaqHistoryVideo.tsx
      generated/
data/
  fifa-ranking-race/
  nasdaq-history/
outputs/
  bitcoin-history/
public/
  audio/
  projects/nasdaq-history/images/events/
out/
  fifa-ranking-race/
  bitcoin-history/
  nasdaq-history/
```

새 주제 영상을 만들 때는 같은 이름의 폴더를 함께 만듭니다.

- 소스 코드: `src/projects/<topic>/`
- 원본/가공 데이터: `data/<topic>/`
- 분석 산출물, 워크북, 프리뷰: `outputs/<topic>/`
- 렌더 결과물: `out/<topic>/`
- 정적 이미지: `public/projects/<topic>/...`

공통 프레임 값, 해상도, FPS, 쇼츠 안전영역은 `src/shared/`에서 공유합니다. 주제별 폴더에는 해당 영상의 데이터 설정, UI, 생성된 TS 데이터만 둡니다.

## 템플릿 1: QuadrillionShort

`QuadrillionShort`는 데이터 항목의 값과 순위가 시간에 따라 움직이는 랭킹 레이스 템플릿입니다. 현재 기본 데이터는 1992.12-2026.06 남자 FIFA/Coca-Cola 공식 랭킹 발표를 바탕으로 한 국가별 랭킹 포인트와 순위입니다.

핵심 파일은 다음과 같습니다.

- `src/projects/fifa-ranking-race/config.ts`: 제목, 단위, 길이, 이벤트, CSV 연결
- `src/projects/fifa-ranking-race/chartRace.ts`: CSV 파싱, 스냅샷 생성, 프레임별 순위 보간
- `src/projects/fifa-ranking-race/ShortsVideo.tsx`: SVG 순위 라인 레이스 UI
- `src/projects/fifa-ranking-race/generated/fifaMensRankingRaceCsv.ts`: Remotion에서 바로 import하는 생성 CSV 문자열
- `data/fifa-ranking-race/`: 원본/가공 FIFA 랭킹 CSV와 메타데이터

CSV 필수 컬럼은 다음 형식입니다.

```csv
year,name,code,region,value,color
2026,United States,USA,North America,610,#48C7FF
```

현재 구현은 `date`, `quarter`, `month`, `rank`, `flag`, `worldCupWins` 같은 선택 컬럼도 활용합니다.

## 템플릿 2: BitcoinHistory

`BitcoinHistory`는 비트코인 가격의 장기 흐름을 캔들 차트로 보여주고, 주요 이벤트 시점에서 일시 정지와 토스트 설명을 넣는 템플릿입니다.

핵심 파일은 다음과 같습니다.

- `src/projects/bitcoin-history/data.ts`: BTC 3일봉 OHLC, 이벤트, 영상 설정
- `src/projects/bitcoin-history/BitcoinHistoryVideo.tsx`: Lightweight Charts 기반 캔들 차트, 이벤트 토스트, 프롤로그, 엔딩 줌아웃
- `outputs/bitcoin-history/btc-element-analysis/`: BTC 분석 워크북과 프리뷰 이미지
- `out/bitcoin-history/`: 렌더된 비트코인 영상과 확인용 still

현재 캔들은 `outputs/bitcoin-history/btc-element-analysis/btc_price_element_analysis_3day.xlsx`에서 집계한 Investing.com BTC/USD 3일봉 데이터를 기반으로 합니다. 원본 USD 가격은 `openUsd`, `highUsd`, `lowUsd`, `closeUsd`에 보존하고 화면용 OHLC는 고정 USD/KRW 환율로 원화 환산합니다.

## 템플릿 3: NasdaqHistory

`NasdaqHistory`는 NASDAQ Composite 월봉 가격을 캔들 차트로 보여주고, 주요 변동성 이벤트를 큰 뉴스카드로 표시하는 템플릿입니다.

핵심 파일은 다음과 같습니다.

- `src/projects/nasdaq-history/data.ts`: 월봉 캔들 연결, 이벤트, 영상 설정
- `src/projects/nasdaq-history/NasdaqHistoryVideo.tsx`: 월봉 롤링 캔들 차트, 뉴스카드, 엔딩 프로모션
- `src/projects/nasdaq-history/generated/nasdaqMonthlyCandles.ts`: Remotion에서 바로 import하는 월봉 배열
- `data/nasdaq-history/nasdaq_monthly_prices.csv`: 월별 OHLC 원본
- `data/nasdaq-history/nasdaq_volatility_events_1980_present.md`: 이벤트 리서치 메모
- `public/projects/nasdaq-history/images/events/`: 이벤트 카드 이미지

나스닥 데이터는 일봉이 아니라 월봉입니다. 최신 월인 2026-06은 원본 테이블 기준 부분월 데이터이므로 공개 전 최신 종가와 사건 설명을 다시 확인해야 합니다.

## 데이터 정확성

- `QuadrillionShort`의 현재 데이터는 1992.12-2026.06 남자 FIFA/Coca-Cola 공식 랭킹 발표를 기반으로 하며, 월드컵 우승은 차트 위 이벤트 토스트로만 표시합니다.
- `WorldCupSquadValues`의 현재 데이터는 Transfermarkt 추정 선수 가치의 월간 글로벌 top 100에서 월드컵 출전국 선수만 필터링한 프록시입니다. 공식 23/26인 엔트리 전체 스쿼드 가치가 아니므로 공개 전 로스터/가치 산식을 검증해야 합니다.
- `BitcoinHistory`의 캔들 데이터는 엑셀 병합본에서 생성한 BTC/USD 3일봉을 원화 환산한 데이터입니다.
- `NasdaqHistory`의 최신 월 데이터는 부분월일 수 있습니다.
- 공개 콘텐츠로 사용할 때는 데이터 출처, 날짜 범위, 단위, 계산 방식을 영상 하단 또는 문서에 명시해야 합니다.
- 금융/투자 관련 영상은 정보 시각화 템플릿이며 금융 조언으로 표현하지 않습니다.

## 개발 메모

- Remotion 컴포지션 등록은 `src/Root.tsx`에서 관리합니다.
- `src/index.ts`는 Remotion 엔트리포인트로 `RemotionRoot`를 등록합니다.
- TypeScript strict 모드를 사용합니다.
- 기본 검증은 `yarn typecheck`입니다.
- 차트 렌더링은 Remotion 프레임 값에 직접 연결되어 있어 FPS, duration, frame 계산을 함께 맞춰야 합니다.
- 렌더 산출물은 `out/<topic>/`에 생성되고 Git 추적 대상에서 제외됩니다.
