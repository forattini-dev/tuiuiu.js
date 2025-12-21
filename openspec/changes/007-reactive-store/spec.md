# Proposta: Tuiuiu Store (Redux-inspired Reactive State)

## Metadados
- **Autor:** Gemini (Agent)
- **Data:** 2025-12-20
- **Status:** Proposta
- **Inspiração:** Redux, Zustan, Signals

## 1. O Problema

Aplicações TUI complexas (como dashboards, gerenciadores de arquivos) precisam de gerenciamento de estado global robusto.
Atualmente, usamos `createSignal` soltos ou `useContext`. Embora poderosos, eles carecem de:
1.  **Previsibilidade:** Difícil rastrear *quem* mudou o estado e *quando*.
2.  **Persistência:** Não há padrão para salvar/carregar estado do disco.
3.  **Depuração:** Impossível fazer "Time Travel" ou logs estruturados de mudanças.

## 2. A Solução: `createStore`

Propomos uma primitiva de gerenciamento de estado que une a arquitetura **Flux/Redux** com a performance de **Signals**.

### 2.1. Arquitetura

```typescript
// Interface inspirada no Redux
interface Store<T> {
  state: Accessor<T>;      // Signal getter (reativo)
  dispatch: (action: Action) => void;
  subscribe: (fn: (state: T) => void) => () => void;
}
```

### 2.2. Diferenças Chave do Redux

1.  **Reatividade Nativa:** O `state` exposto é um *Signal*. Componentes que o consomem re-renderizam automaticamente apenas quando necessário. Não é preciso `connect()` ou HOCs.
2.  **Zero Boilerplate:** Suporte a reducers clássicos, mas também ações diretas (estilo Zustand) se desejado.
3.  **Foco em TUI:** Middlewares pensados para CLI (ex: persistência síncrona/assíncrona em arquivo, logging no terminal de debug).

## 3. Implementação Proposta

### `src/primitives/store.ts`

```typescript
export function createStore<T>(
  reducer: (state: T, action: Action) => T,
  initialState: T,
  enhancers?: StoreEnhancer<T>[]
) {
  // O estado interno é um Signal
  const [state, setState] = createSignal(initialState);

  function dispatch(action: Action) {
    // Reducer calcula o próximo estado imutável
    const nextState = reducer(state(), action);
    
    // Signal notifica os ouvintes APENAS se houver mudança real
    setState(nextState);
  }

  return { state, dispatch };
}
```

## 4. Persistência (O "Pulo do Gato")

Criaremos um middleware `persist` que sincroniza o estado com o sistema de arquivos.

```typescript
const store = createStore(rootReducer, initialState, [
  persist({
    path: './data/app-state.json',
    throttle: 1000, // Salva no máximo a cada 1s
    format: 'json' // ou 'yaml'
  })
]);
```

Isso resolve o problema de "sessões" em CLIs. O usuário fecha o app, abre de novo e está tudo lá.

## 5. DevTools (TUI)

Podemos criar um componente `<DevTools />` que pode ser renderizado em uma aba separada ou overlay, mostrando o log de Actions e o diff do estado, já que temos o controle centralizado.

## 6. Plano de Ação

1.  Criar `src/primitives/store.ts` (Core logic).
2.  Implementar middleware `logger` (console/file log).
3.  Implementar middleware `persist` (fs integration).
4.  Criar exemplo `examples/07-redux-store.ts` demonstrando o uso.
