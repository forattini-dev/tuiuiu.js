# Clipboard integration

`useClipboard` is an internal capability-aware adapter, not a public v2 export.
Do not import it from the package root or use an unsupported deep import.
The public `TextInput` and `TextView` components expose selected-text copying
through Ctrl+Shift+C and an optional `onCopy` callback.

## Public usage

```typescript
import { component, useState } from 'tuiuiu.js/app';
import { Box, Text, TextInput, useTextInputState } from 'tuiuiu.js/ui';

const CopyPanel = component('CopyPanel', () => {
  const [copied, setCopied] = useState('');
  const input = useTextInputState({ initialValue: 'Select part of this text' });
  return Box({ flexDirection: 'column' },
    TextInput({ state: input, onCopy: setCopied }),
    Text({}, `Copy preview: ${JSON.stringify(copied())}`));
});
```

The callback overrides the default clipboard write. Omit `onCopy` to use OSC52
when negotiated terminal capabilities support it; unsupported terminals are a
no-op. Multiplexers use the progressive passthrough layer. Copy handles bind to
the creating application's output, including callbacks invoked outside its scope.
No clipboard read, platform subprocess or browser clipboard is involved.

Plain Ctrl+C remains available for application interruption. The component removes
terminal protocols and copies source text, not prompts or inserted soft wraps.
Password TextInput never sends selected text to OSC52 or `onCopy`.
`state.copyText()` offers pure extraction without writing, and returns an empty
string for password controllers.

See [TextInput](/components/atoms/text-input.md) and
[text models](/core/text-models.md). Run `pnpm example text-editor-lab` to try
the preview interactively.
