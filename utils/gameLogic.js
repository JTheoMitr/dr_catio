import { GRID_WIDTH, GRID_HEIGHT, COLOR_VALUES } from '../constants/GameConstants';

// Generate a random color
export const getRandomColor = () => {
  return COLOR_VALUES[Math.floor(Math.random() * COLOR_VALUES.length)];
};

// Generate a random fish treat (2 blocks, can be same or different colors)
export const generateFishTreat = () => {
  const color1 = getRandomColor();
  const color2 = Math.random() < 0.5 ? color1 : getRandomColor();
  return {
    top: color1,
    bottom: color2,
    rotation: 0, // 0 = horizontal (top-left, top-right), 1 = vertical (top, bottom)
  };
};

// Generate random cat heads for initial board
export const generateRandomCats = (count) => {
  const cats = [];
  const positions = new Set();
  
  while (cats.length < count) {
    const row = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2; // Avoid top rows
    const col = Math.floor(Math.random() * GRID_WIDTH);
    const key = `${row}-${col}`;
    
    if (!positions.has(key)) {
      positions.add(key);
      cats.push({
        row,
        col,
        color: getRandomColor(),
      });
    }
  }
  
  return cats;
};

// Check if a position is valid
export const isValidPosition = (row, col) => {
  return row >= 0 && row < GRID_HEIGHT && col >= 0 && col < GRID_WIDTH;
};

// Check if a position is empty in the grid
export const isEmpty = (grid, row, col) => {
  if (!isValidPosition(row, col)) return false;
  return grid[row][col] === null;
};

// Get positions occupied by a fish treat
export const getFishTreatPositions = (treat, row, col) => {
  const positions = [];
  
  if (treat.rotation === 0) {
    // Horizontal: left and right
    positions.push({ row, col });
    positions.push({ row, col: col + 1 });
  } else {
    // Vertical: top and bottom
    positions.push({ row, col });
    positions.push({ row: row + 1, col });
  }
  
  return positions;
};

// Check if fish treat can be placed at position
export const canPlaceFishTreat = (grid, treat, row, col) => {
  const positions = getFishTreatPositions(treat, row, col);
  
  for (const pos of positions) {
    if (!isValidPosition(pos.row, pos.col) || !isEmpty(grid, pos.row, pos.col)) {
      return false;
    }
  }
  
  return true;
};

// Rotate fish treat
export const rotateFishTreat = (treat) => {
  return {
    ...treat,
    rotation: treat.rotation === 0 ? 1 : 0,
  };
};

// Find matches (4 in a row horizontally or vertically)
export const findMatches = (grid) => {
  const matches = new Set();
  
  // Check horizontal matches
  for (let row = 0; row < GRID_HEIGHT; row++) {
    let startCol = 0;
    let currentColor = null;
    let count = 0;
    
    for (let col = 0; col < GRID_WIDTH; col++) {
      const cell = grid[row][col];
      const cellColor = cell ? cell.color : null;
      
      if (cellColor === currentColor && currentColor !== null) {
        // Continue the sequence
        count++;
      } else {
        // Sequence ended or changed
        if (count >= 4 && currentColor !== null) {
          // Found a match - mark all cells in the sequence
          for (let i = startCol; i < startCol + count; i++) {
            matches.add(`${row}-${i}`);
          }
        }
        
        // Start new sequence
        if (cellColor !== null) {
          currentColor = cellColor;
          startCol = col;
          count = 1;
        } else {
          currentColor = null;
          count = 0;
        }
      }
    }
    
    // Check if there's a match at the end of the row
    if (count >= 4 && currentColor !== null) {
      for (let i = startCol; i < startCol + count; i++) {
        matches.add(`${row}-${i}`);
      }
    }
  }
  
  // Check vertical matches
  for (let col = 0; col < GRID_WIDTH; col++) {
    let startRow = 0;
    let currentColor = null;
    let count = 0;
    
    for (let row = 0; row < GRID_HEIGHT; row++) {
      const cell = grid[row][col];
      const cellColor = cell ? cell.color : null;
      
      if (cellColor === currentColor && currentColor !== null) {
        // Continue the sequence
        count++;
      } else {
        // Sequence ended or changed
        if (count >= 4 && currentColor !== null) {
          // Found a match - mark all cells in the sequence
          for (let i = startRow; i < startRow + count; i++) {
            matches.add(`${i}-${col}`);
          }
        }
        
        // Start new sequence
        if (cellColor !== null) {
          currentColor = cellColor;
          startRow = row;
          count = 1;
        } else {
          currentColor = null;
          count = 0;
        }
      }
    }
    
    // Check if there's a match at the end of the column
    if (count >= 4 && currentColor !== null) {
      for (let i = startRow; i < startRow + count; i++) {
        matches.add(`${i}-${col}`);
      }
    }
  }
  
  return Array.from(matches).map(key => {
    const [row, col] = key.split('-').map(Number);
    return { row, col };
  });
};

// Clear matches from grid
export const clearMatches = (grid, matches) => {
  const newGrid = grid.map(row => [...row]);
  let catCount = 0;
  
  matches.forEach(({ row, col }) => {
    const cell = newGrid[row][col];
    if (cell && cell.type === 'cat') {
      catCount++;
    }
    newGrid[row][col] = null;
  });
  
  return { grid: newGrid, catCount };
};

// Apply gravity (make blocks fall) - only in specified columns, only moves blocks (not circles)
export const applyGravity = (grid, affectedColumns = null) => {
  const newGrid = grid.map(row => [...row]);
  let moved = false;
  
  // Determine which columns to process
  const columnsToProcess = affectedColumns 
    ? new Set(affectedColumns) 
    : new Set(Array.from({ length: GRID_WIDTH }, (_, i) => i));
  
  // Start from bottom and work up
  for (let row = GRID_HEIGHT - 2; row >= 0; row--) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      // Only process affected columns
      if (!columnsToProcess.has(col)) continue;
      
      const cell = newGrid[row][col];
      // Only move blocks (fish treats), never circles (cats)
      if (cell && cell.type === 'treat' && newGrid[row + 1][col] === null) {
        // Move block down
        newGrid[row + 1][col] = newGrid[row][col];
        newGrid[row][col] = null;
        moved = true;
      }
    }
  }
  
  return { grid: newGrid, moved };
};

// Check if game is over (any block in top row)
export const isGameOver = (grid) => {
  for (let col = 0; col < GRID_WIDTH; col++) {
    if (grid[0][col] !== null) {
      return true;
    }
  }
  return false;
};

// Check if level is complete (no cats remaining)
export const isLevelComplete = (grid) => {
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      const cell = grid[row][col];
      if (cell && cell.type === 'cat') {
        return false;
      }
    }
  }
  return true;
};

