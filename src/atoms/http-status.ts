/**
 * HttpStatus - Color-mapped HTTP status display
 *
 * @layer Atom
 * @description Displays HTTP status codes with semantic coloring
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { getContrastColor, resolveColor } from '../core/theme.js';
import { getRenderMode } from '../core/capabilities.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';

export type HttpStatusVariant = 'badge' | 'text' | 'dot';

export interface HttpStatusProps {
  /** HTTP status code */
  code: MaybeReactive<number>;
  /** Display HTTP status text */
  showText?: boolean;
  /** Display style */
  variant?: HttpStatusVariant;
}

const HTTP_STATUS_TEXT: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  206: 'Partial Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

function getHttpStatusColorName(code: number): string {
  if (code >= 100 && code < 200) return 'muted';
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'info';
  if (code >= 400 && code < 500) return 'warning';
  if (code >= 500 && code < 600) return 'error';
  return 'muted';
}

function getHttpStatusLabel(code: number, showText: boolean): string {
  const text = HTTP_STATUS_TEXT[code] ?? 'Unknown';
  return showText ? `${code} ${text}` : String(code);
}

/**
 * HttpStatus - semantic HTTP status renderer.
 */
export function HttpStatus(props: HttpStatusProps): VNode {
  const code = resolve(props.code);
  const showText = props.showText ?? false;
  const variant = props.variant ?? 'badge';
  const color = resolveColor(getHttpStatusColorName(code));
  const label = getHttpStatusLabel(code, showText);

  if (variant === 'text') {
    return Text({ color, bold: true }, label);
  }

  if (variant === 'dot') {
    const dot = getRenderMode() === 'ascii' ? '*' : '●';
    return Box(
      {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
      },
      Text({ color }, dot),
      Text({ color, bold: true }, label)
    );
  }

  return Text(
    {
      color: getContrastColor(color),
      backgroundColor: color,
      bold: true,
    },
    ` ${label} `
  );
}

export function httpOk(showText = false): VNode {
  return HttpStatus({ code: 200, showText });
}

export function httpCreated(showText = false): VNode {
  return HttpStatus({ code: 201, showText });
}

export function httpNoContent(showText = false): VNode {
  return HttpStatus({ code: 204, showText });
}

export function httpBadRequest(showText = false): VNode {
  return HttpStatus({ code: 400, showText });
}

export function httpUnauthorized(showText = false): VNode {
  return HttpStatus({ code: 401, showText });
}

export function httpForbidden(showText = false): VNode {
  return HttpStatus({ code: 403, showText });
}

export function httpNotFound(showText = false): VNode {
  return HttpStatus({ code: 404, showText });
}

export function httpError(code = 500, showText = false): VNode {
  return HttpStatus({ code, showText });
}
