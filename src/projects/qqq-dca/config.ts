export type QqqDcaVideoConfig = {
  dailyInvestmentUsd: number;
  durationInSeconds: number;
  evaluationDate: string;
  fps: number;
  source: string;
  subtitle: string;
  tenYearStartDate: string;
  title: string;
  twentyYearStartDate: string;
};

export type QqqDcaBuyableMilestone = {
  accent: string;
  id: string;
  image: string;
  label: string;
  price: number;
};

export const qqqDcaVideoConfig: QqqDcaVideoConfig = {
  dailyInvestmentUsd: 10,
  durationInSeconds: 47,
  evaluationDate: '2026-06-17',
  fps: 60,
  source:
    'Source: Yahoo Finance QQQ daily OHLCV · adjClose used for DCA value · close used for average cost · not financial advice',
  subtitle: 'The compounding rule that turns small money into wealth',
  tenYearStartDate: '2016-06-17',
  title: 'What If You Invested\n$10/Day in Nasdaq?',
  twentyYearStartDate: '2006-06-17',
};

export const qqqDcaBuyableMilestones: QqqDcaBuyableMilestone[] = [
  {
    accent: '#4F46E5',
    id: 'game-console',
    image: 'projects/qqq-dca/buyables/game-console.png',
    label: 'Game console',
    price: 500,
  },
  {
    accent: '#2563EB',
    id: 'laptop',
    image: 'projects/qqq-dca/buyables/laptop.png',
    label: 'Laptop',
    price: 2000,
  },
  {
    accent: '#64748B',
    id: 'car',
    image: 'projects/qqq-dca/buyables/car.png',
    label: 'Car',
    price: 35000,
  },
  {
    accent: '#C58A19',
    id: 'home-deposit',
    image: 'projects/qqq-dca/buyables/home-deposit.png',
    label: 'Home deposit',
    price: 80000,
  },
  {
    accent: '#0F766E',
    id: 'condo',
    image: 'projects/qqq-dca/buyables/condo.png',
    label: 'Condo',
    price: 250000,
  },
  {
    accent: '#7C3AED',
    id: 'house',
    image: 'projects/qqq-dca/buyables/house.png',
    label: 'House',
    price: 350000,
  },
];
