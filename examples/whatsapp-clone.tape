# WhatsApp Clone Demo - Tuiuiu.js
# A terminal-based WhatsApp Web clone built with tuiuiu.js

Output examples/whatsapp-clone.gif

Set Shell "bash"
Set FontSize 13
Set Width 1600
Set Height 900
Set Padding 10
Set Theme "Dracula"
Set TypingSpeed 50ms
Set PlaybackSpeed 1.0

# Start the app
Type "pnpm example examples/whatsapp-clone.ts"
Enter
Sleep 2s

# Navigate through contacts with arrow keys
Sleep 1s
Down
Sleep 500ms
Down
Sleep 500ms
Down
Sleep 500ms

# Select a contact (David - has unread messages)
Enter
Sleep 1s

# Type a message
Type "Hey! Just checking in on the PR status"
Sleep 500ms
Enter
Sleep 1s

# Go back to contacts and check another one
Escape
Sleep 500ms
Up
Up
Sleep 500ms
Enter
Sleep 1s

# Navigate to see more contacts
Down
Down
Down
Down
Down
Sleep 1s

# Try the filter tabs - press 'u' for Unread
Type "u"
Sleep 1s

# Press 'a' for All
Type "a"
Sleep 1s

# Press 'f' for Favorites
Type "f"
Sleep 1s

# Press 'g' for Groups
Type "g"
Sleep 1s

# Back to All
Type "a"
Sleep 1s

# Wait to see incoming messages animation
Sleep 3s

# Scroll through messages
Up
Up
Up
Sleep 1s

# Final pause
Sleep 2s

# Exit
Type "q"
Sleep 500ms
