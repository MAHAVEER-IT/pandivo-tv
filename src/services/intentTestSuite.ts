import { parseMusicIntent } from './geminiIntentService';
import type { MusicIntent } from './geminiIntentService';

export interface TestCase {
  id: number;
  prompt: string;
  expectedDescription: string;
  validate: (intent: MusicIntent) => { passed: boolean; details: string };
}

export const ACCEPTANCE_TESTS: TestCase[] = [
  {
    id: 1,
    prompt: 'Create a calm playlist for 30 minutes',
    expectedDescription: 'Mood (calm) + Duration (30 min)',
    validate: (i) => {
      const moodOk = i.mood === 'calm' || i.mood === 'relaxed';
      const durOk = i.duration_minutes === 30;
      const passed = moodOk && durOk;
      return {
        passed,
        details: `mood: "${i.mood}", duration: ${i.duration_minutes}m`,
      };
    },
  },
  {
    id: 2,
    prompt: 'Give me energetic workout music',
    expectedDescription: 'Context (workout) + Energy (high)',
    validate: (i) => {
      const contextOk = i.context === 'workout';
      const energyOk = i.energy === 'high';
      const passed = contextOk && energyOk;
      return {
        passed,
        details: `context: "${i.context}", energy: "${i.energy}"`,
      };
    },
  },
  {
    id: 3,
    prompt: 'Play romantic songs from the 2000s',
    expectedDescription: 'Theme/Mood (romantic) + Era (2000-2009)',
    validate: (i) => {
      const themeOk = i.mood === 'romantic' || i.theme === 'romantic';
      const eraOk = i.era_start === 2000 && (i.era_end === 2009 || i.era_end === 2000);
      const passed = themeOk && eraOk;
      return {
        passed,
        details: `theme/mood: "${i.mood || i.theme}", era: ${i.era_start}-${i.era_end}`,
      };
    },
  },
  {
    id: 4,
    prompt: 'Play something similar to this',
    expectedDescription: 'Action (play_similar)',
    validate: (i) => {
      const passed = i.action === 'play_similar';
      return {
        passed,
        details: `action: "${i.action}"`,
      };
    },
  },
  {
    id: 5,
    prompt: 'Make it more energetic',
    expectedDescription: 'Action (modify_playlist) + modifications.energy (high)',
    validate: (i) => {
      const actionOk = i.action === 'modify_playlist';
      const modOk = i.modifications?.energy === 'high' || i.energy === 'high';
      const passed = actionOk && modOk;
      return {
        passed,
        details: `action: "${i.action}", mod.energy: "${i.modifications?.energy || i.energy}"`,
      };
    },
  },
  {
    id: 6,
    prompt: 'Remove sad songs',
    expectedDescription: 'Action (modify_playlist) + modifications.exclude_moods (sad)',
    validate: (i) => {
      const actionOk = i.action === 'modify_playlist';
      const excludeOk = i.modifications?.exclude_moods?.includes('sad');
      const passed = actionOk && !!excludeOk;
      return {
        passed,
        details: `action: "${i.action}", exclude_moods: [${i.modifications?.exclude_moods?.join(', ')}]`,
      };
    },
  },
  {
    id: 7,
    prompt: 'Give me music from 2010 to 2020',
    expectedDescription: 'Era range (2010 to 2020)',
    validate: (i) => {
      const passed = i.era_start === 2010 && i.era_end === 2020;
      return {
        passed,
        details: `era_start: ${i.era_start}, era_end: ${i.era_end}`,
      };
    },
  },
  {
    id: 8,
    prompt: 'Play something for a rainy evening',
    expectedDescription: 'Context (rainy_evening)',
    validate: (i) => {
      const passed = i.context === 'rainy_evening' || (i.context || '').includes('rain');
      return {
        passed,
        details: `context: "${i.context}"`,
      };
    },
  },
  {
    id: 9,
    prompt: 'I want chill acoustic music for an hour',
    expectedDescription: 'Mood (chill) + Genre (acoustic) + Duration (60 min)',
    validate: (i) => {
      const moodOk = i.mood === 'chill' || i.mood === 'calm';
      const genreOk = i.genre === 'acoustic';
      const durOk = i.duration_minutes === 60;
      const passed = moodOk && genreOk && durOk;
      return {
        passed,
        details: `mood: "${i.mood}", genre: "${i.genre}", duration: ${i.duration_minutes}m`,
      };
    },
  },
  {
    id: 10,
    prompt: "What's the capital of France?",
    expectedDescription: 'Action (unsupported)',
    validate: (i) => {
      const passed = i.action === 'unsupported';
      return {
        passed,
        details: `action: "${i.action}", confidence: ${i.confidence}`,
      };
    },
  },
  {
    id: 11,
    prompt: 'Play something good',
    expectedDescription: 'Ambiguous request: needs_clarification (true)',
    validate: (i) => {
      const passed = i.needs_clarification === true && !!i.clarification;
      return {
        passed,
        details: `needs_clarification: ${i.needs_clarification}, clarification: "${i.clarification}"`,
      };
    },
  },
  {
    id: 12,
    prompt: 'Create a relaxing 45-minute playlist with romantic songs from the 2010s',
    expectedDescription: 'Multi-parameter (relaxing + 45 min + romantic + 2010-2019)',
    validate: (i) => {
      const moodOk = i.mood === 'relaxed' || i.mood === 'calm' || i.mood === 'romantic';
      const durOk = i.duration_minutes === 45;
      const themeOk = i.theme === 'romantic' || i.mood === 'romantic';
      const eraOk = i.era_start === 2010 && (i.era_end === 2019 || i.era_end === 2010);
      const passed = moodOk && durOk && themeOk && eraOk;
      return {
        passed,
        details: `mood: "${i.mood}", duration: ${i.duration_minutes}m, theme: "${i.theme}", era: ${i.era_start}-${i.era_end}`,
      };
    },
  },
];

export async function runAcceptanceTests(
  onProgress?: (index: number, result: { test: TestCase; intent: MusicIntent; passed: boolean; details: string }) => void
) {
  const results = [];
  for (let i = 0; i < ACCEPTANCE_TESTS.length; i++) {
    const test = ACCEPTANCE_TESTS[i];
    const intent = await parseMusicIntent(test.prompt);
    const { passed, details } = test.validate(intent);
    const res = { test, intent, passed, details };
    results.push(res);
    if (onProgress) {
      onProgress(i, res);
    }
  }
  return results;
}
