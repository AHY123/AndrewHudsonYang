import { Game } from './components/Game';
import './style.css';

// Create and initialize the game
const game = new Game();

// Add the game canvas to the page
const app = document.querySelector<HTMLDivElement>('#app')!;
app.appendChild(game.getView());
