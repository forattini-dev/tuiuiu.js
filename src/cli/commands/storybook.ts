/**
 * Storybook command - launches the interactive component explorer
 */

export async function runStorybookCommand(): Promise<void> {
  // Dynamic import to avoid side effects before command is confirmed
  const { runStorybook } = await import('../../storybook/app.js');
  await runStorybook();
}
