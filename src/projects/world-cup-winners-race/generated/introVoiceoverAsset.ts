export type IntroVoiceoverAsset = {
  durationInSeconds: number | null;
  generatedAt: string;
  languageCode: string;
  path: string;
  speakingRate: number;
  text: string;
  voiceName: string;
};

export const introVoiceoverAsset: IntroVoiceoverAsset | null = {
  "durationInSeconds": 1.968,
  "generatedAt": "2026-06-27T16:19:53.205Z",
  "languageCode": "en-US",
  "path": "projects/world-cup-winners-race/audio/intro-voiceover.mp3",
  "speakingRate": 1.3,
  "text": "Which country has won the most World Cups?",
  "voiceName": "en-US-Studio-Q"
};
