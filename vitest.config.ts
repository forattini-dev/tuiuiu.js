import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
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
        // CLI commands (require running CLI)
        'src/cli/**',
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
        'src/core/renderer.ts',
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
        'src/core/delta-render.ts',
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
        // MCP server (requires full MCP setup)
        'src/mcp/server.ts',
        // Old components file (replaced by design-system)
        'src/components/components.ts',
        // Layout components (WIP or complex)
        'src/design-system/layout/tabs.ts',
        'src/design-system/layout/collapsible.ts',
        'src/design-system/layout/scroll-area.ts',
        'src/design-system/layout/grid.ts',
        'src/design-system/layout/app.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
    testTimeout: 30000,
  },
})
