import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/storybook/**',
        'src/**/types.ts',
        // Interactive CLI entry points; command parsers are covered separately.
        'src/cli/index.ts',
        'src/cli/commands/help.ts',
        'src/cli/commands/storybook.ts',
      ],
      thresholds: {
        // These global floors include the renderer, delta renderer, MCP, and
        // CLI parser; they were previously excluded and made the headline
        // percentage look better than the risk-bearing code actually was.
        statements: 84,
        branches: 76,
        functions: 85,
        lines: 84,
        'src/utils/terminal-sanitize.ts': {
          statements: 90,
          branches: 78,
          functions: 100,
          lines: 90,
        },
        'src/core/{renderer,delta-render}.ts': {
          statements: 80,
          branches: 70,
          functions: 95,
          lines: 80,
          perFile: true,
        },
        'src/core/layout.ts': {
          statements: 88,
          branches: 82,
          functions: 88,
          lines: 89,
        },
        'src/core/animation.ts': {
          statements: 82,
          branches: 77,
          functions: 88,
          lines: 83,
        },
        'src/hooks/use-app.ts': {
          statements: 75,
          branches: 68,
          functions: 64,
          lines: 76,
        },
        'src/hooks/use-mouse.ts': {
          statements: 50,
          branches: 28,
          functions: 65,
          lines: 52,
        },
        'src/mcp/server.ts': {
          statements: 44,
          branches: 39,
          functions: 50,
          lines: 45,
        },
        'src/organisms/file-browser.ts': {
          statements: 82,
          branches: 80,
          functions: 75,
          lines: 82,
        },
        'src/primitives/split-box.ts': {
          statements: 82,
          branches: 76,
          functions: 95,
          lines: 87,
        },
        'src/molecules/data-viz/{radar-chart,scatter-plot,time-heatmap}.ts': {
          statements: 68,
          branches: 48,
          functions: 90,
          lines: 70,
          perFile: true,
        },
        'src/utils/fs-storage.ts': {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
        'src/core/image-file.ts': {
          statements: 85,
          branches: 82,
          functions: 80,
          lines: 85,
        },
        'src/core/clipboard-image.ts': {
          statements: 45,
          branches: 25,
          functions: 75,
          lines: 45,
        },
      },
    },
    testTimeout: 30000,
  },
})
