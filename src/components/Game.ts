import * as PIXI from 'pixi.js';
import { Boid, BoidColor } from '../boids/Boid';
import { PuzzleTile, tileData, GAP, GRID_ROWS, GRID_COLS, calculateTileDimensions } from './PuzzleTile';
import { Vector } from '../utils/vector';
import { PuzzleState } from '../puzzle/PuzzleState';

export class Game {
  private app: PIXI.Application;
  private boids: Map<BoidColor, Boid[]> = new Map();
  private tiles: PuzzleTile[] = [];
  private mousePosition: Vector;
  private isCircularFlow: boolean = false; // Changed default to directional flow
  private puzzleState: PuzzleState;
  private shuffleButton: HTMLButtonElement | null = null;

  constructor() {
    // Initialize puzzle state
    this.puzzleState = new PuzzleState();

    // Create PixiJS application
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xFFE5B4,
      resolution: Math.max(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    document.body.appendChild(this.app.view as HTMLCanvasElement);

    // Track mouse position
    this.mousePosition = new Vector(0, 0);
    window.addEventListener('mousemove', (e: MouseEvent) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
    });

    // Create boid container for background simulation
    const boidContainer = new PIXI.Container();
    this.app.stage.addChild(boidContainer);

    // Initialize boids for each color
    const boidsPerColor = 50; // 500 total boids divided among 10 colors
    const colors: BoidColor[] = [
      BoidColor.PINK,
      BoidColor.BLUE,
      BoidColor.GREEN,
      BoidColor.PURPLE,
      BoidColor.ORANGE,
      BoidColor.CYAN,
      BoidColor.RED,
      BoidColor.YELLOW,
      BoidColor.MAGENTA,
      BoidColor.TEAL
    ];
    colors.forEach(color => {
      const colorBoids: Boid[] = [];
      for (let i = 0; i < boidsPerColor; i++) {
        const boid = new Boid(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
          color,
          boidContainer
        );
        colorBoids.push(boid);
      }
      this.boids.set(color, colorBoids);
    });

    // Create tiles container
    const tilesContainer = new PIXI.Container();
    const tileDimensions = calculateTileDimensions();
    tilesContainer.position.set(
      (window.innerWidth - (GRID_COLS * (tileDimensions.width + GAP) - GAP)) / 2,
      (window.innerHeight - (GRID_ROWS * (tileDimensions.height + GAP) - GAP)) / 2
    );
    this.app.stage.addChild(tilesContainer);

    // Create puzzle tiles
    tileData.forEach(data => {
      const tile = new PuzzleTile(data.id, data.correctRow, data.correctCol);
      tile.setTilePosition(data.correctRow, data.correctCol);
      
      // Listen for tile click events
      tile.on('tileclick', (tile: PuzzleTile) => this.handleTileClick(tile));
      
      tilesContainer.addChild(tile);
      this.tiles.push(tile);
    });

    // Handle window resize
    window.addEventListener('resize', this.onResize.bind(this));

    // Create shuffle button
    this.createShuffleButton();

    // Start the animation loop
    this.app.ticker.add(this.update.bind(this));

    // Add keyboard listener to toggle flow pattern
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ') { // Space bar to toggle
        this.isCircularFlow = !this.isCircularFlow;
        console.log(`Switched to ${this.isCircularFlow ? 'circular' : 'directional'} flow`);
      }
    });
  }

  private handleTileClick(tile: PuzzleTile): void {
    const [tileRow, tileCol] = this.puzzleState.findTilePosition(tile.id) || [0, 0];
    
    if (this.puzzleState.canMove(tileRow, tileCol)) {
      // Get empty slot position
      const [emptyRow, emptyCol] = this.puzzleState.findEmptySlot();
      
      // Update puzzle state
      this.puzzleState.moveTile(tileRow, tileCol);
      
      // Find the empty tile (id 8)
      const emptyTile = this.tiles.find(t => t.id === 8);
      if (emptyTile) {
        // Move the empty tile to the clicked tile's position
        emptyTile.animateToPosition(tileRow, tileCol);
        // Move the clicked tile to the empty position
        tile.animateToPosition(emptyRow, emptyCol);
      }
      
      // Check if puzzle is solved
      if (this.puzzleState.isSolved()) {
        console.log('Puzzle solved!');
        // TODO: Add puzzle completion effects
      }
    }
  }

  private applyCircularFlow(boid: Boid): void {
    const dx = this.mousePosition.x - boid.position.x;
    const dy = this.mousePosition.y - boid.position.y;
    const distanceSquared = dx * dx + dy * dy;
    
    if (distanceSquared < 22500) { // 150 * 150
      // Calculate the angle between boid's velocity and direction to cursor
      const toCursor = new Vector(dx, dy);
      const angle = toCursor.angleBetween(boid.velocity);
      
      // Create tangential force (perpendicular to direction to cursor)
      const tangent = new Vector(-dy, dx);
      tangent.normalize();
      
      // Determine which way to flow based on which side of the cursor the boid is approaching from
      if (angle < 0) {
        tangent.mult(-1); // Reverse direction if needed
      }
      
      // Smooth exponential falloff
      const distance = Math.sqrt(distanceSquared);
      const strength = Math.exp(-distance / 100) * 0.3; // 75 is the "half-life" distance
      tangent.mult(strength);
      
      boid.applyForce(tangent);
    }
  }

  private applyDirectionalFlow(boid: Boid): void {
    const dx = this.mousePosition.x - boid.position.x;
    const dy = this.mousePosition.y - boid.position.y;
    const distanceSquared = dx * dx + dy * dy;
    
    if (distanceSquared < 22500) { // 150 * 150
      // Calculate the angle between boid's velocity and direction to cursor
      const toCursor = new Vector(dx, dy);
      const angle = toCursor.angleBetween(boid.velocity);
      
      // If boid is moving away from cursor (angle > 90 degrees), apply scatter force
      if (Math.abs(angle) > Math.PI / 2) {
        // Create a scatter force in the direction of current velocity
        const scatter = boid.velocity.copy();
        scatter.normalize();
        
        // Smooth exponential falloff for scatter
        const distance = Math.sqrt(distanceSquared);
        const strength = Math.exp(-distance / 50) * 0.5; // 75 is the "half-life" distance
        scatter.mult(strength);
        
        boid.applyForce(scatter);
      } else {
        // Create a charge force towards the cursor
        const charge = toCursor.copy();
        charge.normalize();
        
        // Smooth exponential falloff for charge
        const distance = Math.sqrt(distanceSquared);
        const strength = Math.exp(-distance / 50) * 0.5; // 75 is the "half-life" distance
        charge.mult(strength);
        
        boid.applyForce(charge);
      }
    }
  }

  private update() {
    // Update boid positions for each color group
    this.boids.forEach((colorBoids) => {
      colorBoids.forEach(boid => {
        boid.update(colorBoids); // Only pass boids of the same color
        
        // Apply cursor interaction based on selected pattern
        if (this.isCircularFlow) {
          this.applyCircularFlow(boid);
        } else {
          this.applyDirectionalFlow(boid);
        }
      });
    });

    // Update boid positions in each tile viewport
    this.tiles.forEach(tile => {
      // Get all boids for the viewport
      const allBoids = Array.from(this.boids.values()).flat();
      tile.updateBoids(allBoids);
    });
  }

  private onResize() {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);

    // Center the tiles container
    if (this.app.stage.children[1]) {
      const tilesContainer = this.app.stage.children[1];
      const tileDimensions = calculateTileDimensions();
      tilesContainer.position.set(
        (window.innerWidth - (GRID_COLS * (tileDimensions.width + GAP) - GAP)) / 2,
        (window.innerHeight - (GRID_ROWS * (tileDimensions.height + GAP) - GAP)) / 2
      );
    }
  }

  private createShuffleButton(): void {
    this.shuffleButton = document.createElement('button');
    this.shuffleButton.textContent = 'Shuffle';
    this.shuffleButton.className = 'shuffle-button';
    
    // Style the button
    Object.assign(this.shuffleButton.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '10px 20px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      color: '#FFE5B4',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      zIndex: '1000',
      transition: 'background-color 0.2s',
    });

    // Add hover effect
    this.shuffleButton.onmouseover = () => {
      if (this.shuffleButton) {
        this.shuffleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      }
    };
    this.shuffleButton.onmouseout = () => {
      if (this.shuffleButton) {
        this.shuffleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      }
    };

    // Add click handler
    this.shuffleButton.onclick = () => this.handleShuffle();

    // Add to document
    document.body.appendChild(this.shuffleButton);
  }

  private handleShuffle(): void {
    // Shuffle the puzzle state
    this.puzzleState.shuffle();

    // Update visual positions of all tiles
    const grid = this.puzzleState.getGrid();
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const tileId = grid[row][col];
        // Find the tile that should be at this position
        const tile = this.tiles.find(t => t.id === tileId);
        if (tile) {
          tile.animateToPosition(row, col);
        }
      }
    }

    // Ensure empty tile is visible and in correct position
    const emptyTile = this.tiles.find(t => t.id === 8);
    if (emptyTile) {
      emptyTile.alpha = 0.5; // Make empty tile semi-transparent
      const [emptyRow, emptyCol] = this.puzzleState.findEmptySlot();
      emptyTile.animateToPosition(emptyRow, emptyCol);
    }
  }

  public getView(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }
} 