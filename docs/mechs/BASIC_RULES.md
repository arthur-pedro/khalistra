_(Versão 1 — Núcleo Tradicional, sem modificadores ou habilidades extras)_

### **4.1 Objetivo da Partida**

O objetivo é colocar o **Rei inimigo** em uma posição onde não possa evitar a captura.  
Quando isso ocorre, a partida termina — é o **Xeque-mate**.

---

### **4.2 Preparação Inicial**

- O tabuleiro é uma grade **8×8**, casas alternadas entre claro e escuro.
    
- Cada jogador inicia com **16 peças**, posicionadas de forma simétrica.
    
- **O jogador que controla as peças brancas joga primeiro.**
    

Posicionamento inicial:

- **Peões** ocupam a segunda fileira de cada lado.
    
- Na primeira fileira: **Torre, Cavalo, Bispo, Rainha, Rei, Bispo, Cavalo, Torre**.
    
- A **Rainha** sempre começa na casa da **sua cor**.
    

---

### **4.3 Estrutura de Turno**

Cada turno de um jogador consiste em **uma única ação principal**:

1. **Mover uma peça** OU
    
2. **Capturar uma peça adversária**, desde que obedecidas as regras de movimento.
    

Não existem ações simultâneas.  
O jogo avança alternando turnos entre os jogadores.

---

### **4.4 Regras de Movimento e Captura**

As peças se movem conforme regras tradicionais (movimento determinístico, sem aleatoriedade):

|Peça|Movimento|Captura|
|---|---|---|
|**Rei**|Uma casa em qualquer direção|Igual ao movimento|
|**Rainha**|Qualquer número de casas em qualquer direção|Igual ao movimento|
|**Torre**|Fileiras e colunas|Igual ao movimento|
|**Bispo**|Diagonais|Igual ao movimento|
|**Cavalo**|Movimento em “L” (2+1)|Igual ao movimento, ignora peças no caminho|
|**Peão**|Avança para frente|Captura apenas na diagonal; promove ao chegar à última fileira|

---

### **4.5 Xeque, Sacrifício e Defesa**

- Um Rei **não pode permanecer ou mover-se para uma casa sob ataque**.
    
- Quando uma peça adversária ameaça o Rei, ele está em **Xeque**.
    
- O jogador em xeque deve, no seu turno, **remover a ameaça**, seja:
    
    - Movendo o Rei;
        
    - Capturando a peça que ameaça;
        
    - Bloqueando a ameaça com outra peça.
        

Se nenhuma dessas opções for possível → **Xeque-mate → fim da partida**.

---

### **4.6 Promoção**

Quando um **Peão** alcança a última fileira do adversário, ele é **promovido**.  
Na Versão 1, a promoção transforma o Peão imediatamente em:

- **Rainha**  
    _(versão inicial não oferece escolha para simplificar design e UI)_
    

---

### **4.7 Empates e Condições de Não-Vitória**

A partida termina empatada se:

|Condição|Descrição|
|---|---|
|**Afogamento (Stalemate)**|O jogador não está em xeque, mas não pode realizar movimentos válidos|
|**Repetição de Movimento**|A mesma posição ocorre 3 vezes consecutivas com a mesma ordem de jogadas|
|**Insuficiência de Material**|Nenhum dos jogadores possui peças suficientes para vencer (ex.: Rei vs Rei)|
|**Tempo**|O jogador fica sem "tempo", chegando a zero (ou menor), seja pela demora da decisão, ou usar recursos de forma exagerada

---

### **4.8 Duração**

Não há limite de turnos.  
A duração depende da análise e profundidade estratégica dos jogadores.