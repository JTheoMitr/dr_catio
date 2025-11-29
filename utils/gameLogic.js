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
    rotation: 0, // 0 = 0° (horizontal left-right), 1 = 90° (vertical top-bottom), 2 = 180° (horizontal right-left), 3 = 270° (vertical bottom-top)
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
  
  // 0°: horizontal, left-right (top color on left, bottom color on right)
  // 90°: vertical, top-bottom (top color on top, bottom color on bottom)
  // 180°: horizontal, right-left (top color on right, bottom color on left) - flipped
  // 270°: vertical, bottom-top (top color on bottom, bottom color on top) - flipped
  
  if (treat.rotation === 0) {
    // Horizontal: left and right
    positions.push({ row, col });
    positions.push({ row, col: col + 1 });
  } else if (treat.rotation === 1) {
    // Vertical: top and bottom
    positions.push({ row, col });
    positions.push({ row: row + 1, col });
  } else if (treat.rotation === 2) {
    // Horizontal: right and left (flipped)
    positions.push({ row, col: col + 1 });
    positions.push({ row, col });
  } else if (treat.rotation === 3) {
    // Vertical: bottom and top (flipped)
    positions.push({ row: row + 1, col });
    positions.push({ row, col });
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

// Rotate fish treat (cycles through 0°, 90°, 180°, 270°)
export const rotateFishTreat = (treat) => {
  return {
    ...treat,
    rotation: (treat.rotation + 1) % 4,
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

// Check if a block is part of a treat (has an adjacent treat block)
const isPartOfTreat = (grid, row, col) => {
  const cell = grid[row][col];
  if (!cell || cell.type !== 'treat') return false;
  
  // Check for adjacent treat blocks (horizontal or vertical)
  // Horizontal: check left and right
  if (col > 0 && grid[row][col - 1] && grid[row][col - 1].type === 'treat') {
    return { type: 'horizontal', partnerRow: row, partnerCol: col - 1 };
  }
  if (col < GRID_WIDTH - 1 && grid[row][col + 1] && grid[row][col + 1].type === 'treat') {
    return { type: 'horizontal', partnerRow: row, partnerCol: col + 1 };
  }
  
  // Vertical: check top and bottom
  if (row > 0 && grid[row - 1][col] && grid[row - 1][col].type === 'treat') {
    return { type: 'vertical', partnerRow: row - 1, partnerCol: col };
  }
  if (row < GRID_HEIGHT - 1 && grid[row + 1][col] && grid[row + 1][col].type === 'treat') {
    return { type: 'vertical', partnerRow: row + 1, partnerCol: col };
  }
  
  return false;
};

// Check if both blocks of a treat can fall together
const canTreatFall = (grid, row1, col1, row2, col2, treatType) => {
  // Both blocks must have empty space below them
  if (treatType === 'horizontal') {
    // Horizontal treat: both blocks must be able to fall in their respective columns
    const canFall1 = row1 < GRID_HEIGHT - 1 && grid[row1 + 1][col1] === null;
    const canFall2 = row2 < GRID_HEIGHT - 1 && grid[row2 + 1][col2] === null;
    return canFall1 && canFall2;
  } else {
    // Vertical treat: the bottom block must be able to fall
    const bottomRow = Math.max(row1, row2);
    const topRow = Math.min(row1, row2);
    const col = col1; // Same column for vertical
    
    // Bottom block must have empty space below
    if (bottomRow >= GRID_HEIGHT - 1) return false;
    if (grid[bottomRow + 1][col] !== null) return false;
    
    // Top block must be able to move into bottom block's position
    return grid[bottomRow][col] === null || grid[bottomRow][col].type === 'treat';
  }
};

// Apply gravity (make blocks fall) - only in specified columns, only moves blocks (not circles)
// Treats (2-block pieces) must fall together - both blocks move or neither moves
export const applyGravity = (grid, affectedColumns = null) => {
  const newGrid = grid.map(row => [...row]);
  let moved = false;
  
  // Determine which columns to process
  const columnsToProcess = affectedColumns 
    ? new Set(affectedColumns) 
    : new Set(Array.from({ length: GRID_WIDTH }, (_, i) => i));
  
  // Track which cells we've already processed (to avoid moving the same treat twice)
  const processed = new Set();
  
  // Start from bottom and work up
  for (let row = GRID_HEIGHT - 2; row >= 0; row--) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      // Only process affected columns
      if (!columnsToProcess.has(col)) continue;
      
      const cellKey = `${row}-${col}`;
      if (processed.has(cellKey)) continue;
      
      const cell = newGrid[row][col];
      // Only move blocks (fish treats), never circles (cats)
      if (cell && cell.type === 'treat') {
        // Check if this block is part of a treat
        const treatInfo = isPartOfTreat(newGrid, row, col);
        
        if (treatInfo) {
          // This is part of a treat - both blocks must fall together
          const { partnerRow, partnerCol, type: treatType } = treatInfo;
          const partnerKey = `${partnerRow}-${partnerCol}`;
          
          // Check if both blocks can fall
          if (canTreatFall(newGrid, row, col, partnerRow, partnerCol, treatType)) {
            // Move both blocks together
            if (treatType === 'horizontal') {
              // Horizontal: move each block down in its own column
              newGrid[row + 1][col] = newGrid[row][col];
              newGrid[row][col] = null;
              newGrid[partnerRow + 1][partnerCol] = newGrid[partnerRow][partnerCol];
              newGrid[partnerRow][partnerCol] = null;
            } else {
              // Vertical: move the bottom block down, top block moves into bottom's position
              const bottomRow = Math.max(row, partnerRow);
              const topRow = Math.min(row, partnerRow);
              const colSame = col;
              
              // Move bottom block down
              newGrid[bottomRow + 1][colSame] = newGrid[bottomRow][colSame];
              // Move top block to bottom's old position
              newGrid[bottomRow][colSame] = newGrid[topRow][colSame];
              newGrid[topRow][colSame] = null;
            }
            
            processed.add(cellKey);
            processed.add(partnerKey);
            moved = true;
          }
        } else {
          // Single block (not part of a treat) - fall to the lowest empty space in its column
          // Find the lowest empty space below this block
          let lowestEmptyRow = row;
          for (let checkRow = row + 1; checkRow < GRID_HEIGHT; checkRow++) {
            if (newGrid[checkRow][col] === null) {
              lowestEmptyRow = checkRow;
            } else {
              // Hit something (block or circle) - stop here
              break;
            }
          }
          
          // Move block to the lowest empty space (if it can move)
          if (lowestEmptyRow > row) {
            newGrid[lowestEmptyRow][col] = newGrid[row][col];
            newGrid[row][col] = null;
            processed.add(cellKey);
            moved = true;
          }
        }
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

