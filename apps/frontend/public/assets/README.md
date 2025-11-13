# Assets do Frontend Khalistra

Estrutura esperada para skins de tabuleiro, sprites de peças, efeitos e HUD. Todos os arquivos ficam dentro de `apps/frontend/public/assets` para que o Next.js sirva diretamente.

```
assets/
  boards/<boardId>/atlas.json
  pieces/<setId>/<color>-<piece>.png
  effects/<effectId>/sheet.json
  ui/icons/<icon>.svg
```

## Pastas

### boards/
- Cada skin possui um `atlas.json` (ou `.png` flat) com metadados opcionais (`tileSize`, `highlightColor`).
- A engine Pixi usa `boards/default` automaticamente quando nenhuma skin é informada.
- Recomenda-se manter texturas 1024x1024 (ou múltiplos) para evitar borrões.

### pieces/
- Nome do arquivo segue `<color>-<piece>.png`, onde `color` ∈ {`light`, `shadow`} e `piece` ∈ {`king`, `queen`, `rook`, `bishop`, `knight`, `pawn`}.
- Coloque variantes em subpastas (`pieces/obsidian/...`). A aplicação procura primeiro pelo set configurado e cai para `pieces/default` caso não encontre.

### effects/
- Usados para partículas de poderes, buff/debuff etc. Cada efeito possui um `sheet.json` compatível com Pixi Assets.
- Quando um efeito não existir, o frontend renderiza glow genérico com cores definidas no tema.

### ui/
- Ícones, ornamentos e decals usados na HUD sobreposta. Preferir SVG monocromático para aplicar `fill` via CSS.

## Boas Práticas
- Sempre rodar `pnpm lint` após adicionar novos assets para garantir que os manifests foram registrados.
- Evitar sobrescrever arquivos existentes sem atualizar CHANGELOG.
- Documentar novos diretórios ou formatos neste README para manter o time alinhado.
