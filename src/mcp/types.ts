/**
 * MCP (Model Context Protocol) Types
 *
 * JSON-RPC 2.0 based protocol for AI tool integration
 */

// =============================================================================
// JSON-RPC 2.0
// =============================================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: JsonRpcError;
}

// =============================================================================
// MCP Protocol
// =============================================================================

export interface MCPServerInfo {
  name: string;
  version: string;
}

export interface MCPCapabilities {
  tools?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  serverInfo: MCPServerInfo;
  capabilities: MCPCapabilities;
}

// =============================================================================
// MCP Tools
// =============================================================================

export interface MCPToolInputSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: MCPToolInputSchema;
}

export interface MCPTextContent {
  type: 'text';
  text: string;
}

export interface MCPImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface MCPResourceContent {
  type: 'resource';
  uri: string;
  mimeType?: string;
  text?: string;
}

export type MCPContent = MCPTextContent | MCPImageContent | MCPResourceContent;

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

export type MCPToolHandler = (
  args: Record<string, unknown>
) => MCPToolResult | Promise<MCPToolResult>;

// =============================================================================
// MCP Resources
// =============================================================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
}

// =============================================================================
// Documentation Types
// =============================================================================

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface ComponentDoc {
  name: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'primitives' | 'hooks' | 'utils' | 'media';
  description: string;
  props: PropDefinition[];
  examples: string[];
  relatedComponents?: string[];
}

export interface HookDoc {
  name: string;
  description: string;
  signature: string;
  params: PropDefinition[];
  returns: string;
  examples: string[];
}

export interface ThemeDoc {
  name: string;
  description: string;
  colors: Record<string, string>;
}

// =============================================================================
// Error Codes
// =============================================================================

export const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;
