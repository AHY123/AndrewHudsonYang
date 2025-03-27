import * as PIXI from 'pixi.js';
import { Vector } from '../utils/vector';

// Flocking parameters
const PERCEPTION_RADIUS = 150;
const SEPARATION_RADIUS = 40;
const BOID_SIZE = 6; // Smaller size for better visibility

// Color definitions
export enum BoidColor {
    PINK = 0xFF69B4,    // Hot Pink
    BLUE = 0x4169E1,    // Royal Blue
    GREEN = 0x32CD32,   // Lime Green
    PURPLE = 0x9370DB,  // Medium Purple
    ORANGE = 0xFFA500,  // Orange
    CYAN = 0x00CED1,    // Dark Turquoise
    RED = 0xFF4500,     // Orange Red
    YELLOW = 0xFFD700,  // Gold
    MAGENTA = 0xFF00FF, // Magenta
    TEAL = 0x008080     // Teal
}

export class Boid {
    position: Vector;
    velocity: Vector;
    acceleration: Vector;
    maxForce: number = 0.1;
    maxSpeed: number = 3;
    graphics?: PIXI.Graphics;
    rotation: number = 0;
    color: BoidColor;

    constructor(x: number, y: number, color: BoidColor, container?: PIXI.Container) {
        this.position = new Vector(x, y);
        this.velocity = Vector.random2D();
        this.velocity.setMag(this.maxSpeed);
        this.acceleration = new Vector(0, 0);
        this.color = color;

        if (container) {
            // Create visual representation as a triangle
            this.graphics = new PIXI.Graphics();
            this.graphics.beginFill(this.color);
            // Draw an isometric triangle
            this.graphics.moveTo(0, -BOID_SIZE); // Top point
            this.graphics.lineTo(BOID_SIZE * 0.85, BOID_SIZE); // Bottom right
            this.graphics.lineTo(-BOID_SIZE * 0.85, BOID_SIZE); // Bottom left
            this.graphics.closePath();
            this.graphics.endFill();
            
            this.graphics.x = x;
            this.graphics.y = y;
            container.addChild(this.graphics);
        }
    }

    get x(): number {
        return this.position.x;
    }

    get y(): number {
        return this.position.y;
    }

    public applyForce(force: Vector): void {
        if (!force) {
            throw new Error('Force vector is required');
        }
        this.acceleration.add(force);
    }

    private wrappedDistance(other: Boid): number {
        // Early return if boids are far apart
        const dx = Math.abs(this.position.x - other.position.x);
        const dy = Math.abs(this.position.y - other.position.y);
        
        // If either distance is more than perception radius, they're definitely too far
        if (dx > PERCEPTION_RADIUS || dy > PERCEPTION_RADIUS) {
            return PERCEPTION_RADIUS + 1; // Return value that will be ignored by flocking
        }

        // Only calculate wrapped distance if boids are close enough
        let wrappedDx = dx;
        let wrappedDy = dy;

        if (dx > window.innerWidth / 2) {
            wrappedDx = window.innerWidth - dx;
        }
        if (dy > window.innerHeight / 2) {
            wrappedDy = window.innerHeight - dy;
        }

        return Math.sqrt(wrappedDx * wrappedDx + wrappedDy * wrappedDy);
    }

    public flock(boids: Boid[]): void {
        if (!Array.isArray(boids)) {
            throw new Error('Boids must be an array');
        }

        const alignment = new Vector(0, 0);
        const cohesion = new Vector(0, 0);
        const separation = new Vector(0, 0);
        let total = 0;

        for (const other of boids) {
            if (!(other instanceof Boid)) {
                console.warn('Invalid boid in flock array');
                continue;
            }

            // Only consider boids of the same color
            if (other.color !== this.color) continue;

            const d = this.wrappedDistance(other);
            if (other !== this && d < PERCEPTION_RADIUS) {
                // Alignment - use the average velocity direction
                alignment.add(other.velocity);

                // Cohesion - calculate wrapped position
                const wrappedPos = new Vector(other.position.x, other.position.y);
                // Adjust position if it's on the other side of the screen
                if (Math.abs(this.position.x - other.position.x) > window.innerWidth / 2) {
                    wrappedPos.x += this.position.x > window.innerWidth / 2 ? -window.innerWidth : window.innerWidth;
                }
                if (Math.abs(this.position.y - other.position.y) > window.innerHeight / 2) {
                    wrappedPos.y += this.position.y > window.innerHeight / 2 ? -window.innerHeight : window.innerHeight;
                }
                cohesion.add(wrappedPos);

                // Separation
                if (d < SEPARATION_RADIUS) {
                    const diff = this.position.copy().sub(wrappedPos);
                    // Weight by distance
                    const factor = 1 / Math.max(d, 0.1);
                    diff.mult(factor);
                    separation.add(diff);
                }

                total++;
            }
        }

        if (total > 0) {
            // Alignment - normalize and scale to maintain speed
            alignment.div(total);
            alignment.setMag(this.maxSpeed);
            alignment.sub(this.velocity);
            alignment.limit(this.maxForce);

            // Cohesion
            cohesion.div(total);
            cohesion.sub(this.position);
            cohesion.limit(this.maxForce);

            // Separation
            separation.div(total);
            separation.limit(this.maxForce);

            // Apply forces with weights
            const alignmentWeight = 0.3;
            const cohesionWeight = 0.5;
            const separationWeight = 1.0;

            alignment.mult(alignmentWeight);
            cohesion.mult(cohesionWeight);
            separation.mult(separationWeight);

            this.applyForce(alignment);
            this.applyForce(cohesion);
            this.applyForce(separation);
        }
    }

    public attractTo(point: Vector, strength: number = 0.05): void {
        if (!point) {
            throw new Error('Point is required for attraction');
        }
        const force = this.position.copy().sub(point);
        force.limit(strength);
        this.applyForce(force);
    }

    public repelFrom(point: Vector, strength: number = 0.1, radius: number = 100): void {
        if (!point) {
            throw new Error('Point is required for repulsion');
        }
        const d = this.position.dist(point);
        if (d < radius) {
            const force = this.position.copy().sub(point);
            const factor = 1 - (d / radius); // Stronger when closer
            force.mult(factor * strength);
            this.applyForce(force);
        }
    }

    public update(boids: Boid[]): void {
        this.flock(boids);
        
        // Update velocity and position
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        
        // Update rotation to match velocity direction
        this.rotation = Math.atan2(this.velocity.y, this.velocity.x);
        
        // Reset acceleration
        this.acceleration.mult(0);
        
        // Wrap around screen edges
        this.edges();
    }

    private edges(): void {
        if (this.position.x < 0) this.position.x = window.innerWidth;
        if (this.position.x > window.innerWidth) this.position.x = 0;
        if (this.position.y < 0) this.position.y = window.innerHeight;
        if (this.position.y > window.innerHeight) this.position.y = 0;

        // Update graphics position if it exists
        if (this.graphics) {
            this.graphics.x = this.position.x;
            this.graphics.y = this.position.y;
            // Add PI/2 to align the triangle's point with the direction of movement
            this.graphics.rotation = this.rotation + Math.PI/2;
        }
    }

    // Getters for position and velocity (useful for debugging and testing)
    public getPosition(): Vector {
        return this.position.copy();
    }

    public getVelocity(): Vector {
        return this.velocity.copy();
    }

    public getSprite(): PIXI.Graphics {
        return this.graphics!;
    }
} 