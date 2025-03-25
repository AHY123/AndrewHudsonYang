import * as PIXI from 'pixi.js';
import { Boid } from './Boid';

export class BoidSim extends PIXI.Container {
    private boids: Boid[] = [];
    private readonly simWidth: number;
    private readonly simHeight: number;

    constructor(width: number, height: number, numBoids: number = 50) {
        super();
        this.simWidth = width;
        this.simHeight = height;

        // Create initial boids
        for (let i = 0; i < numBoids; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            this.boids.push(new Boid(x, y, this));
        }
    }

    public update(): void {
        for (const boid of this.boids) {
            boid.update();
        }
    }

    public getBoids(): Boid[] {
        return this.boids;
    }

    public addBoid(x: number, y: number): void {
        this.boids.push(new Boid(x, y, this));
    }

    public removeBoid(boid: Boid): void {
        const index = this.boids.indexOf(boid);
        if (index > -1) {
            this.boids.splice(index, 1);
        }
    }

    public clear(): void {
        this.boids = [];
        this.removeChildren();
    }

    public getSimWidth(): number {
        return this.simWidth;
    }

    public getSimHeight(): number {
        return this.simHeight;
    }
} 