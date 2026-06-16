# Quadrillion Shorts

React, Remotion, SVG 차트, TradingView Lightweight Charts로 만드는 9:16 데이터 영상 제작 프로젝트입니다. 목표는 유튜브 쇼츠, 릴스, 틱톡 같은 세로형 플랫폼에 바로 올릴 수 있는 데이터 기반 모션 그래픽 영상을 코드로 생성하는 것입니다.

현재 프로젝트에는 세 가지 Remotion 컴포지션이 있습니다.

- `QuadrillionShort`: 남자 FIFA/Coca-Cola 국가대표 랭킹 변화를 보여주는 순위 라인 레이스 영상
- `BitcoinHistory`: 비트코인 3일봉 가격 흐름과 주요 이벤트를 보여주는 캔들 차트 영상
- `NasdaqHistory`: 나스닥 월봉 가격 흐름과 변동성 이벤트 뉴스카드를 보여주는 캔들 차트 영상

## 프로젝트 한 줄 설명

`Quadrillion Shorts`는 CSV나 시계열 데이터를 입력하면 1080x1920 세로 영상으로 데이터 차트, 순위 변화, 가격 흐름, 이벤트 토스트를 렌더링하는 Remotion 기반 쇼츠 제작 템플릿입니다.

## 기술 스택

- `Remotion`: React 컴포넌트를 프레임 단위 영상으로 렌더링합니다.
- `React 19`: 영상 화면을 컴포넌트로 구성합니다.
- `SVG`: 랭킹 레이스의 시간축, 순위축, 라인 애니메이션을 직접 그립니다.
- `lightweight-charts`: 비트코인 캔들 차트를 렌더링합니다.
- `TypeScript`: 데이터 모델, 영상 설정, 프레임 계산 로직을 타입으로 관리합니다.
- `Yarn 4`: 패키지 매니저입니다. `.yarnrc.yml`에서 `nodeLinker: node-modules`를 사용합니다.

## 실행 명령

```bash
yarn install
yarn dev
yarn typecheck
yarn poster
yarn render
yarn poster:race
yarn render:race
yarn poster:bitcoin
yarn render:bitcoin
yarn poster:nasdaq
yarn render:nasdaq
```

- `yarn dev`: Remotion Studio를 열어 컴포지션을 미리 봅니다.
- `yarn typecheck`: TypeScript 타입 검사를 실행합니다.
- `yarn poster`: `QuadrillionShort`의 대표 프레임을 `out/poster.png`로 렌더링합니다.
- `yarn render`: `QuadrillionShort`를 `out/quadrillion-short.mp4`로 렌더링합니다.
- `yarn poster:race`: 랭킹 레이스 포스터를 `out/ranking-race.png`로 렌더링합니다.
- `yarn render:race`: 랭킹 레이스 영상을 `out/ranking-race.mp4`로 렌더링합니다.
- `yarn poster:bitcoin`: 비트코인 히스토리 포스터를 `out/bitcoin-history.png`로 렌더링합니다.
- `yarn render:bitcoin`: 비트코인 히스토리 영상을 `out/bitcoin-history.mp4`로 렌더링합니다.
- `yarn poster:nasdaq`: 나스닥 히스토리 포스터를 `out/nasdaq-history.png`로 렌더링합니다.
- `yarn render:nasdaq`: 나스닥 히스토리 영상을 `out/nasdaq-history.mp4`로 렌더링합니다.

`out/`은 렌더 결과물 폴더이며 `.gitignore`에 포함되어 있습니다.

## 영상 기본 설정

공통 영상 크기와 FPS는 `src/script.ts`에 정의되어 있습니다.

- 해상도: `1080 x 1920`
- 비율: `9:16`
- FPS: `30`
- `QuadrillionShort` 길이: `75초`
- `BitcoinHistory` 길이: `82초`

## 쇼츠 안전영역 템플릿

상단에는 YouTube Shorts UI 버튼에 가려지지 않도록 프로젝트 공통 추가 여백을 둡니다. 이 값은 `src/script.ts`의 `SHORTS_PLATFORM_TOP_CLEARANCE`에 정의되어 있으며 현재 `50px`입니다.

새로운 영상 템플릿을 만들 때는 상단에 붙는 헤더, 날짜, 차트, 이벤트 배지 같은 주요 요소를 이 공통 offset 기준으로 배치해야 합니다. `SAFE_ZONE_TOP`은 기본 상단 safe zone에 이 추가 여백을 포함한 값입니다.

Remotion 컴포지션 등록은 `src/Root.tsx`에서 관리합니다. `src/index.ts`는 Remotion 엔트리포인트로 `RemotionRoot`를 등록합니다.

## 디렉터리 구조

```text
src/
  index.ts                  Remotion 엔트리포인트
  Root.tsx                  Remotion 컴포지션 등록
  script.ts                 공통 영상 설정과 랭킹 레이스 CSV 데이터
  chartRace.ts              CSV 파싱, 스냅샷 생성, 프레임별 순위 보간 로직
  ShortsVideo.tsx           랭킹 레이스 영상 UI
  bitcoinHistoryData.ts     비트코인 샘플 캔들 데이터와 이벤트 정의
  BitcoinHistoryVideo.tsx   비트코인 캔들 차트 영상 UI와 재생 스케줄
  nasdaqHistoryData.ts      나스닥 월봉 캔들 데이터 연결과 이벤트 정의
  NasdaqHistoryVideo.tsx    나스닥 월봉 캔들 차트 영상 UI와 뉴스카드
out/
  *.png, *.mp4              렌더링 결과물
```

## 템플릿 1: QuadrillionShort

`QuadrillionShort`는 데이터 항목의 값과 순위가 시간에 따라 움직이는 랭킹 레이스 템플릿입니다. 현재 기본 데이터는 1992.12-2026.06 남자 FIFA/Coca-Cola 공식 랭킹 발표를 바탕으로 한 국가별 랭킹 포인트와 순위입니다.

핵심 흐름은 다음과 같습니다.

1. `src/script.ts`의 `chartVideoConfig.csv`에 CSV 데이터를 넣습니다. 현재 FIFA 랭킹 레이스 데이터는 `src/generated/fifaMensRankingRaceCsv.ts`에서 가져옵니다.
2. `src/chartRace.ts`의 `buildChartRaceData()`가 CSV를 파싱해 연도별 스냅샷을 만듭니다.
3. `getChartFrameState()`가 현재 프레임에 맞는 연도, 값, 애니메이션 순위, 표시 행을 계산합니다.
4. `src/ShortsVideo.tsx`가 커스텀 SVG로 시간축 x 순위축 꺾은선 레이스 화면을 그립니다.

CSV 컬럼은 아래 형식을 사용합니다.

```csv
year,name,code,region,value,color
2026,United States,USA,North America,610,#48C7FF
```

필수 컬럼은 `year`, `name`, `code`, `region`, `value`, `color`입니다.

자주 바꾸는 설정은 `src/script.ts`의 `chartVideoConfig`에 있습니다.

- `title`: 영상 제목
- `subtitle`: 영상 부제
- `dateLabel`: 연도 라벨
- `valuePrefix`: 값 앞에 붙는 문자, 예: `$`
- `valueSuffix`: 값 뒤에 붙는 문자, 예: `B`
- `durationInSeconds`: 영상 길이
- `topN`: 화면에 강조 표시할 상위 개수
- `source`: 하단 출처 문구
- `csv`: 랭킹 레이스 원본 데이터

현재 FIFA 랭킹 CSV는 공식 랭킹 발표별 상위권 국가, 포인트, 순위를 담습니다. 월드컵 우승 시점은 차트 위 토스트 이벤트로 표시합니다.

## 템플릿 2: BitcoinHistory

`BitcoinHistory`는 비트코인 가격의 장기 흐름을 캔들 차트로 보여주고, 주요 이벤트 시점에서 일시 정지와 토스트 설명을 넣는 템플릿입니다.

핵심 흐름은 다음과 같습니다.

1. `src/bitcoinHistoryData.ts`의 `bitcoinCandles`가 엑셀 병합 데이터에서 생성된 BTC 3일봉 OHLC를 보관합니다.
2. 원본 USD 가격은 `openUsd`, `highUsd`, `lowUsd`, `closeUsd`에 보존하고, 화면용 OHLC는 고정 USD/KRW 환율로 원화 환산합니다.
3. `bitcoinEvents`가 반감기, ETF 승인, FTX 파산 같은 이벤트 날짜와 설명을 정의합니다.
4. `src/BitcoinHistoryVideo.tsx`의 `getPlaybackSchedule()`이 이동 구간과 이벤트 일시 정지 구간을 계산합니다.
5. 본 차트 전에 제네시스 블록, 첫 외부 트랜잭션, 첫 거래소, 피자 구매를 프롤로그로 표시합니다.
6. Lightweight Charts가 최근 약 1년치인 122개 3일봉 롤링 캔들 차트를 그리고, 이벤트 시점에는 토스트와 시가-종가 강조 오버레이가 표시됩니다.
7. 마지막 캔들 도달 후 2.5초 정지하고, 엔딩에서 전체 기간 차트로 줌아웃합니다.

비트코인 템플릿의 현재 캔들은 `outputs/btc_element_analysis/btc_price_element_analysis_3day.xlsx`에서 집계한 Investing.com BTC/USD 3일봉 데이터를 기반으로 합니다. 영상 하단에는 원천과 환율 기준을 표시합니다.

## 템플릿 3: NasdaqHistory

`NasdaqHistory`는 NASDAQ Composite 월봉 가격을 캔들 차트로 보여주고, 주요 변동성 이벤트를 큰 뉴스카드로 표시하는 템플릿입니다.

핵심 흐름은 다음과 같습니다.

1. `data/nasdaq_monthly_prices.csv`에 월별 OHLC 원본이 있습니다.
2. `src/generated/nasdaqMonthlyCandles.ts`가 Remotion에서 바로 import할 수 있는 월봉 배열을 제공합니다.
3. `data/nasdaq_volatility_events_1980_present.md`의 리서치 내용을 바탕으로 `src/nasdaqHistoryData.ts`의 `nasdaqEvents`가 뉴스카드 이벤트를 정의합니다.
4. `src/NasdaqHistoryVideo.tsx`는 약 6년치 월봉 롤링 차트를 보여주다가 이벤트 월에서 멈추고, 마지막에는 전체 기간 차트로 줌아웃합니다.

나스닥 데이터는 일봉이 아니라 월봉입니다. 최신 월인 2026-06은 원본 테이블 기준 부분월 데이터이므로 공개 전 최신 종가와 사건 설명을 다시 확인해야 합니다.

## 커스터마이징 가이드

랭킹 레이스 영상을 바꾸려면 주로 `src/script.ts`와 `src/ShortsVideo.tsx`를 수정합니다.

- 데이터 주제 변경: `chartVideoConfig.title`, `subtitle`, `source`, `csv`
- 단위 변경: `valuePrefix`, `valueSuffix`
- 표시 개수 변경: `topN`
- 길이 변경: `durationInSeconds`
- 색상과 레이아웃 변경: `ShortsVideo.tsx`의 `styles`, `chartWidth`, `chartHeight`, `chartMargin`

비트코인 영상을 바꾸려면 주로 `src/bitcoinHistoryData.ts`와 `src/BitcoinHistoryVideo.tsx`를 수정합니다.

- 이벤트 변경: `bitcoinEvents`
- 가격 데이터 변경: `bitcoinCandles` 또는 엑셀-to-TS 생성 스크립트
- 보여줄 롤링 캔들 수 변경: `bitcoinVideoConfig.visibleCandles`
- 이벤트 정지 시간 변경: `eventPauseFrames`
- 토스트 노출 시간 변경: `eventToastFrames`
- 차트 레이아웃 변경: `chartWidth`, `chartHeight`, `chartTop`, `styles`

## 데이터와 정확성 메모

- `QuadrillionShort`의 현재 데이터는 1992.12-2026.06 남자 FIFA/Coca-Cola 공식 랭킹 발표를 기반으로 하며, 월드컵 우승은 차트 위 이벤트 토스트로만 표시합니다.
- `BitcoinHistory`의 캔들 데이터는 엑셀 병합본에서 생성한 BTC/USD 3일봉을 원화 환산한 데이터입니다.
- 실제 공개 콘텐츠나 투자 관련 콘텐츠로 사용할 때는 데이터 출처, 날짜, 단위, 계산 방식을 README나 영상 하단 출처에 명시해야 합니다.
- 현재 비트코인 템플릿은 가격 흐름을 설명하는 시각 템플릿이며, 금융 조언을 제공하는 프로젝트가 아닙니다.

## 개발 상태 메모

- TypeScript strict 모드를 사용합니다.
- 렌더 산출물은 `out/`에 생성되고 Git 추적 대상에서 제외됩니다.
- 현재 테스트 스위트는 없고, 기본 검증은 `yarn typecheck`로 수행합니다.
- 차트 렌더링은 Remotion 프레임 값에 직접 연결되어 있어 프레임 수, FPS, duration 변경 시 애니메이션 속도가 함께 바뀝니다.

## 다음 개선 후보

- 실제 CSV 파일을 읽어 랭킹 레이스 데이터를 주입하는 로더 추가
- 재현 가능한 BTC 일봉 CSV/API 수집 파이프라인 추가
- 공통 영상 테마, 폰트, 색상 토큰 분리
- 데이터 검증 에러 메시지 강화
- 대표 프레임과 렌더 결과를 확인하는 간단한 시각 회귀 체크 추가
