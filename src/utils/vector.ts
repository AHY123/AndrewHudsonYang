import * as PIXI from 'pixi.js';

export class Vector {
  constructor(public x: number, public y: number) {}

  add(v: Vector): Vector {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector): Vector {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n: number): Vector {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number): Vector {
    if (n === 0) return this;
    this.x /= n;
    this.y /= n;
    return this;
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  setMag(n: number): Vector {
    return this.normalize().mult(n);
  }

  normalize(): Vector {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max: number): Vector {
    const mSq = this.x * this.x + this.y * this.y;
    if (mSq > max * max) {
      this.normalize().mult(max);
    }
    return this;
  }

  copy(): Vector {
    return new Vector(this.x, this.y);
  }

  dist(v: Vector): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static random2D(): Vector {
    const angle = Math.random() * Math.PI * 2;
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  public angleBetween(other: Vector): number {
    // Calculate the angle between this vector and another vector
    // Returns angle in radians, positive if this vector is to the left of other vector
    const dot = this.x * other.x + this.y * other.y;
    const mag1 = Math.sqrt(this.x * this.x + this.y * this.y);
    const mag2 = Math.sqrt(other.x * other.x + other.y * other.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    // Determine sign of angle using cross product
    const cross = this.x * other.y - this.y * other.x;
    return cross >= 0 ? angle : -angle;
  }
}

export function distance(a: PIXI.Point, b: PIXI.Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
} 