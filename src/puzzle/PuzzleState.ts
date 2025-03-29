// Type for tile IDs (null represents empty slot)
export type TileId = number | null;

export class PuzzleState {
    private grid: TileId[][];
    private readonly rows: number = 3;
    private readonly cols: number = 3;

    constructor() {
        // Initialize grid with solved state
        this.grid = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, null]
        ];
    }

    // Convert 1D index to 2D position
    public indexToPos(index: number): [number, number] {
        return [Math.floor(index / this.cols), index % this.cols];
    }

    // Convert 2D position to 1D index
    public posToIndex(row: number, col: number): number {
        return row * this.cols + col;
    }

    // Get current state of the grid
    public getGrid(): TileId[][] {
        return this.grid.map(row => [...row]); // Return a deep copy
    }

    // Get current state as a flat array
    public getFlatGrid(): TileId[] {
        return this.grid.flat();
    }

    // Find position of a specific tile
    public findTilePosition(tileId: TileId): [number, number] | null {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === tileId) {
                    return [row, col];
                }
            }
        }
        return null;
    }

    // Find position of empty slot
    public findEmptySlot(): [number, number] {
        const emptyPos = this.findTilePosition(null);
        if (!emptyPos) {
            throw new Error('Empty slot not found');
        }
        return emptyPos;
    }

    // Check if a tile can move to the empty slot
    public canMove(tileRow: number, tileCol: number): boolean {
        const [emptyRow, emptyCol] = this.findEmptySlot();
        const dx = Math.abs(tileCol - emptyCol);
        const dy = Math.abs(tileRow - emptyRow);
        return (dx + dy === 1); // Must be exactly one tile away (orthogonally)
    }

    // Move a tile to the empty slot
    public moveTile(tileRow: number, tileCol: number): void {
        const [emptyRow, emptyCol] = this.findEmptySlot();
        
        if (!this.canMove(tileRow, tileCol)) {
            return;
        }

        // Swap in logical grid
        const tileId = this.grid[tileRow][tileCol];
        this.grid[emptyRow][emptyCol] = tileId;
        this.grid[tileRow][tileCol] = null;
    }

    // Check if puzzle is solved
    public isSolved(): boolean {
        let expected = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (row === 2 && col === 2) {
                    if (this.grid[row][col] !== null) return false;
                } else {
                    if (this.grid[row][col] !== expected) return false;
                    expected++;
                }
            }
        }
        return true;
    }

    // Count inversions in the grid (excluding empty tile)
    private countInversions(): number {
        const flatGrid = this.getFlatGrid().filter(id => id !== null) as number[];
        let inversions = 0;
        
        for (let i = 0; i < flatGrid.length; i++) {
            for (let j = i + 1; j < flatGrid.length; j++) {
                if (flatGrid[i] > flatGrid[j]) {
                    inversions++;
                }
            }
        }
        
        return inversions;
    }

    // Check if the current configuration is solvable
    private isSolvable(): boolean {
        // For a 3x3 puzzle, it's solvable if number of inversions is even
        return this.countInversions() % 2 === 0;
    }

    // Shuffle the puzzle by performing random valid moves
    public shuffle(times: number = 50): void {
        // First perform random moves
        for (let i = 0; i < times; i++) {
            const [emptyRow, emptyCol] = this.findEmptySlot();
            const neighbors: Array<[number, number]> = [
                [emptyRow - 1, emptyCol] as [number, number],
                [emptyRow + 1, emptyCol] as [number, number],
                [emptyRow, emptyCol - 1] as [number, number],
                [emptyRow, emptyCol + 1] as [number, number],
            ].filter(([r, c]) => 
                r >= 0 && r < this.rows && 
                c >= 0 && c < this.cols && 
                this.grid[r][c] !== null
            );

            if (neighbors.length > 0) {
                const [targetRow, targetCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.moveTile(targetRow, targetCol);
            }
        }

        // If the resulting configuration is not solvable, make one more move to make it solvable
        if (!this.isSolvable()) {
            const [emptyRow, emptyCol] = this.findEmptySlot();
            const neighbors: Array<[number, number]> = [
                [emptyRow - 1, emptyCol] as [number, number],
                [emptyRow + 1, emptyCol] as [number, number],
                [emptyRow, emptyCol - 1] as [number, number],
                [emptyRow, emptyCol + 1] as [number, number],
            ].filter(([r, c]) => 
                r >= 0 && r < this.rows && 
                c >= 0 && c < this.cols && 
                this.grid[r][c] !== null
            );

            if (neighbors.length > 0) {
                const [targetRow, targetCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.moveTile(targetRow, targetCol);
            }
        }
    }
} 