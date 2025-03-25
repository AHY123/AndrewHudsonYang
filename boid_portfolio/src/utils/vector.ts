import * as PIXI from 'pixi.js';

export function limit(vec: PIXI.Point, max: number) {
    const mag = Math.sqrt(vec.x ** 2 + vec.y ** 2);
    if (mag > max) {
        vec.x = (vec.x / mag) * max;
        vec.y = (vec.y / mag) * max;
    }
}

export function distance(a: PIXI.Point, b: PIXI.Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
} 