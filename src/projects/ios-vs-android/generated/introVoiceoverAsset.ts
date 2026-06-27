export type IntroVoiceoverAsset = {
  durationInSeconds: number | null;
  generatedAt: string;
  languageCode: string;
  path: string;
  text: string;
  voiceName: string;
};

export const introVoiceoverAsset: IntroVoiceoverAsset | null = {
  "durationInSeconds": 2.016,
  "generatedAt": "2026-06-21T06:34:14.165Z",
  "languageCode": "en-US",
  "path": "projects/ios-vs-android/audio/intro-voiceover.mp3",
  "text": "iPhone or Android? What do you use?",
  "voiceName": "en-US-Studio-Q"
};
