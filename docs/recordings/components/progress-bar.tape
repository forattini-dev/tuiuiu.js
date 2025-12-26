# ProgressBar Component - Clean documentation GIF
# Shows animated progress bar filling up

Output docs/assets/components/progress-bar.gif

Set Shell bash
Set FontSize 18
Set Width 500
Set Height 180
Set Padding 20
Set PlaybackSpeed 1

# Hide the setup
Hide
Type "pnpm tsx docs/component-demos/progress-bar-demo.ts"
Enter
Sleep 500ms
Show

# Watch the progress bar animate (auto-exits after ~6s)
Sleep 6s

Hide
Ctrl+C
