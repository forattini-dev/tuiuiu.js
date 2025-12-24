/**
 * Theme System Types
 *
 * Clean, unified theme structure for Tuiuiu.
 * Provides semantic color scales, background/foreground hierarchy, and component tokens.
 */

// =============================================================================
// Color Scale
// =============================================================================

/**
 * Color scale with shades from 50 (lightest) to 900 (darkest).
 * Shade 500 is the "base" shade, typically used as the default.
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/** Color shade values */
export type ShadeValue = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Get shade from scale, defaulting to 500.
 */
export function getShade(scale: ColorScale, shade: ShadeValue = 500): string {
  return scale[shade];
}

// =============================================================================
// Theme Palette
// =============================================================================

/**
 * Semantic color palette with scales.
 * Each semantic color has a full scale (50-900) for flexibility.
 */
export interface ThemePalette {
  /** Primary brand color scale */
  primary: ColorScale;
  /** Secondary/neutral accent scale */
  secondary: ColorScale;
  /** Success/positive state scale */
  success: ColorScale;
  /** Warning/caution state scale */
  warning: ColorScale;
  /** Danger/error/destructive state scale */
  danger: ColorScale;
  /** Neutral gray scale for UI elements */
  neutral: ColorScale;
}

/** Palette color names */
export type PaletteColorName = keyof ThemePalette;

// =============================================================================
// Background Hierarchy
// =============================================================================

/**
 * Background color levels for UI hierarchy.
 * From lowest (deepest) to overlay (topmost layer).
 */
export interface ThemeBackground {
  /** Deepest background, behind everything (app shell) */
  lowest: string;
  /** Main application background */
  base: string;
  /** Slightly elevated background (sidebars) */
  subtle: string;
  /** Card/panel surface background */
  surface: string;
  /** Elevated surface (nested cards) */
  raised: string;
  /** Floating element background (non-interactive) */
  elevated: string;
  /** Popover/dropdown/menu background (interactive floating) */
  popover: string;
  /** Modal overlay background (semi-transparent) */
  overlay: string;
}

/** Background level names */
export type BackgroundLevel = keyof ThemeBackground;

// =============================================================================
// Foreground Hierarchy
// =============================================================================

/**
 * Inverse foreground colors for use on colored backgrounds.
 */
export interface ForegroundInverse {
  /** Full opacity inverse color */
  base: string;
  /** Soft/reduced opacity */
  soft: string;
  /** Subtle/low opacity */
  subtle: string;
}

/**
 * Foreground (text) color levels for hierarchy.
 */
export interface ThemeForeground {
  /** Primary text color - highest contrast */
  primary: string;
  /** Secondary text color - supporting content */
  secondary: string;
  /** Muted text color - de-emphasized content */
  muted: string;
  /** Disabled text color - inactive elements */
  disabled: string;
  /** Inverse colors - for use on primary/accent backgrounds */
  inverse: ForegroundInverse;
}

/** Foreground level names */
export type ForegroundLevel = keyof Omit<ThemeForeground, 'inverse'>;

// =============================================================================
// Accent Colors
// =============================================================================

/**
 * Accent colors for status and semantic meaning.
 */
export interface ThemeAccent {
  /** Positive/success accent (green) */
  positive: string;
  /** Warning/caution accent (amber/yellow) */
  warning: string;
  /** Critical/error/danger accent (red) */
  critical: string;
  /** Informational accent (blue/cyan) */
  info: string;
  /** Highlight/selection accent */
  highlight: string;
}

/** Accent color names */
export type AccentColorName = keyof ThemeAccent;

// =============================================================================
// Interactive States
// =============================================================================

/**
 * State token with optional background and foreground.
 */
export interface StateToken {
  bg?: string | null;
  fg?: string | null;
}

/**
 * Focus state with ring configuration.
 */
export interface FocusState {
  border: string;
  ring: {
    color: string;
    width: number;
  };
}

/**
 * Disabled state configuration.
 */
export interface DisabledState {
  opacity: number;
  bg: string;
  fg: string;
}

/**
 * Selected state configuration.
 */
export interface SelectedState {
  bg: string;
  fg: string;
}

/**
 * Interactive state colors for hover, active, focus, disabled, selected.
 */
export interface ThemeStates {
  hover: StateToken;
  active: StateToken;
  focus: FocusState;
  disabled: DisabledState;
  selected: SelectedState;
}

/** State names */
export type StateName = keyof ThemeStates;

// =============================================================================
// Borders
// =============================================================================

/**
 * Border color variants.
 */
export interface ThemeBorders {
  /** Standard border color */
  default: string;
  /** Subtle/light border */
  subtle: string;
  /** Strong/emphasized border */
  strong: string;
  /** Accent/primary color border */
  accent: string;
  /** Danger/error border */
  danger: string;
}

/** Border type names */
export type BorderType = keyof ThemeBorders;

// =============================================================================
// Opacity
// =============================================================================

/**
 * Opacity values for various states.
 */
export interface ThemeOpacity {
  /** Disabled element opacity */
  disabled: number;
  /** Muted/de-emphasized opacity */
  muted: number;
  /** Modal overlay opacity */
  overlay: number;
  /** Ghost button/subtle element opacity */
  ghost: number;
}

// =============================================================================
// Component Tokens
// =============================================================================

/**
 * Button variant tokens.
 */
export interface ButtonVariantTokens {
  bg: string;
  fg: string;
  hoverBg?: string;
  activeBg?: string;
  border?: string;
}

/**
 * Button component tokens with variants.
 */
export interface ButtonTokens {
  primary: ButtonVariantTokens;
  secondary: ButtonVariantTokens;
  outline: ButtonVariantTokens;
  ghost: ButtonVariantTokens;
}

/**
 * Panel component tokens.
 */
export interface PanelTokens {
  bg: string;
  headerBg: string;
  footerBg: string;
  border: string;
}

/**
 * Menu item tokens.
 */
export interface MenuItemTokens {
  fg: string;
  hoverBg: string;
  activeBg: string;
  selectedBg: string;
  disabledFg: string;
}

/**
 * Menu component tokens.
 */
export interface MenuTokens {
  bg: string;
  border: string;
  item: MenuItemTokens;
}

/**
 * Tab tokens.
 */
export interface TabTokens {
  fg: string;
  activeFg: string;
  activeBg: string;
  hoverFg: string;
  indicator: string;
}

/**
 * Tabs component tokens.
 */
export interface TabsTokens {
  bg: string;
  border: string;
  tab: TabTokens;
}

/**
 * Dropdown item tokens.
 */
export interface DropdownItemTokens {
  fg: string;
  hoverBg: string;
  selectedBg: string;
}

/**
 * Dropdown component tokens.
 */
export interface DropdownTokens {
  bg: string;
  border: string;
  item: DropdownItemTokens;
}

/**
 * Input component tokens.
 */
export interface InputTokens {
  bg: string;
  fg: string;
  placeholder: string;
  border: string;
  focusBorder: string;
  invalidBorder: string;
}

/**
 * Checkbox component tokens.
 */
export interface CheckboxTokens {
  bg: string;
  border: string;
  checkColor: string;
  checkedBg: string;
}

/**
 * Radio component tokens.
 */
export interface RadioTokens {
  bg: string;
  dotColor: string;
  border: string;
  checkedBorder: string;
}

/**
 * Tooltip component tokens.
 */
export interface TooltipTokens {
  bg: string;
  fg: string;
}

/**
 * Modal component tokens.
 */
export interface ModalTokens {
  bg: string;
  border: string;
  overlay: string;
}

/**
 * Badge variant tokens.
 */
export interface BadgeVariantTokens {
  bg: string;
  fg: string;
}

/**
 * Badge component tokens.
 */
export interface BadgeTokens {
  default: BadgeVariantTokens;
  success: BadgeVariantTokens;
  warning: BadgeVariantTokens;
  danger: BadgeVariantTokens;
}

/**
 * List item tokens.
 */
export interface ListItemTokens {
  bg: string;
  hoverBg: string;
  selectedBg: string;
  fg: string;
}

/**
 * List component tokens.
 */
export interface ListTokens {
  item: ListItemTokens;
}

// =============================================================================
// Semantic Variant (Shared Type)
// =============================================================================

/**
 * Semantic variant type shared across components.
 */
export type SemanticVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';

// =============================================================================
// Header Component Tokens
// =============================================================================

/**
 * Header variant tokens.
 */
export interface HeaderVariantTokens {
  bg: string;
  fg: string;
  titleFg: string;
  subtitleFg: string;
  border: string;
}

/**
 * Header component tokens with semantic variants.
 */
export interface HeaderTokens {
  default: HeaderVariantTokens;
  primary: HeaderVariantTokens;
  secondary: HeaderVariantTokens;
  success: HeaderVariantTokens;
  warning: HeaderVariantTokens;
  danger: HeaderVariantTokens;
}

// =============================================================================
// StatusBar Component Tokens
// =============================================================================

/**
 * StatusBar variant tokens.
 */
export interface StatusBarVariantTokens {
  bg: string;
  fg: string;
}

/**
 * StatusBar component tokens with semantic variants.
 */
export interface StatusBarTokens {
  default: StatusBarVariantTokens;
  primary: StatusBarVariantTokens;
  info: StatusBarVariantTokens;
  success: StatusBarVariantTokens;
  warning: StatusBarVariantTokens;
  danger: StatusBarVariantTokens;
}

// =============================================================================
// Page Component Tokens
// =============================================================================

/**
 * Page variant tokens.
 */
export interface PageVariantTokens {
  bg: string;
  titleFg: string;
  subtitleFg: string;
  border: string;
}

/**
 * Page component tokens with semantic variants.
 */
export interface PageTokens {
  default: PageVariantTokens;
  primary: PageVariantTokens;
  secondary: PageVariantTokens;
}

// =============================================================================
// AppShell Component Tokens
// =============================================================================

/**
 * AppShell component tokens.
 */
export interface AppShellTokens {
  bg: string;
  dividerFg: string;
  sidebarBg: string;
  asideBg: string;
}

// =============================================================================
// Collapsible Component Tokens
// =============================================================================

/**
 * Collapsible variant tokens.
 */
export interface CollapsibleVariantTokens {
  headerBg: string;
  headerFg: string;
  contentBg: string;
  border: string;
  iconFg: string;
}

/**
 * Collapsible component tokens with semantic variants.
 */
export interface CollapsibleTokens {
  default: CollapsibleVariantTokens;
  primary: CollapsibleVariantTokens;
  secondary: CollapsibleVariantTokens;
}

// =============================================================================
// CommandPalette Component Tokens
// =============================================================================

/**
 * CommandPalette component tokens.
 */
export interface CommandPaletteTokens {
  bg: string;
  border: string;
  inputBg: string;
  inputFg: string;
  inputPlaceholder: string;
  itemFg: string;
  itemHoverBg: string;
  itemSelectedBg: string;
  itemSelectedFg: string;
  highlightFg: string;
  categoryFg: string;
}

// =============================================================================
// SplitPanel Component Tokens
// =============================================================================

/**
 * SplitPanel component tokens.
 */
export interface SplitPanelTokens {
  bg: string;
  dividerBg: string;
  dividerHoverBg: string;
  dividerActiveBg: string;
  border: string;
  titleFg: string;
}

// =============================================================================
// Toast Component Tokens
// =============================================================================

/**
 * Toast variant tokens.
 */
export interface ToastVariantTokens {
  bg: string;
  fg: string;
  border: string;
  iconFg: string;
}

/**
 * Toast component tokens with semantic variants.
 */
export interface ToastTokens {
  success: ToastVariantTokens;
  error: ToastVariantTokens;
  warning: ToastVariantTokens;
  info: ToastVariantTokens;
}

// =============================================================================
// Window Component Tokens
// =============================================================================

/**
 * Window variant tokens.
 */
export interface WindowVariantTokens {
  bg: string;
  fg: string;
  titleBarBg: string;
  titleBarFg: string;
  border: string;
  buttonFg: string;
  closeFg: string;
}

/**
 * Window component tokens with semantic variants.
 */
export interface WindowTokens {
  default: WindowVariantTokens;
  primary: WindowVariantTokens;
  success: WindowVariantTokens;
  warning: WindowVariantTokens;
  danger: WindowVariantTokens;
}

/**
 * All component tokens.
 */
export interface ComponentTokens {
  button: ButtonTokens;
  panel: PanelTokens;
  menu: MenuTokens;
  tabs: TabsTokens;
  dropdown: DropdownTokens;
  input: InputTokens;
  checkbox: CheckboxTokens;
  radio: RadioTokens;
  tooltip: TooltipTokens;
  modal: ModalTokens;
  badge: BadgeTokens;
  list: ListTokens;
  header: HeaderTokens;
  statusbar: StatusBarTokens;
  page: PageTokens;
  appshell: AppShellTokens;
  collapsible: CollapsibleTokens;
  commandPalette: CommandPaletteTokens;
  splitPanel: SplitPanelTokens;
  toast: ToastTokens;
  window: WindowTokens;
}

/** Component names */
export type ComponentName = keyof ComponentTokens;

// =============================================================================
// Theme Metadata
// =============================================================================

/**
 * Theme metadata.
 */
export interface ThemeMeta {
  version: string;
  author: string;
  description: string;
}

/**
 * Theme mode (dark or light).
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Border radius style.
 */
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg';

// =============================================================================
// Theme Interface
// =============================================================================

/**
 * Complete theme definition.
 *
 * This is the single, unified theme format for Tuiuiu.
 * All themes implement this interface directly.
 */
export interface Theme {
  /** Theme name identifier */
  name: string;
  /** Theme mode (dark/light) */
  mode: ThemeMode;
  /** Theme metadata */
  meta: ThemeMeta;
  /** Semantic color palette with scales (50-900) */
  palette: ThemePalette;
  /** Background hierarchy levels */
  background: ThemeBackground;
  /** Foreground/text hierarchy levels */
  foreground: ThemeForeground;
  /** Accent/status colors */
  accents: ThemeAccent;
  /** Interactive state colors */
  states: ThemeStates;
  /** Border color variants */
  borders: ThemeBorders;
  /** Opacity values */
  opacity: ThemeOpacity;
  /** Component-specific tokens */
  components: ComponentTokens;
  /** Border radius style (optional, defaults to 'md') */
  borderRadius?: BorderRadius;
}

