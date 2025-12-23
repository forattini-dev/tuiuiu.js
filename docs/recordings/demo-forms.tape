# Tuiuiu forms - Form Wizard Demo
# Multi-step form with validation, selections, and toggle controls

Output docs/assets/demo-forms.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.5
Set TypingSpeed 0.003s

# Run forms example
Type "pnpm tsx examples/app-forms.ts"
Enter

# Let it initialize
Sleep 800ms

# Fill out form fields with realistic typing
Set TypingSpeed 0.02s
Type "Alice Johnson"
Sleep 300ms
Tab
Sleep 200ms

Type "alice@tuiuiu.dev"
Sleep 300ms
Tab
Sleep 200ms

# Navigate role dropdown
Down
Sleep 150ms
Down
Sleep 150ms
Enter
Sleep 300ms

# Move to skills
Tab
Sleep 200ms

# Toggle some skills with space
Space
Sleep 200ms
Down
Sleep 150ms
Space
Sleep 200ms
Down
Sleep 150ms
Space
Sleep 300ms

# Navigate to submit
Tab
Sleep 200ms
Tab
Sleep 200ms

# Submit form
Enter
Sleep 1s

# Exit
Ctrl+C
Sleep 200ms
