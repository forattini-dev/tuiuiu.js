import { createTextInput, renderTextInput } from '../atoms/text-input.js';
import { createSelect, renderSelect, type SelectItem } from '../molecules/select.js';
import { Box, Text } from '../primitives/nodes.js';
import { createSignal } from '../primitives/signal.js';
import type { VNode } from '../utils/types.js';
import type { OverlayHost, OverlaySession } from '../interaction/overlay.js';
import {
  PromptCancelledError,
  type PromptControls,
  type PromptCheckboxRequest,
  type PromptConfirmRequest,
  type PromptRenderer,
  type PromptRequest,
  type PromptSelectRequest,
  type PromptValidationResult,
} from '../interaction/prompt.js';
import type { Disposable, InteractionRuntime } from '../interaction/runtime.js';

function validationMessage(result: boolean | string): string | null {
  if (result === true) return null;
  return typeof result === 'string' ? result : 'Invalid value';
}

async function validate<T>(
  value: T,
  validator: ((value: T) => PromptValidationResult) | undefined,
): Promise<string | null> {
  return validator ? validationMessage(await validator(value)) : null;
}

export function createVNodePromptRenderer(
  overlays: OverlayHost<VNode | null>,
  runtime: InteractionRuntime,
): PromptRenderer {
  let nextId = 1;

  return {
    present<TResult>(request: PromptRequest<any>, controls: PromptControls<TResult>): () => void {
      const id = `prompt-${nextId++}`;
      const [error, setError] = createSignal<string | null>(null);
      const [pending, setPending] = createSignal(false);
      let session: OverlaySession<VNode | null, unknown>;
      let inputHandler: Disposable | null = null;
      let submitting = false;

      const settle = async <T>(
        value: T,
        validator?: (value: T) => PromptValidationResult,
      ) => {
        if (submitting || controls.signal.aborted) return;
        submitting = true;
        setPending(true);
        setError(null);
        try {
          const message = await validate(value, validator);
          if (controls.signal.aborted) return;
          if (message) {
            setError(message);
            return;
          }
          controls.resolve(value as unknown as TResult);
        } catch (validationError) {
          if (!controls.signal.aborted) {
            setError(validationError instanceof Error ? validationError.message : String(validationError));
          }
        } finally {
          submitting = false;
          setPending(false);
        }
      };

      const frame = (body: VNode) => Box(
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: 'cyan',
          paddingX: 1,
          paddingY: 1,
          minWidth: 32,
          maxWidth: 72,
          backgroundColor: 'black',
        },
        Text({ bold: true }, request.message),
        Box({ marginTop: 1 }, body),
        error() ? Text({ color: 'yellow' }, `! ${error()}`) : null,
        pending() ? Text({ color: 'cyan', dim: true }, 'Validating…') : null,
      );

      let content: () => VNode;
      let handleEvent: (event: Parameters<InteractionRuntime['dispatch']>[0]) => boolean | void;

      if (request.kind === 'input' || request.kind === 'password' || request.kind === 'number') {
        const text = createTextInput({
          initialValue: request.default?.toString() ?? '',
          placeholder: request.kind === 'number' ? undefined : request.placeholder,
          password: request.kind === 'password',
          maskChar: request.kind === 'password' ? request.mask : undefined,
          borderStyle: 'round',
          fullWidth: true,
          isActive: () => !pending(),
          onCancel: () => controls.reject(new PromptCancelledError()),
          onSubmit: (rawValue) => {
            if (request.kind === 'number') {
              const value = Number(rawValue);
              if (!Number.isFinite(value)) {
                setError('Please enter a valid number');
                return;
              }
              if (request.integer && !Number.isInteger(value)) {
                setError('Please enter an integer');
                return;
              }
              if (request.min !== undefined && value < request.min) {
                setError(`Value must be at least ${request.min}`);
                return;
              }
              if (request.max !== undefined && value > request.max) {
                setError(`Value must be at most ${request.max}`);
                return;
              }
              void settle(value, request.validate);
              return;
            }
            const value = request.transform ? request.transform(rawValue) : rawValue;
            void settle(value, request.validate);
          },
        });
        content = () => frame(renderTextInput(text, {
          password: request.kind === 'password',
          maskChar: request.kind === 'password' ? request.mask : undefined,
          placeholder: request.kind === 'number' ? 'Enter a number' : request.placeholder,
          borderStyle: 'round',
          fullWidth: true,
          isActive: () => !pending(),
        }));
        handleEvent = (event) => {
          if (event.type !== 'key') return false;
          text.handleInput(event.key.text, event.key.native);
          return true;
        };
      } else {
        const choiceRequest = request as
          | PromptConfirmRequest
          | PromptSelectRequest<any>
          | PromptCheckboxRequest<any>;
        const choices: readonly string[] = choiceRequest.kind === 'confirm'
          ? ['Yes', 'No']
          : choiceRequest.choices;
        const initialValue = choiceRequest.kind === 'confirm'
          ? ((choiceRequest.default ?? false) ? 'Yes' : 'No')
          : choiceRequest.default;
        const items: SelectItem<string>[] = choices.map((choice) => ({ value: choice, label: choice }));
        const select = createSelect<string>({
          items,
          multiple: choiceRequest.kind === 'checkbox',
          initialValue: choiceRequest.kind === 'checkbox' ? [...(choiceRequest.default ?? [])] : initialValue,
          maxVisible: choiceRequest.kind === 'autocomplete' ? choiceRequest.maxSuggestions ?? 8 : 10,
          searchable: choiceRequest.kind === 'autocomplete',
          isActive: () => !pending(),
          onCancel: () => controls.reject(new PromptCancelledError()),
          onSubmit: (rawValue) => {
            if (choiceRequest.kind === 'confirm') {
              controls.resolve((rawValue === 'Yes') as TResult);
            } else if (choiceRequest.kind === 'checkbox') {
              const values = rawValue as string[];
              if (choiceRequest.min !== undefined && values.length < choiceRequest.min) {
                setError(`Select at least ${choiceRequest.min}`);
                return;
              }
              if (choiceRequest.max !== undefined && values.length > choiceRequest.max) {
                setError(`Select at most ${choiceRequest.max}`);
                return;
              }
              void settle(values, choiceRequest.validate);
            } else {
              controls.resolve(rawValue as TResult);
            }
          },
        });
        content = () => frame(renderSelect(select, {
          items,
          multiple: choiceRequest.kind === 'checkbox',
          searchable: choiceRequest.kind === 'autocomplete',
          maxVisible: choiceRequest.kind === 'autocomplete' ? choiceRequest.maxSuggestions ?? 8 : 10,
          isActive: () => !pending(),
          borderStyle: 'none',
          showCount: true,
        }));
        handleEvent = (event) => event.type === 'key' && select.handleInput(event.key.text, event.key.native) !== false;
      }

      session = overlays.open({
        id,
        content,
        blocking: true,
        captureFocus: true,
        backdrop: true,
        closeOnEscape: true,
        closeOnBackdrop: false,
        onClose: (outcome) => {
          if (controls.signal.aborted || outcome.reason === 'programmatic') return;
          controls.reject(new PromptCancelledError());
        },
      });
      inputHandler = runtime.registerHandler(handleEvent, {
        mode: 'overlay',
        target: id,
        priority: 90,
      });

      return () => {
        inputHandler?.dispose();
        inputHandler = null;
        void session.close(undefined, 'programmatic');
      };
    },
  };
}
