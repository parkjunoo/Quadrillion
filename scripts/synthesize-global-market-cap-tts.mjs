import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const defaultSsml = [
  '<speak>',
  'No stock stays king forever.',
  '</speak>',
].join('');

const defaultPublicPath = 'projects/global-market-cap/audio/intro-voiceover.mp3';
const generatedModulePath = 'src/projects/global-market-cap/generated/introVoiceoverAsset.ts';

const args = parseArgs(process.argv.slice(2));
const languageCode = args.language ?? process.env.GOOGLE_TTS_LANGUAGE ?? 'en-US';
const voiceName = args.voice ?? process.env.GOOGLE_TTS_VOICE ?? 'en-US-Studio-Q';
const speakingRate = Number(args['speaking-rate'] ?? process.env.GOOGLE_TTS_SPEAKING_RATE ?? 1.2);
const pitch = Number(args.pitch ?? process.env.GOOGLE_TTS_PITCH ?? -0.5);
const publicPath = args.output ?? defaultPublicPath;
const input = args.text
  ? { text: args.text }
  : { ssml: args.ssml ?? process.env.GOOGLE_TTS_SSML ?? defaultSsml };
const displayText = args.text ?? stripSsml(input.ssml);

validateNumber('speaking-rate', speakingRate);
validateNumber('pitch', pitch);

const token = getAccessToken();
const quotaProject = getQuotaProject();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

if (quotaProject) {
  headers['x-goog-user-project'] = quotaProject;
}

const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
  body: JSON.stringify({
    audioConfig: {
      audioEncoding: 'MP3',
      pitch,
      speakingRate,
    },
    input,
    voice: {
      languageCode,
      name: voiceName,
    },
  }),
  headers,
  method: 'POST',
});

const payload = await response.json();

if (!response.ok) {
  const message = payload?.error?.message ?? response.statusText;
  throw new Error(`Google Cloud Text-to-Speech failed: ${message}`);
}

if (typeof payload.audioContent !== 'string' || payload.audioContent.length === 0) {
  throw new Error('Google Cloud Text-to-Speech returned no audioContent.');
}

const outputFile = resolve('public', publicPath);
mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, Buffer.from(payload.audioContent, 'base64'));

const durationInSeconds = probeDuration(outputFile);
writeFileSync(
  generatedModulePath,
  [
    'export type IntroVoiceoverAsset = {',
    '  durationInSeconds: number | null;',
    '  generatedAt: string;',
    '  languageCode: string;',
    '  path: string;',
    '  text: string;',
    '  voiceName: string;',
    '};',
    '',
    `export const introVoiceoverAsset: IntroVoiceoverAsset | null = ${JSON.stringify(
      {
        durationInSeconds,
        generatedAt: new Date().toISOString(),
        languageCode,
        path: publicPath,
        text: displayText,
        voiceName,
      },
      null,
      2,
    )};`,
    '',
  ].join('\n'),
);

console.log(`Generated ${outputFile}`);
console.log(`Updated ${generatedModulePath}`);
if (durationInSeconds !== null) {
  console.log(`Duration: ${durationInSeconds.toFixed(2)}s`);
}

function parseArgs(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split('=');
    const nextValue = rawArgs[index + 1];

    if (inlineValue !== undefined) {
      parsed[rawKey] = inlineValue;
      continue;
    }

    if (nextValue && !nextValue.startsWith('--')) {
      parsed[rawKey] = nextValue;
      index += 1;
      continue;
    }

    parsed[rawKey] = 'true';
  }

  return parsed;
}

function getAccessToken() {
  if (process.env.GOOGLE_CLOUD_ACCESS_TOKEN) {
    return process.env.GOOGLE_CLOUD_ACCESS_TOKEN.trim();
  }

  const commands = [
    ['gcloud', ['auth', 'application-default', 'print-access-token']],
    ['gcloud', ['auth', 'print-access-token']],
  ];

  for (const [command, commandArgs] of commands) {
    try {
      const token = execFileSync(command, commandArgs, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      if (token) {
        return token;
      }
    } catch {
      // Try the next supported auth source.
    }
  }

  throw new Error(
    [
      'No Google Cloud access token found.',
      'Set GOOGLE_CLOUD_ACCESS_TOKEN, or run `gcloud auth application-default login`.',
      'Also make sure the Text-to-Speech API is enabled for your Google Cloud project.',
    ].join(' '),
  );
}

function getQuotaProject() {
  const envProject =
    process.env.GOOGLE_CLOUD_QUOTA_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT;
  const normalizedEnvProject = normalizeProjectId(envProject);

  if (normalizedEnvProject) {
    return normalizedEnvProject;
  }

  const commands = [
    ['gcloud', ['config', 'get-value', 'billing/quota_project']],
    ['gcloud', ['config', 'get-value', 'project']],
  ];

  for (const [command, commandArgs] of commands) {
    try {
      const projectId = normalizeProjectId(
        execFileSync(command, commandArgs, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }),
      );

      if (projectId) {
        return projectId;
      }
    } catch {
      // The header is optional unless local ADC requires a quota project.
    }
  }

  return null;
}

function normalizeProjectId(projectId) {
  const trimmed = projectId?.trim();

  if (!trimmed || trimmed === '(unset)' || trimmed === 'CURRENT_PROJECT') {
    return null;
  }

  return trimmed;
}

function probeDuration(filePath) {
  try {
    const output = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', filePath],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim();
    const duration = Number(output);

    return Number.isFinite(duration) ? duration : null;
  } catch {
    return null;
  }
}

function stripSsml(ssml) {
  return ssml
    .replace(/<break[^>]*>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateNumber(name, value) {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name} value.`);
  }
}
