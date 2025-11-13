import { Assets } from 'pixi.js';

interface AssetDescriptor {
  alias: string;
  src: string;
}

const ASSET_PREFIX = '/assets';

const DEFAULT_ASSETS: AssetDescriptor[] = [
  { alias: 'boards/default/texture', src: `${ASSET_PREFIX}/boards/default/atlas.json` },
  { alias: 'pieces/default/light-king', src: `${ASSET_PREFIX}/pieces/default/light-king.png` },
  { alias: 'pieces/default/light-queen', src: `${ASSET_PREFIX}/pieces/default/light-queen.png` },
  { alias: 'pieces/default/light-bishop', src: `${ASSET_PREFIX}/pieces/default/light-bishop.png` },
  { alias: 'pieces/default/light-knight', src: `${ASSET_PREFIX}/pieces/default/light-knight.png` },
  { alias: 'pieces/default/light-rook', src: `${ASSET_PREFIX}/pieces/default/light-rook.png` },
  { alias: 'pieces/default/light-pawn', src: `${ASSET_PREFIX}/pieces/default/light-pawn.png` },
  { alias: 'pieces/default/shadow-king', src: `${ASSET_PREFIX}/pieces/default/shadow-king.png` },
  { alias: 'pieces/default/shadow-queen', src: `${ASSET_PREFIX}/pieces/default/shadow-queen.png` },
  { alias: 'pieces/default/shadow-bishop', src: `${ASSET_PREFIX}/pieces/default/shadow-bishop.png` },
  { alias: 'pieces/default/shadow-knight', src: `${ASSET_PREFIX}/pieces/default/shadow-knight.png` },
  { alias: 'pieces/default/shadow-rook', src: `${ASSET_PREFIX}/pieces/default/shadow-rook.png` },
  { alias: 'pieces/default/shadow-pawn', src: `${ASSET_PREFIX}/pieces/default/shadow-pawn.png` }
];

const registered = new Set<string>();

export const ensureDefaultAssets = () => {
  DEFAULT_ASSETS.forEach((asset) => {
    if (registered.has(asset.alias)) {
      return;
    }

    try {
      Assets.add({ alias: asset.alias, src: asset.src });
      registered.add(asset.alias);
    } catch {
      // alias já existe no cache – ignorar
    }
  });
};

export const getPieceAlias = (setId: string, color: 'light' | 'shadow', piece: string) =>
  `pieces/${setId}/${color}-${piece}`;
