/**
 * Tuiuiu Prompts Demo
 *
 * Demonstrates all prompt types available in tuiuiu.js
 * Run with: pnpm tsx examples/prompts-demo.ts
 */

import { prompt } from '../src/interaction/index.js';

async function main() {
  prompt.setTheme({
    symbols: {
      question: '◆',
      pointer: '›',
    },
    colors: {
      accent: '#cba6f7',
      answer: 'greenBright',
      error: 'redBright',
    },
  });

  console.log('\n╭─────────────────────────────────────╮');
  console.log('│     Tuiuiu Prompts Demo             │');
  console.log('╰─────────────────────────────────────╯\n');

  // 1. Input prompt
  const name = await prompt.input('What is your name?', {
    default: 'Anonymous',
    validate: (v) => v.length >= 2 || 'Name must be at least 2 characters',
  });
  console.log(`\n  → Hello, ${name}!\n`);

  // 2. Confirm prompt
  const wantsCoffee = await prompt.confirm('Do you want coffee?', {
    default: true,
  });
  console.log(`  → Coffee: ${wantsCoffee ? '☕ Yes please!' : '🚫 No thanks'}\n`);

  // 3. Select prompt (single choice)
  const environment = await prompt.select(
    'Choose environment:',
    ['development', 'staging', 'production'] as const,
    { default: 'development' }
  );
  console.log(`  → Selected: ${environment}\n`);

  // 4. Checkbox prompt (multiple choice) - NEW!
  const features = await prompt.checkbox(
    'Select features to enable:',
    ['typescript', 'eslint', 'prettier', 'husky', 'jest'] as const,
    { default: ['typescript', 'eslint'], min: 1 }
  );
  console.log(`  → Enabled: ${features.join(', ')}\n`);

  // 5. Autocomplete prompt - NEW!
  const countries = [
    'Argentina', 'Australia', 'Austria',
    'Brazil', 'Belgium', 'Bulgaria',
    'Canada', 'Chile', 'China', 'Colombia',
    'Denmark',
    'Egypt',
    'France', 'Finland',
    'Germany', 'Greece',
    'Hungary',
    'India', 'Indonesia', 'Ireland', 'Italy',
    'Japan',
    'Kenya',
    'Luxembourg',
    'Mexico', 'Morocco',
    'Netherlands', 'New Zealand', 'Norway',
    'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Romania', 'Russia',
    'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
    'Thailand', 'Turkey',
    'Ukraine', 'United Kingdom', 'United States',
    'Vietnam',
  ] as const;

  const country = await prompt.autocomplete('Your country:', countries, {
    maxSuggestions: 5,
  });
  console.log(`  → Country: ${country}\n`);

  // 6. Number prompt - NEW!
  const age = await prompt.number('Your age:', {
    min: 1,
    max: 120,
    integer: true,
  });
  console.log(`  → Age: ${age}\n`);

  // 7. Password prompt
  const secret = await prompt.password('Enter your API key:', {
    validate: (v) => v.length >= 8 || 'API key must be at least 8 characters',
  });
  console.log(`  → API key: ${'*'.repeat(secret.length)} (${secret.length} chars)\n`);

  // Summary
  console.log('╭─────────────────────────────────────╮');
  console.log('│     Summary                         │');
  console.log('╰─────────────────────────────────────╯');
  console.log(`  Name:        ${name}`);
  console.log(`  Coffee:      ${wantsCoffee}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  Features:    ${features.join(', ')}`);
  console.log(`  Country:     ${country}`);
  console.log(`  Age:         ${age}`);
  console.log(`  API Key:     ${'*'.repeat(secret.length)}`);
  console.log('\n✨ Demo complete!\n');
}

main().catch(console.error);
