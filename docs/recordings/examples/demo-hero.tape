# Tuiuiu Storybook - Component Explorer (Hero)
# Navigate through categories, preview components, explore the design system

Output docs/recordings/examples/demo-hero.gif

Set Shell bash
Set FontSize 14
Set Width 1400
Set Height 900
Set Padding 20
Set PlaybackSpeed 1.0
Set TypingSpeed 0.003s

# Run storybook
Type "pnpm storybook"
Enter

# Wait for splash screen to complete (1.5s duration + fade + buffer)
Sleep 3s

# === Navigate to Atoms category ===
Down
Sleep 300ms
Down
Sleep 300ms
Enter
Sleep 500ms

# Browse Spinner stories
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 1.5s

# Back to menu
Escape
Sleep 300ms

# === Navigate to Molecules category ===
Down
Sleep 200ms
Enter
Sleep 500ms

# Browse Select component
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 1.5s

# Back to menu
Escape
Sleep 300ms

# === Navigate to Data Viz ===
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 500ms

# Browse BarChart
Down
Sleep 200ms
Enter
Sleep 1.5s

# Back to menu
Escape
Sleep 300ms

# === Navigate to Waveform ===
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 1.5s

# Exit
Type "q"
Sleep 300ms
