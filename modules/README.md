# Khalistra Modules

Cada pasta abaixo representa um limite isolado dentro da arquitetura do jogo. Implementações devem expor apenas interfaces claras (services, eventos ou DTOs) para evitar acoplamento cruzado.

| Módulo | Responsabilidade | Hand-off principal |
| --- | --- | --- |
| `auth` | Identidade, sessão e assinatura de eventos. | Backend / realtime |
| `users` | Perfis, progressão e inventário cosmético. | Backend / frontend |
| `matchmaking` | Filas, ranking e alocação de arenas. | Backend / realtime |
| `game-engine` | Regras do tabuleiro, turnos e simulação determinística. | Backend / frontend |
| `realtime` | Camada Socket.io + contrato de eventos. | Backend / frontend |

Cada módulo deve conter uma pasta `__tests__` com cenários executáveis via Jest. Utilize os tipos exportados em `@khalistra/shared` para compartilhar contratos de maneira consistente.
