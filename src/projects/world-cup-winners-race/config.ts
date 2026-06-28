export type WorldCupWinnerCountry = {
  code: string;
  color: string;
  flag: string;
  name: string;
  region: string;
};

export type WorldCupWinnerTournament = {
  code: string;
  host: string;
  year: number;
};

const countries: WorldCupWinnerCountry[] = [
  {
    code: 'BRA',
    color: '#22C55E',
    flag: '🇧🇷',
    name: 'Brazil',
    region: 'South America',
  },
  {
    code: 'GER',
    color: '#FACC15',
    flag: '🇩🇪',
    name: 'Germany',
    region: 'Europe',
  },
  {
    code: 'ITA',
    color: '#2563EB',
    flag: '🇮🇹',
    name: 'Italy',
    region: 'Europe',
  },
  {
    code: 'ARG',
    color: '#38BDF8',
    flag: '🇦🇷',
    name: 'Argentina',
    region: 'South America',
  },
  {
    code: 'FRA',
    color: '#4F46E5',
    flag: '🇫🇷',
    name: 'France',
    region: 'Europe',
  },
  {
    code: 'URU',
    color: '#67E8F9',
    flag: '🇺🇾',
    name: 'Uruguay',
    region: 'South America',
  },
  {
    code: 'ENG',
    color: '#DC2626',
    flag: '🏴',
    name: 'England',
    region: 'Europe',
  },
  {
    code: 'ESP',
    color: '#F97316',
    flag: '🇪🇸',
    name: 'Spain',
    region: 'Europe',
  },
];

export const worldCupWinnerTournaments: WorldCupWinnerTournament[] = [
  { year: 1930, host: 'Uruguay', code: 'URU' },
  { year: 1934, host: 'Italy', code: 'ITA' },
  { year: 1938, host: 'France', code: 'ITA' },
  { year: 1950, host: 'Brazil', code: 'URU' },
  { year: 1954, host: 'Switzerland', code: 'GER' },
  { year: 1958, host: 'Sweden', code: 'BRA' },
  { year: 1962, host: 'Chile', code: 'BRA' },
  { year: 1966, host: 'England', code: 'ENG' },
  { year: 1970, host: 'Mexico', code: 'BRA' },
  { year: 1974, host: 'West Germany', code: 'GER' },
  { year: 1978, host: 'Argentina', code: 'ARG' },
  { year: 1982, host: 'Spain', code: 'ITA' },
  { year: 1986, host: 'Mexico', code: 'ARG' },
  { year: 1990, host: 'Italy', code: 'GER' },
  { year: 1994, host: 'United States', code: 'BRA' },
  { year: 1998, host: 'France', code: 'FRA' },
  { year: 2002, host: 'South Korea / Japan', code: 'BRA' },
  { year: 2006, host: 'Germany', code: 'ITA' },
  { year: 2010, host: 'South Africa', code: 'ESP' },
  { year: 2014, host: 'Brazil', code: 'GER' },
  { year: 2018, host: 'Russia', code: 'FRA' },
  { year: 2022, host: 'Qatar', code: 'ARG' },
];

export const worldCupWinnersRaceVideoConfig = {
  csv: buildWorldCupWinnersRaceCsv(),
  dateLabel: 'YEAR',
  durationInSeconds: 25,
  endHoldSeconds: 2,
  fps: 60,
  introVoiceoverVolume: 0.95,
  source:
    'Source: FIFA/Wikipedia final standings via data/world-cup-standings/world_cup_top16_standings.csv · West Germany counted under Germany',
  startHoldSeconds: 1,
  subtitle: 'Men\'s FIFA World Cup champions · cumulative titles',
  title: 'World Cup Winners Race',
  titleHook: 'Countries by total trophies',
  topN: 6,
  valueColumnLabel: 'TITLES',
} as const;

function buildWorldCupWinnersRaceCsv() {
  const header = [
    'date',
    'year',
    'month',
    'rank',
    'name',
    'code',
    'region',
    'value',
    'color',
    'flag',
    'host',
    'lastTitleYear',
    'isTournamentWinner',
  ];
  const totals = new Map(countries.map((country) => [country.code, 0]));
  const lastTitleYears = new Map(countries.map((country) => [country.code, 0]));
  const rows: string[] = [header.join(',')];

  for (const tournament of worldCupWinnerTournaments) {
    totals.set(tournament.code, (totals.get(tournament.code) ?? 0) + 1);
    lastTitleYears.set(tournament.code, tournament.year);

    const rankedCountries = [...countries].sort((countryA, countryB) =>
      (totals.get(countryB.code) ?? 0) - (totals.get(countryA.code) ?? 0) ||
      countryA.name.localeCompare(countryB.name)
    );
    const rankByCode = new Map(
      rankedCountries.map((country, index) => [country.code, index + 1]),
    );

    for (const country of countries) {
      rows.push([
        `${tournament.year}-07-01`,
        String(tournament.year),
        '7',
        String(rankByCode.get(country.code) ?? countries.length + 1),
        country.name,
        country.code,
        country.region,
        String(totals.get(country.code) ?? 0),
        country.color,
        country.flag,
        tournament.host,
        String(lastTitleYears.get(country.code) || ''),
        tournament.code === country.code ? 'true' : 'false',
      ].map(csvEscape).join(','));
    }
  }

  return rows.join('\n');
}

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
