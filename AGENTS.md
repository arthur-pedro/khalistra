# AGENTS DEVELOPMENT GUIDELINES

Este documento define diretrizes para agentes, serviços e módulos envolvidos no desenvolvimento do projeto **Khalistra**.  
O objetivo é garantir **padronização, escalabilidade, testabilidade e consistência arquitetural** entre todos os colaboradores e agentes automatizados.

Sempre verifique a pasta docs na raiz do projeto antes de iniciar o desenvolvimento.

Sempre rode o pnpm build e pnpm lint na raiz do projeto no final de cada implementação. Corrija os erros que aparecer antes de finalizar a entrega.

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|-------|------------|--------------|
| Frontend | **React + Next.js** | Renderização eficiente, suporte SSR e composição modular. |
| Estado (Frontend) | **Zustand ou Jotai** | Simples, previsível e escalável para UI interativa em tempo real. |
| UI | **TailwindCSS + Radix UI** | Padronização, acessibilidade e velocidade de desenvolvimento. |
| Backend | **Node.js (NestJS)** | Estrutura modular, organizada e com DI (Nest) com fastify. |
| Networking | **WebSockets (Socket.io)** | Comunicação em tempo real entre jogadores. |
| Banco de Dados | **PostgreSQL** | Consistência transacional e robustez para dados de estado e histórico. |
| Cache / Estado de Partida | **Redis** | Armazena estados temporários de partidas e sessões. |
| Infra | **Docker + Kubernetes (posterior)** | Portabilidade, escalabilidade e automação de deploy. |
| Logs e Observabilidade | **OpenTelemetry + Prometheus + Grafana** | Monitoramento e rastreamento de performance. |

---

## 2. Arquitetura do Sistema

O sistema segue uma **arquitetura orientada a módulos**, com camadas bem definidas e princípios SOLID:

```

/app
/frontend
/backend
/modules
/auth
/users
/matchmaking
/game-engine
/realtime
/shared
/types
/constants
/utils

```

### Princípios

- **Separar engine de jogo da UI**
  - A engine deve ser totalmente independente — não deve importar React, DOM, etc.

- **Nenhum módulo deve depender diretamente de outro módulo sem interface clara**
  - Dependências cruzadas devem ser evitadas.

- **Toda comunicação entre módulos deve acontecer via interfaces ou eventos**.

- **Usar padrões SOLID como boas práticas**.

- **Dockerizar projeto**.

- **Sempre prever usabilidade e UI com e sem sprites configurados**.

- **O objetivo final do projeto é lançar o jogo nan steam**

---

## 3. Diretrizes para o Código

### 3.1 Nomeação

- Nomes devem ser **curtos, claros e sem abreviações desnecessárias**.
- Funções devem iniciar com verbos: `calculateMove`, `validateTurn`, `updateState`, etc.
- Classes e entidades em `PascalCase`.
- Variáveis e funções em `camelCase`.

### 3.2 Formatação e Estilo

- **ESLint + Prettier** são mandatórios.
- Padrão de importação organizado e sem imports não utilizados.
- Nunca comentar código sem necessidade — prefira tornar o código autoexplicativo.

---

## 5. Testes

### Tipos

| Tipo | Ferramenta | Escopo |
|------|------------|--------|
| Unitários | Jest | Engine de jogo e funções puras

### Diretrizes
- Cada módulo deve manter sua própria pasta `__tests__`.
- São obrigatórios testes em:
  - Lógica do motor de jogo
  - Processamento de turnos
  - Validação de ações
- Code coverage alvo: **mínimo 80%** nas áreas core.

---

## 6. Comunicação e Sincronização (Tempo Real)

- WebSockets devem ser **event-driven**.
- Cada evento deve ter:
  - Nome padrão (`namespace:eventName`)
  - Payload tipado compartilhado (`shared/types/events.ts`)
  - Resposta padronizada ou ACK explícito.

### Exemplo de padrão de naming
```

game:join
game:start
game:move
game:update
game:finish

```

---

## 7. Logging e Observabilidade

- Toda ação crítica deve gerar **log estruturado** em JSON.
- Logar:
  - ID da partida
  - ID dos jogadores
  - Timestamp
  - Tipo da ação
- Não logar:
  - Dados sensíveis
  - Conteúdo de autenticação

---

## 8. Guidelines de Evolução

- O código deve ser modular o suficiente para permitir:
  - Mudança completa nas regras do jogo sem refatoração da UI.
  - Introdução de novos modos de jogo sem duplicar lógica.
  - Substituição do backend por outra linguagem sem quebrar contrato.

**Todo módulo deve ser substituível.**  
Se não for substituível, está acoplado demais.

---

## 9. Checklist para Cada imlpementação

- [ ] Código escrito seguindo padrões
- [ ] Typos e inconsistências resolvidas
- [ ] Testes adicionados ou atualizados
- [ ] Tipos TypeScript exportados corretamente
- [ ] Não há lógica duplicada
- [ ] CI executou com sucesso
- [ ] Sempre rodar o Lint do projeto antes de entregar
- [ ] Sempre rodar o testes unitários do projeto antes de entregar
- [ ] Sempre rodar o build do projeto antes de entregar Build
- [ ] Sempre atualizar CHANGELOG.md com as mudanças
