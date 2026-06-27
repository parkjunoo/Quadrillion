export type IntroVoiceoverAsset = {
  durationInSeconds: number | null;
  generatedAt: string;
  languageCode: string;
  path: string;
  text: string;
  voiceName: string;
};

export const introVoiceoverAsset: IntroVoiceoverAsset | null = {
  "durationInSeconds": 1.656,
  "generatedAt": "2026-06-23T16:37:14.516Z",
  "languageCode": "en-US",
  "path": "projects/global-market-cap/audio/intro-voiceover.mp3",
  "text": "No stock stays king forever.",
  "voiceName": "en-US-Studio-Q"
};
