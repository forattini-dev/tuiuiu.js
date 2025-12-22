/**
 * Exemplo: Tuiuiu MCP Server
 *
 * Um servidor MCP que expõe ferramentas para construir interfaces Tuiuiu
 * dinamicamente via Model Context Protocol.
 *
 * Uso:
 *   pnpm example examples/mcp-server-example.ts
 */

import { Box, Text, Button } from '../src/index.js';
import type { VNode } from '../src/utils/types.js';

/**
 * Tipos de dados para o MCP
 */
interface MCPToolRequest {
  name: string;
  arguments: Record<string, unknown>;
}

interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'image';
    data?: string;
    mimeType?: string;
  }>;
}

interface ComponentInput {
  type: string;
  props?: Record<string, unknown>;
  children?: ComponentInput[];
}

/**
 * Servidor MCP para Tuiuiu
 *
 * Fornece ferramentas para criar componentes de UI dinamicamente
 */
class TuiiuiMCPServer {
  private components: Map<string, VNode> = new Map();
  private tools: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Registra as ferramentas padrão disponíveis
   */
  private registerDefaultTools(): void {
    // Ferramenta: Criar um texto simples
    this.registerTool('create-text', async (args) => {
      const content = args.content as string;
      const color = args.color as string | undefined;
      const bold = args.bold as boolean | undefined;

      const node = Text({ color, bold }, content);
      const id = this.storeComponent(node);

      return {
        componentId: id,
        type: 'text',
        preview: content,
      };
    });

    // Ferramenta: Criar um botão
    this.registerTool('create-button', async (args) => {
      const label = args.label as string;
      const color = args.color as string | undefined;

      const node = Button({
        label,
        color,
        onPress: () => console.log(`Button pressed: ${label}`),
      });
      const id = this.storeComponent(node);

      return {
        componentId: id,
        type: 'button',
        label,
      };
    });

    // Ferramenta: Criar um container
    this.registerTool('create-box', async (args) => {
      const padding = args.padding as number | undefined;
      const gap = args.gap as number | undefined;
      const flexDirection = args.flexDirection as string | undefined;
      const children = args.children as string[] | undefined;

      const childrenNodes = children?.map((id) => this.components.get(id)).filter(Boolean) || [];

      const node = Box(
        { padding, gap, flexDirection },
        ...childrenNodes,
      );
      const id = this.storeComponent(node);

      return {
        componentId: id,
        type: 'box',
        childCount: childrenNodes.length,
      };
    });

    // Ferramenta: Listar componentes disponíveis
    this.registerTool('list-components', async () => {
      return {
        available: [
          'create-text',
          'create-button',
          'create-box',
          'render-component',
          'get-component',
          'delete-component',
        ],
      };
    });

    // Ferramenta: Renderizar um componente
    this.registerTool('render-component', async (args) => {
      const id = args.id as string;
      const component = this.components.get(id);

      if (!component) {
        throw new Error(`Component not found: ${id}`);
      }

      // Aqui você renderizaria o componente para terminal
      return {
        componentId: id,
        rendered: true,
        message: `Component ${id} would be rendered to terminal`,
      };
    });

    // Ferramenta: Obter informações de um componente
    this.registerTool('get-component', async (args) => {
      const id = args.id as string;
      const component = this.components.get(id);

      if (!component) {
        throw new Error(`Component not found: ${id}`);
      }

      return {
        id,
        type: (component as any).type || 'unknown',
        props: (component as any).props || {},
      };
    });

    // Ferramenta: Deletar um componente
    this.registerTool('delete-component', async (args) => {
      const id = args.id as string;
      const existed = this.components.delete(id);

      return {
        id,
        deleted: existed,
      };
    });
  }

  /**
   * Registra uma ferramenta customizada
   */
  registerTool(
    name: string,
    handler: (args: Record<string, unknown>) => Promise<unknown>,
  ): void {
    this.tools.set(name, handler);
  }

  /**
   * Processa uma requisição MCP
   */
  async handleRequest(request: MCPToolRequest): Promise<MCPToolResponse> {
    const handler = this.tools.get(request.name);

    if (!handler) {
      return {
        content: [
          {
            type: 'text',
            data: JSON.stringify({
              error: `Tool not found: ${request.name}`,
              availableTools: Array.from(this.tools.keys()),
            }),
          },
        ],
      };
    }

    try {
      const result = await handler(request.arguments);
      return {
        content: [
          {
            type: 'text',
            data: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            data: JSON.stringify({
              error: String(error),
              tool: request.name,
            }),
          },
        ],
      };
    }
  }

  /**
   * Armazena um componente e retorna um ID
   */
  private storeComponent(node: VNode): string {
    const id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.components.set(id, node);
    return id;
  }

  /**
   * Obtém um componente pelo ID
   */
  getComponent(id: string): VNode | undefined {
    return this.components.get(id);
  }

  /**
   * Lista todos os componentes
   */
  listComponents(): Array<[string, VNode]> {
    return Array.from(this.components.entries());
  }
}

/**
 * Exemplo de uso do servidor
 */
async function main() {
  const server = new TuiiuiMCPServer();

  console.log('🚀 Tuiuiu MCP Server iniciado');
  console.log('Ferramentas disponíveis:');

  // Listar ferramentas
  const toolsList = await server.handleRequest({
    name: 'list-components',
    arguments: {},
  });
  console.log(toolsList.content[0].data);

  // Criar um texto
  console.log('\n📝 Criando um texto...');
  const textResponse = await server.handleRequest({
    name: 'create-text',
    arguments: {
      content: 'Olá do MCP Server!',
      color: 'cyan',
      bold: true,
    },
  });
  const textId = JSON.parse(textResponse.content[0].data!).componentId;
  console.log(`✓ Texto criado: ${textId}`);

  // Criar um botão
  console.log('\n🔘 Criando um botão...');
  const buttonResponse = await server.handleRequest({
    name: 'create-button',
    arguments: {
      label: 'Click me!',
      color: 'green',
    },
  });
  const buttonId = JSON.parse(buttonResponse.content[0].data!).componentId;
  console.log(`✓ Botão criado: ${buttonId}`);

  // Criar um container com os componentes
  console.log('\n📦 Criando um container...');
  const boxResponse = await server.handleRequest({
    name: 'create-box',
    arguments: {
      padding: 2,
      gap: 1,
      flexDirection: 'column',
      children: [textId, buttonId],
    },
  });
  const boxId = JSON.parse(boxResponse.content[0].data!).componentId;
  console.log(`✓ Container criado: ${boxId}`);

  // Obter informações do container
  console.log('\n📋 Informações do container:');
  const infoResponse = await server.handleRequest({
    name: 'get-component',
    arguments: { id: boxId },
  });
  console.log(infoResponse.content[0].data);

  // Renderizar o container
  console.log('\n🎨 Renderizando o container...');
  const renderResponse = await server.handleRequest({
    name: 'render-component',
    arguments: { id: boxId },
  });
  console.log(renderResponse.content[0].data);

  // Listar todos os componentes criados
  console.log('\n📊 Componentes em memória:');
  const components = server.listComponents();
  console.log(`Total: ${components.length} componente(s)`);
  components.forEach(([id, component]) => {
    console.log(`  - ${id}: ${(component as any).type}`);
  });

  // Deletar o texto
  console.log('\n🗑️  Deletando o texto...');
  const deleteResponse = await server.handleRequest({
    name: 'delete-component',
    arguments: { id: textId },
  });
  console.log(deleteResponse.content[0].data);

  // Listar novamente
  console.log('\n📊 Componentes após deleção:');
  const updatedComponents = server.listComponents();
  console.log(`Total: ${updatedComponents.length} componente(s)`);

  console.log('\n✅ Exemplo concluído');
}

// Executar o exemplo
main().catch(console.error);
