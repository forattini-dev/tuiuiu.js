# WhatsApp Clone Demo - Tuiuiu.js
# Showcase: search filtering, chat selection, and message sending

Output examples/whatsapp-clone.gif

Set Shell "bash"
Set FontSize 13
Set Width 1600
Set Height 900
Set Padding 10
Set Theme "Dracula"
Set TypingSpeed 35ms
Set PlaybackSpeed 1.0

# Start the app
Type "pnpm example examples/whatsapp-clone.ts"
Enter
Sleep 2s

# Send a long message to show input auto-grow and wrapping
Set TypingSpeed 30ms
Type "Hey Alice, I just pushed the new chat input with auto-grow and word wrap so we can test long messages in the UI."
Sleep 400ms
Enter
Sleep 900ms

# Focus the search input and filter by name
Tab
Sleep 400ms
Type "dev"
Sleep 700ms

# Move selection to another filtered chat
Down
Sleep 500ms

# Return to message input and send in the selected chat
Shift+Tab
Sleep 400ms
Type "Hey team, can you review the latest changes?"
Sleep 300ms
Enter
Sleep 900ms

# Clear the search and show full list again
Tab
Sleep 300ms
Ctrl+U
Sleep 600ms

# Navigate a bit in the list
Down
Down
Sleep 500ms

# Send another quick message
Shift+Tab
Sleep 300ms
Type "Ping! Testing chat selection and send."
Sleep 300ms
Enter
Sleep 1s

# Final pause
Sleep 2s

# Exit
Type "q"
Sleep 500ms
