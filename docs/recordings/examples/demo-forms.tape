# Tuiuiu Forms - Wizard Journey Demo
# Step-by-step form wizard with smooth transitions and success feedback

Output docs/assets/demo-forms.gif

Set Shell bash
Set FontSize 16
Set Width 1920
Set Height 1080
Set Padding 30
Set PlaybackSpeed 1.2
Set TypingSpeed 0.003s

# Run forms example
Type "pnpm tsx examples/app-forms.ts"
Enter

# Let it initialize
Sleep 1s

# === SHOWCASE: Wizard Journey ===

# Step 1: Name - natural typing speed
Set TypingSpeed 0.025s
Type "Sarah Chen"
Sleep 400ms
Enter
Sleep 500ms

# Step 2: Email
Type "sarah@tuiuiu.dev"
Sleep 400ms
Enter
Sleep 500ms

# Step 3: Role dropdown - navigate with purpose
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 500ms

# Step 4: Experience - quick selection
Down
Sleep 200ms
Down
Sleep 200ms
Enter
Sleep 500ms

# Step 5: Skills multi-select - toggle a few
Space
Sleep 200ms
Down
Sleep 150ms
Space
Sleep 200ms
Down
Sleep 150ms
Down
Sleep 150ms
Space
Sleep 300ms

# Submit the form
Enter
Sleep 1.5s

# Appreciate the success screen
Sleep 1s

# Exit
Ctrl+C
Sleep 200ms
