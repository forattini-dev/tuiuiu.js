# Tuiuiu forms - Form Wizard Demo
# Multi-step form with validation

Output docs/assets/demo-forms.gif

Set Shell bash
Set FontSize 14
Set Width 900
Set Height 550
Set Padding 15
Set PlaybackSpeed 0.6
Set TypingSpeed 0.005s

# Run forms example (fast command typing)
Type "pnpm tsx examples/app-forms.ts"
Enter

# Let it initialize
Sleep 1.5s

# Fill out form (slower typing for readability)
Set TypingSpeed 0.03s
Type "John Doe"
Sleep 500ms
Tab
Sleep 300ms

Type "john@example.com"
Sleep 500ms
Tab
Sleep 300ms

# Select role
Down
Sleep 300ms
Down
Sleep 300ms
Enter
Sleep 500ms

# Skip to skills
Tab
Sleep 300ms

# Toggle some skills
Space
Sleep 500ms

# Submit
Tab
Sleep 300ms
Enter
Sleep 1.5s

# Exit
Ctrl+C
Sleep 300ms
