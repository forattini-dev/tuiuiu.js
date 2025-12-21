# Patterns & Recipes

Common patterns and recipes for building TUI applications with Tuiuiu.

## Navigation Patterns

### 1. Multi-Step Wizard

```typescript
function Wizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});

  const steps = [
    { title: 'Basic Info', component: BasicInfoStep },
    { title: 'Preferences', component: PreferencesStep },
    { title: 'Confirm', component: ConfirmStep },
  ];

  const CurrentStep = steps[step()].component;

  return Box(
    { flexDirection: 'column' },
    // Progress indicator
    Box(
      { marginBottom: 1 },
      ...steps.map((s, i) =>
        Text({
          color: i === step() ? 'cyan' : i < step() ? 'green' : 'gray',
        }, `${i < step() ? '✓' : i + 1}. ${s.title}  `)
      )
    ),
    // Current step
    CurrentStep({
      data: data(),
      onNext: (stepData) => {
        setData(d => ({ ...d, ...stepData }));
        setStep(s => s + 1);
      },
      onBack: () => setStep(s => s - 1),
    })
  );
}
```

### 2. Tab Navigation

```typescript
function TabView() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Home', 'Settings', 'Help'];

  useInput((input, key) => {
    if (key.leftArrow) setActiveTab(t => Math.max(0, t - 1));
    if (key.rightArrow) setActiveTab(t => Math.min(tabs.length - 1, t + 1));
    if (input >= '1' && input <= '3') setActiveTab(Number(input) - 1);
  });

  return Box(
    { flexDirection: 'column' },
    Box(
      { borderStyle: 'single', borderColor: 'gray' },
      ...tabs.map((tab, i) =>
        Text({
          color: i === activeTab() ? 'cyan' : 'gray',
          bold: i === activeTab(),
          paddingX: 1,
        }, `[${i + 1}] ${tab}`)
      )
    ),
    Box({ padding: 1 }, renderTabContent(activeTab()))
  );
}
```

## Data Loading Patterns

### 1. Loading State

```typescript
function DataView() {
  const [state, setState] = useState<'loading' | 'error' | 'success'>('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(d => { setData(d); setState('success'); })
      .catch(e => { setError(e); setState('error'); });
  });

  if (state() === 'loading') {
    return Box({},
      Text({ color: 'yellow' }, '⠋ Loading...'));
  }

  if (state() === 'error') {
    return Box({},
      Text({ color: 'red' }, `✗ Error: ${error().message}`));
  }

  return Box({}, DataDisplay({ data: data() }));
}
```

### 2. Polling Pattern

```typescript
function LiveData() {
  const [data, setData] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  createEffect(() => {
    if (isPaused()) return;
    const interval = setInterval(async () => {
      const newData = await fetchLatest();
      setData(newData);
    }, 5000);
    return () => clearInterval(interval);
  });

  useInput((input) => {
    if (input === 'p') setIsPaused(p => !p);
  });

  return Box(
    { flexDirection: 'column' },
    Text({ color: isPaused() ? 'yellow' : 'green' },
      isPaused() ? '⏸ Paused' : '▶ Live'),
    DataList({ items: data() })
  );
}
```

## Form Patterns

### 1. Form Validation

```typescript
function ValidatedForm() {
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const validate = (v: string) => {
    const errs = [];
    if (v.length < 3) errs.push('Min 3 characters');
    if (!/^[a-z]+$/i.test(v)) errs.push('Only letters allowed');
    return errs;
  };

  useEffect(() => {
    if (touched()) {
      setErrors(validate(value()));
    }
  });

  return Box(
    { flexDirection: 'column' },
    TextInput({
      value: value(),
      onChange: setValue,
      onBlur: () => setTouched(true),
    }),
    errors().length > 0 && Box(
      { flexDirection: 'column' },
      ...errors().map(e => Text({ color: 'red' }, `✗ ${e}`))
    )
  );
}
```

### 2. Form State Manager

```typescript
function createFormState<T>(initial: T) {
  const [values, setValues] = createSignal(initial);
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [dirty, setDirty] = createSignal<Set<string>>(new Set());

  return {
    values, errors, dirty,
    setValue: <K extends keyof T>(key: K, value: T[K]) => {
      setValues(v => ({ ...v, [key]: value }));
      setDirty(d => new Set([...d, key as string]));
    },
    setError: (key: string, error: string) => {
      setErrors(e => ({ ...e, [key]: error }));
    },
    clearError: (key: string) => {
      setErrors(e => { const { [key]: _, ...rest } = e; return rest; });
    },
    reset: () => {
      setValues(initial);
      setErrors({});
      setDirty(new Set());
    },
    isValid: () => Object.keys(errors()).length === 0,
  };
}
```

## Layout Patterns

### 1. Master-Detail

```typescript
function MasterDetail() {
  const [selected, setSelected] = useState<Item | null>(null);

  return Box(
    { flexDirection: 'row', height: 20 },
    // Master (list)
    Box(
      { width: 30, borderStyle: 'single', borderColor: 'gray' },
      ItemList({
        onSelect: setSelected,
        selectedId: selected()?.id,
      })
    ),
    // Detail
    Box(
      { flexGrow: 1, padding: 1 },
      selected()
        ? ItemDetail({ item: selected() })
        : Text({ color: 'gray' }, 'Select an item')
    )
  );
}
```

### 2. Dashboard Grid

```typescript
function Dashboard() {
  return Box(
    { flexDirection: 'column', gap: 1 },
    // Top row
    Box(
      { flexDirection: 'row', gap: 1 },
      Widget({ title: 'CPU', flex: 1, content: GaugeWidget }),
      Widget({ title: 'Memory', flex: 1, content: GaugeWidget }),
      Widget({ title: 'Network', flex: 1, content: SparklineWidget }),
    ),
    // Bottom row
    Box(
      { flexDirection: 'row', gap: 1 },
      Widget({ title: 'Logs', flex: 2, content: LogsWidget }),
      Widget({ title: 'Alerts', flex: 1, content: AlertsWidget }),
    )
  );
}

function Widget({ title, flex, content: Content }) {
  return Box(
    { flexGrow: flex, borderStyle: 'round', borderColor: 'gray' },
    Box(
      { flexDirection: 'column' },
      Text({ color: 'cyan', bold: true }, title),
      Content({})
    )
  );
}
```

## Notification Patterns

### 1. Toast Manager

```typescript
const toasts = createSignal<Toast[]>([]);
let toastId = 0;

function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const toast = { id: ++toastId, message, type, createdAt: Date.now() };
  toasts.set([...toasts.get(), toast]);

  // Auto-dismiss
  setTimeout(() => {
    toasts.set(toasts.get().filter(t => t.id !== toast.id));
  }, 3000);
}

function ToastContainer() {
  const list = toasts.get();
  if (list.length === 0) return null;

  const colors = { info: 'cyan', success: 'green', error: 'red' };

  return Box(
    { position: 'absolute', right: 0, top: 0, flexDirection: 'column' },
    ...list.map(t =>
      Box(
        { borderStyle: 'round', borderColor: colors[t.type], padding: 1 },
        Text({ color: colors[t.type] }, t.message)
      )
    )
  );
}
```

## Keyboard Shortcut Patterns

### 1. Global Shortcuts

```typescript
function App() {
  const [showHelp, setShowHelp] = useState(false);

  useInput((input, key) => {
    // Global shortcuts
    if (input === '?') setShowHelp(v => !v);
    if (key.escape) setShowHelp(false);
    if (key.ctrl && input === 'c') useApp().exit();
  });

  return Box(
    { flexDirection: 'column' },
    MainContent({}),
    showHelp() && HelpOverlay({})
  );
}
```

### 2. Vim-like Navigation

```typescript
function VimNav() {
  const [mode, setMode] = useState<'normal' | 'insert'>('normal');
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useInput((input, key) => {
    if (mode() === 'normal') {
      if (input === 'h') setCursor(c => ({ ...c, x: c.x - 1 }));
      if (input === 'j') setCursor(c => ({ ...c, y: c.y + 1 }));
      if (input === 'k') setCursor(c => ({ ...c, y: c.y - 1 }));
      if (input === 'l') setCursor(c => ({ ...c, x: c.x + 1 }));
      if (input === 'i') setMode('insert');
      if (input === 'g') setCursor({ x: 0, y: 0 }); // gg = top
      if (input === 'G') setCursor(c => ({ ...c, y: maxY })); // G = bottom
    } else {
      if (key.escape) setMode('normal');
    }
  });
}
```

## More Patterns

See also:
- [Programmatic Control Guide](/guides/programmatic-control.md)
- [Examples Directory](/examples/)
