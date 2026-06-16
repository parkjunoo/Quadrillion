const teams = [
  { name: 'Brazil', code: 'BRA', region: 'CONMEBOL', color: '#FFE45C', flag: 'BRA', sortOrder: 1 },
  { name: 'Germany', code: 'GER', region: 'UEFA', color: '#FFCC33', flag: 'GER', sortOrder: 2 },
  { name: 'Italy', code: 'ITA', region: 'UEFA', color: '#31D07D', flag: 'ITA', sortOrder: 3 },
  { name: 'Argentina', code: 'ARG', region: 'CONMEBOL', color: '#6EC6FF', flag: 'ARG', sortOrder: 4 },
  { name: 'France', code: 'FRA', region: 'UEFA', color: '#4D7CFF', flag: 'FRA', sortOrder: 5 },
  { name: 'Uruguay', code: 'URU', region: 'CONMEBOL', color: '#77C8FF', flag: 'URU', sortOrder: 6 },
  { name: 'Spain', code: 'ESP', region: 'UEFA', color: '#FF4B3E', flag: 'ESP', sortOrder: 7 },
  { name: 'England', code: 'ENG', region: 'UEFA', color: '#F7F7F7', flag: 'ENG', sortOrder: 8 },
] as const;

type TeamCode = (typeof teams)[number]['code'];

const finals: { date: string; year: number; month: number; code: TeamCode }[] = [
  { date: '1930-07-30', year: 1930, month: 7, code: 'URU' },
  { date: '1934-06-10', year: 1934, month: 6, code: 'ITA' },
  { date: '1938-06-19', year: 1938, month: 6, code: 'ITA' },
  { date: '1950-07-16', year: 1950, month: 7, code: 'URU' },
  { date: '1954-07-04', year: 1954, month: 7, code: 'GER' },
  { date: '1958-06-29', year: 1958, month: 6, code: 'BRA' },
  { date: '1962-06-17', year: 1962, month: 6, code: 'BRA' },
  { date: '1966-07-30', year: 1966, month: 7, code: 'ENG' },
  { date: '1970-06-21', year: 1970, month: 6, code: 'BRA' },
  { date: '1974-07-07', year: 1974, month: 7, code: 'GER' },
  { date: '1978-06-25', year: 1978, month: 6, code: 'ARG' },
  { date: '1982-07-11', year: 1982, month: 7, code: 'ITA' },
  { date: '1986-06-29', year: 1986, month: 6, code: 'ARG' },
  { date: '1990-07-08', year: 1990, month: 7, code: 'GER' },
  { date: '1994-07-17', year: 1994, month: 7, code: 'BRA' },
  { date: '1998-07-12', year: 1998, month: 7, code: 'FRA' },
  { date: '2002-06-30', year: 2002, month: 6, code: 'BRA' },
  { date: '2006-07-09', year: 2006, month: 7, code: 'ITA' },
  { date: '2010-07-11', year: 2010, month: 7, code: 'ESP' },
  { date: '2014-07-13', year: 2014, month: 7, code: 'GER' },
  { date: '2018-07-15', year: 2018, month: 7, code: 'FRA' },
  { date: '2022-12-18', year: 2022, month: 12, code: 'ARG' },
];

const header = 'date,year,quarter,month,name,code,region,value,rank,color,flag,worldCupWins';

const buildWorldCupWinnersRaceCsv = () => {
  const titleCounts = new Map<TeamCode, number>(teams.map((team) => [team.code, 0]));
  const rows: string[] = [];

  for (const final of finals) {
    titleCounts.set(final.code, (titleCounts.get(final.code) ?? 0) + 1);

    const values = teams.map((team) => ({
      ...team,
      value: titleCounts.get(team.code) ?? 0,
    }));
    const rankByCode = new Map(
      [...values]
        .sort((a, b) => b.value - a.value || a.sortOrder - b.sortOrder)
        .map((team, index) => [team.code, index + 1]),
    );
    const quarter = Math.floor((final.month - 1) / 3) + 1;

    for (const team of [...values].sort(
      (a, b) => (rankByCode.get(a.code) ?? 99) - (rankByCode.get(b.code) ?? 99),
    )) {
      rows.push([
        final.date,
        final.year,
        quarter,
        String(final.month).padStart(2, '0'),
        team.name,
        team.code,
        team.region,
        team.value,
        rankByCode.get(team.code) ?? teams.length,
        team.color,
        team.flag,
        team.value,
      ].join(','));
    }
  }

  return [header, ...rows].join('\n');
};

export const worldCupWinnersRaceCsv = buildWorldCupWinnersRaceCsv();
