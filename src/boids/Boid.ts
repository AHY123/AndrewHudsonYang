import * as PIXI from 'pixi.js';
import { limit, distance } from '../utils/vector';

// Flocking parameters
const MAX_SPEED = 6;
const MAX_FORCE = 0.05;
const PERCEPTION_RADIUS = 100;
const SEPARATION_RADIUS = 50;
const BOID_SIZE = 16; // Customizable size constant

export class Boid {
    private readonly sprite: PIXI.Graphics;
    private readonly position: PIXI.Point;
    private readonly velocity: PIXI.Point;
    private readonly acceleration: PIXI.Point;

    constructor(x: number, y: number, container: PIXI.Container) {
        if (!container) {
            throw new Error('Container is required for Boid initialization');
        }

        this.position = new PIXI.Point(x, y);
        this.velocity = new PIXI.Point(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
        this.acceleration = new PIXI.Point(0, 0);

        // Create visual representation as a triangle
        this.sprite = new PIXI.Graphics()
            .beginFill(0xFF69B4) // Hot pink for better contrast
            .moveTo(0, -BOID_SIZE) // Top point
            .lineTo(BOID_SIZE * 0.85, BOID_SIZE) // Right point
            .lineTo(-BOID_SIZE * 0.85, BOID_SIZE) // Left point
            .closePath()
            .endFill();

        this.sprite.x = x;
        this.sprite.y = y;
        container.addChild(this.sprite);
    }

    public applyForce(force: PIXI.Point): void {
        if (!force) {
            throw new Error('Force vector is required');
        }
        this.acceleration.x += force.x;
        this.acceleration.y += force.y;
    }

    public flock(boids: Boid[]): void {
        if (!Array.isArray(boids)) {
            throw new Error('Boids must be an array');
        }

        const alignment = new PIXI.Point(0, 0);
        const cohesion = new PIXI.Point(0, 0);
        const separation = new PIXI.Point(0, 0);
        let total = 0;

        for (const other of boids) {
            if (!(other instanceof Boid)) {
                console.warn('Invalid boid in flock array');
                continue;
            }

            const d = distance(this.position, other.position);
            if (other !== this && d < PERCEPTION_RADIUS) {
                // Alignment
                alignment.x += other.velocity.x;
                alignment.y += other.velocity.y;

                // Cohesion
                cohesion.x += other.position.x;
                cohesion.y += other.position.y;

                // Separation
                if (d < SEPARATION_RADIUS) {
                    const diff = new PIXI.Point(
                        this.position.x - other.position.x,
                        this.position.y - other.position.y
                    );
                    // Weight by distance
                    const factor = 1 / Math.max(d, 0.1);
                    diff.x *= factor;
                    diff.y *= factor;
                    separation.x += diff.x;
                    separation.y += diff.y;
                }

                total++;
            }
        }

        if (total > 0) {
            // Alignment
            alignment.x /= total;
            alignment.y /= total;
            alignment.x -= this.velocity.x;
            alignment.y -= this.velocity.y;
            limit(alignment, MAX_FORCE);

            // Cohesion
            cohesion.x /= total;
            cohesion.y /= total;
            cohesion.x -= this.position.x;
            cohesion.y -= this.position.y;
            limit(cohesion, MAX_FORCE);

            // Separation
            separation.x /= total;
            separation.y /= total;
            limit(separation, MAX_FORCE);

            // Apply forces with weights
            const alignmentWeight = 1.0;
            const cohesionWeight = 1.0;
            const separationWeight = 2;

            alignment.x *= alignmentWeight;
            alignment.y *= alignmentWeight;
            cohesion.x *= cohesionWeight;
            cohesion.y *= cohesionWeight;
            separation.x *= separationWeight;
            separation.y *= separationWeight;

            this.applyForce(alignment);
            this.applyForce(cohesion);
            this.applyForce(separation);
        }
    }

    public attractTo(point: PIXI.Point, strength: number = 0.05): void {
        if (!point) {
            throw new Error('Point is required for attraction');
        }
        const force = new PIXI.Point(
            point.x - this.position.x,
            point.y - this.position.y
        );
        limit(force, strength);
        this.applyForce(force);
    }

    public repelFrom(point: PIXI.Point, strength: number = 0.1, radius: number = 100): void {
        if (!point) {
            throw new Error('Point is required for repulsion');
        }
        const d = distance(this.position, point);
        if (d < radius) {
            const force = new PIXI.Point(
                this.position.x - point.x,
                this.position.y - point.y
            );
            const factor = 1 - (d / radius); // Stronger when closer
            force.x *= factor * strength;
            force.y *= factor * strength;
            this.applyForce(force);
        }
    }

    public update(): void {
        // Physics
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        limit(this.velocity, MAX_SPEED);
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Wrap around edges (torus)
        this.position.x = (this.position.x + window.innerWidth) % window.innerWidth;
        this.position.y = (this.position.y + window.innerHeight) % window.innerHeight;

        // Sync sprite position
        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;

        // Update rotation to point in direction of movement
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            // Add Math.PI/2 to align the triangle's top point with the direction
            this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI/2;
        }

        // Reset acceleration
        this.acceleration.set(0, 0);
    }

    // Getters for position and velocity (useful for debugging and testing)
    public getPosition(): PIXI.Point {
        return new PIXI.Point(this.position.x, this.position.y);
    }

    public getVelocity(): PIXI.Point {
        return new PIXI.Point(this.velocity.x, this.velocity.y);
    }

    public getSprite(): PIXI.Graphics {
        return this.sprite;
    }
} 