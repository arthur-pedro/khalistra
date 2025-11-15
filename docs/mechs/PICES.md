
Em Khalistra, uma peça **não é seu movimento**.  
Ela é uma **entidade com atributos**, e o movimento é **apenas uma propriedade** (que pode mudar).

Ou seja:

> _Peça = identidade._  
> _Tipo = conjunto de regras base._  
> _Atributos = modificadores temporários ou permanentes._


**Explicação:** peça = entidade com tipo, estado, propriedades mutáveis (HP? status? movement overrides).

#### **Resumo Unificado dos Elementos do Sistema**

**1. Tipos de Peças (Versão Base)**

- **Rei**
    
- **Rainha**
    
- **Torre**
    
- **Bispo**
    
- **Cavalo**
    
- **Peão**
    

Esses nomes e funções são mantidos como no xadrez tradicional **na versão inicial**.

---

**2. Atributos Essenciais (Introduzidos para evoluções futuras)**

|Atributo|Descrição|Aplicação|
|---|---|---|
|**HP (Vitalidade)**|Quantidade de dano que a peça pode suportar antes de ser removida|Permite combate prolongado, trocas, desgaste|
|**Movimento**|Como a peça se desloca no tabuleiro|Pode ser alterado por efeitos e evoluções|
|**Ataque / Alcance**|Forma pela qual captura ou causa dano a outra peça|Pode ser direto, por área ou condicional|
|**Defesa**|Redução de dano recebido ou proteção de área|Introduz compensações estratégicas|
|**Influência Territorial**|Capacidade de controlar casas sem ocupar|Pode gerar pressão estratégica|
|**Afinidade / Classe** _(opcional futuro)_|Agrupa peças em categorias (ex.: Sagrado, Militar, Arcano)|Permite sinergias e buffs de grupo|

Inicialmente, apenas **Movimento** e **Captura** são ativos;  
os demais são planejados para fases posteriores.

---

**3. Estados (Status) de Peças**

Estados representam condições **temporárias**, positivas ou negativas.

| Tipo de Estado          | Exemplos                              | Efeito Geral                        |
| ----------------------- | ------------------------------------- | ----------------------------------- |
| **Buff (Bônus)**        | Fortalecido / Veloz / Implacável      | Melhora atributos                   |
| **Debuff (Penalidade)** | Enfraquecido / Enraizado / Silenciado | Limita ações                        |
| **Proteção**            | Guardado / Consagrado                 | Evita dano ou captura               |
| **Corrupção**           | Marcado / Instável                    | Efeitos que se agravam com o tempo  |
| **Canalização**         | Foco / Preparação                     | Permite habilidades de carregamento |

Estados devem ter: _origem, duração e condição de término_ claramente definidas.

---

**4. Modificadores**

Modificadores são **alterações diretas nas regras de jogo**, permanentes ou de longa duração.

|Categoria|Descrição|Exemplo Conceitual|
|---|---|---|
|**Modificador de Movimento**|Aumenta, reduz ou altera direções|Peão pode avançar 2–4 casas continuamente|
|**Modificador de Captura**|Altera como a peça elimina inimigos|Cavalo captura peças adjacentes após o salto|
|**Modificador de Área**|Afeta zonas ao redor|Torre cria zona de bloqueio em linha|
|**Modificador de Condição**|Habilidade só ativa sob circunstâncias|Bispo recebe poder extra enquanto está em diagonal livre|

---

**5. Evoluções**

Evolução é uma **mudança permanente** na peça, adquirida durante a partida.

Tipos de Evolução:

|Tipo|Descrição|Exemplo Conceitual|
|---|---|---|
|**Promoção**|Transformação ao atingir condição|Peão promove-se ao chegar na última fileira|
|**Ascensão**|Ganha nova habilidade sem trocar de peça|Torre pode se “fortificar” aumentando alcance defensivo|
|**Transmutação**|Muda o papel estratégico|Bispo torna-se peça híbrida com alcance reduzido + efeito de área|

---

**6. Recursos do Jogador**

Recursos são elementos externos ao tabuleiro que afetam decisões.

|Recurso|Função|
|---|---|
|**Tempo**|Gasta para ativar habilidades ou cartas|
|**Cartas / Poderes**|Efeitos de modificação temporária ou imediata|
|**Sorte / Aleatoriedade Controlada**|Introduz variação sem prejudicar clareza|

Recursos permitem **jogabilidade dinâmica**, mas serão introduzidos **após a base sólida do jogo estar pronta**.

---

**Linha Mestra do Design**

Para garantir coerência:

1. A **Versão 1** deve ser xadrez puro, sem HP, sem cartas, sem status.
    
2. A arquitetura deve _prever_ atributos e estados, mas não ativá-los ainda.
    
3. Expansões devem entrar **por camadas**, nunca substituindo o núcleo.