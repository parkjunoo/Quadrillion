export type MemeCandidate = {
  name: string;
  communityRank: number;
  kymVoteShare: number | null;
  videoSearchQuery: string;
};

export type MemeMonth = {
  label: string;
  monthName: string;
  hero: MemeCandidate;
  candidates: MemeCandidate[];
};

const createCandidate = (
  communityRank: number,
  name: string,
  kymVoteShare: number | null,
  videoSearchQuery: string,
): MemeCandidate => ({
  communityRank,
  kymVoteShare,
  name,
  videoSearchQuery,
});

export const memeTrendMonths2025: MemeMonth[] = [
  {
    label: '2025-01',
    monthName: 'JAN',
    hero: createCandidate(1, 'Gi-Hun Played These Games', 32.5, 'Squid Game I played these games before meme'),
    candidates: [
      createCandidate(1, 'Gi-Hun Played These Games', 32.5, 'Squid Game I played these games before meme'),
      createCandidate(2, 'Eye of Rah', 10.5, 'Eye of Rah meme'),
      createCandidate(3, 'Elon Musk Salute', 9.5, 'Elon Musk salute meme'),
      createCandidate(4, 'TikTok US Ban', 6.5, 'TikTok ban memes January 2025'),
    ],
  },
  {
    label: '2025-02',
    monthName: 'FEB',
    hero: createCandidate(1, 'Cave Diver Memes', 34.5, 'Cave diver meme 2025'),
    candidates: [
      createCandidate(1, 'Cave Diver Memes', 34.5, 'Cave diver meme 2025'),
      createCandidate(2, 'Say Drake', 8, 'Kendrick Lamar Say Drake meme'),
      createCandidate(2, "Milton's Dancing Rat", 8, 'Milton dancing rat trend'),
      createCandidate(4, "Artists Who Can't Sing", 7.5, 'Artists who can sing meme'),
    ],
  },
  {
    label: '2025-03',
    monthName: 'MAR',
    hero: createCandidate(1, 'Italian Brainrot', 19.5, 'Italian Brainrot meme'),
    candidates: [
      createCandidate(1, 'Italian Brainrot', 19.5, 'Italian Brainrot meme'),
      createCandidate(2, "Ashton Hall's Routine", 15.5, 'Ashton Hall morning routine meme'),
      createCandidate(3, 'J.D. Vance Photoshops', 13, 'JD Vance photoshop meme'),
      createCandidate(4, 'Meme Drought', null, 'March 2025 meme drought'),
    ],
  },
  {
    label: '2025-04',
    monthName: 'APR',
    hero: createCandidate(1, 'Chicken Jockey', 38.3, 'Chicken Jockey Minecraft movie meme'),
    candidates: [
      createCandidate(1, 'Chicken Jockey', 38.3, 'Chicken Jockey Minecraft movie meme'),
      createCandidate(2, 'Vance / Pope Theory', 10.1, 'JD Vance killed Pope Francis meme'),
      createCandidate(3, 'Tung Tung Tung Sahur', 9.7, 'Tung Tung Tung Sahur meme'),
      createCandidate(4, 'R.E.P.O. I Love', null, 'REPO I Love meme'),
    ],
  },
  {
    label: '2025-05',
    monthName: 'MAY',
    hero: createCandidate(1, '100 Men vs 1 Gorilla', 20, '100 men vs 1 gorilla meme'),
    candidates: [
      createCandidate(1, '100 Men vs 1 Gorilla', 20, '100 men vs 1 gorilla meme'),
      createCandidate(2, 'Rhymes With Grug', 18.5, 'Rhymes with Grug meme'),
      createCandidate(3, 'Aerial Tramway Emoji', 12, 'Aerial Tramway Emoji meme'),
      createCandidate(4, 'F Students Are Inventors', null, 'F students are inventors meme'),
    ],
  },
  {
    label: '2025-06',
    monthName: 'JUN',
    hero: createCandidate(1, 'Job Application Forms', 29.3, 'Job application form memes'),
    candidates: [
      createCandidate(1, 'Job Application Forms', 29.3, 'Job application form memes'),
      createCandidate(2, 'SYBAU Guy', 14.4, 'SYBAU Guy meme'),
      createCandidate(3, 'Asgore Runs Over Dess', 13.7, 'Asgore Running Over Dess meme'),
      createCandidate(4, 'Quarter Haircut', 5.04, 'Barbershop haircut costs a quarter meme'),
    ],
  },
  {
    label: '2025-07',
    monthName: 'JUL',
    hero: createCandidate(1, 'Astronomer CEO Coldplay', 22, 'Astronomer CEO Coldplay meme'),
    candidates: [
      createCandidate(1, 'Astronomer CEO Coldplay', 22, 'Astronomer CEO Coldplay meme'),
      createCandidate(2, 'Jet2 Holiday', 12.5, 'Nothing beats a Jet2 Holiday meme'),
      createCandidate(3, 'SDIYBT', 11, 'SDIYBT meme'),
    ],
  },
  {
    label: '2025-08',
    monthName: 'AUG',
    hero: createCandidate(1, 'Clanker', 19, 'Clanker meme'),
    candidates: [
      createCandidate(1, 'Clanker', 19, 'Clanker meme'),
      createCandidate(2, 'Adrian Eeffoc Brainrot', 8.1, 'Adrian Eeffoc Brainrot meme'),
      createCandidate(3, 'Lizard Lizard Lizard', 7.9, 'Lizard Lizard Lizard meme'),
    ],
  },
  {
    label: '2025-09',
    monthName: 'SEP',
    hero: createCandidate(1, '6-7 Kid', 18, '6-7 Kid meme'),
    candidates: [
      createCandidate(1, '6-7 Kid', 18, '6-7 Kid meme'),
      createCandidate(2, 'Tylenol Autism News', 13, 'Tylenol Autism Announcement meme'),
      createCandidate(3, 'W Speed', 9, 'W Speed meme'),
      createCandidate(4, 'NicheTok', 7, 'NicheTok meme'),
    ],
  },
  {
    label: '2025-10',
    monthName: 'OCT',
    hero: createCandidate(1, 'IShowSpeed 2021 Stream', 15.5, 'IShowSpeed mom kind of homeless meme'),
    candidates: [
      createCandidate(1, 'IShowSpeed 2021 Stream', 15.5, 'IShowSpeed mom kind of homeless meme'),
      createCandidate(2, 'White Rabbit Clock', 12.8, 'White Rabbit pointing at clock meme'),
      createCandidate(3, 'Hasan Dog Collar', 12.7, 'Hasan Piker dog shock collar meme'),
    ],
  },
  {
    label: '2025-11',
    monthName: 'NOV',
    hero: createCandidate(1, 'Kirkification', 19, 'Kirkification Charlie Kirk face swap meme'),
    candidates: [
      createCandidate(1, 'Kirkification', 19, 'Kirkification Charlie Kirk face swap meme'),
      createCandidate(2, 'Frieren Looking Up', 16.7, 'Frieren Looking Up meme'),
      createCandidate(3, 'Cassius Thundercock', 9.8, 'Cassius Thundercock meme'),
    ],
  },
  {
    label: '2025-12',
    monthName: 'DEC',
    hero: createCandidate(1, 'Jon Hamm Dancing', 13, 'Jon Hamm Dancing meme'),
    candidates: [
      createCandidate(1, 'Jon Hamm Dancing', 13, 'Jon Hamm Dancing meme'),
      createCandidate(2, 'Gang Clowned Him', 10, 'He made a statement so trash even his gang clowned him meme'),
      createCandidate(3, 'Epstein Glazing Edits', 8, 'Jeffrey Epstein Glazing Edits meme'),
    ],
  },
];

export const maxKymVoteShare = Math.max(
  ...memeTrendMonths2025.flatMap((month) =>
    month.candidates.map((candidate) => candidate.kymVoteShare ?? 0),
  ),
);
