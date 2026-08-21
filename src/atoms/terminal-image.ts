import { useFactoryState } from '../hooks/factory-state.js';
import { Box } from '../primitives/nodes.js';
import { createSignal } from '../primitives/signal.js';
import type {
  GraphicsProtocol,
  ImageData,
  ImageOptions,
  TerminalImageProtocolState,
  TerminalImageSource,
} from '../core/graphics.js';
import { createTerminalImageProtocolState } from '../core/graphics.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';
import type { BoxProps, VNode } from '../utils/types.js';
import { component, type ComponentKeyProps } from '../app/component.js';

type TerminalImageInput = ImageData | TerminalImageSource;
type TerminalImageFit = NonNullable<ImageOptions['fit']>;

export interface TerminalImageOptions {
  source: TerminalImageInput;
  fit?: TerminalImageFit;
  protocol?: GraphicsProtocol;
  imageWidth?: number;
  imageHeight?: number;
}

export interface TerminalImageState {
  source: () => TerminalImageInput;
  fit: () => TerminalImageFit | undefined;
  protocol: () => GraphicsProtocol | undefined;
  imageWidth: () => number | undefined;
  imageHeight: () => number | undefined;
  protocolState: TerminalImageProtocolState;
  setSource: (nextSource: TerminalImageInput) => void;
  setFit: (nextFit: TerminalImageFit | undefined) => void;
  setProtocol: (nextProtocol: GraphicsProtocol | undefined) => void;
  setImageSize: (size: { width?: number; height?: number }) => void;
  invalidateRenderCache: () => void;
  updateOptions: (nextOptions: TerminalImageOptions) => void;
}

export interface TerminalImageProps extends Omit<BoxProps, 'children' | 'key'>, ComponentKeyProps {
  source?: MaybeReactive<TerminalImageInput>;
  fit?: MaybeReactive<TerminalImageFit | undefined>;
  protocol?: MaybeReactive<GraphicsProtocol | undefined>;
  imageWidth?: MaybeReactive<number | undefined>;
  imageHeight?: MaybeReactive<number | undefined>;
  state?: TerminalImageState;
}

function resolveTerminalImageOptions(
  props: TerminalImageProps,
  state?: TerminalImageState,
): TerminalImageOptions {
  const source = props.source !== undefined ? resolve(props.source) : state?.source();

  if (!source) {
    throw new Error('TerminalImage requires a source when no state is provided.');
  }

  return {
    source,
    fit: props.fit !== undefined ? resolve(props.fit) : state?.fit(),
    protocol: props.protocol !== undefined ? resolve(props.protocol) : state?.protocol(),
    imageWidth: props.imageWidth !== undefined ? resolve(props.imageWidth) : state?.imageWidth(),
    imageHeight: props.imageHeight !== undefined ? resolve(props.imageHeight) : state?.imageHeight(),
  };
}

function syncValue<T>(read: () => T, write: (next: T) => void, next: T): void {
  if (read() !== next) {
    write(next);
  }
}

export function createTerminalImage(options: TerminalImageOptions): TerminalImageState {
  const [source, setSource] = createSignal<TerminalImageInput>(options.source);
  const [fit, setFit] = createSignal<TerminalImageFit | undefined>(options.fit);
  const [protocol, setProtocol] = createSignal<GraphicsProtocol | undefined>(options.protocol);
  const [imageWidth, setImageWidth] = createSignal<number | undefined>(options.imageWidth);
  const [imageHeight, setImageHeight] = createSignal<number | undefined>(options.imageHeight);
  const protocolState = createTerminalImageProtocolState();

  const setImageSize = (size: { width?: number; height?: number }) => {
    setImageWidth(size.width);
    setImageHeight(size.height);
  };

  return {
    source,
    fit,
    protocol,
    imageWidth,
    imageHeight,
    protocolState,
    setSource,
    setFit,
    setProtocol,
    setImageSize,
    invalidateRenderCache: () => {
      protocolState.invalidate();
    },
    updateOptions: (nextOptions) => {
      syncValue(source, setSource, nextOptions.source);
      syncValue(fit, setFit, nextOptions.fit);
      syncValue(protocol, setProtocol, nextOptions.protocol);
      syncValue(imageWidth, setImageWidth, nextOptions.imageWidth);
      syncValue(imageHeight, setImageHeight, nextOptions.imageHeight);
    },
  };
}

export const TerminalImage = component<TerminalImageProps, VNode>('TerminalImage', (props) => {
  const {
    state: externalState,
    source: _source,
    fit: _fit,
    protocol: _protocol,
    imageWidth: _imageWidth,
    imageHeight: _imageHeight,
    ...boxProps
  } = props;
  const state = useFactoryState(
    externalState,
    resolveTerminalImageOptions(props, externalState),
    createTerminalImage,
  );

  const nodeProps = {
    ...boxProps,
    __terminalImage: {
      source: state.source(),
      protocolState: state.protocolState,
      options: {
        fit: state.fit(),
        protocol: state.protocol(),
        width: state.imageWidth(),
        height: state.imageHeight(),
      },
    },
  } as BoxProps & {
    __terminalImage: {
      source: TerminalImageInput;
      protocolState: TerminalImageProtocolState;
      options: {
        fit?: TerminalImageFit;
        protocol?: GraphicsProtocol;
        width?: number;
        height?: number;
      };
    };
  };

  return Box(nodeProps);
});
