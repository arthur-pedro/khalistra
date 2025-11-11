
**Explicação:** o tabuleiro é a grade onde ecossistema do jogo roda. Definir representação facilita engine e networking.

**Decisões:**

- Grade base: 8x8 (como xadrez) — mantém familiaridade.
    
- Cada célula tem atributos: coordenada, estado (normal, bloqueada, cursed), efeitos ativos, token(s) temporários.
    
- Representação padrão: FEN-like (string) para salvar/compartilhar + JSON completo para engine.
    

**Khalistra (definição):**

- `board.rows = 8`, `board.cols = 8`.
    
- Cada square: `{ id: "e4", type: "normal"|"ruined"|"sanctum", effects: [...], height?:0 }`.
    
- Algumas rulesets podem alterar dimensões (ex.: 9x9) — engine deve suportar dinamicamente.