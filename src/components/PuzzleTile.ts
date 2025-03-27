import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { Boid } from '../boids/Boid';

// Constants for tile layout
export const GAP = 8; // Can be adjusted as needed
export const GRID_ROWS = 3;
export const GRID_COLS = 3;
export const CORNER_RADIUS = 12;

// Function to calculate tile dimensions based on screen dimensions
export function calculateTileDimensions(): { width: number; height: number } {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Calculate tile dimensions to fit screen with gaps
  const tileWidth = (width - (GAP * (GRID_COLS + 1))) / GRID_COLS;
  const tileHeight = (height - (GAP * (GRID_ROWS + 1))) / GRID_ROWS;
  
  return {
    width: Math.floor(tileWidth),
    height: Math.floor(tileHeight)
  };
}

// Type definition for tile data
export type TileData = {
  id: number;
  correctRow: number;
  correctCol: number;
};

// Array of tile data for the 3x3 grid (including empty slot)
export const tileData: TileData[] = [
  { id: 0, correctRow: 0, correctCol: 0 },
  { id: 1, correctRow: 0, correctCol: 1 },
  { id: 2, correctRow: 0, correctCol: 2 },
  { id: 3, correctRow: 1, correctCol: 0 },
  { id: 4, correctRow: 1, correctCol: 1 },
  { id: 5, correctRow: 1, correctCol: 2 },
  { id: 6, correctRow: 2, correctCol: 0 },
  { id: 7, correctRow: 2, correctCol: 1 },
  { id: 8, correctRow: 2, correctCol: 2 }, // Empty slot
];

export class PuzzleTile extends PIXI.Container {
  id: number;
  correctRow: number;
  correctCol: number;
  private boidContainer: PIXI.Container;
  dragging: boolean = false;
  private startPosition: PIXI.Point | null = null;
  private htmlElement!: HTMLDivElement;
  private tileWidth: number;
  private tileHeight: number;

  constructor(id: number, correctRow: number, correctCol: number) {
    super();
    this.id = id;
    this.correctRow = correctRow;
    this.correctCol = correctCol;
    const dimensions = calculateTileDimensions();
    this.tileWidth = dimensions.width;
    this.tileHeight = dimensions.height;

    // Create container for boids
    this.boidContainer = new PIXI.Container();
    this.addChild(this.boidContainer);

    // Create mask for the boid container
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(0, 0, this.tileWidth, this.tileHeight, CORNER_RADIUS);
    mask.endFill();
    this.addChild(mask);
    this.boidContainer.mask = mask;

    // Add border with rounded corners
    const border = new PIXI.Graphics();
    border.lineStyle(3, 0x4A4A4A, 1);
    border.drawRoundedRect(0, 0, this.tileWidth, this.tileHeight, CORNER_RADIUS);
    this.addChild(border);

    // Make the last tile semi-transparent
    if (id === 8) {
      this.alpha = 0.5;
    }

    // Create HTML element for the number (except for the last tile)
    if (id < 8) {
      this.createHtmlElement();
    }

    // Enable interactivity
    this.setupInteraction();

    // Ensure position updates after being added to stage
    this.on('added', () => {
      requestAnimationFrame(() => {
        this.updateHtmlPosition();
      });
    });

    // Handle window resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  updateBoids(boids: Boid[]) {
    // Clear existing boids
    this.boidContainer.removeChildren();

    // Get the container's global position
    const globalPos = this.parent?.getGlobalPosition() || { x: 0, y: 0 };

    // Calculate the viewport bounds for this tile, accounting for gaps and container position
    const viewportX = globalPos.x + this.correctCol * (this.tileWidth + GAP);
    const viewportY = globalPos.y + this.correctRow * (this.tileHeight + GAP);

    // Re-render only the boids that should be visible in this tile
    boids.forEach(boid => {
      // Normalize boid position relative to the simulation area
      const normalizedX = ((boid.x % window.innerWidth) + window.innerWidth) % window.innerWidth;
      const normalizedY = ((boid.y % window.innerHeight) + window.innerHeight) % window.innerHeight;

      if (normalizedX >= viewportX && normalizedX < viewportX + this.tileWidth &&
          normalizedY >= viewportY && normalizedY < viewportY + this.tileHeight) {
        // Create a new graphics object for this boid
        const boidGraphics = new PIXI.Graphics();
        boidGraphics.beginFill(boid.color); // Use the boid's original color
        // Draw an isometric triangle
        boidGraphics.moveTo(0, -6); // Top point
        boidGraphics.lineTo(5.1, 6); // Bottom right (6 * 0.85)
        boidGraphics.lineTo(-5.1, 6); // Bottom left
        boidGraphics.closePath();
        boidGraphics.endFill();

        // Position relative to tile viewport
        boidGraphics.x = normalizedX - viewportX;
        boidGraphics.y = normalizedY - viewportY;

        // Rotate to match boid direction (add PI/2 to align with movement)
        boidGraphics.rotation = boid.rotation + Math.PI/2;

        this.boidContainer.addChild(boidGraphics);
      }
    });
  }

  private onResize() {
    const newDimensions = calculateTileDimensions();
    if (newDimensions.width !== this.tileWidth || newDimensions.height !== this.tileHeight) {
      this.tileWidth = newDimensions.width;
      this.tileHeight = newDimensions.height;
      
      // Update mask
      const oldMask = this.boidContainer.mask;
      const newMask = new PIXI.Graphics();
      newMask.beginFill(0xffffff);
      newMask.drawRoundedRect(0, 0, this.tileWidth, this.tileHeight, CORNER_RADIUS);
      newMask.endFill();
      
      if (oldMask instanceof PIXI.Container) {
        oldMask.destroy();
      }
      this.addChild(newMask);
      this.boidContainer.mask = newMask;

      // Update border
      this.children.forEach(child => {
        if (child instanceof PIXI.Graphics && child !== newMask) {
          child.clear();
          child.lineStyle(3, 0x4A4A4A, 1);
          child.drawRoundedRect(0, 0, this.tileWidth, this.tileHeight, CORNER_RADIUS);
        }
      });

      // Update position
      const currentCol = Math.round(this.x / (this.tileWidth + GAP));
      const currentRow = Math.round(this.y / (this.tileHeight + GAP));
      this.setTilePosition(currentRow, currentCol);
    }
  }

  private createHtmlElement() {
    this.htmlElement = document.createElement('div');
    this.htmlElement.className = 'tile-number';
    this.htmlElement.textContent = (this.id + 1).toString();
    
    // Style the element
    Object.assign(this.htmlElement.style, {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      color: '#FFE5B4',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      pointerEvents: 'none',
      fontFamily: 'Arial, sans-serif',
      zIndex: '1000',
      margin: '8px',
      transform: 'translate(0, 0)', // Initialize transform
      display: 'none', // Start hidden until positioned
    });

    // Add to the document
    document.body.appendChild(this.htmlElement);
  }

  private updateHtmlPosition() {
    if (this.htmlElement && this.parent) {
      const globalPosition = this.getGlobalPosition();
      this.htmlElement.style.transform = `translate(${globalPosition.x}px, ${globalPosition.y}px)`;
      this.htmlElement.style.display = this.visible ? 'block' : 'none';
    }
  }

  setTilePosition(row: number, col: number) {
    this.x = col * (this.tileWidth + GAP);
    this.y = row * (this.tileHeight + GAP);
    
    requestAnimationFrame(() => {
      this.updateHtmlPosition();
    });
  }

  private setupInteraction() {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', this.onDragStart)
        .on('pointerup', this.onDragEnd)
        .on('pointerupoutside', this.onDragEnd)
        .on('pointermove', this.onDragMove);
  }

  private onDragStart = (event: PIXI.FederatedPointerEvent) => {
    this.dragging = true;
    this.startPosition = new PIXI.Point(event.globalX - this.x, event.globalY - this.y);
    this.alpha = 0.8;
  }

  private onDragEnd = () => {
    this.dragging = false;
    this.startPosition = null;
    this.alpha = 1;
  }

  private onDragMove = (event: PIXI.FederatedPointerEvent) => {
    if (this.dragging && this.startPosition) {
      this.x = event.globalX - this.startPosition.x;
      this.y = event.globalY - this.startPosition.y;
      this.updateHtmlPosition();
    }
  }

  animateToPosition(row: number, col: number) {
    gsap.to(this, {
      x: col * (this.tileWidth + GAP),
      y: row * (this.tileHeight + GAP),
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => this.updateHtmlPosition()
    });
  }

  destroy() {
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.htmlElement && this.htmlElement.parentNode) {
      this.htmlElement.parentNode.removeChild(this.htmlElement);
    }
    super.destroy();
  }
} 