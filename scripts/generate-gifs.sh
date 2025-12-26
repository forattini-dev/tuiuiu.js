#!/bin/bash
# Generate all demo GIFs using VHS
# Requires: https://github.com/charmbracelet/vhs

set -e

cd "$(dirname "$0")/.."

echo "🎬 Generating Tuiuiu GIFs..."
echo ""

# Check if vhs is installed
if ! command -v vhs &> /dev/null; then
    echo "❌ VHS not found. Install it first:"
    echo "   brew install vhs"
    echo "   # or"
    echo "   go install github.com/charmbracelet/vhs@latest"
    exit 1
fi

# Parse arguments
CATEGORY="${1:-all}"

# Build first to ensure examples work
echo "📦 Building project..."
pnpm build

generate_category() {
    local category=$1
    local dir="docs/recordings/${category}"

    if [ ! -d "$dir" ]; then
        echo "⚠️  Directory $dir not found, skipping..."
        return
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 Generating ${category} GIFs..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    for tape in "$dir"/*.tape; do
        if [ -f "$tape" ]; then
            name=$(basename "$tape" .tape)
            echo ""
            echo "🎥 Recording ${name}..."
            vhs "$tape"
            echo "✅ Generated"
        fi
    done
}

case "$CATEGORY" in
    examples)
        generate_category "examples"
        ;;
    components)
        generate_category "components"
        ;;
    all)
        generate_category "examples"
        generate_category "components"
        ;;
    *)
        echo "Usage: $0 [examples|components|all]"
        echo ""
        echo "  examples   - Generate full app demo GIFs"
        echo "  components - Generate component documentation GIFs"
        echo "  all        - Generate all GIFs (default)"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Done!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Generated files:"
echo ""
echo "📁 Examples:"
ls -lh docs/recordings/examples/*.gif 2>/dev/null || echo "   (none)"
echo ""
echo "📁 Components:"
ls -lh docs/recordings/components/*.gif 2>/dev/null || echo "   (none)"
