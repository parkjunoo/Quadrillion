export type NasdaqMonthlyCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  volumeRaw: string | null;
  changePercent: number;
};

export const nasdaqMonthlyPriceSummary = {
  "source": "Pasted Nasdaq monthly historical price table",
  "interval": "1 month",
  "rows": 555,
  "firstTime": "1980-04-01",
  "lastTime": "2026-06-01",
  "minClose": 139.99,
  "maxClose": 26972.62,
  "missingVolumeRows": 314
} as const;

export const nasdaqMonthlyCandles: NasdaqMonthlyCandle[] = [
  {
    "time": "1980-04-01",
    "open": 139.99,
    "high": 139.99,
    "low": 139.99,
    "close": 139.99,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.86
  },
  {
    "time": "1980-05-01",
    "open": 150.45,
    "high": 150.45,
    "low": 150.45,
    "close": 150.45,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.47
  },
  {
    "time": "1980-06-01",
    "open": 157.78,
    "high": 157.78,
    "low": 157.78,
    "close": 157.78,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.87
  },
  {
    "time": "1980-07-01",
    "open": 171.81,
    "high": 171.81,
    "low": 171.81,
    "close": 171.81,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.89
  },
  {
    "time": "1980-08-01",
    "open": 181.52,
    "high": 181.52,
    "low": 181.52,
    "close": 181.52,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.65
  },
  {
    "time": "1980-09-01",
    "open": 187.76,
    "high": 187.76,
    "low": 187.76,
    "close": 187.76,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.44
  },
  {
    "time": "1980-10-01",
    "open": 192.78,
    "high": 192.78,
    "low": 192.78,
    "close": 192.78,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.67
  },
  {
    "time": "1980-11-01",
    "open": 208.15,
    "high": 208.15,
    "low": 208.15,
    "close": 208.15,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.97
  },
  {
    "time": "1980-12-01",
    "open": 202.34,
    "high": 202.34,
    "low": 202.34,
    "close": 202.34,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.79
  },
  {
    "time": "1981-01-01",
    "open": 197.81,
    "high": 197.81,
    "low": 197.81,
    "close": 197.81,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.24
  },
  {
    "time": "1981-02-01",
    "open": 198.01,
    "high": 198.01,
    "low": 198.01,
    "close": 198.01,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.1
  },
  {
    "time": "1981-03-01",
    "open": 210.18,
    "high": 210.18,
    "low": 210.18,
    "close": 210.18,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.15
  },
  {
    "time": "1981-04-01",
    "open": 216.74,
    "high": 216.74,
    "low": 216.74,
    "close": 216.74,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.12
  },
  {
    "time": "1981-05-01",
    "open": 223.47,
    "high": 223.47,
    "low": 223.47,
    "close": 223.47,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.11
  },
  {
    "time": "1981-06-01",
    "open": 215.75,
    "high": 215.75,
    "low": 215.75,
    "close": 215.75,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.45
  },
  {
    "time": "1981-07-01",
    "open": 211.63,
    "high": 211.63,
    "low": 211.63,
    "close": 211.63,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.91
  },
  {
    "time": "1981-08-01",
    "open": 195.75,
    "high": 195.75,
    "low": 195.75,
    "close": 195.75,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -7.5
  },
  {
    "time": "1981-09-01",
    "open": 180.03,
    "high": 180.03,
    "low": 180.03,
    "close": 180.03,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.03
  },
  {
    "time": "1981-10-01",
    "open": 195.24,
    "high": 195.24,
    "low": 195.24,
    "close": 195.24,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.45
  },
  {
    "time": "1981-11-01",
    "open": 201.37,
    "high": 201.37,
    "low": 201.37,
    "close": 201.37,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.14
  },
  {
    "time": "1981-12-01",
    "open": 195.84,
    "high": 195.84,
    "low": 195.84,
    "close": 195.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.75
  },
  {
    "time": "1982-01-01",
    "open": 188.39,
    "high": 188.39,
    "low": 188.39,
    "close": 188.39,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.8
  },
  {
    "time": "1982-02-01",
    "open": 179.43,
    "high": 179.43,
    "low": 179.43,
    "close": 179.43,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.76
  },
  {
    "time": "1982-03-01",
    "open": 175.65,
    "high": 175.65,
    "low": 175.65,
    "close": 175.65,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.11
  },
  {
    "time": "1982-04-01",
    "open": 184.7,
    "high": 184.7,
    "low": 184.7,
    "close": 184.7,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.15
  },
  {
    "time": "1982-05-01",
    "open": 178.54,
    "high": 178.54,
    "low": 178.54,
    "close": 178.54,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.34
  },
  {
    "time": "1982-06-01",
    "open": 171.3,
    "high": 171.3,
    "low": 171.3,
    "close": 171.3,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.06
  },
  {
    "time": "1982-07-01",
    "open": 167.35,
    "high": 167.35,
    "low": 167.35,
    "close": 167.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.31
  },
  {
    "time": "1982-08-01",
    "open": 177.71,
    "high": 177.71,
    "low": 177.71,
    "close": 177.71,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.19
  },
  {
    "time": "1982-09-01",
    "open": 187.65,
    "high": 189.62,
    "low": 185.53,
    "close": 187.65,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.59
  },
  {
    "time": "1982-10-01",
    "open": 212.63,
    "high": 215.29,
    "low": 187.79,
    "close": 212.63,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 13.31
  },
  {
    "time": "1982-11-01",
    "open": 232.31,
    "high": 233.13,
    "low": 212.64,
    "close": 232.31,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 9.26
  },
  {
    "time": "1982-12-01",
    "open": 232.41,
    "high": 241.63,
    "low": 224.91,
    "close": 232.41,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.04
  },
  {
    "time": "1983-01-01",
    "open": 248.35,
    "high": 248.35,
    "low": 229.88,
    "close": 248.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.86
  },
  {
    "time": "1983-02-01",
    "open": 260.67,
    "high": 263.21,
    "low": 246.89,
    "close": 260.67,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.96
  },
  {
    "time": "1983-03-01",
    "open": 270.8,
    "high": 272.24,
    "low": 260.62,
    "close": 270.8,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.89
  },
  {
    "time": "1983-04-01",
    "open": 293.06,
    "high": 293.06,
    "low": 266.21,
    "close": 293.06,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.22
  },
  {
    "time": "1983-05-01",
    "open": 308.73,
    "high": 312.18,
    "low": 288.56,
    "close": 308.73,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.35
  },
  {
    "time": "1983-06-01",
    "open": 318.7,
    "high": 329.11,
    "low": 307.1,
    "close": 318.7,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.23
  },
  {
    "time": "1983-07-01",
    "open": 303.96,
    "high": 321.58,
    "low": 303.09,
    "close": 303.96,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.63
  },
  {
    "time": "1983-08-01",
    "open": 292.42,
    "high": 304.34,
    "low": 288.42,
    "close": 292.42,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.8
  },
  {
    "time": "1983-09-01",
    "open": 296.65,
    "high": 305.06,
    "low": 292.91,
    "close": 296.65,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.45
  },
  {
    "time": "1983-10-01",
    "open": 274.55,
    "high": 297.81,
    "low": 274.16,
    "close": 274.55,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -7.45
  },
  {
    "time": "1983-11-01",
    "open": 285.67,
    "high": 289.6,
    "low": 269.42,
    "close": 285.67,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.05
  },
  {
    "time": "1983-12-01",
    "open": 278.6,
    "high": 286.12,
    "low": 274.36,
    "close": 278.6,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.47
  },
  {
    "time": "1984-01-01",
    "open": 268.43,
    "high": 288.41,
    "low": 267.75,
    "close": 268.43,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.65
  },
  {
    "time": "1984-02-01",
    "open": 252.57,
    "high": 268.79,
    "low": 246.03,
    "close": 252.57,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.91
  },
  {
    "time": "1984-03-01",
    "open": 250.78,
    "high": 255.67,
    "low": 248.49,
    "close": 250.78,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.71
  },
  {
    "time": "1984-04-01",
    "open": 247.44,
    "high": 251.28,
    "low": 240.7,
    "close": 247.44,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.33
  },
  {
    "time": "1984-05-01",
    "open": 232.82,
    "high": 253.45,
    "low": 230.22,
    "close": 232.82,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.91
  },
  {
    "time": "1984-06-01",
    "open": 239.65,
    "high": 241.52,
    "low": 232.8,
    "close": 239.65,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.93
  },
  {
    "time": "1984-07-01",
    "open": 229.7,
    "high": 239.77,
    "low": 225.29,
    "close": 229.7,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.15
  },
  {
    "time": "1984-08-01",
    "open": 254.64,
    "high": 255.29,
    "low": 229.62,
    "close": 254.64,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 10.86
  },
  {
    "time": "1984-09-01",
    "open": 249.94,
    "high": 255.87,
    "low": 249.36,
    "close": 249.94,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.85
  },
  {
    "time": "1984-10-01",
    "open": 247.03,
    "high": 252.59,
    "low": 242.2,
    "close": 247.03,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.16
  },
  {
    "time": "1984-11-01",
    "open": 242.53,
    "high": 250.96,
    "low": 242.19,
    "close": 242.53,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.82
  },
  {
    "time": "1984-12-01",
    "open": 247.35,
    "high": 247.41,
    "low": 237.58,
    "close": 247.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.99
  },
  {
    "time": "1985-01-01",
    "open": 278.7,
    "high": 278.95,
    "low": 245.7,
    "close": 278.7,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.67
  },
  {
    "time": "1985-02-01",
    "open": 284.17,
    "high": 288.87,
    "low": 277.69,
    "close": 284.17,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.96
  },
  {
    "time": "1985-03-01",
    "open": 279.2,
    "high": 287.96,
    "low": 275.61,
    "close": 279.2,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.75
  },
  {
    "time": "1985-04-01",
    "open": 280.56,
    "high": 284.79,
    "low": 276.21,
    "close": 280.56,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.49
  },
  {
    "time": "1985-05-01",
    "open": 290.8,
    "high": 294.8,
    "low": 278.76,
    "close": 290.8,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.65
  },
  {
    "time": "1985-06-01",
    "open": 296.2,
    "high": 296.2,
    "low": 286.69,
    "close": 296.2,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.86
  },
  {
    "time": "1985-07-01",
    "open": 301.29,
    "high": 307.94,
    "low": 295.54,
    "close": 301.29,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.72
  },
  {
    "time": "1985-08-01",
    "open": 297.71,
    "high": 304.58,
    "low": 295.52,
    "close": 297.71,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.19
  },
  {
    "time": "1985-09-01",
    "open": 280.33,
    "high": 297.73,
    "low": 279.48,
    "close": 280.33,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.84
  },
  {
    "time": "1985-10-01",
    "open": 292.54,
    "high": 292.78,
    "low": 276.61,
    "close": 292.54,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.36
  },
  {
    "time": "1985-11-01",
    "open": 313.95,
    "high": 314.05,
    "low": 292.5,
    "close": 313.95,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.32
  },
  {
    "time": "1985-12-01",
    "open": 324.93,
    "high": 325.61,
    "low": 312.3,
    "close": 324.93,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.5
  },
  {
    "time": "1986-01-01",
    "open": 335.77,
    "high": 335.82,
    "low": 322.06,
    "close": 335.77,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.34
  },
  {
    "time": "1986-02-01",
    "open": 359.53,
    "high": 360,
    "low": 335.77,
    "close": 359.53,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.08
  },
  {
    "time": "1986-03-01",
    "open": 374.72,
    "high": 374.74,
    "low": 359.07,
    "close": 374.72,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.22
  },
  {
    "time": "1986-04-01",
    "open": 383.24,
    "high": 392.95,
    "low": 368,
    "close": 383.24,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.27
  },
  {
    "time": "1986-05-01",
    "open": 400.16,
    "high": 400.39,
    "low": 381.45,
    "close": 400.16,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.41
  },
  {
    "time": "1986-06-01",
    "open": 405.51,
    "high": 405.51,
    "low": 391.75,
    "close": 405.51,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.34
  },
  {
    "time": "1986-07-01",
    "open": 371.37,
    "high": 411.33,
    "low": 369.11,
    "close": 371.37,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.42
  },
  {
    "time": "1986-08-01",
    "open": 382.86,
    "high": 383.22,
    "low": 364.36,
    "close": 382.86,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.09
  },
  {
    "time": "1986-09-01",
    "open": 350.67,
    "high": 383.99,
    "low": 342.28,
    "close": 350.67,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.41
  },
  {
    "time": "1986-10-01",
    "open": 360.77,
    "high": 361.6,
    "low": 351.22,
    "close": 360.77,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.88
  },
  {
    "time": "1986-11-01",
    "open": 359.57,
    "high": 362.48,
    "low": 349.09,
    "close": 359.57,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.33
  },
  {
    "time": "1986-12-01",
    "open": 348.83,
    "high": 364.65,
    "low": 347,
    "close": 348.83,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.99
  },
  {
    "time": "1987-01-01",
    "open": 392.06,
    "high": 402.33,
    "low": 348.81,
    "close": 392.06,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.39
  },
  {
    "time": "1987-02-01",
    "open": 424.97,
    "high": 424.97,
    "low": 392.04,
    "close": 424.97,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.39
  },
  {
    "time": "1987-03-01",
    "open": 430.05,
    "high": 439.99,
    "low": 422.92,
    "close": 430.05,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.2
  },
  {
    "time": "1987-04-01",
    "open": 417.81,
    "high": 439.16,
    "low": 407.35,
    "close": 417.81,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.85
  },
  {
    "time": "1987-05-01",
    "open": 416.54,
    "high": 424.83,
    "low": 404.52,
    "close": 416.54,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.3
  },
  {
    "time": "1987-06-01",
    "open": 424.67,
    "high": 429.89,
    "low": 413.53,
    "close": 424.67,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.95
  },
  {
    "time": "1987-07-01",
    "open": 434.93,
    "high": 434.94,
    "low": 423.73,
    "close": 434.93,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.42
  },
  {
    "time": "1987-08-01",
    "open": 454.97,
    "high": 455.78,
    "low": 431.17,
    "close": 454.97,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.61
  },
  {
    "time": "1987-09-01",
    "open": 444.29,
    "high": 456.27,
    "low": 433.86,
    "close": 444.29,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.35
  },
  {
    "time": "1987-10-01",
    "open": 323.3,
    "high": 453.88,
    "low": 288.49,
    "close": 323.3,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -27.23
  },
  {
    "time": "1987-11-01",
    "open": 305.16,
    "high": 328.82,
    "low": 301.62,
    "close": 305.16,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.61
  },
  {
    "time": "1987-12-01",
    "open": 330.47,
    "high": 333.23,
    "low": 291.86,
    "close": 330.47,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.29
  },
  {
    "time": "1988-01-01",
    "open": 344.66,
    "high": 350.3,
    "low": 329,
    "close": 344.66,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.29
  },
  {
    "time": "1988-02-01",
    "open": 366.95,
    "high": 366.99,
    "low": 343.48,
    "close": 366.95,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.47
  },
  {
    "time": "1988-03-01",
    "open": 374.64,
    "high": 382.61,
    "low": 366.68,
    "close": 374.64,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.1
  },
  {
    "time": "1988-04-01",
    "open": 379.23,
    "high": 384.26,
    "low": 369.82,
    "close": 379.23,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.23
  },
  {
    "time": "1988-05-01",
    "open": 370.34,
    "high": 383.06,
    "low": 362.37,
    "close": 370.34,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.34
  },
  {
    "time": "1988-06-01",
    "open": 394.66,
    "high": 394.77,
    "low": 370.33,
    "close": 394.66,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.57
  },
  {
    "time": "1988-07-01",
    "open": 387.33,
    "high": 397.54,
    "low": 382.13,
    "close": 387.33,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.86
  },
  {
    "time": "1988-08-01",
    "open": 376.55,
    "high": 389.5,
    "low": 372.2,
    "close": 376.55,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.78
  },
  {
    "time": "1988-09-01",
    "open": 387.71,
    "high": 388.37,
    "low": 372.15,
    "close": 387.71,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.96
  },
  {
    "time": "1988-10-01",
    "open": 382.46,
    "high": 388.93,
    "low": 380.66,
    "close": 382.46,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.35
  },
  {
    "time": "1988-11-01",
    "open": 371.45,
    "high": 383.07,
    "low": 364.03,
    "close": 371.45,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.88
  },
  {
    "time": "1988-12-01",
    "open": 381.38,
    "high": 381.38,
    "low": 371.16,
    "close": 381.38,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.67
  },
  {
    "time": "1989-01-01",
    "open": 401.3,
    "high": 401.41,
    "low": 376.87,
    "close": 401.3,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.22
  },
  {
    "time": "1989-02-01",
    "open": 399.71,
    "high": 410.09,
    "low": 398.13,
    "close": 399.71,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.4
  },
  {
    "time": "1989-03-01",
    "open": 406.73,
    "high": 409.86,
    "low": 397.68,
    "close": 406.73,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.76
  },
  {
    "time": "1989-04-01",
    "open": 427.55,
    "high": 427.59,
    "low": 406.48,
    "close": 427.55,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.12
  },
  {
    "time": "1989-05-01",
    "open": 446.17,
    "high": 446.25,
    "low": 425.68,
    "close": 446.17,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.36
  },
  {
    "time": "1989-06-01",
    "open": 435.29,
    "high": 454.59,
    "low": 431.72,
    "close": 435.29,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.44
  },
  {
    "time": "1989-07-01",
    "open": 453.84,
    "high": 453.86,
    "low": 434.35,
    "close": 453.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.26
  },
  {
    "time": "1989-08-01",
    "open": 469.33,
    "high": 469.42,
    "low": 452.41,
    "close": 469.33,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.41
  },
  {
    "time": "1989-09-01",
    "open": 472.92,
    "high": 474.56,
    "low": 464.83,
    "close": 472.92,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.76
  },
  {
    "time": "1989-10-01",
    "open": 455.63,
    "high": 487.6,
    "low": 447,
    "close": 455.63,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.66
  },
  {
    "time": "1989-11-01",
    "open": 456.09,
    "high": 457.83,
    "low": 446.72,
    "close": 456.09,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.1
  },
  {
    "time": "1989-12-01",
    "open": 454.82,
    "high": 459.4,
    "low": 431.7,
    "close": 454.82,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.28
  },
  {
    "time": "1990-01-01",
    "open": 415.81,
    "high": 461.72,
    "low": 409.98,
    "close": 415.81,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.58
  },
  {
    "time": "1990-02-01",
    "open": 425.83,
    "high": 430.92,
    "low": 415.79,
    "close": 425.83,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.41
  },
  {
    "time": "1990-03-01",
    "open": 435.54,
    "high": 443.31,
    "low": 424.44,
    "close": 435.54,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.28
  },
  {
    "time": "1990-04-01",
    "open": 420.07,
    "high": 438.5,
    "low": 416.95,
    "close": 420.07,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.55
  },
  {
    "time": "1990-05-01",
    "open": 458.97,
    "high": 459.98,
    "low": 420.07,
    "close": 458.97,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 9.26
  },
  {
    "time": "1990-06-01",
    "open": 462.29,
    "high": 469.42,
    "low": 453.1,
    "close": 462.29,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.72
  },
  {
    "time": "1990-07-01",
    "open": 438.24,
    "high": 470.3,
    "low": 436.76,
    "close": 438.24,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.2
  },
  {
    "time": "1990-08-01",
    "open": 381.21,
    "high": 438.59,
    "low": 359.67,
    "close": 381.21,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -13.01
  },
  {
    "time": "1990-09-01",
    "open": 344.51,
    "high": 385.19,
    "low": 334.54,
    "close": 344.51,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -9.63
  },
  {
    "time": "1990-10-01",
    "open": 329.84,
    "high": 360.97,
    "low": 322.93,
    "close": 329.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.26
  },
  {
    "time": "1990-11-01",
    "open": 359.06,
    "high": 359.06,
    "low": 327.75,
    "close": 359.06,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.86
  },
  {
    "time": "1990-12-01",
    "open": 373.84,
    "high": 378.03,
    "low": 359.05,
    "close": 373.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.12
  },
  {
    "time": "1991-01-01",
    "open": 414.2,
    "high": 414.29,
    "low": 352.85,
    "close": 414.2,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 10.8
  },
  {
    "time": "1991-02-01",
    "open": 453.05,
    "high": 454.47,
    "low": 413.45,
    "close": 453.05,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 9.38
  },
  {
    "time": "1991-03-01",
    "open": 482.3,
    "high": 483.48,
    "low": 450.26,
    "close": 482.3,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.46
  },
  {
    "time": "1991-04-01",
    "open": 484.72,
    "high": 512.75,
    "low": 479.07,
    "close": 484.72,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.5
  },
  {
    "time": "1991-05-01",
    "open": 506.11,
    "high": 506.16,
    "low": 476.53,
    "close": 506.11,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.41
  },
  {
    "time": "1991-06-01",
    "open": 475.92,
    "high": 508.07,
    "low": 470.92,
    "close": 475.92,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.97
  },
  {
    "time": "1991-07-01",
    "open": 502.04,
    "high": 502.21,
    "low": 471.17,
    "close": 502.04,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.49
  },
  {
    "time": "1991-08-01",
    "open": 508.27,
    "high": 527.76,
    "low": 487,
    "close": 525.68,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.71
  },
  {
    "time": "1991-09-01",
    "open": 526.01,
    "high": 529.29,
    "low": 510.97,
    "close": 526.88,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.23
  },
  {
    "time": "1991-10-01",
    "open": 527.34,
    "high": 543.11,
    "low": 513.08,
    "close": 542.98,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.06
  },
  {
    "time": "1991-11-01",
    "open": 543.26,
    "high": 558.29,
    "low": 516.34,
    "close": 523.9,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.51
  },
  {
    "time": "1991-12-01",
    "open": 522.23,
    "high": 586.35,
    "low": 518.53,
    "close": 586.34,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 11.92
  },
  {
    "time": "1992-01-01",
    "open": 584.28,
    "high": 633.08,
    "low": 576.04,
    "close": 620.21,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.78
  },
  {
    "time": "1992-02-01",
    "open": 619.77,
    "high": 646.11,
    "low": 616.83,
    "close": 633.47,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.14
  },
  {
    "time": "1992-03-01",
    "open": 633.85,
    "high": 637.25,
    "low": 599.41,
    "close": 603.77,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.69
  },
  {
    "time": "1992-04-01",
    "open": 601.58,
    "high": 603.7,
    "low": 557.03,
    "close": 578.68,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.16
  },
  {
    "time": "1992-05-01",
    "open": 579.96,
    "high": 591.27,
    "low": 571,
    "close": 585.31,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.15
  },
  {
    "time": "1992-06-01",
    "open": 584.43,
    "high": 591.12,
    "low": 545.85,
    "close": 563.6,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.71
  },
  {
    "time": "1992-07-01",
    "open": 563.36,
    "high": 581.11,
    "low": 553.74,
    "close": 580.83,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.06
  },
  {
    "time": "1992-08-01",
    "open": 580.75,
    "high": 583.9,
    "low": 550.23,
    "close": 563.12,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.05
  },
  {
    "time": "1992-09-01",
    "open": 563.21,
    "high": 594.27,
    "low": 562.19,
    "close": 583.27,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.58
  },
  {
    "time": "1992-10-01",
    "open": 582.48,
    "high": 606.71,
    "low": 551.64,
    "close": 605.17,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.75
  },
  {
    "time": "1992-11-01",
    "open": 605.48,
    "high": 652.77,
    "low": 603.23,
    "close": 652.73,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.86
  },
  {
    "time": "1992-12-01",
    "open": 652.34,
    "high": 676.95,
    "low": 648.69,
    "close": 676.95,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.71
  },
  {
    "time": "1993-01-01",
    "open": 676.78,
    "high": 711.29,
    "low": 670.4,
    "close": 696.34,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.86
  },
  {
    "time": "1993-02-01",
    "open": 696.79,
    "high": 711.29,
    "low": 647.69,
    "close": 670.77,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.67
  },
  {
    "time": "1993-03-01",
    "open": 671.84,
    "high": 697.52,
    "low": 668.55,
    "close": 690.13,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.89
  },
  {
    "time": "1993-04-01",
    "open": 690.24,
    "high": 691.22,
    "low": 644.59,
    "close": 661.42,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.16
  },
  {
    "time": "1993-05-01",
    "open": 662.29,
    "high": 707.29,
    "low": 661.24,
    "close": 700.53,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.91
  },
  {
    "time": "1993-06-01",
    "open": 701.16,
    "high": 706.64,
    "low": 682.83,
    "close": 703.95,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.49
  },
  {
    "time": "1993-07-01",
    "open": 704.42,
    "high": 714.12,
    "low": 694.49,
    "close": 704.7,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.11
  },
  {
    "time": "1993-08-01",
    "open": 705.06,
    "high": 743.14,
    "low": 704.7,
    "close": 742.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.41
  },
  {
    "time": "1993-09-01",
    "open": 742.79,
    "high": 766.67,
    "low": 724.32,
    "close": 762.78,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.68
  },
  {
    "time": "1993-10-01",
    "open": 762.52,
    "high": 791.3,
    "low": 758.78,
    "close": 779.26,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.16
  },
  {
    "time": "1993-11-01",
    "open": 779.78,
    "high": 786.26,
    "low": 737.53,
    "close": 754.39,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.19
  },
  {
    "time": "1993-12-01",
    "open": 757.4,
    "high": 777.02,
    "low": 750.25,
    "close": 776.8,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.97
  },
  {
    "time": "1994-01-01",
    "open": 777.29,
    "high": 800.7,
    "low": 768.34,
    "close": 800.47,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.05
  },
  {
    "time": "1994-02-01",
    "open": 799.99,
    "high": 800.51,
    "low": 767.07,
    "close": 792.5,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1
  },
  {
    "time": "1994-03-01",
    "open": 793.35,
    "high": 804.53,
    "low": 731.74,
    "close": 743.46,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -6.19
  },
  {
    "time": "1994-04-01",
    "open": 737.13,
    "high": 755.6,
    "low": 703.15,
    "close": 733.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.29
  },
  {
    "time": "1994-05-01",
    "open": 735.01,
    "high": 742.68,
    "low": 703.78,
    "close": 735.19,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.18
  },
  {
    "time": "1994-06-01",
    "open": 735.01,
    "high": 744.97,
    "low": 690.85,
    "close": 705.96,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.98
  },
  {
    "time": "1994-07-01",
    "open": 706.29,
    "high": 726.06,
    "low": 699.37,
    "close": 722.16,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.29
  },
  {
    "time": "1994-08-01",
    "open": 722.84,
    "high": 767.67,
    "low": 715.77,
    "close": 765.62,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.02
  },
  {
    "time": "1994-09-01",
    "open": 763,
    "high": 779.73,
    "low": 752.35,
    "close": 764.29,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.17
  },
  {
    "time": "1994-10-01",
    "open": 764.47,
    "high": 778.88,
    "low": 737.59,
    "close": 777.49,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.73
  },
  {
    "time": "1994-11-01",
    "open": 776.25,
    "high": 777.52,
    "low": 728.72,
    "close": 750.32,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.49
  },
  {
    "time": "1994-12-01",
    "open": 748.83,
    "high": 752.21,
    "low": 710.87,
    "close": 751.96,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.22
  },
  {
    "time": "1995-01-01",
    "open": 751.31,
    "high": 774.35,
    "low": 740.44,
    "close": 755.2,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.43
  },
  {
    "time": "1995-02-01",
    "open": 756.68,
    "high": 796.24,
    "low": 755.2,
    "close": 793.73,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.1
  },
  {
    "time": "1995-03-01",
    "open": 794.33,
    "high": 830.01,
    "low": 790.23,
    "close": 817.21,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.96
  },
  {
    "time": "1995-04-01",
    "open": 816.06,
    "high": 844.45,
    "low": 810.82,
    "close": 843.98,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.28
  },
  {
    "time": "1995-05-01",
    "open": 844.72,
    "high": 886.1,
    "low": 839.26,
    "close": 864.58,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.44
  },
  {
    "time": "1995-06-01",
    "open": 865.67,
    "high": 940.21,
    "low": 863.76,
    "close": 933.45,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.97
  },
  {
    "time": "1995-07-01",
    "open": 933.99,
    "high": 1011.9,
    "low": 931.95,
    "close": 1001.21,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.26
  },
  {
    "time": "1995-08-01",
    "open": 1001.57,
    "high": 1035.35,
    "low": 970.6,
    "close": 1020.11,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.89
  },
  {
    "time": "1995-09-01",
    "open": 1019.42,
    "high": 1070.47,
    "low": 1008.38,
    "close": 1043.54,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.3
  },
  {
    "time": "1995-10-01",
    "open": 1041.39,
    "high": 1050.69,
    "low": 956.98,
    "close": 1036.06,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.72
  },
  {
    "time": "1995-11-01",
    "open": 1037.3,
    "high": 1068.8,
    "low": 1016.36,
    "close": 1059.2,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.23
  },
  {
    "time": "1995-12-01",
    "open": 1060.66,
    "high": 1075.14,
    "low": 1001.37,
    "close": 1052.13,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.67
  },
  {
    "time": "1996-01-01",
    "open": 1052.83,
    "high": 1059.81,
    "low": 969.95,
    "close": 1059.79,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.73
  },
  {
    "time": "1996-02-01",
    "open": 1058.26,
    "high": 1122.05,
    "low": 1057.7,
    "close": 1100.05,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.8
  },
  {
    "time": "1996-03-01",
    "open": 1098.94,
    "high": 1119.89,
    "low": 1057.73,
    "close": 1101.4,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.12
  },
  {
    "time": "1996-04-01",
    "open": 1105.77,
    "high": 1191.17,
    "low": 1092.23,
    "close": 1190.52,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.09
  },
  {
    "time": "1996-05-01",
    "open": 1190.48,
    "high": 1252.92,
    "low": 1163.02,
    "close": 1243.43,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.44
  },
  {
    "time": "1996-06-01",
    "open": 1242.54,
    "high": 1254.32,
    "low": 1147.58,
    "close": 1185.02,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.7
  },
  {
    "time": "1996-07-01",
    "open": 1185.64,
    "high": 1199.98,
    "low": 1008.44,
    "close": 1080.59,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.81
  },
  {
    "time": "1996-08-01",
    "open": 1081.34,
    "high": 1154.03,
    "low": 1080.41,
    "close": 1141.5,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.64
  },
  {
    "time": "1996-09-01",
    "open": 1133.3,
    "high": 1237.26,
    "low": 1123.14,
    "close": 1226.92,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.48
  },
  {
    "time": "1996-10-01",
    "open": 1223.73,
    "high": 1269.62,
    "low": 1202.36,
    "close": 1221.51,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.44
  },
  {
    "time": "1996-11-01",
    "open": 1223.72,
    "high": 1293.75,
    "low": 1165.81,
    "close": 1292.61,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.82
  },
  {
    "time": "1996-12-01",
    "open": 1294.78,
    "high": 1328.95,
    "low": 1251.03,
    "close": 1291.03,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.12
  },
  {
    "time": "1997-01-01",
    "open": 1292.65,
    "high": 1400.53,
    "low": 1272.34,
    "close": 1379.85,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.88
  },
  {
    "time": "1997-02-01",
    "open": 1383.97,
    "high": 1384.51,
    "low": 1296.88,
    "close": 1309,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.13
  },
  {
    "time": "1997-03-01",
    "open": 1306.21,
    "high": 1332.49,
    "low": 1220.4,
    "close": 1221.7,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -6.67
  },
  {
    "time": "1997-04-01",
    "open": 1211.28,
    "high": 1267.41,
    "low": 1194.16,
    "close": 1260.76,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.2
  },
  {
    "time": "1997-05-01",
    "open": 1263.93,
    "high": 1414.26,
    "low": 1260.94,
    "close": 1400.32,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 11.07
  },
  {
    "time": "1997-06-01",
    "open": 1407.07,
    "high": 1458.85,
    "low": 1375.45,
    "close": 1442.07,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.98
  },
  {
    "time": "1997-07-01",
    "open": 1442.65,
    "high": 1595.76,
    "low": 1432.42,
    "close": 1593.81,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 10.52
  },
  {
    "time": "1997-08-01",
    "open": 1594.67,
    "high": 1638.26,
    "low": 1545.13,
    "close": 1587.32,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.41
  },
  {
    "time": "1997-09-01",
    "open": 1595.07,
    "high": 1702.49,
    "low": 1587.32,
    "close": 1685.69,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.2
  },
  {
    "time": "1997-10-01",
    "open": 1690.79,
    "high": 1748.78,
    "low": 1465.84,
    "close": 1593.61,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.46
  },
  {
    "time": "1997-11-01",
    "open": 1609.62,
    "high": 1654.43,
    "low": 1526.85,
    "close": 1600.55,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.44
  },
  {
    "time": "1997-12-01",
    "open": 1608.56,
    "high": 1652.84,
    "low": 1486.23,
    "close": 1570.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.89
  },
  {
    "time": "1998-01-01",
    "open": 1574.1,
    "high": 1629.54,
    "low": 1465.61,
    "close": 1619.36,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.12
  },
  {
    "time": "1998-02-01",
    "open": 1640.06,
    "high": 1783.74,
    "low": 1619.36,
    "close": 1770.51,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 9.33
  },
  {
    "time": "1998-03-01",
    "open": 1778.72,
    "high": 1840.83,
    "low": 1708.48,
    "close": 1835.68,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.68
  },
  {
    "time": "1998-04-01",
    "open": 1838.15,
    "high": 1931.83,
    "low": 1788.74,
    "close": 1868.41,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.78
  },
  {
    "time": "1998-05-01",
    "open": 1871.81,
    "high": 1890.8,
    "low": 1741.72,
    "close": 1778.87,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.79
  },
  {
    "time": "1998-06-01",
    "open": 1770.37,
    "high": 1898.76,
    "low": 1715.04,
    "close": 1894.74,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.51
  },
  {
    "time": "1998-07-01",
    "open": 1904.24,
    "high": 2028.18,
    "low": 1871.72,
    "close": 1872.39,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.18
  },
  {
    "time": "1998-08-01",
    "open": 1869.72,
    "high": 1874.31,
    "low": 1498.73,
    "close": 1499.25,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -19.93
  },
  {
    "time": "1998-09-01",
    "open": 1509.01,
    "high": 1769.71,
    "low": 1475.49,
    "close": 1693.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.98
  },
  {
    "time": "1998-10-01",
    "open": 1663.3,
    "high": 1781.63,
    "low": 1357.09,
    "close": 1771.39,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.58
  },
  {
    "time": "1998-11-01",
    "open": 1783.71,
    "high": 2025.04,
    "low": 1771.4,
    "close": 1949.54,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 10.06
  },
  {
    "time": "1998-12-01",
    "open": 1928.51,
    "high": 2200.63,
    "low": 1924.15,
    "close": 2192.69,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.47
  },
  {
    "time": "1999-01-01",
    "open": 2207.54,
    "high": 2506.68,
    "low": 2192.68,
    "close": 2505.89,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 14.28
  },
  {
    "time": "1999-02-01",
    "open": 2522.38,
    "high": 2533.44,
    "low": 2224.21,
    "close": 2288.03,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.69
  },
  {
    "time": "1999-03-01",
    "open": 2286.83,
    "high": 2520.63,
    "low": 2235.19,
    "close": 2461.4,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.58
  },
  {
    "time": "1999-04-01",
    "open": 2493.07,
    "high": 2677.76,
    "low": 2329.87,
    "close": 2542.85,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.31
  },
  {
    "time": "1999-05-01",
    "open": 2546.33,
    "high": 2632.74,
    "low": 2339.12,
    "close": 2470.52,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.84
  },
  {
    "time": "1999-06-01",
    "open": 2467.51,
    "high": 2696.87,
    "low": 2364.59,
    "close": 2686.12,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.73
  },
  {
    "time": "1999-07-01",
    "open": 2692.96,
    "high": 2874.92,
    "low": 2619.08,
    "close": 2638.49,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.77
  },
  {
    "time": "1999-08-01",
    "open": 2638.31,
    "high": 2819.9,
    "low": 2442.22,
    "close": 2739.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.82
  },
  {
    "time": "1999-09-01",
    "open": 2752.33,
    "high": 2897.53,
    "low": 2684.7,
    "close": 2746.16,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.25
  },
  {
    "time": "1999-10-01",
    "open": 2729.04,
    "high": 2978.63,
    "low": 2632.01,
    "close": 2966.43,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.02
  },
  {
    "time": "1999-11-01",
    "open": 2970.93,
    "high": 3469.35,
    "low": 2967.63,
    "close": 3336.16,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.46
  },
  {
    "time": "1999-12-01",
    "open": 3341.1,
    "high": 4090.61,
    "low": 3321.57,
    "close": 4069.31,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 21.98
  },
  {
    "time": "2000-01-01",
    "open": 4186.19,
    "high": 4303.15,
    "low": 3711.09,
    "close": 3940.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.17
  },
  {
    "time": "2000-02-01",
    "open": 3961.07,
    "high": 4698.46,
    "low": 3911.84,
    "close": 4696.69,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 19.19
  },
  {
    "time": "2000-03-01",
    "open": 4732.82,
    "high": 5132.52,
    "low": 4355.69,
    "close": 4572.83,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.64
  },
  {
    "time": "2000-04-01",
    "open": 4494.89,
    "high": 4572.84,
    "low": 3227.04,
    "close": 3860.66,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -15.57
  },
  {
    "time": "2000-05-01",
    "open": 3930.18,
    "high": 3982.38,
    "low": 3042.66,
    "close": 3400.91,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -11.91
  },
  {
    "time": "2000-06-01",
    "open": 3471.95,
    "high": 4073.73,
    "low": 3400.91,
    "close": 3966.11,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 16.62
  },
  {
    "time": "2000-07-01",
    "open": 3950.59,
    "high": 4289.06,
    "low": 3615.79,
    "close": 3766.99,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.02
  },
  {
    "time": "2000-08-01",
    "open": 3760.95,
    "high": 4208.73,
    "low": 3521.14,
    "close": 4206.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 11.66
  },
  {
    "time": "2000-09-01",
    "open": 4252.15,
    "high": 4259.87,
    "low": 3614.66,
    "close": 3672.82,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -12.68
  },
  {
    "time": "2000-10-01",
    "open": 3714.48,
    "high": 3714.48,
    "low": 3026.11,
    "close": 3369.63,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.25
  },
  {
    "time": "2000-11-01",
    "open": 3316.51,
    "high": 3480.01,
    "low": 2523.04,
    "close": 2597.93,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -22.9
  },
  {
    "time": "2000-12-01",
    "open": 2644.09,
    "high": 3028.75,
    "low": 2288.16,
    "close": 2470.52,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.9
  },
  {
    "time": "2001-01-01",
    "open": 2474.16,
    "high": 2892.36,
    "low": 2251.71,
    "close": 2772.73,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.23
  },
  {
    "time": "2001-02-01",
    "open": 2771.57,
    "high": 2796.89,
    "low": 2127.5,
    "close": 2151.83,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -22.39
  },
  {
    "time": "2001-03-01",
    "open": 2126.3,
    "high": 2243.78,
    "low": 1794.21,
    "close": 1840.26,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -14.48
  },
  {
    "time": "2001-04-01",
    "open": 1835.22,
    "high": 2202.86,
    "low": 1619.58,
    "close": 2116.24,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 15
  },
  {
    "time": "2001-05-01",
    "open": 2116.24,
    "high": 2328.05,
    "low": 2052.41,
    "close": 2110.49,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.27
  },
  {
    "time": "2001-06-01",
    "open": 2131.12,
    "high": 2264.58,
    "low": 1973.7,
    "close": 2161.24,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.4
  },
  {
    "time": "2001-07-01",
    "open": 2156.76,
    "high": 2181.05,
    "low": 1934.67,
    "close": 2027.13,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -6.21
  },
  {
    "time": "2001-08-01",
    "open": 2051.56,
    "high": 2102.53,
    "low": 1777.11,
    "close": 1805.43,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -10.94
  },
  {
    "time": "2001-09-01",
    "open": 1802.29,
    "high": 1836.19,
    "low": 1387.06,
    "close": 1498.8,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -16.98
  },
  {
    "time": "2001-10-01",
    "open": 1491.45,
    "high": 1792.87,
    "low": 1458.41,
    "close": 1690.2,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 12.77
  },
  {
    "time": "2001-11-01",
    "open": 1705.52,
    "high": 1965.09,
    "low": 1683.99,
    "close": 1930.58,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 14.22
  },
  {
    "time": "2001-12-01",
    "open": 1915.13,
    "high": 2065.69,
    "low": 1898.98,
    "close": 1950.4,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.03
  },
  {
    "time": "2002-01-01",
    "open": 1965.18,
    "high": 2098.88,
    "low": 1851.49,
    "close": 1934.03,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.84
  },
  {
    "time": "2002-02-01",
    "open": 1928.83,
    "high": 1942.15,
    "low": 1696.55,
    "close": 1731.49,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -10.47
  },
  {
    "time": "2002-03-01",
    "open": 1745.49,
    "high": 1946.23,
    "low": 1742.08,
    "close": 1845.35,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.58
  },
  {
    "time": "2002-04-01",
    "open": 1834.59,
    "high": 1865.37,
    "low": 1640.97,
    "close": 1688.23,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -8.51
  },
  {
    "time": "2002-05-01",
    "open": 1683.76,
    "high": 1759.33,
    "low": 1560.29,
    "close": 1615.73,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -4.29
  },
  {
    "time": "2002-06-01",
    "open": 1613.5,
    "high": 1621.5,
    "low": 1375.53,
    "close": 1463.21,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -9.44
  },
  {
    "time": "2002-07-01",
    "open": 1457.04,
    "high": 1459.84,
    "low": 1192.42,
    "close": 1328.26,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -9.22
  },
  {
    "time": "2002-08-01",
    "open": 1322.47,
    "high": 1426.76,
    "low": 1205.68,
    "close": 1314.85,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.01
  },
  {
    "time": "2002-09-01",
    "open": 1302.67,
    "high": 1347.27,
    "low": 1160.07,
    "close": 1172.06,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -10.86
  },
  {
    "time": "2002-10-01",
    "open": 1180.26,
    "high": 1347.58,
    "low": 1108.49,
    "close": 1329.75,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 13.45
  },
  {
    "time": "2002-11-01",
    "open": 1320.95,
    "high": 1497.44,
    "low": 1313.72,
    "close": 1478.78,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 11.21
  },
  {
    "time": "2002-12-01",
    "open": 1507.94,
    "high": 1521.44,
    "low": 1327.19,
    "close": 1335.51,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -9.69
  },
  {
    "time": "2003-01-01",
    "open": 1346.93,
    "high": 1467.35,
    "low": 1303.64,
    "close": 1320.91,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.09
  },
  {
    "time": "2003-02-01",
    "open": 1324.74,
    "high": 1352.07,
    "low": 1261.79,
    "close": 1337.52,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.26
  },
  {
    "time": "2003-03-01",
    "open": 1344.21,
    "high": 1425.73,
    "low": 1253.22,
    "close": 1341.17,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 0.27
  },
  {
    "time": "2003-04-01",
    "open": 1347.54,
    "high": 1482.49,
    "low": 1338.23,
    "close": 1464.31,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 9.18
  },
  {
    "time": "2003-05-01",
    "open": 1463,
    "high": 1599.92,
    "low": 1451.32,
    "close": 1595.91,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.99
  },
  {
    "time": "2003-06-01",
    "open": 1612.1,
    "high": 1686.1,
    "low": 1584.7,
    "close": 1622.8,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.68
  },
  {
    "time": "2003-07-01",
    "open": 1617.3,
    "high": 1776.1,
    "low": 1598.92,
    "close": 1735.02,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.92
  },
  {
    "time": "2003-08-01",
    "open": 1731.63,
    "high": 1813.82,
    "low": 1640.88,
    "close": 1810.45,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.35
  },
  {
    "time": "2003-09-01",
    "open": 1817.92,
    "high": 1913.74,
    "low": 1783.46,
    "close": 1786.94,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.3
  },
  {
    "time": "2003-10-01",
    "open": 1797.07,
    "high": 1966.87,
    "low": 1796.09,
    "close": 1932.21,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 8.13
  },
  {
    "time": "2003-11-01",
    "open": 1941.31,
    "high": 1992.27,
    "low": 1878.07,
    "close": 1960.26,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 1.45
  },
  {
    "time": "2003-12-01",
    "open": 1972.97,
    "high": 2015.23,
    "low": 1887.46,
    "close": 2003.37,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.2
  },
  {
    "time": "2004-01-01",
    "open": 2011.08,
    "high": 2153.83,
    "low": 1999.77,
    "close": 2066.15,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.13
  },
  {
    "time": "2004-02-01",
    "open": 2072.13,
    "high": 2094.92,
    "low": 1991.05,
    "close": 2029.82,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.76
  },
  {
    "time": "2004-03-01",
    "open": 2036.92,
    "high": 2069.02,
    "low": 1896.91,
    "close": 1994.22,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.75
  },
  {
    "time": "2004-04-01",
    "open": 1996.45,
    "high": 2079.12,
    "low": 1919.39,
    "close": 1920.15,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.71
  },
  {
    "time": "2004-05-01",
    "open": 1928.72,
    "high": 1991.87,
    "low": 1865.4,
    "close": 1986.74,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.47
  },
  {
    "time": "2004-06-01",
    "open": 1978.52,
    "high": 2055.65,
    "low": 1960.26,
    "close": 2047.79,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.07
  },
  {
    "time": "2004-07-01",
    "open": 2045.53,
    "high": 2045.53,
    "low": 1829.06,
    "close": 1887.36,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -7.83
  },
  {
    "time": "2004-08-01",
    "open": 1874.93,
    "high": 1893.13,
    "low": 1750.82,
    "close": 1838.1,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.61
  },
  {
    "time": "2004-09-01",
    "open": 1833.37,
    "high": 1925.85,
    "low": 1833.33,
    "close": 1896.84,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.2
  },
  {
    "time": "2004-10-01",
    "open": 1909.59,
    "high": 1984.18,
    "low": 1899.33,
    "close": 1974.99,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.12
  },
  {
    "time": "2004-11-01",
    "open": 1975.48,
    "high": 2117.89,
    "low": 1969.32,
    "close": 2096.81,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.17
  },
  {
    "time": "2004-12-01",
    "open": 2104.58,
    "high": 2185.56,
    "low": 2097.86,
    "close": 2175.44,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 3.75
  },
  {
    "time": "2005-01-01",
    "open": 2184.75,
    "high": 2191.6,
    "low": 2008.68,
    "close": 2062.41,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -5.2
  },
  {
    "time": "2005-02-01",
    "open": 2063.27,
    "high": 2103.45,
    "low": 2023,
    "close": 2051.72,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.52
  },
  {
    "time": "2005-03-01",
    "open": 2057.47,
    "high": 2100.57,
    "low": 1968.58,
    "close": 1999.23,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -2.56
  },
  {
    "time": "2005-04-01",
    "open": 2009.09,
    "high": 2021.82,
    "low": 1889.83,
    "close": 1921.65,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -3.88
  },
  {
    "time": "2005-05-01",
    "open": 1923.23,
    "high": 2076.8,
    "low": 1916.03,
    "close": 2068.22,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 7.63
  },
  {
    "time": "2005-06-01",
    "open": 2067.23,
    "high": 2106.57,
    "low": 2039.69,
    "close": 2056.96,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.54
  },
  {
    "time": "2005-07-01",
    "open": 2060.97,
    "high": 2201.39,
    "low": 2050.3,
    "close": 2184.83,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 6.22
  },
  {
    "time": "2005-08-01",
    "open": 2191.49,
    "high": 2219.91,
    "low": 2112.25,
    "close": 2152.09,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.5
  },
  {
    "time": "2005-09-01",
    "open": 2150.03,
    "high": 2186.83,
    "low": 2093.06,
    "close": 2151.69,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.02
  },
  {
    "time": "2005-10-01",
    "open": 2152.7,
    "high": 2167,
    "low": 2025.58,
    "close": 2120.3,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.46
  },
  {
    "time": "2005-11-01",
    "open": 2109.89,
    "high": 2269.3,
    "low": 2108.86,
    "close": 2232.82,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 5.31
  },
  {
    "time": "2005-12-01",
    "open": 2244.85,
    "high": 2278.16,
    "low": 2200.51,
    "close": 2205.32,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.23
  },
  {
    "time": "2006-01-01",
    "open": 2216.53,
    "high": 2332.92,
    "low": 2189.91,
    "close": 2305.82,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 4.56
  },
  {
    "time": "2006-02-01",
    "open": 2294.11,
    "high": 2313.53,
    "low": 2232.68,
    "close": 2281.39,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -1.06
  },
  {
    "time": "2006-03-01",
    "open": 2288.15,
    "high": 2353.14,
    "low": 2239.54,
    "close": 2339.79,
    "volume": null,
    "volumeRaw": null,
    "changePercent": 2.56
  },
  {
    "time": "2006-04-01",
    "open": 2352.24,
    "high": 2375.54,
    "low": 2299.42,
    "close": 2322.57,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -0.74
  },
  {
    "time": "2006-05-01",
    "open": 2329.79,
    "high": 2352.56,
    "low": 2135.81,
    "close": 2178.88,
    "volume": null,
    "volumeRaw": null,
    "changePercent": -6.19
  },
  {
    "time": "2006-06-01",
    "open": 2179.82,
    "high": 2233.88,
    "low": 2065.11,
    "close": 2172.09,
    "volume": 17540000000,
    "volumeRaw": "17.54B",
    "changePercent": -0.31
  },
  {
    "time": "2006-07-01",
    "open": 2177.91,
    "high": 2190.44,
    "low": 2012.78,
    "close": 2091.47,
    "volume": 26890000000,
    "volumeRaw": "26.89B",
    "changePercent": -3.71
  },
  {
    "time": "2006-08-01",
    "open": 2080.34,
    "high": 2193.34,
    "low": 2048.22,
    "close": 2183.75,
    "volume": 18680000000,
    "volumeRaw": "18.68B",
    "changePercent": 4.41
  },
  {
    "time": "2006-09-01",
    "open": 2194.56,
    "high": 2273.3,
    "low": 2147.44,
    "close": 2258.43,
    "volume": 18440000000,
    "volumeRaw": "18.44B",
    "changePercent": 3.42
  },
  {
    "time": "2006-10-01",
    "open": 2257,
    "high": 2379.29,
    "low": 2224.21,
    "close": 2366.71,
    "volume": 20920000000,
    "volumeRaw": "20.92B",
    "changePercent": 4.79
  },
  {
    "time": "2006-11-01",
    "open": 2373.49,
    "high": 2468.42,
    "low": 2316.82,
    "close": 2431.77,
    "volume": 17200000000,
    "volumeRaw": "17.20B",
    "changePercent": 2.75
  },
  {
    "time": "2006-12-01",
    "open": 2430.75,
    "high": 2470.95,
    "low": 2392.95,
    "close": 2415.29,
    "volume": 16059999999.999998,
    "volumeRaw": "16.06B",
    "changePercent": -0.68
  },
  {
    "time": "2007-01-01",
    "open": 2429.72,
    "high": 2508.93,
    "low": 2394.66,
    "close": 2463.93,
    "volume": 18720000000,
    "volumeRaw": "18.72B",
    "changePercent": 2.01
  },
  {
    "time": "2007-02-01",
    "open": 2474.08,
    "high": 2531.42,
    "low": 2395.35,
    "close": 2416.15,
    "volume": 17100000000.000002,
    "volumeRaw": "17.10B",
    "changePercent": -1.94
  },
  {
    "time": "2007-03-01",
    "open": 2377.18,
    "high": 2459.96,
    "low": 2331.57,
    "close": 2421.64,
    "volume": 20270000000,
    "volumeRaw": "20.27B",
    "changePercent": 0.23
  },
  {
    "time": "2007-04-01",
    "open": 2425.36,
    "high": 2562.99,
    "low": 2409.04,
    "close": 2525.09,
    "volume": 18180000000,
    "volumeRaw": "18.18B",
    "changePercent": 4.27
  },
  {
    "time": "2007-05-01",
    "open": 2529.95,
    "high": 2607.9,
    "low": 2510.57,
    "close": 2604.52,
    "volume": 20210000000,
    "volumeRaw": "20.21B",
    "changePercent": 3.15
  },
  {
    "time": "2007-06-01",
    "open": 2614.01,
    "high": 2634.6,
    "low": 2534.97,
    "close": 2603.23,
    "volume": 20010000000,
    "volumeRaw": "20.01B",
    "changePercent": -0.05
  },
  {
    "time": "2007-07-01",
    "open": 2617.39,
    "high": 2724.74,
    "low": 2545.57,
    "close": 2545.57,
    "volume": 20210000000,
    "volumeRaw": "20.21B",
    "changePercent": -2.21
  },
  {
    "time": "2007-08-01",
    "open": 2538.5,
    "high": 2627.75,
    "low": 2386.69,
    "close": 2596.36,
    "volume": 23990000000,
    "volumeRaw": "23.99B",
    "changePercent": 2
  },
  {
    "time": "2007-09-01",
    "open": 2596.38,
    "high": 2716.75,
    "low": 2536.93,
    "close": 2701.5,
    "volume": 15460000000,
    "volumeRaw": "15.46B",
    "changePercent": 4.05
  },
  {
    "time": "2007-10-01",
    "open": 2704.25,
    "high": 2861.51,
    "low": 2698.14,
    "close": 2859.12,
    "volume": 20700000000,
    "volumeRaw": "20.70B",
    "changePercent": 5.83
  },
  {
    "time": "2007-11-01",
    "open": 2835,
    "high": 2835.63,
    "low": 2539.81,
    "close": 2660.96,
    "volume": 21070000000,
    "volumeRaw": "21.07B",
    "changePercent": -6.93
  },
  {
    "time": "2007-12-01",
    "open": 2654.91,
    "high": 2734.82,
    "low": 2553.99,
    "close": 2652.28,
    "volume": 16079999999.999998,
    "volumeRaw": "16.08B",
    "changePercent": -0.33
  },
  {
    "time": "2008-01-01",
    "open": 2653.91,
    "high": 2661.5,
    "low": 2202.54,
    "close": 2389.86,
    "volume": 24810000000,
    "volumeRaw": "24.81B",
    "changePercent": -9.89
  },
  {
    "time": "2008-02-01",
    "open": 2392.58,
    "high": 2419.23,
    "low": 2252.65,
    "close": 2271.48,
    "volume": 19890000000,
    "volumeRaw": "19.89B",
    "changePercent": -4.95
  },
  {
    "time": "2008-03-01",
    "open": 2271.26,
    "high": 2346.78,
    "low": 2155.42,
    "close": 2279.1,
    "volume": 19520000000,
    "volumeRaw": "19.52B",
    "changePercent": 0.34
  },
  {
    "time": "2008-04-01",
    "open": 2306.51,
    "high": 2451.19,
    "low": 2266.29,
    "close": 2412.8,
    "volume": 17610000000,
    "volumeRaw": "17.61B",
    "changePercent": 5.87
  },
  {
    "time": "2008-05-01",
    "open": 2416.49,
    "high": 2551.47,
    "low": 2416.49,
    "close": 2522.66,
    "volume": 17480000000,
    "volumeRaw": "17.48B",
    "changePercent": 4.55
  },
  {
    "time": "2008-06-01",
    "open": 2514.82,
    "high": 2549.94,
    "low": 2290.59,
    "close": 2292.98,
    "volume": 19270000000,
    "volumeRaw": "19.27B",
    "changePercent": -9.1
  },
  {
    "time": "2008-07-01",
    "open": 2274.24,
    "high": 2353.39,
    "low": 2167.29,
    "close": 2325.55,
    "volume": 20420000000,
    "volumeRaw": "20.42B",
    "changePercent": 1.42
  },
  {
    "time": "2008-08-01",
    "open": 2326.83,
    "high": 2473.2,
    "low": 2280.93,
    "close": 2367.52,
    "volume": 14410000000,
    "volumeRaw": "14.41B",
    "changePercent": 1.8
  },
  {
    "time": "2008-09-01",
    "open": 2402.11,
    "high": 2413.11,
    "low": 1983.73,
    "close": 2091.88,
    "volume": 19750000000,
    "volumeRaw": "19.75B",
    "changePercent": -11.64
  },
  {
    "time": "2008-10-01",
    "open": 2075.1,
    "high": 2083.2,
    "low": 1493.79,
    "close": 1720.95,
    "volume": 25280000000,
    "volumeRaw": "25.28B",
    "changePercent": -17.73
  },
  {
    "time": "2008-11-01",
    "open": 1718.89,
    "high": 1785.84,
    "low": 1295.48,
    "close": 1535.57,
    "volume": 15970000000,
    "volumeRaw": "15.97B",
    "changePercent": -10.77
  },
  {
    "time": "2008-12-01",
    "open": 1496.09,
    "high": 1602.92,
    "low": 1398.07,
    "close": 1577.03,
    "volume": 15380000000,
    "volumeRaw": "15.38B",
    "changePercent": 2.7
  },
  {
    "time": "2009-01-01",
    "open": 1578.87,
    "high": 1665.63,
    "low": 1434.08,
    "close": 1476.42,
    "volume": 15090000000,
    "volumeRaw": "15.09B",
    "changePercent": -6.38
  },
  {
    "time": "2009-02-01",
    "open": 1460.85,
    "high": 1598.5,
    "low": 1372.42,
    "close": 1377.84,
    "volume": 15710000000,
    "volumeRaw": "15.71B",
    "changePercent": -6.68
  },
  {
    "time": "2009-03-01",
    "open": 1356.13,
    "high": 1587,
    "low": 1265.52,
    "close": 1528.59,
    "volume": 17300000000,
    "volumeRaw": "17.30B",
    "changePercent": 10.94
  },
  {
    "time": "2009-04-01",
    "open": 1504.87,
    "high": 1753.61,
    "low": 1498.54,
    "close": 1717.3,
    "volume": 15430000000,
    "volumeRaw": "15.43B",
    "changePercent": 12.35
  },
  {
    "time": "2009-05-01",
    "open": 1719.29,
    "high": 1774.33,
    "low": 1664.19,
    "close": 1774.33,
    "volume": 14460000000,
    "volumeRaw": "14.46B",
    "changePercent": 3.32
  },
  {
    "time": "2009-06-01",
    "open": 1796.09,
    "high": 1879.92,
    "low": 1753.78,
    "close": 1835.04,
    "volume": 16200000000,
    "volumeRaw": "16.20B",
    "changePercent": 3.42
  },
  {
    "time": "2009-07-01",
    "open": 1846.12,
    "high": 2009.81,
    "low": 1727.05,
    "close": 1978.5,
    "volume": 14220000000,
    "volumeRaw": "14.22B",
    "changePercent": 7.82
  },
  {
    "time": "2009-08-01",
    "open": 1998.35,
    "high": 2059.48,
    "low": 1929.64,
    "close": 2009.06,
    "volume": 12700000000,
    "volumeRaw": "12.70B",
    "changePercent": 1.54
  },
  {
    "time": "2009-09-01",
    "open": 2001.3,
    "high": 2167.7,
    "low": 1958.04,
    "close": 2122.42,
    "volume": 14270000000,
    "volumeRaw": "14.27B",
    "changePercent": 5.64
  },
  {
    "time": "2009-10-01",
    "open": 2111.77,
    "high": 2190.64,
    "low": 2040.21,
    "close": 2045.11,
    "volume": 15230000000,
    "volumeRaw": "15.23B",
    "changePercent": -3.64
  },
  {
    "time": "2009-11-01",
    "open": 2047.42,
    "high": 2205.32,
    "low": 2024.27,
    "close": 2144.6,
    "volume": 11980000000,
    "volumeRaw": "11.98B",
    "changePercent": 4.86
  },
  {
    "time": "2009-12-01",
    "open": 2162.23,
    "high": 2295.8,
    "low": 2155.96,
    "close": 2269.15,
    "volume": 11530000000,
    "volumeRaw": "11.53B",
    "changePercent": 5.81
  },
  {
    "time": "2010-01-01",
    "open": 2294.41,
    "high": 2326.28,
    "low": 2140.34,
    "close": 2147.35,
    "volume": 12780000000,
    "volumeRaw": "12.78B",
    "changePercent": -5.37
  },
  {
    "time": "2010-02-01",
    "open": 2155.81,
    "high": 2251.68,
    "low": 2100.17,
    "close": 2238.26,
    "volume": 12180000000,
    "volumeRaw": "12.18B",
    "changePercent": 4.23
  },
  {
    "time": "2010-03-01",
    "open": 2247.4,
    "high": 2432.25,
    "low": 2247.33,
    "close": 2397.96,
    "volume": 14440000000,
    "volumeRaw": "14.44B",
    "changePercent": 7.14
  },
  {
    "time": "2010-04-01",
    "open": 2411.68,
    "high": 2535.28,
    "low": 2383.77,
    "close": 2461.19,
    "volume": 13660000000,
    "volumeRaw": "13.66B",
    "changePercent": 2.64
  },
  {
    "time": "2010-05-01",
    "open": 2472.32,
    "high": 2503,
    "low": 2140.53,
    "close": 2257.04,
    "volume": 15560000000,
    "volumeRaw": "15.56B",
    "changePercent": -8.29
  },
  {
    "time": "2010-06-01",
    "open": 2244.79,
    "high": 2341.11,
    "low": 2105.26,
    "close": 2109.24,
    "volume": 14170000000,
    "volumeRaw": "14.17B",
    "changePercent": -6.55
  },
  {
    "time": "2010-07-01",
    "open": 2110.75,
    "high": 2307.6,
    "low": 2061.14,
    "close": 2254.7,
    "volume": 12500000000,
    "volumeRaw": "12.50B",
    "changePercent": 6.9
  },
  {
    "time": "2010-08-01",
    "open": 2283.32,
    "high": 2309.43,
    "low": 2099.29,
    "close": 2114.03,
    "volume": 11610000000,
    "volumeRaw": "11.61B",
    "changePercent": -6.24
  },
  {
    "time": "2010-09-01",
    "open": 2142.75,
    "high": 2400.06,
    "low": 2141.95,
    "close": 2368.62,
    "volume": 11620000000,
    "volumeRaw": "11.62B",
    "changePercent": 12.04
  },
  {
    "time": "2010-10-01",
    "open": 2386.82,
    "high": 2517.5,
    "low": 2332.46,
    "close": 2507.41,
    "volume": 10960000000,
    "volumeRaw": "10.96B",
    "changePercent": 5.86
  },
  {
    "time": "2010-11-01",
    "open": 2520.45,
    "high": 2592.94,
    "low": 2459.79,
    "close": 2498.23,
    "volume": 11050000000,
    "volumeRaw": "11.05B",
    "changePercent": -0.37
  },
  {
    "time": "2010-12-01",
    "open": 2535.19,
    "high": 2675.26,
    "low": 2535.19,
    "close": 2652.87,
    "volume": 9340000000,
    "volumeRaw": "9.34B",
    "changePercent": 6.19
  },
  {
    "time": "2011-01-01",
    "open": 2676.65,
    "high": 2766.17,
    "low": 2663.64,
    "close": 2700.08,
    "volume": 9520000000,
    "volumeRaw": "9.52B",
    "changePercent": 1.78
  },
  {
    "time": "2011-02-01",
    "open": 2717.61,
    "high": 2840.51,
    "low": 2705.54,
    "close": 2782.27,
    "volume": 9620000000,
    "volumeRaw": "9.62B",
    "changePercent": 3.04
  },
  {
    "time": "2011-03-01",
    "open": 2791.08,
    "high": 2802.32,
    "low": 2603.5,
    "close": 2781.07,
    "volume": 12130000000,
    "volumeRaw": "12.13B",
    "changePercent": -0.04
  },
  {
    "time": "2011-04-01",
    "open": 2796.67,
    "high": 2876.83,
    "low": 2706.5,
    "close": 2873.54,
    "volume": 10190000000,
    "volumeRaw": "10.19B",
    "changePercent": 3.32
  },
  {
    "time": "2011-05-01",
    "open": 2881.28,
    "high": 2887.75,
    "low": 2739.85,
    "close": 2835.3,
    "volume": 11830000000,
    "volumeRaw": "11.83B",
    "changePercent": -1.33
  },
  {
    "time": "2011-06-01",
    "open": 2829.39,
    "high": 2834.05,
    "low": 2599.86,
    "close": 2773.52,
    "volume": 12850000000,
    "volumeRaw": "12.85B",
    "changePercent": -2.18
  },
  {
    "time": "2011-07-01",
    "open": 2775.08,
    "high": 2878.94,
    "low": 2724.99,
    "close": 2756.38,
    "volume": 9760000000,
    "volumeRaw": "9.76B",
    "changePercent": -0.62
  },
  {
    "time": "2011-08-01",
    "open": 2791.45,
    "high": 2796.24,
    "low": 2331.65,
    "close": 2579.46,
    "volume": 15410000000,
    "volumeRaw": "15.41B",
    "changePercent": -6.42
  },
  {
    "time": "2011-09-01",
    "open": 2583.34,
    "high": 2643.37,
    "low": 2414.31,
    "close": 2415.4,
    "volume": 11940000000,
    "volumeRaw": "11.94B",
    "changePercent": -6.36
  },
  {
    "time": "2011-10-01",
    "open": 2401.19,
    "high": 2753.37,
    "low": 2298.89,
    "close": 2684.41,
    "volume": 11330000000,
    "volumeRaw": "11.33B",
    "changePercent": 11.14
  },
  {
    "time": "2011-11-01",
    "open": 2607.31,
    "high": 2730.39,
    "low": 2441.48,
    "close": 2620.34,
    "volume": 10180000000,
    "volumeRaw": "10.18B",
    "changePercent": -2.39
  },
  {
    "time": "2011-12-01",
    "open": 2615.67,
    "high": 2674.53,
    "low": 2518.01,
    "close": 2605.15,
    "volume": 8750000000,
    "volumeRaw": "8.75B",
    "changePercent": -0.58
  },
  {
    "time": "2012-01-01",
    "open": 2657.39,
    "high": 2834.3,
    "low": 2627.23,
    "close": 2813.84,
    "volume": 8790000000,
    "volumeRaw": "8.79B",
    "changePercent": 8.01
  },
  {
    "time": "2012-02-01",
    "open": 2830.1,
    "high": 3000.11,
    "low": 2825.19,
    "close": 2966.89,
    "volume": 9350000000,
    "volumeRaw": "9.35B",
    "changePercent": 5.44
  },
  {
    "time": "2012-03-01",
    "open": 2979.11,
    "high": 3134.17,
    "low": 2900.28,
    "close": 3091.57,
    "volume": 9680000000,
    "volumeRaw": "9.68B",
    "changePercent": 4.2
  },
  {
    "time": "2012-04-01",
    "open": 3085.94,
    "high": 3128.25,
    "low": 2946.04,
    "close": 3046.36,
    "volume": 8930000000,
    "volumeRaw": "8.93B",
    "changePercent": -1.46
  },
  {
    "time": "2012-05-01",
    "open": 3044.79,
    "high": 3085.4,
    "low": 2774.45,
    "close": 2827.34,
    "volume": 10550000000,
    "volumeRaw": "10.55B",
    "changePercent": -7.19
  },
  {
    "time": "2012-06-01",
    "open": 2810.13,
    "high": 2942.28,
    "low": 2726.68,
    "close": 2935.05,
    "volume": 10160000000,
    "volumeRaw": "10.16B",
    "changePercent": 3.81
  },
  {
    "time": "2012-07-01",
    "open": 2938.41,
    "high": 2987.94,
    "low": 2837.72,
    "close": 2939.52,
    "volume": 8860000000,
    "volumeRaw": "8.86B",
    "changePercent": 0.15
  },
  {
    "time": "2012-08-01",
    "open": 2956.72,
    "high": 3100.54,
    "low": 2890.85,
    "close": 3066.96,
    "volume": 8590000000,
    "volumeRaw": "8.59B",
    "changePercent": 4.34
  },
  {
    "time": "2012-09-01",
    "open": 3063.25,
    "high": 3196.93,
    "low": 3040.24,
    "close": 3116.23,
    "volume": 8060000000.000001,
    "volumeRaw": "8.06B",
    "changePercent": 1.61
  },
  {
    "time": "2012-10-01",
    "open": 3130.31,
    "high": 3171.46,
    "low": 2961.16,
    "close": 2977.23,
    "volume": 8250000000,
    "volumeRaw": "8.25B",
    "changePercent": -4.46
  },
  {
    "time": "2012-11-01",
    "open": 2987.54,
    "high": 3033.85,
    "low": 2810.8,
    "close": 3010.24,
    "volume": 8590000000,
    "volumeRaw": "8.59B",
    "changePercent": 1.11
  },
  {
    "time": "2012-12-01",
    "open": 3029.21,
    "high": 3061.82,
    "low": 2951.04,
    "close": 3019.51,
    "volume": 7730000000,
    "volumeRaw": "7.73B",
    "changePercent": 0.31
  },
  {
    "time": "2013-01-01",
    "open": 3091.33,
    "high": 3164.06,
    "low": 3076.6,
    "close": 3142.13,
    "volume": 8320000000,
    "volumeRaw": "8.32B",
    "changePercent": 4.06
  },
  {
    "time": "2013-02-01",
    "open": 3162.94,
    "high": 3213.6,
    "low": 3105.36,
    "close": 3160.19,
    "volume": 8070000000,
    "volumeRaw": "8.07B",
    "changePercent": 0.57
  },
  {
    "time": "2013-03-01",
    "open": 3143.54,
    "high": 3270.3,
    "low": 3129.4,
    "close": 3267.52,
    "volume": 7850000000,
    "volumeRaw": "7.85B",
    "changePercent": 3.4
  },
  {
    "time": "2013-04-01",
    "open": 3268.63,
    "high": 3328.79,
    "low": 3154.96,
    "close": 3328.79,
    "volume": 9230000000,
    "volumeRaw": "9.23B",
    "changePercent": 1.88
  },
  {
    "time": "2013-05-01",
    "open": 3325.35,
    "high": 3532.04,
    "low": 3296.51,
    "close": 3455.91,
    "volume": 9020000000,
    "volumeRaw": "9.02B",
    "changePercent": 3.82
  },
  {
    "time": "2013-06-01",
    "open": 3460.76,
    "high": 3488.31,
    "low": 3294.95,
    "close": 3403.25,
    "volume": 9560000000,
    "volumeRaw": "9.56B",
    "changePercent": -1.52
  },
  {
    "time": "2013-07-01",
    "open": 3430.48,
    "high": 3649.35,
    "low": 3415.23,
    "close": 3626.37,
    "volume": 8369999999.999999,
    "volumeRaw": "8.37B",
    "changePercent": 6.56
  },
  {
    "time": "2013-08-01",
    "open": 3654.18,
    "high": 3694.19,
    "low": 3573.57,
    "close": 3589.87,
    "volume": 7580000000,
    "volumeRaw": "7.58B",
    "changePercent": -1.01
  },
  {
    "time": "2013-09-01",
    "open": 3622.64,
    "high": 3798.76,
    "low": 3593.62,
    "close": 3771.48,
    "volume": 8330000000,
    "volumeRaw": "8.33B",
    "changePercent": 5.06
  },
  {
    "time": "2013-10-01",
    "open": 3774.18,
    "high": 3966.71,
    "low": 3650.03,
    "close": 3919.71,
    "volume": 10310000000,
    "volumeRaw": "10.31B",
    "changePercent": 3.93
  },
  {
    "time": "2013-11-01",
    "open": 3932.45,
    "high": 4069.7,
    "low": 3855.07,
    "close": 4059.89,
    "volume": 8560000000.000001,
    "volumeRaw": "8.56B",
    "changePercent": 3.58
  },
  {
    "time": "2013-12-01",
    "open": 4065.66,
    "high": 4177.73,
    "low": 3979.59,
    "close": 4176.59,
    "volume": 9260000000,
    "volumeRaw": "9.26B",
    "changePercent": 2.87
  },
  {
    "time": "2014-01-01",
    "open": 4160.03,
    "high": 4246.55,
    "low": 4044.76,
    "close": 4103.88,
    "volume": 10890000000,
    "volumeRaw": "10.89B",
    "changePercent": -1.74
  },
  {
    "time": "2014-02-01",
    "open": 4105.06,
    "high": 4342.59,
    "low": 3968.19,
    "close": 4308.12,
    "volume": 9940000000,
    "volumeRaw": "9.94B",
    "changePercent": 4.98
  },
  {
    "time": "2014-03-01",
    "open": 4261.42,
    "high": 4371.71,
    "low": 4131.81,
    "close": 4198.99,
    "volume": 11620000000,
    "volumeRaw": "11.62B",
    "changePercent": -2.53
  },
  {
    "time": "2014-04-01",
    "open": 4219.87,
    "high": 4286.09,
    "low": 3946.03,
    "close": 4114.56,
    "volume": 11050000000,
    "volumeRaw": "11.05B",
    "changePercent": -2.01
  },
  {
    "time": "2014-05-01",
    "open": 4121.25,
    "high": 4252.08,
    "low": 4021.05,
    "close": 4242.62,
    "volume": 9830000000,
    "volumeRaw": "9.83B",
    "changePercent": 3.11
  },
  {
    "time": "2014-06-01",
    "open": 4247.96,
    "high": 4417.46,
    "low": 4207.61,
    "close": 4408.18,
    "volume": 10350000000,
    "volumeRaw": "10.35B",
    "changePercent": 3.9
  },
  {
    "time": "2014-07-01",
    "open": 4424.71,
    "high": 4485.93,
    "low": 4351.04,
    "close": 4369.77,
    "volume": 9700000000,
    "volumeRaw": "9.70B",
    "changePercent": -0.87
  },
  {
    "time": "2014-08-01",
    "open": 4363.39,
    "high": 4580.27,
    "low": 4321.89,
    "close": 4580.27,
    "volume": 8180000000,
    "volumeRaw": "8.18B",
    "changePercent": 4.82
  },
  {
    "time": "2014-09-01",
    "open": 4592.42,
    "high": 4610.57,
    "low": 4464.44,
    "close": 4493.39,
    "volume": 10140000000,
    "volumeRaw": "10.14B",
    "changePercent": -1.9
  },
  {
    "time": "2014-10-01",
    "open": 4486.65,
    "high": 4641.51,
    "low": 4116.6,
    "close": 4630.74,
    "volume": 12870000000,
    "volumeRaw": "12.87B",
    "changePercent": 3.06
  },
  {
    "time": "2014-11-01",
    "open": 4633.71,
    "high": 4810.86,
    "low": 4594.91,
    "close": 4791.63,
    "volume": 8480000000,
    "volumeRaw": "8.48B",
    "changePercent": 3.47
  },
  {
    "time": "2014-12-01",
    "open": 4777.73,
    "high": 4814.95,
    "low": 4547.31,
    "close": 4736.05,
    "volume": 10630000000,
    "volumeRaw": "10.63B",
    "changePercent": -1.16
  },
  {
    "time": "2015-01-01",
    "open": 4760.24,
    "high": 4777.01,
    "low": 4563.11,
    "close": 4635.24,
    "volume": 10020000000,
    "volumeRaw": "10.02B",
    "changePercent": -2.13
  },
  {
    "time": "2015-02-01",
    "open": 4650.6,
    "high": 4989.25,
    "low": 4580.46,
    "close": 4963.53,
    "volume": 8770000000,
    "volumeRaw": "8.77B",
    "changePercent": 7.08
  },
  {
    "time": "2015-03-01",
    "open": 4973.43,
    "high": 5042.14,
    "low": 4825.93,
    "close": 4900.88,
    "volume": 10390000000,
    "volumeRaw": "10.39B",
    "changePercent": -1.26
  },
  {
    "time": "2015-04-01",
    "open": 4894.36,
    "high": 5119.83,
    "low": 4844.39,
    "close": 4941.42,
    "volume": 8960000000,
    "volumeRaw": "8.96B",
    "changePercent": 0.83
  },
  {
    "time": "2015-05-01",
    "open": 4966.32,
    "high": 5111.54,
    "low": 4888.17,
    "close": 5070.02,
    "volume": 8570000000,
    "volumeRaw": "8.57B",
    "changePercent": 2.6
  },
  {
    "time": "2015-06-01",
    "open": 5094.94,
    "high": 5164.36,
    "low": 4956.23,
    "close": 4986.87,
    "volume": 10530000000,
    "volumeRaw": "10.53B",
    "changePercent": -1.64
  },
  {
    "time": "2015-07-01",
    "open": 5029.05,
    "high": 5231.94,
    "low": 4901.51,
    "close": 5128.28,
    "volume": 9460000000,
    "volumeRaw": "9.46B",
    "changePercent": 2.84
  },
  {
    "time": "2015-08-01",
    "open": 5134.34,
    "high": 5175.26,
    "low": 4292.14,
    "close": 4776.51,
    "volume": 10460000000,
    "volumeRaw": "10.46B",
    "changePercent": -6.86
  },
  {
    "time": "2015-09-01",
    "open": 4673.61,
    "high": 4960.87,
    "low": 4487.06,
    "close": 4620.16,
    "volume": 10530000000,
    "volumeRaw": "10.53B",
    "changePercent": -3.27
  },
  {
    "time": "2015-10-01",
    "open": 4624.46,
    "high": 5095.69,
    "low": 4552.34,
    "close": 5053.75,
    "volume": 9910000000,
    "volumeRaw": "9.91B",
    "changePercent": 9.38
  },
  {
    "time": "2015-11-01",
    "open": 5065.64,
    "high": 5163.47,
    "low": 4908.66,
    "close": 5108.67,
    "volume": 8400000000,
    "volumeRaw": "8.40B",
    "changePercent": 1.09
  },
  {
    "time": "2015-12-01",
    "open": 5129.64,
    "high": 5176.77,
    "low": 4871.59,
    "close": 5007.41,
    "volume": 9860000000,
    "volumeRaw": "9.86B",
    "changePercent": -1.98
  },
  {
    "time": "2016-01-01",
    "open": 4897.65,
    "high": 4926.73,
    "low": 4313.39,
    "close": 4613.95,
    "volume": 10700000000,
    "volumeRaw": "10.70B",
    "changePercent": -7.86
  },
  {
    "time": "2016-02-01",
    "open": 4587.59,
    "high": 4636.93,
    "low": 4209.76,
    "close": 4557.95,
    "volume": 10510000000,
    "volumeRaw": "10.51B",
    "changePercent": -1.21
  },
  {
    "time": "2016-03-01",
    "open": 4596.01,
    "high": 4899.14,
    "low": 4581.75,
    "close": 4869.85,
    "volume": 10060000000,
    "volumeRaw": "10.06B",
    "changePercent": 6.84
  },
  {
    "time": "2016-04-01",
    "open": 4842.55,
    "high": 4969.32,
    "low": 4740.84,
    "close": 4775.36,
    "volume": 8820000000,
    "volumeRaw": "8.82B",
    "changePercent": -1.94
  },
  {
    "time": "2016-05-01",
    "open": 4786.55,
    "high": 4951.45,
    "low": 4678.38,
    "close": 4948.06,
    "volume": 9210000000,
    "volumeRaw": "9.21B",
    "changePercent": 3.62
  },
  {
    "time": "2016-06-01",
    "open": 4928.97,
    "high": 4980.14,
    "low": 4574.25,
    "close": 4842.67,
    "volume": 10960000000,
    "volumeRaw": "10.96B",
    "changePercent": -2.13
  },
  {
    "time": "2016-07-01",
    "open": 4837.18,
    "high": 5175.81,
    "low": 4786.01,
    "close": 5162.13,
    "volume": 8010000000,
    "volumeRaw": "8.01B",
    "changePercent": 6.6
  },
  {
    "time": "2016-08-01",
    "open": 5167.42,
    "high": 5275.74,
    "low": 5109.8,
    "close": 5213.22,
    "volume": 8790000000,
    "volumeRaw": "8.79B",
    "changePercent": 0.99
  },
  {
    "time": "2016-09-01",
    "open": 5218.28,
    "high": 5342.88,
    "low": 5097.8,
    "close": 5312,
    "volume": 9630000000,
    "volumeRaw": "9.63B",
    "changePercent": 1.89
  },
  {
    "time": "2016-10-01",
    "open": 5300.29,
    "high": 5340.52,
    "low": 5169.76,
    "close": 5189.14,
    "volume": 7970000000,
    "volumeRaw": "7.97B",
    "changePercent": -2.31
  },
  {
    "time": "2016-11-01",
    "open": 5199.77,
    "high": 5403.86,
    "low": 5034.41,
    "close": 5323.68,
    "volume": 9910000000,
    "volumeRaw": "9.91B",
    "changePercent": 2.59
  },
  {
    "time": "2016-12-01",
    "open": 5323.88,
    "high": 5512.37,
    "low": 5238.21,
    "close": 5383.12,
    "volume": 9320000000,
    "volumeRaw": "9.32B",
    "changePercent": 1.12
  },
  {
    "time": "2017-01-01",
    "open": 5425.62,
    "high": 5669.61,
    "low": 5397.99,
    "close": 5614.79,
    "volume": 8380000000.000001,
    "volumeRaw": "8.38B",
    "changePercent": 4.3
  },
  {
    "time": "2017-02-01",
    "open": 5654.51,
    "high": 5867.89,
    "low": 5616.4,
    "close": 5825.44,
    "volume": 8560000000.000001,
    "volumeRaw": "8.56B",
    "changePercent": 3.75
  },
  {
    "time": "2017-03-01",
    "open": 5874.86,
    "high": 5928.06,
    "low": 5769.39,
    "close": 5911.74,
    "volume": 11000000000,
    "volumeRaw": "11.00B",
    "changePercent": 1.48
  },
  {
    "time": "2017-04-01",
    "open": 5917.31,
    "high": 6074.04,
    "low": 5805.15,
    "close": 6047.61,
    "volume": 8300000000.000001,
    "volumeRaw": "8.30B",
    "changePercent": 2.3
  },
  {
    "time": "2017-05-01",
    "open": 6067.56,
    "high": 6221.99,
    "low": 5996.81,
    "close": 6198.52,
    "volume": 10240000000,
    "volumeRaw": "10.24B",
    "changePercent": 2.5
  },
  {
    "time": "2017-06-01",
    "open": 6215.91,
    "high": 6341.7,
    "low": 6087.81,
    "close": 6140.42,
    "volume": 12500000000,
    "volumeRaw": "12.50B",
    "changePercent": -0.94
  },
  {
    "time": "2017-07-01",
    "open": 6173.29,
    "high": 6460.84,
    "low": 6081.96,
    "close": 6348.12,
    "volume": 8580000000,
    "volumeRaw": "8.58B",
    "changePercent": 3.38
  },
  {
    "time": "2017-08-01",
    "open": 6372.16,
    "high": 6435.27,
    "low": 6177.19,
    "close": 6428.66,
    "volume": 9580000000,
    "volumeRaw": "9.58B",
    "changePercent": 1.27
  },
  {
    "time": "2017-09-01",
    "open": 6442.17,
    "high": 6497.98,
    "low": 6334.59,
    "close": 6495.96,
    "volume": 9410000000,
    "volumeRaw": "9.41B",
    "changePercent": 1.05
  },
  {
    "time": "2017-10-01",
    "open": 6506.08,
    "high": 6737.75,
    "low": 6484.14,
    "close": 6727.67,
    "volume": 9640000000,
    "volumeRaw": "9.64B",
    "changePercent": 3.57
  },
  {
    "time": "2017-11-01",
    "open": 6758.64,
    "high": 6914.19,
    "low": 6667.31,
    "close": 6873.97,
    "volume": 10200000000,
    "volumeRaw": "10.20B",
    "changePercent": 2.17
  },
  {
    "time": "2017-12-01",
    "open": 6844.04,
    "high": 7003.89,
    "low": 6734.13,
    "close": 6903.39,
    "volume": 10000000000,
    "volumeRaw": "10.00B",
    "changePercent": 0.43
  },
  {
    "time": "2018-01-01",
    "open": 6937.65,
    "high": 7505.77,
    "low": 6924.08,
    "close": 7411.48,
    "volume": 10400000000,
    "volumeRaw": "10.40B",
    "changePercent": 7.36
  },
  {
    "time": "2018-02-01",
    "open": 7377.17,
    "high": 7441.09,
    "low": 6630.67,
    "close": 7273.01,
    "volume": 10810000000,
    "volumeRaw": "10.81B",
    "changePercent": -1.87
  },
  {
    "time": "2018-03-01",
    "open": 7274.75,
    "high": 7637.27,
    "low": 6901.07,
    "close": 7063.44,
    "volume": 12330000000,
    "volumeRaw": "12.33B",
    "changePercent": -2.88
  },
  {
    "time": "2018-04-01",
    "open": 7016.17,
    "high": 7319.58,
    "low": 6805.96,
    "close": 7066.27,
    "volume": 10160000000,
    "volumeRaw": "10.16B",
    "changePercent": 0.04
  },
  {
    "time": "2018-05-01",
    "open": 7053.65,
    "high": 7492.42,
    "low": 6991.14,
    "close": 7442.12,
    "volume": 10640000000,
    "volumeRaw": "10.64B",
    "changePercent": 5.32
  },
  {
    "time": "2018-06-01",
    "open": 7487.66,
    "high": 7806.6,
    "low": 7419.56,
    "close": 7510.3,
    "volume": 12840000000,
    "volumeRaw": "12.84B",
    "changePercent": 0.92
  },
  {
    "time": "2018-07-01",
    "open": 7451.9,
    "high": 7933.31,
    "low": 7443.1,
    "close": 7671.79,
    "volume": 9420000000,
    "volumeRaw": "9.42B",
    "changePercent": 2.15
  },
  {
    "time": "2018-08-01",
    "open": 7701.82,
    "high": 8133.3,
    "low": 7659.52,
    "close": 8109.54,
    "volume": 10700000000,
    "volumeRaw": "10.70B",
    "changePercent": 5.71
  },
  {
    "time": "2018-09-01",
    "open": 8087.95,
    "high": 8104.07,
    "low": 7873.93,
    "close": 8046.35,
    "volume": 11150000000,
    "volumeRaw": "11.15B",
    "changePercent": -0.78
  },
  {
    "time": "2018-10-01",
    "open": 8091.5,
    "high": 8107.38,
    "low": 6922.83,
    "close": 7305.9,
    "volume": 14830000000,
    "volumeRaw": "14.83B",
    "changePercent": -9.2
  },
  {
    "time": "2018-11-01",
    "open": 7327.82,
    "high": 7572.93,
    "low": 6830.76,
    "close": 7330.54,
    "volume": 12570000000,
    "volumeRaw": "12.57B",
    "changePercent": 0.34
  },
  {
    "time": "2018-12-01",
    "open": 7486.13,
    "high": 7486.51,
    "low": 6190.17,
    "close": 6635.28,
    "volume": 13120000000,
    "volumeRaw": "13.12B",
    "changePercent": -9.48
  },
  {
    "time": "2019-01-01",
    "open": 6506.91,
    "high": 7303.12,
    "low": 6457.13,
    "close": 7281.74,
    "volume": 12230000000,
    "volumeRaw": "12.23B",
    "changePercent": 9.74
  },
  {
    "time": "2019-02-01",
    "open": 7256.37,
    "high": 7602.69,
    "low": 7225.14,
    "close": 7532.53,
    "volume": 10640000000,
    "volumeRaw": "10.64B",
    "changePercent": 3.44
  },
  {
    "time": "2019-03-01",
    "open": 7587.45,
    "high": 7850.1,
    "low": 7332.92,
    "close": 7729.32,
    "volume": 13040000000,
    "volumeRaw": "13.04B",
    "changePercent": 2.61
  },
  {
    "time": "2019-04-01",
    "open": 7800.24,
    "high": 8176.08,
    "low": 7777.1,
    "close": 8095.39,
    "volume": 10750000000,
    "volumeRaw": "10.75B",
    "changePercent": 4.74
  },
  {
    "time": "2019-05-01",
    "open": 8132.93,
    "high": 8164.71,
    "low": 7448.23,
    "close": 7453.15,
    "volume": 12280000000,
    "volumeRaw": "12.28B",
    "changePercent": -7.93
  },
  {
    "time": "2019-06-01",
    "open": 7441.22,
    "high": 8088.88,
    "low": 7292.22,
    "close": 8006.24,
    "volume": 12570000000,
    "volumeRaw": "12.57B",
    "changePercent": 7.42
  },
  {
    "time": "2019-07-01",
    "open": 8145.85,
    "high": 8339.64,
    "low": 8059.29,
    "close": 8175.42,
    "volume": 11140000000,
    "volumeRaw": "11.14B",
    "changePercent": 2.11
  },
  {
    "time": "2019-08-01",
    "open": 8190.56,
    "high": 8311.04,
    "low": 7662.9,
    "close": 7962.88,
    "volume": 11990000000,
    "volumeRaw": "11.99B",
    "changePercent": -2.6
  },
  {
    "time": "2019-09-01",
    "open": 7906.44,
    "high": 8243.8,
    "low": 7847.32,
    "close": 7999.33,
    "volume": 11510000000,
    "volumeRaw": "11.51B",
    "changePercent": 0.46
  },
  {
    "time": "2019-10-01",
    "open": 8026.83,
    "high": 8335.56,
    "low": 7700,
    "close": 8292.36,
    "volume": 11230000000,
    "volumeRaw": "11.23B",
    "changePercent": 3.66
  },
  {
    "time": "2019-11-01",
    "open": 8335.05,
    "high": 8705.91,
    "low": 8326.56,
    "close": 8665.47,
    "volume": 10750000000,
    "volumeRaw": "10.75B",
    "changePercent": 4.5
  },
  {
    "time": "2019-12-01",
    "open": 8672.84,
    "high": 9052,
    "low": 8435.4,
    "close": 8972.6,
    "volume": 12250000000,
    "volumeRaw": "12.25B",
    "changePercent": 3.54
  },
  {
    "time": "2020-01-01",
    "open": 9039.46,
    "high": 9451.43,
    "low": 8943.5,
    "close": 9150.94,
    "volume": 12890000000,
    "volumeRaw": "12.89B",
    "changePercent": 1.99
  },
  {
    "time": "2020-02-01",
    "open": 9190.72,
    "high": 9838.37,
    "low": 8264.16,
    "close": 8567.37,
    "volume": 13390000000,
    "volumeRaw": "13.39B",
    "changePercent": -6.38
  },
  {
    "time": "2020-03-01",
    "open": 8667.14,
    "high": 9070.32,
    "low": 6631.42,
    "close": 7700.1,
    "volume": 25110000000,
    "volumeRaw": "25.11B",
    "changePercent": -10.12
  },
  {
    "time": "2020-04-01",
    "open": 7459.5,
    "high": 8957.26,
    "low": 7288.11,
    "close": 8889.55,
    "volume": 18760000000,
    "volumeRaw": "18.76B",
    "changePercent": 15.45
  },
  {
    "time": "2020-05-01",
    "open": 8681.29,
    "high": 9523.64,
    "low": 8537.83,
    "close": 9489.87,
    "volume": 18170000000,
    "volumeRaw": "18.17B",
    "changePercent": 6.75
  },
  {
    "time": "2020-06-01",
    "open": 9471.42,
    "high": 10221.85,
    "low": 9403,
    "close": 10058.76,
    "volume": 27300000000,
    "volumeRaw": "27.30B",
    "changePercent": 5.99
  },
  {
    "time": "2020-07-01",
    "open": 10063.67,
    "high": 10839.93,
    "low": 10048.04,
    "close": 10745.27,
    "volume": 20680000000,
    "volumeRaw": "20.68B",
    "changePercent": 6.82
  },
  {
    "time": "2020-08-01",
    "open": 10848.64,
    "high": 11829.84,
    "low": 10762.71,
    "close": 11775.46,
    "volume": 17240000000,
    "volumeRaw": "17.24B",
    "changePercent": 9.59
  },
  {
    "time": "2020-09-01",
    "open": 11850.96,
    "high": 12074.07,
    "low": 10519.49,
    "close": 11167.68,
    "volume": 20520000000,
    "volumeRaw": "20.52B",
    "changePercent": -5.16
  },
  {
    "time": "2020-10-01",
    "open": 11291.99,
    "high": 11965.54,
    "low": 10822.57,
    "close": 10911.59,
    "volume": 16770000000,
    "volumeRaw": "16.77B",
    "changePercent": -2.29
  },
  {
    "time": "2020-11-01",
    "open": 11010.45,
    "high": 12244.65,
    "low": 10830.94,
    "close": 12198.74,
    "volume": 19470000000,
    "volumeRaw": "19.47B",
    "changePercent": 11.8
  },
  {
    "time": "2020-12-01",
    "open": 12313.36,
    "high": 12973.33,
    "low": 12214.74,
    "close": 12888.28,
    "volume": 23500000000,
    "volumeRaw": "23.50B",
    "changePercent": 5.65
  },
  {
    "time": "2021-01-01",
    "open": 12958.52,
    "high": 13728.98,
    "low": 12543.24,
    "close": 13070.69,
    "volume": 26550000000,
    "volumeRaw": "26.55B",
    "changePercent": 1.42
  },
  {
    "time": "2021-02-01",
    "open": 13226.18,
    "high": 14175.11,
    "low": 13003.98,
    "close": 13192.35,
    "volume": 27400000000,
    "volumeRaw": "27.40B",
    "changePercent": 0.93
  },
  {
    "time": "2021-03-01",
    "open": 13406.16,
    "high": 13620.71,
    "low": 12397.05,
    "close": 13246.87,
    "volume": 29120000000,
    "volumeRaw": "29.12B",
    "changePercent": 0.41
  },
  {
    "time": "2021-04-01",
    "open": 13414.33,
    "high": 14211.57,
    "low": 13404.18,
    "close": 13962.68,
    "volume": 18510000000,
    "volumeRaw": "18.51B",
    "changePercent": 5.4
  },
  {
    "time": "2021-05-01",
    "open": 14031.77,
    "high": 14042.12,
    "low": 13002.53,
    "close": 13748.74,
    "volume": 18490000000,
    "volumeRaw": "18.49B",
    "changePercent": -1.53
  },
  {
    "time": "2021-06-01",
    "open": 13829.06,
    "high": 14535.97,
    "low": 13548.93,
    "close": 14503.95,
    "volume": 24050000000,
    "volumeRaw": "24.05B",
    "changePercent": 5.49
  },
  {
    "time": "2021-07-01",
    "open": 14493.69,
    "high": 14863.65,
    "low": 14178.66,
    "close": 14672.68,
    "volume": 17460000000,
    "volumeRaw": "17.46B",
    "changePercent": 1.16
  },
  {
    "time": "2021-08-01",
    "open": 14758.6,
    "high": 15288.08,
    "low": 14423.16,
    "close": 15259.24,
    "volume": 17680000000,
    "volumeRaw": "17.68B",
    "changePercent": 4
  },
  {
    "time": "2021-09-01",
    "open": 15308.98,
    "high": 15403.44,
    "low": 14444.3,
    "close": 14448.58,
    "volume": 20390000000,
    "volumeRaw": "20.39B",
    "changePercent": -5.31
  },
  {
    "time": "2021-10-01",
    "open": 14494.93,
    "high": 15504.12,
    "low": 14181.69,
    "close": 15498.39,
    "volume": 18710000000,
    "volumeRaw": "18.71B",
    "changePercent": 7.27
  },
  {
    "time": "2021-11-01",
    "open": 15541.26,
    "high": 16212.23,
    "low": 15451.39,
    "close": 15537.69,
    "volume": 21650000000,
    "volumeRaw": "21.65B",
    "changePercent": 0.25
  },
  {
    "time": "2021-12-01",
    "open": 15752.27,
    "high": 15901.47,
    "low": 14860.04,
    "close": 15644.97,
    "volume": 22790000000,
    "volumeRaw": "22.79B",
    "changePercent": 0.69
  },
  {
    "time": "2022-01-01",
    "open": 15732.5,
    "high": 15852.14,
    "low": 13094.65,
    "close": 14239.88,
    "volume": 20650000000,
    "volumeRaw": "20.65B",
    "changePercent": -8.98
  },
  {
    "time": "2022-02-01",
    "open": 14277.43,
    "high": 14509.56,
    "low": 12587.88,
    "close": 13751.4,
    "volume": 18890000000,
    "volumeRaw": "18.89B",
    "changePercent": -3.43
  },
  {
    "time": "2022-03-01",
    "open": 13716.7,
    "high": 14646.9,
    "low": 12555.35,
    "close": 14220.52,
    "volume": 26960000000,
    "volumeRaw": "26.96B",
    "changePercent": 3.41
  },
  {
    "time": "2022-04-01",
    "open": 14269.53,
    "high": 14534.38,
    "low": 12315.74,
    "close": 12334.64,
    "volume": 19020000000,
    "volumeRaw": "19.02B",
    "changePercent": -13.26
  },
  {
    "time": "2022-05-01",
    "open": 12331.69,
    "high": 12985.01,
    "low": 11035.69,
    "close": 12081.39,
    "volume": 23280000000,
    "volumeRaw": "23.28B",
    "changePercent": -2.05
  },
  {
    "time": "2022-06-01",
    "open": 12176.89,
    "high": 12320.12,
    "low": 10565.14,
    "close": 11028.74,
    "volume": 26740000000,
    "volumeRaw": "26.74B",
    "changePercent": -8.71
  },
  {
    "time": "2022-07-01",
    "open": 11006.83,
    "high": 12426.26,
    "low": 10911.45,
    "close": 12390.69,
    "volume": 18160000000,
    "volumeRaw": "18.16B",
    "changePercent": 12.35
  },
  {
    "time": "2022-08-01",
    "open": 12317.96,
    "high": 13181.09,
    "low": 11790.02,
    "close": 11816.2,
    "volume": 21710000000,
    "volumeRaw": "21.71B",
    "changePercent": -4.64
  },
  {
    "time": "2022-09-01",
    "open": 11707.44,
    "high": 12270.19,
    "low": 10572.33,
    "close": 10575.62,
    "volume": 22030000000,
    "volumeRaw": "22.03B",
    "changePercent": -10.5
  },
  {
    "time": "2022-10-01",
    "open": 10659.01,
    "high": 11230.44,
    "low": 10088.83,
    "close": 10988.15,
    "volume": 19930000000,
    "volumeRaw": "19.93B",
    "changePercent": 3.9
  },
  {
    "time": "2022-11-01",
    "open": 11154.74,
    "high": 11492.62,
    "low": 10262.93,
    "close": 11468,
    "volume": 20080000000,
    "volumeRaw": "20.08B",
    "changePercent": 4.37
  },
  {
    "time": "2022-12-01",
    "open": 11475.17,
    "high": 11571.64,
    "low": 10207.47,
    "close": 10466.48,
    "volume": 21690000000,
    "volumeRaw": "21.69B",
    "changePercent": -8.73
  },
  {
    "time": "2023-01-01",
    "open": 10562.06,
    "high": 11691.89,
    "low": 10265.04,
    "close": 11584.55,
    "volume": 19910000000,
    "volumeRaw": "19.91B",
    "changePercent": 10.68
  },
  {
    "time": "2023-02-01",
    "open": 11573.14,
    "high": 12269.56,
    "low": 11334.47,
    "close": 11455.54,
    "volume": 19320000000,
    "volumeRaw": "19.32B",
    "changePercent": -1.11
  },
  {
    "time": "2023-03-01",
    "open": 11447.58,
    "high": 12227.93,
    "low": 10982.8,
    "close": 12221.91,
    "volume": 25370000000,
    "volumeRaw": "25.37B",
    "changePercent": 6.69
  },
  {
    "time": "2023-04-01",
    "open": 12146.09,
    "high": 12245.43,
    "low": 11798.77,
    "close": 12226.58,
    "volume": 17280000000,
    "volumeRaw": "17.28B",
    "changePercent": 0.04
  },
  {
    "time": "2023-05-01",
    "open": 12210.05,
    "high": 13154.29,
    "low": 11925.37,
    "close": 12935.28,
    "volume": 21610000000,
    "volumeRaw": "21.61B",
    "changePercent": 5.8
  },
  {
    "time": "2023-06-01",
    "open": 12944.46,
    "high": 13864.06,
    "low": 12903.63,
    "close": 13787.92,
    "volume": 25040000000,
    "volumeRaw": "25.04B",
    "changePercent": 6.59
  },
  {
    "time": "2023-07-01",
    "open": 13798.7,
    "high": 14446.55,
    "low": 13567.25,
    "close": 14346.02,
    "volume": 19250000000,
    "volumeRaw": "19.25B",
    "changePercent": 4.05
  },
  {
    "time": "2023-08-01",
    "open": 14274.93,
    "high": 14309.21,
    "low": 13161.76,
    "close": 14034.97,
    "volume": 21070000000,
    "volumeRaw": "21.07B",
    "changePercent": -2.17
  },
  {
    "time": "2023-09-01",
    "open": 14129.96,
    "high": 14149.62,
    "low": 12963.16,
    "close": 13219.32,
    "volume": 19740000000,
    "volumeRaw": "19.74B",
    "changePercent": -5.81
  },
  {
    "time": "2023-10-01",
    "open": 13217.99,
    "high": 13714.14,
    "low": 12543.86,
    "close": 12851.24,
    "volume": 19190000000,
    "volumeRaw": "19.19B",
    "changePercent": -2.78
  },
  {
    "time": "2023-11-01",
    "open": 12887.06,
    "high": 14423.22,
    "low": 12875.2,
    "close": 14226.22,
    "volume": 19770000000,
    "volumeRaw": "19.77B",
    "changePercent": 10.7
  },
  {
    "time": "2023-12-01",
    "open": 14181.35,
    "high": 15150.07,
    "low": 14058.52,
    "close": 15011.35,
    "volume": 23680000000,
    "volumeRaw": "23.68B",
    "changePercent": 5.52
  },
  {
    "time": "2024-01-01",
    "open": 14873.7,
    "high": 15630.58,
    "low": 14477.57,
    "close": 15164.01,
    "volume": 21220000000,
    "volumeRaw": "21.22B",
    "changePercent": 1.02
  },
  {
    "time": "2024-02-01",
    "open": 15254.02,
    "high": 16134.22,
    "low": 15208.88,
    "close": 16091.92,
    "volume": 21720000000,
    "volumeRaw": "21.72B",
    "changePercent": 6.12
  },
  {
    "time": "2024-03-01",
    "open": 16109.83,
    "high": 16538.86,
    "low": 15862.63,
    "close": 16379.46,
    "volume": 23150000000,
    "volumeRaw": "23.15B",
    "changePercent": 1.79
  },
  {
    "time": "2024-04-01",
    "open": 16397.05,
    "high": 16490.65,
    "low": 15222.78,
    "close": 15657.82,
    "volume": 21210000000,
    "volumeRaw": "21.21B",
    "changePercent": -4.41
  },
  {
    "time": "2024-05-01",
    "open": 15646.09,
    "high": 17032.65,
    "low": 15557.64,
    "close": 16735.01,
    "volume": 25030000000,
    "volumeRaw": "25.03B",
    "changePercent": 6.88
  },
  {
    "time": "2024-06-01",
    "open": 16865.7,
    "high": 18035,
    "low": 16646.43,
    "close": 17732.6,
    "volume": 24960000000,
    "volumeRaw": "24.96B",
    "changePercent": 5.96
  },
  {
    "time": "2024-07-01",
    "open": 17773.9,
    "high": 18671.07,
    "low": 17015.38,
    "close": 17599.4,
    "volume": 23240000000,
    "volumeRaw": "23.24B",
    "changePercent": -0.75
  },
  {
    "time": "2024-08-01",
    "open": 17647.03,
    "high": 18017.69,
    "low": 15708.54,
    "close": 17713.62,
    "volume": 26770000000,
    "volumeRaw": "26.77B",
    "changePercent": 0.65
  },
  {
    "time": "2024-09-01",
    "open": 17585.45,
    "high": 18327.34,
    "low": 16668.57,
    "close": 18189.17,
    "volume": 23210000000,
    "volumeRaw": "23.21B",
    "changePercent": 2.68
  },
  {
    "time": "2024-10-01",
    "open": 18154.94,
    "high": 18785.49,
    "low": 17767.79,
    "close": 18095.15,
    "volume": 23320000000,
    "volumeRaw": "23.32B",
    "changePercent": -0.52
  },
  {
    "time": "2024-11-01",
    "open": 18189.67,
    "high": 19366.07,
    "low": 18112.83,
    "close": 19218.17,
    "volume": 25040000000,
    "volumeRaw": "25.04B",
    "changePercent": 6.21
  },
  {
    "time": "2024-12-01",
    "open": 19255.43,
    "high": 20204.58,
    "low": 19168.38,
    "close": 19310.79,
    "volume": 29490000000,
    "volumeRaw": "29.49B",
    "changePercent": 0.48
  },
  {
    "time": "2025-01-01",
    "open": 19403.9,
    "high": 20118.61,
    "low": 18831.91,
    "close": 19627.44,
    "volume": 27480000000,
    "volumeRaw": "27.48B",
    "changePercent": 1.64
  },
  {
    "time": "2025-02-01",
    "open": 19215.38,
    "high": 20110.12,
    "low": 18372.99,
    "close": 18847.28,
    "volume": 26420000000,
    "volumeRaw": "26.42B",
    "changePercent": -3.97
  },
  {
    "time": "2025-03-01",
    "open": 18923.36,
    "high": 18992.3,
    "low": 16854.37,
    "close": 17299.29,
    "volume": 30700000000,
    "volumeRaw": "30.70B",
    "changePercent": -8.21
  },
  {
    "time": "2025-04-01",
    "open": 17221.55,
    "high": 17716.52,
    "low": 14784.03,
    "close": 17446.34,
    "volume": 39460000000,
    "volumeRaw": "39.46B",
    "changePercent": 0.85
  },
  {
    "time": "2025-05-01",
    "open": 17793.14,
    "high": 19389.39,
    "low": 17503.01,
    "close": 19113.77,
    "volume": 30150000000,
    "volumeRaw": "30.15B",
    "changePercent": 9.56
  },
  {
    "time": "2025-06-01",
    "open": 19063.06,
    "high": 20418.31,
    "low": 18985.3,
    "close": 20369.73,
    "volume": 31000000000,
    "volumeRaw": "31.00B",
    "changePercent": 6.57
  },
  {
    "time": "2025-07-01",
    "open": 20290.61,
    "high": 21457.48,
    "low": 20105.41,
    "close": 21122.45,
    "volume": 32530000000,
    "volumeRaw": "32.53B",
    "changePercent": 3.7
  },
  {
    "time": "2025-08-01",
    "open": 20830.64,
    "high": 21803.75,
    "low": 20560.17,
    "close": 21455.55,
    "volume": 30090000000,
    "volumeRaw": "30.09B",
    "changePercent": 1.58
  },
  {
    "time": "2025-09-01",
    "open": 21086.57,
    "high": 22801.9,
    "low": 21033.05,
    "close": 22660.01,
    "volume": 35500000000,
    "volumeRaw": "35.50B",
    "changePercent": 5.61
  },
  {
    "time": "2025-10-01",
    "open": 22530.95,
    "high": 24019.99,
    "low": 22193.07,
    "close": 23724.96,
    "volume": 39940000000,
    "volumeRaw": "39.94B",
    "changePercent": 4.7
  },
  {
    "time": "2025-11-01",
    "open": 23951.91,
    "high": 23976.84,
    "low": 21898.29,
    "close": 23365.69,
    "volume": 31200000000,
    "volumeRaw": "31.20B",
    "changePercent": -1.51
  },
  {
    "time": "2025-12-01",
    "open": 23172.34,
    "high": 23704.08,
    "low": 22692,
    "close": 23241.99,
    "volume": 32580000000,
    "volumeRaw": "32.58B",
    "changePercent": -0.53
  },
  {
    "time": "2026-01-01",
    "open": 23481.49,
    "high": 23988.27,
    "low": 22916.83,
    "close": 23461.82,
    "volume": 31640000000,
    "volumeRaw": "31.64B",
    "changePercent": 0.95
  },
  {
    "time": "2026-02-01",
    "open": 23370.54,
    "high": 23691.6,
    "low": 22256.76,
    "close": 22668.21,
    "volume": 30890000000,
    "volumeRaw": "30.89B",
    "changePercent": -3.38
  },
  {
    "time": "2026-03-01",
    "open": 22322.12,
    "high": 22906.72,
    "low": 20690.25,
    "close": 21590.63,
    "volume": 36800000000,
    "volumeRaw": "36.80B",
    "changePercent": -4.75
  },
  {
    "time": "2026-04-01",
    "open": 21742.79,
    "high": 24935.6,
    "low": 21371.32,
    "close": 24892.31,
    "volume": 32030000000,
    "volumeRaw": "32.03B",
    "changePercent": 15.29
  },
  {
    "time": "2026-05-01",
    "open": 24977.79,
    "high": 27094.8,
    "low": 24913.12,
    "close": 26972.62,
    "volume": 35290000000,
    "volumeRaw": "35.29B",
    "changePercent": 8.36
  },
  {
    "time": "2026-06-01",
    "open": 26952.58,
    "high": 27190.21,
    "low": 24980.38,
    "close": 25888.84,
    "volume": 17890000000,
    "volumeRaw": "17.89B",
    "changePercent": -4.02
  }
];
