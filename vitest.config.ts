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
        // Prompts (require interactive TTY input - same as CLI)
        'src/prompts/**',
        // Old component files replaced by design-system equivalents
        'src/components/markdown.ts',
        'src/components/select.ts',
        'src/components/table.ts',
        'src/components/text-input.ts',
        'src/components/split-panel.ts',
        'src/components/code-block.ts',
        'src/components/modal.ts',
        // Mouse hook not yet fully implemented
        'src/hooks/use-mouse.ts',
        // Old core files replaced by design-system/core and primitives
        'src/core/signal.ts',
        'src/core/layout.ts',
        // WIP/complex components not yet fully implemented
        'src/design-system/data-display/calendar.ts',
        'src/design-system/data-display/tree.ts',
        'src/design-system/data-display/data-table.ts',
        'src/design-system/feedback/timer.ts',
        'src/design-system/forms/autocomplete.ts',
        'src/design-system/forms/multi-select.ts',
        'src/design-system/forms/radio-group.ts',
        'src/design-system/forms/slider.ts',
        'src/hooks/use-navigation.ts',
        'src/design-system/overlays/command-palette.ts',
        'src/design-system/overlays/overlay-stack.ts',
        // Charts/visualization (WIP)
        'src/components/data-viz/bar-chart.ts',
        'src/components/data-viz/gauge.ts',
        'src/components/data-viz/line-chart.ts',
        'src/components/data-viz/sparkline.ts',
        // Animation system (advanced features, WIP)
        'src/core/animation.ts',
        // Advanced rendering systems (complex to test)
        'src/core/dirty.ts',
        'src/core/tick.ts',
        'src/core/theme-loader.ts',
        // Complex organisms (require integration testing)
        'src/organisms/file-browser.ts',
        // Complex data-viz components (WIP)
        'src/molecules/data-viz/gantt-chart.ts',
        'src/molecules/data-viz/radar-chart.ts',
        'src/molecules/data-viz/scatter-plot.ts',
        'src/molecules/data-viz/time-heatmap.ts',
        // Advanced components (complex to test in isolation)
        'src/primitives/split-box.ts',
        'src/design-system/visual/splash-screen.ts',
        // System utilities (require mocking process)
        'src/utils/system-data.ts',
        // Old components file (replaced by design-system)
        'src/components/components.ts',
        // Layout components (WIP or complex)
        'src/design-system/layout/tabs.ts',
        'src/design-system/layout/collapsible.ts',
        'src/design-system/layout/scroll-area.ts',
        'src/design-system/layout/grid.ts',
        'src/design-system/layout/app.ts',
        // Molecules WIP components (duplicated in design-system)
        'src/molecules/tree.ts',
        'src/molecules/radio-group.ts',
        'src/molecules/collapsible.ts',
        'src/molecules/multi-select.ts',
        'src/molecules/calendar.ts',
        'src/molecules/markdown.ts',
        'src/molecules/code-block.ts',
        'src/molecules/tabs.ts',
        'src/molecules/table.ts',
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
        'src/hooks/use-app.ts': {
          statements: 75,
          branches: 68,
          functions: 64,
          lines: 76,
        },
        'src/mcp/server.ts': {
          statements: 44,
          branches: 39,
          functions: 50,
          lines: 45,
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
