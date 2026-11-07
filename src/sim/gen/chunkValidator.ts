import { ChunkData } from './types';

/**
 * Validates that a generated chunk is physically traversable by the player.
 * Checks maximum gap spans and ensure traps leave adequate jump clearance.
 */
export class ChunkValidator {
  static validate(chunk: ChunkData): boolean {
    const { widthTiles, heightTiles, tiles, traps } = chunk;

    // Check bottom floor continuity: gaps should not exceed 5 tiles wide
    let currentGap = 0;
    const groundY = heightTiles - 4; // standard ground baseline

    for (let x = 0; x < widthTiles; x++) {
      let hasPlatform = false;
      // Check from y = 10 to groundY + 2
      for (let y = 8; y < heightTiles; y++) {
        if (tiles[y * widthTiles + x] === 1) {
          hasPlatform = true;
          break;
        }
      }

      if (!hasPlatform) {
        currentGap++;
        if (currentGap > 5) {
          // Gap is too wide to clear without special speed
          return false;
        }
      } else {
        currentGap = 0;
      }
    }

    // Check that traps don't completely seal off vertical clearance
    for (const trap of traps) {
      if (trap.type === 'film_scratch') {
        // Ensure there's at least 3 tiles of vertical head clearance above or around it
        let hasClearance = false;
        const tx = trap.tileX;
        for (let y = 4; y < trap.tileY - 2; y++) {
          if (tiles[y * widthTiles + tx] === 0) {
            hasClearance = true;
            break;
          }
        }
        if (!hasClearance && trap.tileY <= 8) return false;
      }
    }

    return true;
  }
}
