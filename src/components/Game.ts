import * as PIXI from 'pixi.js';
import { Boid, BoidColor } from '../boids/Boid';
import { PuzzleTile, tileData, GAP, GRID_ROWS, GRID_COLS, calculateTileDimensions } from './PuzzleTile';
import { Vector } from '../utils/vector';

export class Game {
  private app: PIXI.Application;
  private boids: Map<BoidColor, Boid[]> = new Map();
  private tiles: PuzzleTile[] = [];
  private mousePosition: Vector;
  private isCircularFlow: boolean = false; // Changed default to directional flow

  constructor() {
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

    // Create puzzle tiles (including the 9th tile)
    tileData.forEach(data => {
      const tile = new PuzzleTile(data.id, data.correctRow, data.correctCol);
      tile.setTilePosition(data.correctRow, data.correctCol);
      tilesContainer.addChild(tile);
      this.tiles.push(tile);
    });

    // Handle window resize
    window.addEventListener('resize', this.onResize.bind(this));

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

  private applyCircularFlow(boid: Boid): void {
    const cursor = this.mousePosition;
    const toCursor = cursor.copy().sub(boid.position);
    const distance = toCursor.mag();
    
    if (distance < 150) { // Interaction radius
      // Calculate tangential force (perpendicular to direction to cursor)
      const tangent = new Vector(-toCursor.y, toCursor.x);
      tangent.normalize();
      
      // Strength decreases with distance
      const strength = (1 - distance / 150) * 0.3;
      tangent.mult(strength);
      
      boid.applyForce(tangent);
    }
  }

  private applyDirectionalFlow(boid: Boid): void {
    const cursor = this.mousePosition;
    const toCursor = cursor.copy().sub(boid.position);
    const distance = toCursor.mag();
    
    if (distance < 150) { // Interaction radius
      // Calculate the angle between boid's velocity and direction to cursor
      const angle = Math.atan2(toCursor.y, toCursor.x) - Math.atan2(boid.velocity.y, boid.velocity.x);
      
      // Create a deflection force that's perpendicular to the direction to cursor
      const deflection = new Vector(-toCursor.y, toCursor.x);
      deflection.normalize();
      
      // Determine which side to deflect based on the angle
      if (Math.sin(angle) < 0) {
        deflection.mult(-1); // Reverse direction if needed
      }
      
      // Strength increases as the boid heads more directly toward the cursor
      const strength = (1 - distance / 150) * Math.abs(Math.sin(angle)) * 0.3;
      deflection.mult(strength);
      
      boid.applyForce(deflection);
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

  public getView(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }
} 