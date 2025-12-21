#!/bin/bash
# Generate all demo GIFs using VHS
# Requires: https://github.com/charmbracelet/vhs

set -e

cd "$(dirname "$0")/.."

echo "🎬 Generating Tuiuiu demo GIFs..."
echo ""

# Check if vhs is installed
if ! command -v vhs &> /dev/null; then
    echo "❌ VHS not found. Install it first:"
    echo "   brew install vhs"
    echo "   # or"
    echo "   go install github.com/charmbracelet/vhs@latest"
    exit 1
fi

# Build first to ensure examples work
echo "📦 Building project..."
pnpm build

# Generate each GIF
TAPES=(
    "demo-hero"
    "demo-storybook"
    "demo-dashboard"
    "demo-forms"
    "demo-charts"
    "demo-chat"
    "demo-spinners"
    "demo-layout"
    "demo-mouse"
    "demo-counter"
    "demo-counter-interactive"
)

for tape in "${TAPES[@]}"; do
    if [ -f "docs/recordings/${tape}.tape" ]; then
        echo ""
        echo "🎥 Recording ${tape}..."
        vhs "docs/recordings/${tape}.tape"
        echo "✅ Generated docs/assets/${tape}.gif"
    fi
done

echo ""
echo "🎉 All GIFs generated successfully!"
echo ""
echo "Generated files:"
ls -lh docs/assets/*.gif 2>/dev/null || echo "No GIFs found"
