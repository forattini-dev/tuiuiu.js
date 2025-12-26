# Gauge Demo - System gauges with animated values
# Shows linear and meter gauges for documentation

Output docs/recordings/components/gauge.gif

Set Shell bash
Set FontSize 16
Set Width 550
Set Height 250
Set Padding 20
Set PlaybackSpeed 1

# Hide setup
Hide
Type "pnpm tsx docs/component-demos/gauge-demo.ts"
Enter
Sleep 800ms
Show

# Watch gauges animate
Sleep 8s

Hide
Ctrl+C
