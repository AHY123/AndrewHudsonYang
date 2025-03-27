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
}

export function distance(a: PIXI.Point, b: PIXI.Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
} 