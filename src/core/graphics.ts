/**
 * Graphics Protocol Support
 *
 * Features:
 * - Kitty Graphics Protocol (modern, efficient)
 * - iTerm2 Inline Images
 * - Sixel (legacy, wide support)
 * - Braille fallback (universal)
 * - Auto-detection with manual override
 *
 * 
 */

// =============================================================================
// Types
// =============================================================================

export type GraphicsProtocol = 'kitty' | 'iterm2' | 'sixel' | 'halfblock' | 'braille' | 'none';

export interface CellSize {
  /** Cell width in pixels */
  width: number;
  /** Cell height in pixels */
  height: number;
}

export interface ImageOptions {
  /** Width in cells (auto if not specified) */
  width?: number;
  /** Height in cells (auto if not specified) */
  height?: number;
  /** How to fit image in dimensions */
  fit?: 'contain' | 'cover' | 'fill' | 'crop' | 'none';
  /** Preserve aspect ratio */
  preserveAspectRatio?: boolean;
  /** Threshold for braille conversion (0-255) */
  threshold?: number;
  /** Enable dithering for braille */
  dither?: boolean;
  /** Stable kitty image ID for protocol-managed lifecycle */
  imageId?: number;
}

export interface ImageData {
  /** Raw pixel data (RGBA) */
  pixels: Uint8Array;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

export interface ProtocolCapabilities {
  protocol: GraphicsProtocol;
  supportsTransparency: boolean;
  supportsAnimation: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface TerminalImageCapabilities extends ProtocolCapabilities {
  cellSize: CellSize;
  detectedBy: 'manual' | 'query' | 'env' | 'fallback';
  supportsQueries: boolean;
  supportsPlacement: boolean;
  supportsClear: boolean;
}

export interface TerminalGraphicsQueryTransport {
  isAvailable?(): boolean;
  request(query: string, options?: { timeoutMs?: number }): Promise<string>;
}

export interface QueryGraphicsOptions {
  transport?: TerminalGraphicsQueryTransport;
  timeoutMs?: number;
  force?: boolean;
  skipActiveQuery?: boolean;
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
  terminalSize?: {
    columns: number;
    rows: number;
  };
}

export interface TerminalImageSource {
  /** Raw pixel data (RGBA) */
  pixels: Uint8Array;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Cell size used to map pixels to terminal cells */
  cellSize: CellSize;
  /** Natural size of the image in terminal columns */
  desiredColumns: number;
  /** Natural size of the image in terminal rows */
  desiredRows: number;
  /** Simple content hash for protocol cache keys */
  hash: string;
}

export interface ImagePixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TerminalImageRenderPlan {
  fit: NonNullable<ImageOptions['fit']>;
  cellSize: CellSize;
  targetColumns: number;
  targetRows: number;
  renderColumns: number;
  renderRows: number;
  resizedPixelWidth: number;
  resizedPixelHeight: number;
  visiblePixels: ImagePixelRect;
}

export interface TerminalImageProtocolRenderOptions extends ImageOptions {
  protocol: GraphicsProtocol;
}

export interface TerminalImageProtocolRenderResult {
  cacheKey: string;
  payload: string;
  plan: TerminalImageRenderPlan;
  source: TerminalImageSource;
  protocol: GraphicsProtocol;
  cellRender: boolean;
  reused: boolean;
}

export interface TerminalImageProtocolState {
  instanceKey: string;
  kittyImageId: number;
  render(
    sourceOrImageData: TerminalImageSource | ImageData,
    options: TerminalImageProtocolRenderOptions,
  ): TerminalImageProtocolRenderResult;
  getCacheKey(
    sourceOrImageData: TerminalImageSource | ImageData,
    options: TerminalImageProtocolRenderOptions,
  ): string;
  invalidate(sourceOrImageData?: TerminalImageSource | ImageData): void;
  clear(): void;
  stats(): {
    hits: number;
    misses: number;
    size: number;
  };
}

// =============================================================================
// Protocol Detection
// =============================================================================

let detectedProtocol: GraphicsProtocol | null = null;
let manualOverride: GraphicsProtocol | null = null;
let negotiatedCapabilities: TerminalImageCapabilities | null = null;
let activeDetectionPromise: Promise<TerminalImageCapabilities> | null = null;
let nextTerminalImageProtocolStateId = 1;
let nextKittyImageId = 1;

const DEFAULT_CELL_SIZE: CellSize = {
  width: 10,
  height: 20,
};

const KITTY_GRAPHICS_QUERY = '\x1b_Gi=31,s=1,v=1,a=q,t=d,f=24;AAAA\x1b\\';
const PRIMARY_DEVICE_ATTRIBUTES_QUERY = '\x1b[c';
const CELL_SIZE_QUERY = '\x1b[16t';
const WINDOW_PIXEL_SIZE_QUERY = '\x1b[14t';
const TERMINAL_STATUS_QUERY = '\x1b[5n';

function normalizeCellSize(cellSize?: Partial<CellSize> | null): CellSize {
  return {
    width: Math.max(1, Math.round(cellSize?.width ?? DEFAULT_CELL_SIZE.width)),
    height: Math.max(1, Math.round(cellSize?.height ?? DEFAULT_CELL_SIZE.height)),
  };
}

function getTerminalSize(options?: QueryGraphicsOptions): { columns: number; rows: number } {
  return {
    columns: Math.max(1, options?.terminalSize?.columns ?? options?.stdout?.columns ?? process.stdout.columns ?? 80),
    rows: Math.max(1, options?.terminalSize?.rows ?? options?.stdout?.rows ?? process.stdout.rows ?? 24),
  };
}

function supportsRichColorFallback(): boolean {
  const env = process.env;
  const term = env.TERM?.toLowerCase() || '';
  const colorTerm = env.COLORTERM?.toLowerCase() || '';
  const termProgram = env.TERM_PROGRAM?.toLowerCase() || '';

  if (env.FORCE_COLOR === '0') {
    return false;
  }

  if (env.FORCE_COLOR === '2' || env.FORCE_COLOR === '3') {
    return true;
  }

  return (
    colorTerm === 'truecolor' ||
    colorTerm === '24bit' ||
    term.includes('256color') ||
    term.includes('direct') ||
    termProgram === 'iterm.app' ||
    termProgram === 'wezterm' ||
    termProgram === 'hyper' ||
    !!env.WT_SESSION
  );
}

function getFallbackProtocol(): GraphicsProtocol {
  return supportsRichColorFallback() ? 'halfblock' : 'braille';
}

export function resolveRenderableGraphicsProtocol(protocol: GraphicsProtocol): GraphicsProtocol {
  if (protocol === 'none') {
    return getFallbackProtocol();
  }
  return protocol;
}

export function isCellGraphicsProtocol(protocol: GraphicsProtocol): boolean {
  const resolvedProtocol = resolveRenderableGraphicsProtocol(protocol);
  return resolvedProtocol === 'halfblock' || resolvedProtocol === 'braille';
}

function buildProtocolCapabilities(
  protocol: GraphicsProtocol,
  detectedBy: TerminalImageCapabilities['detectedBy'],
  cellSize: CellSize,
): TerminalImageCapabilities {
  switch (protocol) {
    case 'kitty':
      return {
        protocol: 'kitty',
        supportsTransparency: true,
        supportsAnimation: true,
        detectedBy,
        cellSize,
        supportsQueries: true,
        supportsPlacement: true,
        supportsClear: true,
      };
    case 'iterm2':
      return {
        protocol: 'iterm2',
        supportsTransparency: true,
        supportsAnimation: false,
        detectedBy,
        cellSize,
        supportsQueries: false,
        supportsPlacement: false,
        supportsClear: false,
      };
    case 'sixel':
      return {
        protocol: 'sixel',
        supportsTransparency: false,
        supportsAnimation: false,
        detectedBy,
        cellSize,
        supportsQueries: true,
        supportsPlacement: false,
        supportsClear: false,
        maxWidth: 1024,
        maxHeight: 1024,
      };
    case 'halfblock':
      return {
        protocol: 'halfblock',
        supportsTransparency: false,
        supportsAnimation: false,
        detectedBy,
        cellSize,
        supportsQueries: false,
        supportsPlacement: false,
        supportsClear: false,
      };
    case 'braille':
      return {
        protocol: 'braille',
        supportsTransparency: false,
        supportsAnimation: false,
        detectedBy,
        cellSize,
        supportsQueries: false,
        supportsPlacement: false,
        supportsClear: false,
      };
    default:
      return {
        protocol: 'none',
        supportsTransparency: false,
        supportsAnimation: false,
        detectedBy,
        cellSize,
        supportsQueries: false,
        supportsPlacement: false,
        supportsClear: false,
      };
  }
}

function detectProtocolFromEnvironment(): GraphicsProtocol | null {
  const envProtocol = process.env.TUIUIU_GRAPHICS?.toLowerCase();
  if (envProtocol && isValidProtocol(envProtocol)) {
    return envProtocol as GraphicsProtocol;
  }

  const termProgram = process.env.TERM_PROGRAM?.toLowerCase() || '';
  const term = process.env.TERM?.toLowerCase() || '';
  const kittyWindowId = process.env.KITTY_WINDOW_ID;
  const wtSession = process.env.WT_SESSION;
  const iterm2Session = process.env.ITERM_SESSION_ID;

  if (kittyWindowId || termProgram === 'kitty') {
    return 'kitty';
  }

  if (iterm2Session || termProgram === 'iterm.app') {
    return 'iterm2';
  }

  if (termProgram === 'wezterm') {
    return 'kitty';
  }

  if (wtSession) {
    return 'iterm2';
  }

  if (term.includes('sixel')) {
    return 'sixel';
  }

  return null;
}

function getDetectedBy(protocol: GraphicsProtocol): TerminalImageCapabilities['detectedBy'] {
  return detectProtocolFromEnvironment() === protocol ? 'env' : 'fallback';
}

function buildGraphicsCapabilityQuery(): string {
  return [
    KITTY_GRAPHICS_QUERY,
    PRIMARY_DEVICE_ATTRIBUTES_QUERY,
    CELL_SIZE_QUERY,
    WINDOW_PIXEL_SIZE_QUERY,
    TERMINAL_STATUS_QUERY,
  ].join('');
}

function createProcessGraphicsQueryTransport(
  stdin: NodeJS.ReadStream = process.stdin,
  stdout: NodeJS.WriteStream = process.stdout,
): TerminalGraphicsQueryTransport {
  return {
    isAvailable: () => !!(stdin.isTTY && stdout.isTTY && typeof stdout.write === 'function'),
    request(query: string, options: { timeoutMs?: number } = {}): Promise<string> {
      if (!(stdin.isTTY && stdout.isTTY)) {
        return Promise.resolve('');
      }

      const timeoutMs = Math.max(10, options.timeoutMs ?? 180);

      return new Promise((resolve, reject) => {
        const readStream = stdin as NodeJS.ReadStream & {
          isRaw?: boolean;
          isPaused?: () => boolean;
          pause?: () => void;
          resume?: () => void;
          setRawMode?: (value: boolean) => void;
        };
        const wasRaw = !!readStream.isRaw;
        const wasPaused = typeof readStream.isPaused === 'function' ? readStream.isPaused() : false;
        let settled = false;
        let buffer = '';
        let timer: ReturnType<typeof setTimeout> | null = null;

        const cleanup = () => {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }

          readStream.off('data', onData);
          if (readStream.setRawMode) {
            readStream.setRawMode(wasRaw);
          }
          if (wasPaused && readStream.pause) {
            readStream.pause();
          }
        };

        const finish = () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve(buffer);
        };

        const resetTimer = () => {
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(finish, timeoutMs);
        };

        const onData = (chunk: string | Buffer) => {
          buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
          if (buffer.includes('\x1b[0n')) {
            finish();
            return;
          }
          resetTimer();
        };

        try {
          readStream.on('data', onData);
          if (readStream.setRawMode) {
            readStream.setRawMode(true);
          }
          readStream.resume?.();
          stdout.write(query);
          resetTimer();
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },
  };
}

export function parseGraphicsCapabilityResponse(
  response: string,
  terminalSize: { columns: number; rows: number } = getTerminalSize(),
): {
  protocol?: GraphicsProtocol;
  cellSize?: CellSize;
} {
  const kittySupported = /\x1b_Gi=\d+;[^\x1b]*\x1b\\/.test(response);
  const deviceAttributes = [...response.matchAll(/\x1b\[\??([0-9;]+)c/g)];
  const sixelSupported = deviceAttributes.some((match) =>
    match[1]
      .split(';')
      .map(value => parseInt(value, 10))
      .some(value => value === 4)
  );

  let cellSize: CellSize | undefined;
  const directCellSizeMatches = [...response.matchAll(/\x1b\[6;(\d+);(\d+)t/g)];
  const windowPixelMatches = [...response.matchAll(/\x1b\[4;(\d+);(\d+)t/g)];
  const directCellSize =
    directCellSizeMatches.length > 0 ? directCellSizeMatches[directCellSizeMatches.length - 1] : undefined;
  const windowPixels =
    windowPixelMatches.length > 0 ? windowPixelMatches[windowPixelMatches.length - 1] : undefined;

  if (directCellSize) {
    cellSize = normalizeCellSize({
      height: parseInt(directCellSize[1], 10),
      width: parseInt(directCellSize[2], 10),
    });
  } else if (windowPixels) {
    const pixelHeight = parseInt(windowPixels[1], 10);
    const pixelWidth = parseInt(windowPixels[2], 10);
    cellSize = normalizeCellSize({
      width: pixelWidth / Math.max(1, terminalSize.columns),
      height: pixelHeight / Math.max(1, terminalSize.rows),
    });
  }

  return {
    protocol: kittySupported ? 'kitty' : sixelSupported ? 'sixel' : undefined,
    cellSize,
  };
}

export async function queryGraphicsCapabilities(
  options: QueryGraphicsOptions = {},
): Promise<TerminalImageCapabilities> {
  if (manualOverride) {
    return buildProtocolCapabilities(
      manualOverride,
      'manual',
      normalizeCellSize(negotiatedCapabilities?.cellSize),
    );
  }

  if (!options.force && negotiatedCapabilities) {
    return negotiatedCapabilities;
  }

  if (!options.force && activeDetectionPromise) {
    return activeDetectionPromise;
  }

  const runDetection = async (): Promise<TerminalImageCapabilities> => {
    const envProtocol = detectProtocolFromEnvironment();
    const transport = options.transport ?? createProcessGraphicsQueryTransport(options.stdin, options.stdout);
    let response = '';

    if (!options.skipActiveQuery && (transport.isAvailable?.() ?? true)) {
      try {
        response = await transport.request(buildGraphicsCapabilityQuery(), {
          timeoutMs: options.timeoutMs,
        });
      } catch {
        response = '';
      }
    }

    const parsed = parseGraphicsCapabilityResponse(response, getTerminalSize(options));
    const protocol = parsed.protocol ?? envProtocol ?? getFallbackProtocol();
    const detectedBy: TerminalImageCapabilities['detectedBy'] = parsed.protocol
      ? 'query'
      : envProtocol
      ? 'env'
      : 'fallback';

    return buildProtocolCapabilities(
      protocol,
      detectedBy,
      normalizeCellSize(parsed.cellSize),
    );
  };

  activeDetectionPromise = runDetection();

  try {
    negotiatedCapabilities = await activeDetectionPromise;
    detectedProtocol = negotiatedCapabilities.protocol;
    return negotiatedCapabilities;
  } finally {
    activeDetectionPromise = null;
  }
}

export function getGraphicsCapabilities(): TerminalImageCapabilities {
  if (manualOverride) {
    return buildProtocolCapabilities(
      manualOverride,
      'manual',
      normalizeCellSize(negotiatedCapabilities?.cellSize),
    );
  }

  if (negotiatedCapabilities) {
    return negotiatedCapabilities;
  }

  const protocol = detectGraphicsProtocol();
  return buildProtocolCapabilities(protocol, getDetectedBy(protocol), normalizeCellSize());
}

/**
 * Detect the best available graphics protocol
 */
export function detectGraphicsProtocol(): GraphicsProtocol {
  // Manual override takes precedence
  if (manualOverride) {
    return manualOverride;
  }

  if (negotiatedCapabilities) {
    return negotiatedCapabilities.protocol;
  }

  // Use cached detection
  if (detectedProtocol) {
    return detectedProtocol;
  }

  detectedProtocol = detectProtocolFromEnvironment() ?? getFallbackProtocol();
  return detectedProtocol;
}

/**
 * Set graphics protocol manually (overrides auto-detection)
 */
export function setGraphicsProtocol(protocol: GraphicsProtocol | null): void {
  manualOverride = protocol;
}

/**
 * Get current graphics protocol
 */
export function getGraphicsProtocol(): GraphicsProtocol {
  return manualOverride || detectedProtocol || detectGraphicsProtocol();
}

/**
 * Get protocol capabilities
 */
export function getProtocolCapabilities(): ProtocolCapabilities {
  const capabilities = getGraphicsCapabilities();
  return {
    protocol: capabilities.protocol,
    supportsTransparency: capabilities.supportsTransparency,
    supportsAnimation: capabilities.supportsAnimation,
    maxWidth: capabilities.maxWidth,
    maxHeight: capabilities.maxHeight,
  };
}

function isValidProtocol(protocol: string): protocol is GraphicsProtocol {
  return ['kitty', 'iterm2', 'sixel', 'halfblock', 'braille', 'none'].includes(protocol);
}

/**
 * Reset cached detection (for testing)
 */
export function resetGraphicsDetection(): void {
  detectedProtocol = null;
  manualOverride = null;
  negotiatedCapabilities = null;
  activeDetectionPromise = null;
}

// =============================================================================
// Terminal Image Source And Resize Planning
// =============================================================================

function hashImageData(imageData: ImageData): string {
  let hash = 0x811c9dc5;
  hash ^= imageData.width;
  hash = Math.imul(hash, 0x01000193);
  hash ^= imageData.height;
  hash = Math.imul(hash, 0x01000193);

  for (let index = 0; index < imageData.pixels.length; index++) {
    hash ^= imageData.pixels[index]!;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function isTerminalImageSource(value: TerminalImageSource | ImageData): value is TerminalImageSource {
  return 'desiredColumns' in value && 'desiredRows' in value && 'hash' in value;
}

function toTerminalImageSource(sourceOrImageData: TerminalImageSource | ImageData): TerminalImageSource {
  return isTerminalImageSource(sourceOrImageData)
    ? sourceOrImageData
    : createTerminalImageSource(sourceOrImageData);
}

function scaleDimension(source: number, from: number, to: number): number {
  if (source <= 0 || from <= 0 || to <= 0) {
    return 1;
  }
  return Math.max(1, Math.round(source * (to / from)));
}

export function createTerminalImageSource(
  imageData: ImageData,
  options: {
    cellSize?: CellSize;
  } = {},
): TerminalImageSource {
  const cellSize = normalizeCellSize(options.cellSize ?? getGraphicsCapabilities().cellSize);

  return {
    pixels: imageData.pixels,
    width: imageData.width,
    height: imageData.height,
    cellSize,
    desiredColumns: Math.max(1, Math.ceil(imageData.width / cellSize.width)),
    desiredRows: Math.max(1, Math.ceil(imageData.height / cellSize.height)),
    hash: hashImageData(imageData),
  };
}

export function planImageRender(
  sourceOrImageData: TerminalImageSource | ImageData,
  options: ImageOptions & {
    cellSize?: CellSize;
  } = {},
): TerminalImageRenderPlan {
  const source = isTerminalImageSource(sourceOrImageData)
    ? sourceOrImageData
    : createTerminalImageSource(sourceOrImageData, { cellSize: options.cellSize });
  const fit = options.fit ?? 'contain';
  const requestedWidth = options.width ? Math.max(1, Math.round(options.width)) : undefined;
  const requestedHeight = options.height ? Math.max(1, Math.round(options.height)) : undefined;

  let targetColumns = requestedWidth ?? source.desiredColumns;
  let targetRows = requestedHeight ?? source.desiredRows;
  let renderColumns = source.desiredColumns;
  let renderRows = source.desiredRows;
  let resizedPixelWidth = source.width;
  let resizedPixelHeight = source.height;
  let visiblePixels: ImagePixelRect = {
    x: 0,
    y: 0,
    width: source.width,
    height: source.height,
  };

  if (requestedWidth !== undefined && requestedHeight === undefined) {
    renderColumns = requestedWidth;
    renderRows = scaleDimension(source.desiredRows, source.desiredColumns, renderColumns);
    targetColumns = renderColumns;
    targetRows = renderRows;
    resizedPixelWidth = renderColumns * source.cellSize.width;
    resizedPixelHeight = renderRows * source.cellSize.height;
    visiblePixels = { x: 0, y: 0, width: resizedPixelWidth, height: resizedPixelHeight };
  } else if (requestedHeight !== undefined && requestedWidth === undefined) {
    renderRows = requestedHeight;
    renderColumns = scaleDimension(source.desiredColumns, source.desiredRows, renderRows);
    targetColumns = renderColumns;
    targetRows = renderRows;
    resizedPixelWidth = renderColumns * source.cellSize.width;
    resizedPixelHeight = renderRows * source.cellSize.height;
    visiblePixels = { x: 0, y: 0, width: resizedPixelWidth, height: resizedPixelHeight };
  } else if (requestedWidth !== undefined && requestedHeight !== undefined) {
    targetColumns = requestedWidth;
    targetRows = requestedHeight;

    switch (fit) {
      case 'fill':
        renderColumns = targetColumns;
        renderRows = targetRows;
        resizedPixelWidth = renderColumns * source.cellSize.width;
        resizedPixelHeight = renderRows * source.cellSize.height;
        visiblePixels = { x: 0, y: 0, width: resizedPixelWidth, height: resizedPixelHeight };
        break;
      case 'cover': {
        const scale = Math.max(
          targetColumns / Math.max(1, source.desiredColumns),
          targetRows / Math.max(1, source.desiredRows),
        );
        const scaledColumns = Math.max(1, Math.round(source.desiredColumns * scale));
        const scaledRows = Math.max(1, Math.round(source.desiredRows * scale));
        renderColumns = targetColumns;
        renderRows = targetRows;
        resizedPixelWidth = scaledColumns * source.cellSize.width;
        resizedPixelHeight = scaledRows * source.cellSize.height;
        visiblePixels = {
          x: Math.max(0, Math.floor((resizedPixelWidth - (targetColumns * source.cellSize.width)) / 2)),
          y: Math.max(0, Math.floor((resizedPixelHeight - (targetRows * source.cellSize.height)) / 2)),
          width: targetColumns * source.cellSize.width,
          height: targetRows * source.cellSize.height,
        };
        break;
      }
      case 'crop':
        renderColumns = Math.min(source.desiredColumns, targetColumns);
        renderRows = Math.min(source.desiredRows, targetRows);
        resizedPixelWidth = source.width;
        resizedPixelHeight = source.height;
        visiblePixels = {
          x: 0,
          y: 0,
          width: Math.min(source.width, renderColumns * source.cellSize.width),
          height: Math.min(source.height, renderRows * source.cellSize.height),
        };
        break;
      case 'none':
        renderColumns = Math.min(source.desiredColumns, targetColumns);
        renderRows = Math.min(source.desiredRows, targetRows);
        resizedPixelWidth = source.width;
        resizedPixelHeight = source.height;
        visiblePixels = {
          x: 0,
          y: 0,
          width: Math.min(source.width, renderColumns * source.cellSize.width),
          height: Math.min(source.height, renderRows * source.cellSize.height),
        };
        break;
      case 'contain':
      default: {
        const scale = Math.min(
          targetColumns / Math.max(1, source.desiredColumns),
          targetRows / Math.max(1, source.desiredRows),
        );
        renderColumns = Math.max(1, Math.round(source.desiredColumns * scale));
        renderRows = Math.max(1, Math.round(source.desiredRows * scale));
        resizedPixelWidth = renderColumns * source.cellSize.width;
        resizedPixelHeight = renderRows * source.cellSize.height;
        visiblePixels = { x: 0, y: 0, width: resizedPixelWidth, height: resizedPixelHeight };
        break;
      }
    }
  } else {
    resizedPixelWidth = source.desiredColumns * source.cellSize.width;
    resizedPixelHeight = source.desiredRows * source.cellSize.height;
    visiblePixels = { x: 0, y: 0, width: resizedPixelWidth, height: resizedPixelHeight };
  }

  return {
    fit,
    cellSize: source.cellSize,
    targetColumns,
    targetRows,
    renderColumns,
    renderRows,
    resizedPixelWidth,
    resizedPixelHeight,
    visiblePixels,
  };
}

function buildTerminalImageProtocolCacheKey(
  protocol: GraphicsProtocol,
  source: TerminalImageSource,
  plan: TerminalImageRenderPlan,
  options: ImageOptions = {},
): string {
  return [
    protocol,
    source.hash,
    `${source.cellSize.width}x${source.cellSize.height}`,
    plan.fit,
    `${plan.renderColumns}x${plan.renderRows}`,
    `${plan.visiblePixels.x},${plan.visiblePixels.y},${plan.visiblePixels.width},${plan.visiblePixels.height}`,
    options.threshold ?? '',
    options.dither ? 1 : 0,
    options.preserveAspectRatio ? 1 : 0,
    protocol === 'kitty' ? options.imageId ?? '' : '',
  ].join(':');
}

export function createTerminalImageProtocolState(): TerminalImageProtocolState {
  const cache = new Map<string, Omit<TerminalImageProtocolRenderResult, 'reused'>>();
  let hits = 0;
  let misses = 0;
  const instanceKey = `terminal-image:${nextTerminalImageProtocolStateId++}`;
  const kittyImageId = nextKittyImageId++;

  const withProtocolImageOptions = (
    protocol: GraphicsProtocol,
    options: Omit<TerminalImageProtocolRenderOptions, 'protocol'>,
  ): ImageOptions => {
    if (protocol !== 'kitty') {
      return options;
    }

    return {
      ...options,
      imageId: options.imageId ?? kittyImageId,
    };
  };

  const getKey = (
    sourceOrImageData: TerminalImageSource | ImageData,
    options: TerminalImageProtocolRenderOptions,
  ): string => {
    const { protocol, ...renderOptions } = options;
    const source = toTerminalImageSource(sourceOrImageData);
    const resolvedProtocol = resolveRenderableGraphicsProtocol(protocol);
    const protocolOptions = withProtocolImageOptions(resolvedProtocol, renderOptions);
    const plan = planImageRender(source, protocolOptions);
    return buildTerminalImageProtocolCacheKey(resolvedProtocol, source, plan, protocolOptions);
  };

  return {
    instanceKey,
    kittyImageId,
    render(sourceOrImageData, options) {
      const { protocol, ...renderOptions } = options;
      const source = toTerminalImageSource(sourceOrImageData);
      const resolvedProtocol = resolveRenderableGraphicsProtocol(protocol);
      const protocolOptions = withProtocolImageOptions(resolvedProtocol, renderOptions);
      const plan = planImageRender(source, protocolOptions);
      const cacheKey = buildTerminalImageProtocolCacheKey(
        resolvedProtocol,
        source,
        plan,
        protocolOptions,
      );
      const cached = cache.get(cacheKey);

      if (cached) {
        hits++;
        return {
          ...cached,
          reused: true,
        };
      }

      misses++;
      const payload = renderImageWithProtocol(resolvedProtocol, source, protocolOptions);
      const result: Omit<TerminalImageProtocolRenderResult, 'reused'> = {
        cacheKey,
        payload,
        plan,
        source,
        protocol: resolvedProtocol,
        cellRender: isCellGraphicsProtocol(resolvedProtocol),
      };
      cache.set(cacheKey, result);
      return {
        ...result,
        reused: false,
      };
    },
    getCacheKey: getKey,
    invalidate(sourceOrImageData) {
      if (!sourceOrImageData) {
        cache.clear();
        return;
      }

      const source = toTerminalImageSource(sourceOrImageData);
      for (const [key, entry] of cache) {
        if (entry.source.hash === source.hash) {
          cache.delete(key);
        }
      }
    },
    clear() {
      cache.clear();
    },
    stats() {
      return {
        hits,
        misses,
        size: cache.size,
      };
    },
  };
}

// =============================================================================
// Kitty Graphics Protocol
// =============================================================================

/**
 * Kitty Graphics Protocol implementation
 * https://sw.kovidgoyal.net/kitty/graphics-protocol/
 */
export const kittyGraphics = {
  /**
   * Transmit image data to terminal
   */
  transmit(imageData: ImageData | TerminalImageSource, options: ImageOptions = {}): string {
    const source = toTerminalImageSource(imageData);
    const { width, height, pixels } = source;
    const plan = planImageRender(source, options);
    const cols = options.width ?? plan.renderColumns;
    const rows = options.height ?? plan.renderRows;
    const imageId = Number.isInteger(options.imageId) && options.imageId && options.imageId > 0
      ? `,i=${options.imageId}`
      : '';

    // Base64 encode PNG data (simplified - real implementation would encode PNG)
    const base64Data = base64Encode(pixels);

    // Chunk size (4096 bytes is safe)
    const CHUNK_SIZE = 4096;
    const chunks: string[] = [];

    for (let i = 0; i < base64Data.length; i += CHUNK_SIZE) {
      const chunk = base64Data.slice(i, i + CHUNK_SIZE);
      const isLast = i + CHUNK_SIZE >= base64Data.length;
      const more = isLast ? 0 : 1;

      if (i === 0) {
        // First chunk includes format info
        chunks.push(
          `\x1b_Ga=T,f=32,s=${width},v=${height},c=${cols},r=${rows}${imageId},m=${more};${chunk}\x1b\\`
        );
      } else {
        // Continuation chunks
        chunks.push(`\x1b_Gm=${more};${chunk}\x1b\\`);
      }
    }

    return chunks.join('');
  },

  /**
   * Display a previously transmitted image
   */
  display(imageId: number, x: number, y: number): string {
    return `\x1b_Ga=p,i=${imageId},p=1,X=${x},Y=${y}\x1b\\`;
  },

  /**
   * Delete an image from memory
   */
  delete(imageId?: number): string {
    if (imageId !== undefined) {
      return `\x1b_Ga=d,d=i,i=${imageId}\x1b\\`;
    }
    // Delete all images
    return `\x1b_Ga=d,d=A\x1b\\`;
  },

  /**
   * Clear all images from screen
   */
  clear(): string {
    return `\x1b_Ga=d,d=A\x1b\\`;
  },
};

// =============================================================================
// iTerm2 Inline Images
// =============================================================================

/**
 * iTerm2 Inline Images Protocol
 * https://iterm2.com/documentation-images.html
 */
export const iterm2Graphics = {
  /**
   * Display an image
   */
  display(imageData: ImageData | TerminalImageSource, options: ImageOptions = {}): string {
    const { width: imgWidth, height: imgHeight, pixels } = toTerminalImageSource(imageData);

    // Calculate dimensions
    const width = options.width ? `width=${options.width}` : 'width=auto';
    const height = options.height ? `height=${options.height}` : 'height=auto';

    // Base64 encode
    const base64Data = base64Encode(pixels);

    // iTerm2 OSC 1337 sequence
    return `\x1b]1337;File=inline=1;${width};${height}:${base64Data}\x07`;
  },

  /**
   * Display image from file path (if accessible to terminal)
   */
  displayFile(path: string, options: ImageOptions = {}): string {
    const width = options.width ? `width=${options.width}` : 'width=auto';
    const height = options.height ? `height=${options.height}` : 'height=auto';

    // Base64 encode the path
    const encodedPath = Buffer.from(path).toString('base64');

    return `\x1b]1337;File=inline=1;${width};${height}:${encodedPath}\x07`;
  },
};

// =============================================================================
// Sixel Graphics
// =============================================================================

/**
 * Sixel Graphics implementation
 * https://en.wikipedia.org/wiki/Sixel
 */
export const sixelGraphics = {
  /**
   * Encode image as Sixel
   */
  encode(imageData: ImageData | TerminalImageSource, options: ImageOptions = {}): string {
    const { width, height, pixels } = toTerminalImageSource(imageData);

    // Build palette (up to 256 colors)
    const palette = buildPalette(pixels, 256);

    // Start DCS sequence
    let output = '\x1bPq';

    // Define palette
    for (let i = 0; i < palette.length; i++) {
      const [r, g, b] = palette[i];
      // Sixel uses 0-100 range
      const sr = Math.round((r / 255) * 100);
      const sg = Math.round((g / 255) * 100);
      const sb = Math.round((b / 255) * 100);
      output += `#${i};2;${sr};${sg};${sb}`;
    }

    // Encode pixels (6 rows at a time = 1 sixel row)
    for (let y = 0; y < height; y += 6) {
      for (let c = 0; c < palette.length; c++) {
        let hasColor = false;
        let colorData = `#${c}`;

        for (let x = 0; x < width; x++) {
          let sixel = 0;

          for (let row = 0; row < 6; row++) {
            const py = y + row;
            if (py >= height) continue;

            const idx = (py * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];

            const colorIdx = findClosestColor([r, g, b], palette);
            if (colorIdx === c) {
              sixel |= 1 << row;
              hasColor = true;
            }
          }

          colorData += String.fromCharCode(63 + sixel);
        }

        if (hasColor) {
          output += colorData + '$'; // Carriage return
        }
      }
      output += '-'; // New sixel row
    }

    // End DCS sequence
    output += '\x1b\\';

    return output;
  },
};

// =============================================================================
// Half-Block Graphics (Universal Color Fallback)
// =============================================================================

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function readPixel(imageData: ImageData, x: number, y: number): RgbaColor {
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.pixels[index] ?? 0,
    g: imageData.pixels[index + 1] ?? 0,
    b: imageData.pixels[index + 2] ?? 0,
    a: imageData.pixels[index + 3] ?? 0,
  };
}

function styleRgb(fg?: RgbaColor, bg?: RgbaColor): string | undefined {
  const codes: string[] = [];

  if (fg && fg.a > 0) {
    codes.push(`38;2;${fg.r};${fg.g};${fg.b}`);
  }

  if (bg && bg.a > 0) {
    codes.push(`48;2;${bg.r};${bg.g};${bg.b}`);
  }

  return codes.length > 0 ? `\x1b[${codes.join(';')}m` : undefined;
}

/**
 * Half-block graphics implementation.
 * Each cell encodes two vertical samples using foreground/background colors.
 */
export const halfblockGraphics = {
  render(imageData: ImageData | TerminalImageSource, options: ImageOptions = {}): string {
    const source = toTerminalImageSource(imageData);
    const plan = planImageRender(source, options);
    const sampleWidth = Math.max(1, plan.renderColumns);
    const sampleHeight = Math.max(1, plan.renderRows * 2);
    const scaled = scaleImage(imageData, sampleWidth, sampleHeight);
    const lines: string[] = [];

    for (let y = 0; y < sampleHeight; y += 2) {
      let line = '';
      let currentStyle: string | undefined;

      for (let x = 0; x < sampleWidth; x++) {
        const top = readPixel(scaled, x, y);
        const bottom = readPixel(scaled, x, y + 1);
        let char = ' ';
        let style: string | undefined;

        if (top.a > 0 && bottom.a > 0) {
          char = '▀';
          style = styleRgb(top, bottom);
        } else if (top.a > 0) {
          char = '▀';
          style = styleRgb(top);
        } else if (bottom.a > 0) {
          char = '▄';
          style = styleRgb(bottom);
        }

        if (style !== currentStyle) {
          if (currentStyle) {
            line += '\x1b[0m';
          }
          if (style) {
            line += style;
          }
          currentStyle = style;
        }

        line += char;
      }

      if (currentStyle) {
        line += '\x1b[0m';
      }

      lines.push(line);
    }

    return lines.join('\n');
  },
};

// =============================================================================
// Braille Graphics (Universal Fallback)
// =============================================================================

/**
 * Unicode Braille character mapping
 *
 * Braille dots are arranged:
 * 1 4
 * 2 5
 * 3 6
 * 7 8
 *
 * Each character represents 2x4 pixels
 */
const BRAILLE_OFFSET = 0x2800;

/**
 * Braille Graphics implementation
 */
export const brailleGraphics = {
  /**
   * Convert image to braille characters
   */
  render(imageData: ImageData | TerminalImageSource, options: ImageOptions = {}): string {
    const { width, height, pixels } = toTerminalImageSource(imageData);
    const threshold = options.threshold ?? 128;
    const dither = options.dither ?? false;

    // Calculate output dimensions (2x4 pixels per character)
    const outWidth = Math.ceil(width / 2);
    const outHeight = Math.ceil(height / 4);

    // Grayscale conversion buffer
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Apply Floyd-Steinberg dithering if enabled
    if (dither) {
      floydSteinbergDither(gray, width, height);
    }

    // Build output
    const lines: string[] = [];

    for (let cy = 0; cy < outHeight; cy++) {
      let line = '';

      for (let cx = 0; cx < outWidth; cx++) {
        let braille = 0;

        // Map 2x4 pixel block to braille dots
        const dotMap = [
          [0, 0, 0], // dot 1
          [0, 1, 1], // dot 2
          [0, 2, 2], // dot 3
          [1, 0, 3], // dot 4
          [1, 1, 4], // dot 5
          [1, 2, 5], // dot 6
          [0, 3, 6], // dot 7
          [1, 3, 7], // dot 8
        ];

        for (const [dx, dy, bit] of dotMap) {
          const px = cx * 2 + dx;
          const py = cy * 4 + dy;

          if (px < width && py < height) {
            const idx = py * width + px;
            if (gray[idx] < threshold) {
              braille |= 1 << bit;
            }
          }
        }

        line += String.fromCharCode(BRAILLE_OFFSET + braille);
      }

      lines.push(line);
    }

    return lines.join('\n');
  },

  /**
   * Invert braille output (light on dark vs dark on light)
   */
  invert(brailleText: string): string {
    let result = '';
    for (const char of brailleText) {
      if (char === '\n') {
        result += char;
        continue;
      }

      const code = char.charCodeAt(0);
      if (code >= BRAILLE_OFFSET && code < BRAILLE_OFFSET + 256) {
        // Invert all 8 bits
        const inverted = BRAILLE_OFFSET + (255 - (code - BRAILLE_OFFSET));
        result += String.fromCharCode(inverted);
      } else {
        result += char;
      }
    }
    return result;
  },
};

// =============================================================================
// Unified Image Rendering
// =============================================================================

/**
 * Render an image using the best available protocol
 */
export function renderImageWithProtocol(
  protocol: GraphicsProtocol,
  imageData: ImageData | TerminalImageSource,
  options: ImageOptions = {},
): string {
  switch (resolveRenderableGraphicsProtocol(protocol)) {
    case 'kitty':
      return kittyGraphics.transmit(imageData, options);
    case 'iterm2':
      return iterm2Graphics.display(imageData, options);
    case 'sixel':
      return sixelGraphics.encode(imageData, options);
    case 'halfblock':
      return halfblockGraphics.render(imageData, options);
    case 'braille':
      return brailleGraphics.render(imageData, options);
    default:
      return halfblockGraphics.render(imageData, options);
  }
}

/**
 * Render an image using the best available protocol
 */
export function renderImage(imageData: ImageData, options: ImageOptions = {}): string {
  return renderImageWithProtocol(getGraphicsProtocol(), imageData, options);
}

/**
 * Clear images for a specific protocol
 */
export function clearImagesForProtocol(protocol: GraphicsProtocol): string {
  switch (resolveRenderableGraphicsProtocol(protocol)) {
    case 'kitty':
      return kittyGraphics.clear();
    case 'iterm2':
      return ''; // iTerm2 doesn't have a clear command
    case 'sixel':
      return ''; // Sixel images are just text
    case 'halfblock':
    case 'braille':
      return ''; // Braille is just text
    default:
      return '';
  }
}

/**
 * Clear all displayed images
 */
export function clearImages(): string {
  return clearImagesForProtocol(getGraphicsProtocol());
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Base64 encode bytes
 */
function base64Encode(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Build a color palette from image data
 */
function buildPalette(pixels: Uint8Array, maxColors: number): [number, number, number][] {
  // Simple median cut algorithm
  const colors: Map<string, number> = new Map();

  for (let i = 0; i < pixels.length; i += 4) {
    const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
    colors.set(key, (colors.get(key) || 0) + 1);
  }

  // Sort by frequency and take top colors
  const sorted = Array.from(colors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors);

  return sorted.map(([key]) => {
    const [r, g, b] = key.split(',').map(Number);
    return [r, g, b] as [number, number, number];
  });
}

/**
 * Find closest color in palette
 */
function findClosestColor(
  color: [number, number, number],
  palette: [number, number, number][]
): number {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const dr = color[0] - pr;
    const dg = color[1] - pg;
    const db = color[2] - pb;
    const dist = dr * dr + dg * dg + db * db;

    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

/**
 * Floyd-Steinberg dithering
 */
function floydSteinbergDither(gray: Float32Array, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldValue = gray[idx];
      const newValue = oldValue < 128 ? 0 : 255;
      gray[idx] = newValue;

      const error = oldValue - newValue;

      // Distribute error to neighbors
      if (x + 1 < width) {
        gray[idx + 1] += (error * 7) / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          gray[idx + width - 1] += (error * 3) / 16;
        }
        gray[idx + width] += (error * 5) / 16;
        if (x + 1 < width) {
          gray[idx + width + 1] += (error * 1) / 16;
        }
      }
    }
  }
}

// =============================================================================
// Image Loading Utilities
// =============================================================================

/**
 * Create image data from RGBA pixel array
 */
export function createImageData(
  pixels: Uint8Array | number[],
  width: number,
  height: number
): ImageData {
  return {
    pixels: pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels),
    width,
    height,
  };
}

/**
 * Create a solid color image
 */
export function createSolidImage(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a = 255
): ImageData {
  const pixels = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = a;
  }

  return { pixels, width, height };
}

/**
 * Create a gradient image (for testing)
 */
export function createGradientImage(width: number, height: number): ImageData {
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[i] = Math.floor((x / width) * 255); // R
      pixels[i + 1] = Math.floor((y / height) * 255); // G
      pixels[i + 2] = 128; // B
      pixels[i + 3] = 255; // A
    }
  }

  return { pixels, width, height };
}

/**
 * Scale image data (nearest neighbor)
 */
export function scaleImage(
  imageData: ImageData,
  newWidth: number,
  newHeight: number
): ImageData {
  const { width, height, pixels } = imageData;
  const scaled = new Uint8Array(newWidth * newHeight * 4);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor((x / newWidth) * width);
      const srcY = Math.floor((y / newHeight) * height);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;

      scaled[dstIdx] = pixels[srcIdx];
      scaled[dstIdx + 1] = pixels[srcIdx + 1];
      scaled[dstIdx + 2] = pixels[srcIdx + 2];
      scaled[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  return { pixels: scaled, width: newWidth, height: newHeight };
}
