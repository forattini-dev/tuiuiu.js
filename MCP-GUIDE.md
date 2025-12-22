# Tuiuiu MCP (Model Context Protocol) Guide

**Tuiuiu** tem suporte nativo a **Model Context Protocol** (MCP) para permitir que ferramentas de IA e assistentes construam interfaces de terminal interativas programaticamente.

## O que é MCP?

**Model Context Protocol** é um padrão aberto que permite que aplicações (clientes MCP) se conectem a servidores que fornecem recursos, ferramentas e contexto. Com Tuiuiu MCP, você pode:

- Construir UIs de terminal a partir de IA
- Criar componentes interativos dinamicamente
- Integrar Tuiuiu com Claude, ChatGPT, e outros assistentes
- Automatizar criação de TUIs complexas
- Fornecer documentação interativa do seu projeto

## ⚡ Início Rápido

### 1. Iniciar o Servidor MCP

**Opção A: Via CLI (Recomendado)**

```bash
# Modo stdio (para Claude Code)
npx tuiuiu mcp

# Modo HTTP (para desenvolvimento)
npx tuiuiu mcp --http --port=3200

# Com debug logging
npx tuiuiu mcp --debug
```

**Opção B: Via Configuração (.mcp.json)**

O arquivo `.mcp.json` já está pré-configurado:

```json
{
  "mcpServers": {
    "tuiuiu": {
      "command": "npx",
      "args": ["-y", "tsx", "./src/storybook/cli.ts", "mcp"],
      "env": { "NODE_ENV": "development" },
      "disabled": false
    }
  }
}
```

### 2. Usar com Claude Code

```bash
# Claude Code automaticamente detectará o servidor MCP
claude-code
```

Claude terá acesso às ferramentas e documentação do Tuiuiu.

### 3. Exemplo de Uso

```python
# Dentro de uma sessão Claude Code com MCP habilitado

"""
Crie uma interface de terminal para um TODO app usando Tuiuiu:
- Campo de entrada para novos itens
- Lista com os itens criados
- Botão para limpar tudo
"""

# Claude usará as ferramentas MCP para construir a interface
```

## 📚 Ferramentas Disponíveis

### Componentes Primitivos

```typescript
// Text Input
server.createTextInput({
  placeholder: 'Enter text...',
  defaultValue: '',
  onSubmit: (value) => console.log(value),
})

// Button
server.createButton({
  label: 'Click me',
  variant: 'primary',
  onPress: () => console.log('Pressed'),
})

// Select
server.createSelect({
  options: ['Option 1', 'Option 2', 'Option 3'],
  onSelect: (value) => console.log(value),
})

// Checkbox
server.createCheckbox({
  label: 'Accept terms',
  checked: false,
  onChange: (checked) => console.log(checked),
})

// Radio Group
server.createRadioGroup({
  options: ['A', 'B', 'C'],
  selected: 'A',
  onChange: (value) => console.log(value),
})
```

### Componentes Compostos

```typescript
// Modal
server.createModal({
  title: 'Confirm Action',
  content: 'Are you sure?',
  buttons: [
    { label: 'Cancel', action: 'cancel' },
    { label: 'Confirm', action: 'confirm' },
  ],
})

// Tab Navigation
server.createTabs({
  tabs: [
    { label: 'Tab 1', content: '...' },
    { label: 'Tab 2', content: '...' },
  ],
})

// Collapsible
server.createCollapsible({
  title: 'Advanced Options',
  content: '...',
  defaultOpen: false,
})

// Data Table
server.createTable({
  headers: ['Name', 'Email', 'Role'],
  rows: [
    ['John Doe', 'john@example.com', 'Admin'],
    ['Jane Smith', 'jane@example.com', 'User'],
  ],
})
```

### Componentes de Feedback

```typescript
// Spinner
server.createSpinner({
  text: 'Loading...',
  style: 'dots',
})

// Progress Bar
server.createProgressBar({
  value: 65,
  max: 100,
  showLabel: true,
})

// Toast/Alert
server.showAlert({
  type: 'info',
  title: 'Information',
  message: 'This is an info message',
})
```

### Visualização de Dados

```typescript
// Chart
server.createChart({
  type: 'line',
  title: 'Performance',
  data: [
    { x: '1', y: 10 },
    { x: '2', y: 20 },
    { x: '3', y: 15 },
  ],
})

// Heatmap
server.createHeatmap({
  data: contributionData,
  weeks: 52,
  colorScale: 'greens',
})

// Tree View
server.createTree({
  nodes: [
    { id: '1', label: 'Root', children: [
      { id: '1.1', label: 'Child 1' },
      { id: '1.2', label: 'Child 2' },
    ]},
  ],
})
```

## Exemplos Práticos

### Exemplo 1: Criar um Formulário Dinâmico

```typescript
server.registerTool({
  name: 'create-form',
  description: 'Cria um formulário com campos dinâmicos',
  handler: async (input) => {
    const form = {
      fields: [
        server.createTextInput({
          placeholder: 'Name',
          onSubmit: (name) => console.log('Name:', name),
        }),
        server.createTextInput({
          placeholder: 'Email',
          onSubmit: (email) => console.log('Email:', email),
        }),
        server.createSelect({
          options: ['Developer', 'Designer', 'Manager'],
          onSelect: (role) => console.log('Role:', role),
        }),
        server.createButton({
          label: 'Submit',
          onPress: () => console.log('Form submitted'),
        }),
      ],
    };

    return form;
  },
});
```

### Exemplo 2: Criar um Dashboard

```typescript
server.registerTool({
  name: 'create-dashboard',
  description: 'Cria um dashboard com múltiplas visualizações',
  handler: async (input) => {
    const dashboard = {
      layout: 'grid',
      components: [
        {
          title: 'User Count',
          component: server.createChart({
            type: 'line',
            data: [/* dados */],
          }),
        },
        {
          title: 'Contribution Graph',
          component: server.createHeatmap({
            data: [/* dados */],
          }),
        },
        {
          title: 'Recent Activity',
          component: server.createTable({
            headers: ['Action', 'User', 'Time'],
            rows: [/* dados */],
          }),
        },
      ],
    };

    return dashboard;
  },
});
```

### Exemplo 3: Criar um Menu Interativo

```typescript
server.registerTool({
  name: 'create-menu',
  description: 'Cria um menu de navegação interativo',
  handler: async (input) => {
    const menu = server.createSelect({
      options: [
        'Create New Project',
        'Open Existing Project',
        'View Settings',
        'Help & Documentation',
        'Exit',
      ],
      onSelect: (choice) => {
        switch (choice) {
          case 'Create New Project':
            return server.emit('action', { type: 'create-project' });
          case 'View Settings':
            return server.emit('action', { type: 'open-settings' });
          // ...
        }
      },
    });

    return menu;
  },
});
```

## Integração com Claude

### Usando Tuiuiu via MCP no Claude Code

```python
# Exemplo de prompt para Claude

"""
Crie uma interface de terminal para gerenciar tarefas usando Tuiuiu MCP:

1. Um campo de entrada para adicionar novas tarefas
2. Uma tabela mostrando todas as tarefas
3. Botões para marcar como concluída/deletar
4. Um gráfico de progresso

Use as ferramentas MCP disponíveis para construir cada componente.
"""
```

Claude usará as ferramentas MCP para construir a interface passo a passo.

### Fluxo Típico

1. **Claude analisa o pedido** → Identifica componentes necessários
2. **Claude chama ferramentas MCP** → Cria TextInput, Table, Buttons
3. **Servidor MCP responde** → Retorna componentes renderizados
4. **Interface é exibida** → Usuário interage com a TUI
5. **Eventos são capturados** → MCP notifica Claude de mudanças
6. **Claude reage** → Atualiza componentes conforme necessário

## Configuração Avançada

### Autenticação

```typescript
server.setAuthHandler((token) => {
  // Validar token
  return token === process.env.MCP_TOKEN;
});
```

### Logging

```typescript
server.onLog((level, message) => {
  console.log(`[${level}] ${message}`);
});
```

### Recursos Customizados

```typescript
server.registerResource({
  name: 'project-context',
  description: 'Contexto do projeto atual',
  getContent: async () => {
    return {
      projectName: 'my-app',
      version: '1.0.0',
      dependencies: [/* ... */],
    };
  },
});
```

## Performance & Limites

- **Timeout de resposta**: 30 segundos padrão
- **Tamanho máximo de payload**: 1MB
- **Máximo de componentes por tela**: 100
- **Máximo de linhas em tabelas**: 10,000 (usa virtualização)

## Debugging

### Ativar modo debug

```bash
DEBUG=tuiuiu:mcp node mcp-server.js
```

### Inspecionar requisições

```typescript
server.onRequest((request) => {
  console.log('MCP Request:', {
    tool: request.name,
    params: request.arguments,
    timestamp: new Date().toISOString(),
  });
});
```

## Limitações Conhecidas

- ⚠️ Animações complexas podem ter latência em MCP remoto
- ⚠️ Transferência de dados em tempo real requer polling (não há WebSocket)
- ⚠️ Some terminal capabilities podem variar por cliente MCP

## Roadmap

- [ ] WebSocket support para tempo real
- [ ] Streaming responses para grandes datasets
- [ ] File upload/download
- [ ] Browser rendering mode
- [ ] Multi-session support

## Referências

- [Tuiuiu Docs](./README.md)
- [MCP Specification](https://modelcontextprotocol.io)
- [Claude Code Integration](https://code.anthropic.com)

## Suporte

Para issues ou perguntas:

1. Verifique a [documentação](./README.md)
2. Procure [issues existentes](https://github.com/forattini-dev/tuiuiu.js/issues)
3. Crie um novo [issue](https://github.com/forattini-dev/tuiuiu.js/issues/new)
