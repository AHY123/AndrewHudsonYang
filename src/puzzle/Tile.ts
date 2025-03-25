import * as PIXI from 'pixi.js';

export class Tile extends PIXI.Container {
    private readonly graphics: PIXI.Graphics;
    private readonly index: number;
    private currentPosition: { x: number; y: number };
    private targetPosition: { x: number; y: number };

    constructor(index: number, size: number) {
        super();
        this.index = index;
        this.graphics = new PIXI.Graphics();
        this.currentPosition = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        
        // Draw tile
        this.graphics.beginFill(0x2196f3);
        this.graphics.drawRect(0, 0, size, size);
        this.graphics.endFill();
        
        this.addChild(this.graphics);
        
        // Make interactive
        this.graphics.interactive = true;
        this.graphics.cursor = 'pointer';
    }

    public setPosition(x: number, y: number): void {
        this.currentPosition = { x, y };
        this.position.set(x, y);
    }

    public getIndex(): number {
        return this.index;
    }

    public getCurrentPosition(): { x: number; y: number } {
        return { ...this.currentPosition };
    }

    public getTargetPosition(): { x: number; y: number } {
        return { ...this.targetPosition };
    }

    public setTargetPosition(x: number, y: number): void {
        this.targetPosition = { x, y };
    }

    public getGraphics(): PIXI.Graphics {
        return this.graphics;
    }
} 