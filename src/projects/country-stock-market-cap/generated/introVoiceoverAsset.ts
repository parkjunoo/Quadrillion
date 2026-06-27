export type IntroVoiceoverAsset = {
  durationInSeconds: number | null;
  generatedAt: string;
  languageCode: string;
  path: string;
  text: string;
  voiceName: string;
};

export const introVoiceoverAsset: IntroVoiceoverAsset | null = {
  "durationInSeconds": 2.592,
  "generatedAt": "2026-06-23T06:29:06.554Z",
  "languageCode": "en-US",
  "path": "projects/country-stock-market-cap/audio/intro-voiceover.mp3",
  "text": "When did China's stock market become number two?",
  "voiceName": "en-US-Studio-Q"
};
