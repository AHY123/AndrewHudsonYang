import './style.css'
import * as PIXI from 'pixi.js'
import { Boid } from './boids/Boid'

// Initialize PixiJS Application
const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0xFFE5B4, // Darker pastel yellow for better contrast
    antialias: true,
})
document.body.appendChild(app.view as HTMLCanvasElement)

// Create container for boids
const boidContainer = new PIXI.Container()
app.stage.addChild(boidContainer)

// Create and initialize flock of boids
const boids: Boid[] = []
const numBoids = 100

for (let i = 0; i < numBoids; i++) {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    boids.push(new Boid(x, y, boidContainer))
}

// Track mouse position for interaction
const mousePosition = new PIXI.Point()
const canvas = app.view as HTMLCanvasElement
canvas.addEventListener('mousemove', (e: MouseEvent) => {
    mousePosition.x = e.clientX
    mousePosition.y = e.clientY
})

// Animation loop
app.ticker.add(() => {
    for (const boid of boids) {
        // Apply flocking behavior
        boid.flock(boids)
        
        // Optional: Repel from mouse cursor
        boid.repelFrom(mousePosition, 0.1, 100)
        
        // Update position
        boid.update()
    }
})
