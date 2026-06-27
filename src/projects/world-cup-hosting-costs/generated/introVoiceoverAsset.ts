export type IntroVoiceoverAsset = {
  durationInSeconds: number | null;
  generatedAt: string;
  languageCode: string;
  path: string;
  text: string;
  voiceName: string;
};

export const introVoiceoverAsset: IntroVoiceoverAsset | null = {
  "durationInSeconds": 2.208,
  "generatedAt": "2026-06-22T19:23:57.275Z",
  "languageCode": "en-US",
  "path": "projects/world-cup-hosting-costs/audio/intro-voiceover.mp3",
  "text": "How much did Qatar spend on the World Cup?",
  "voiceName": "en-US-Studio-Q"
};
