/**
 * Example 04: Forms
 *
 * Demonstrates:
 * - TextInput component with validation
 * - Select component for dropdowns
 * - Wizard-style form navigation
 * - Form state management
 *
 * IMPORTANT: All interactive components (TextInput, Select) must be
 * created at MODULE LEVEL to avoid hook ordering issues.
 *
 * Run: pnpm tsx examples/04-forms.ts
 */

import {
  render,
  Box,
  Text,
  useInput,
  useApp,
  createTextInput,
  renderTextInput,
  createSelect,
  renderSelect,
  createSignal,
  type VNode,
  type SelectItem,
} from '../src/index.js';

// Form field definitions
const roleOptions: SelectItem<string>[] = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'devops', label: 'DevOps Engineer' },
];

const experienceOptions: SelectItem<string>[] = [
  { value: 'junior', label: '0-2 years (Junior)' },
  { value: 'mid', label: '3-5 years (Mid)' },
  { value: 'senior', label: '6-10 years (Senior)' },
  { value: 'lead', label: '10+ years (Lead)' },
];

const skillOptions: SelectItem<string>[] = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'react', label: 'React' },
  { value: 'node', label: 'Node.js' },
];

// =============================================================================
// Form state - ALL created at MODULE LEVEL (before render)
// =============================================================================

// State signals
const [activeField, setActiveField] = createSignal(0);
const [submitted, setSubmitted] = createSignal(false);
const [formData, setFormData] = createSignal({
  name: '',
  email: '',
  role: '',
  experience: '',
  skills: [] as string[],
});

// Text inputs - created once, isActive is reactive
const nameInput = createTextInput({
  placeholder: 'Enter your name',
  isActive: () => activeField() === 0,
  onChange: (value) => setFormData((d) => ({ ...d, name: value })),
  onSubmit: () => setActiveField(1),
});

const emailInput = createTextInput({
  placeholder: 'Enter your email',
  isActive: () => activeField() === 1,
  onChange: (value) => setFormData((d) => ({ ...d, email: value })),
  onSubmit: () => setActiveField(2),
});

// Selects - created once, isActive is reactive
const roleSelect = createSelect({
  items: roleOptions,
  isActive: () => activeField() === 2,
  onChange: (value) => setFormData((d) => ({ ...d, role: value as string })),
  onSubmit: () => setActiveField(3),
  onCancel: () => setActiveField(1),
});

const experienceSelect = createSelect({
  items: experienceOptions,
  isActive: () => activeField() === 3,
  onChange: (value) => setFormData((d) => ({ ...d, experience: value as string })),
  onSubmit: () => setActiveField(4),
  onCancel: () => setActiveField(2),
});

const skillsSelect = createSelect({
  items: skillOptions,
  multiple: true,
  isActive: () => activeField() === 4,
  onChange: (values) => {
    if (Array.isArray(values)) {
      setFormData((d) => ({ ...d, skills: values }));
    }
  },
  onSubmit: () => setSubmitted(true),
  onCancel: () => setActiveField(3),
});

// =============================================================================
// Form Component
// =============================================================================

function FormsDemo(): VNode {
  const { exit } = useApp();

  const resetForm = () => {
    setSubmitted(false);
    setActiveField(0);
    setFormData({
      name: '',
      email: '',
      role: '',
      experience: '',
      skills: [],
    });
    nameInput.clear();
    emailInput.clear();
  };

  // Global navigation
  useInput((char, key) => {
    // Tab navigation for text inputs
    if (activeField() < 2) {
      if (key.tab && !key.shift) {
        setActiveField((f) => Math.min(4, f + 1));
        return;
      }
      if (key.tab && key.shift) {
        setActiveField((f) => Math.max(0, f - 1));
        return;
      }
    }

    // Reset form
    if (key.ctrl && char === 'r') {
      resetForm();
      return;
    }

    // Quit
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  // Submission result
  if (submitted()) {
    const data = formData();
    return Box(
      { flexDirection: 'column', padding: 1 },
      Text({ color: 'green', bold: true }, '✅ Form Submitted Successfully!'),
      Text({}),
      Box(
        { borderStyle: 'round', borderColor: 'green', padding: 1, flexDirection: 'column' },
        Text({ color: 'cyan', bold: true }, 'Submitted Data:'),
        Text({}),
        Text({ color: 'white' }, `Name: ${data.name || '(empty)'}`),
        Text({ color: 'white' }, `Email: ${data.email || '(empty)'}`),
        Text({ color: 'white' }, `Role: ${data.role || '(not selected)'}`),
        Text({ color: 'white' }, `Experience: ${data.experience || '(not selected)'}`),
        Text({ color: 'white' }, `Skills: ${data.skills.length > 0 ? data.skills.join(', ') : '(none selected)'}`)
      ),
      Text({}),
      Text({ color: 'gray', dim: true }, 'Ctrl+R: reset form  ESC: quit')
    );
  }

  // Current field content
  const renderActiveField = (): VNode => {
    const field = activeField();

    if (field === 0) {
      return Box(
        { flexDirection: 'column', marginBottom: 1 },
        Text({ color: 'cyan', bold: true }, '1. Name:'),
        renderTextInput(nameInput, { isActive: true }),
        Text({ color: 'gray', dim: true, marginTop: 1 }, 'Enter: next field  Tab: skip  ESC: quit')
      );
    }

    if (field === 1) {
      return Box(
        { flexDirection: 'column', marginBottom: 1 },
        Text({ color: 'cyan', bold: true }, '2. Email:'),
        renderTextInput(emailInput, { isActive: true }),
        Text({ color: 'gray', dim: true, marginTop: 1 }, 'Enter: next field  Tab: skip  Shift+Tab: back  ESC: quit')
      );
    }

    if (field === 2) {
      return Box(
        { flexDirection: 'column', marginBottom: 1 },
        Text({ color: 'cyan', bold: true }, '3. Role:'),
        renderSelect(roleSelect, { items: roleOptions, isActive: true, showCount: false }),
        Text({ color: 'gray', dim: true, marginTop: 1 }, '↑↓: navigate  Enter: select  ESC: back')
      );
    }

    if (field === 3) {
      return Box(
        { flexDirection: 'column', marginBottom: 1 },
        Text({ color: 'cyan', bold: true }, '4. Experience:'),
        renderSelect(experienceSelect, { items: experienceOptions, isActive: true, showCount: false }),
        Text({ color: 'gray', dim: true, marginTop: 1 }, '↑↓: navigate  Enter: select  ESC: back')
      );
    }

    if (field === 4) {
      return Box(
        { flexDirection: 'column', marginBottom: 1 },
        Text({ color: 'cyan', bold: true }, '5. Skills (multi-select):'),
        renderSelect(skillsSelect, { items: skillOptions, multiple: true, isActive: true }),
        Text({ color: 'gray', dim: true, marginTop: 1 }, '↑↓: navigate  Space: toggle  Enter: submit  ESC: back')
      );
    }

    return Text({}, 'Unknown field');
  };

  // Progress
  const renderProgress = (): VNode => {
    const field = activeField();
    const steps = ['Name', 'Email', 'Role', 'Experience', 'Skills'];
    return Box(
      { flexDirection: 'row', marginBottom: 1 },
      ...steps.map((step, i) =>
        Box(
          { flexDirection: 'row' },
          Text(
            {
              color: i < field ? 'green' : i === field ? 'cyan' : 'gray',
              bold: i === field,
            },
            i < field ? '✓ ' : i === field ? '▶ ' : '○ '
          ),
          Text(
            {
              color: i === field ? 'cyan' : 'gray',
              dim: i > field,
            },
            step
          ),
          i < steps.length - 1 ? Text({ color: 'gray' }, ' → ') : Text({}, '')
        )
      )
    );
  };

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '📝 Forms Example'),
    Text({}),
    renderProgress(),
    Text({}),
    renderActiveField()
  );
}

const { waitUntilExit } = render(() => FormsDemo());
await waitUntilExit();
