import { GRID_WIDTH, GRID_HEIGHT, COLOR_VALUES } from '../constants/GameConstants';

// Generate a random color
export const getRandomColor = () => {
  return COLOR_VALUES[Math.floor(Math.random() * COLOR_VALUES.length)];
};

// Generate a random gun icon (2 blocks, can be same or different colors)
export const generateGunIcon = () => {
  const color1 = getRandomColor();
  const color2 = Math.random() < 0.5 ? color1 : getRandomColor();
  return {
    top: color1,
    bottom: color2,
    rotation: 0, // 0 = 0° (horizontal left-right), 1 = 90° (vertical top-bottom), 2 = 180° (horizontal right-left), 3 = 270° (vertical bottom-top)
  };
};

// Generate random mech enemies for initial board
export const generateRandomMechs = (count) => {
  const mechs = [];
  const positions = new Set();
  
  while (mechs.length < count) {
    const row = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2; // Avoid top rows
    const col = Math.floor(Math.random() * GRID_WIDTH);
    const key = `${row}-${col}`;
    
    if (!positions.has(key)) {
      positions.add(key);
      mechs.push({
        row,
        col,
        color: getRandomColor(),
      });
    }
  }
  
  return mechs;
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

// Get positions occupied by a gun icon
export const getGunIconPositions = (gunIcon, row, col) => {
  const positions = [];
  
  // 0°: horizontal, left-right (top color on left, bottom color on right)
  // 90°: vertical, top-bottom (top color on top, bottom color on bottom)
  // 180°: horizontal, right-left (top color on right, bottom color on left) - flipped
  // 270°: vertical, bottom-top (top color on bottom, bottom color on top) - flipped
  
  if (gunIcon.rotation === 0) {
    // Horizontal: left and right
    positions.push({ row, col });
    positions.push({ row, col: col + 1 });
  } else if (gunIcon.rotation === 1) {
    // Vertical: top and bottom
    positions.push({ row, col });
    positions.push({ row: row + 1, col });
  } else if (gunIcon.rotation === 2) {
    // Horizontal: right and left (flipped)
    positions.push({ row, col: col + 1 });
    positions.push({ row, col });
  } else if (gunIcon.rotation === 3) {
    // Vertical: bottom and top (flipped)
    positions.push({ row: row + 1, col });
    positions.push({ row, col });
  }
  
  return positions;
};

// Check if gun icon can be placed at position
export const canPlaceGunIcon = (grid, gunIcon, row, col) => {
  const positions = getGunIconPositions(gunIcon, row, col);
  
  for (const pos of positions) {
    if (!isValidPosition(pos.row, pos.col) || !isEmpty(grid, pos.row, pos.col)) {
      return false;
    }
  }
  
  return true;
};

// Rotate gun icon (cycles through 0°, 90°, 180°, 270°)
export const rotateGunIcon = (gunIcon) => {
  return {
    ...gunIcon,
    rotation: (gunIcon.rotation + 1) % 4,
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
  let mechCount = 0;
  
  matches.forEach(({ row, col }) => {
    const cell = newGrid[row][col];
    if (cell && cell.type === 'enemy') {
      mechCount++;
    }
    newGrid[row][col] = null;
  });
  
  return { grid: newGrid, mechCount };
};

// Check if a block is part of a gun icon (has an adjacent gun icon block)
const isPartOfGunIcon = (grid, row, col) => {
  const cell = grid[row][col];
  if (!cell || cell.type !== 'gunIcon') return false;
  
  // Check for adjacent gun icon blocks (horizontal or vertical)
  // Horizontal: check left and right
  if (col > 0 && grid[row][col - 1] && grid[row][col - 1].type === 'gunIcon') {
    return { type: 'horizontal', partnerRow: row, partnerCol: col - 1 };
  }
  if (col < GRID_WIDTH - 1 && grid[row][col + 1] && grid[row][col + 1].type === 'gunIcon') {
    return { type: 'horizontal', partnerRow: row, partnerCol: col + 1 };
  }
  
  // Vertical: check top and bottom
  if (row > 0 && grid[row - 1][col] && grid[row - 1][col].type === 'gunIcon') {
    return { type: 'vertical', partnerRow: row - 1, partnerCol: col };
  }
  if (row < GRID_HEIGHT - 1 && grid[row + 1][col] && grid[row + 1][col].type === 'gunIcon') {
    return { type: 'vertical', partnerRow: row + 1, partnerCol: col };
  }
  
  return false;
};

// Check if both blocks of a gun icon can fall together
const canGunIconFall = (grid, row1, col1, row2, col2, gunIconType) => {
  // Both blocks must have empty space below them
  if (gunIconType === 'horizontal') {
    // Horizontal gun icon: both blocks must be able to fall in their respective columns
    const canFall1 = row1 < GRID_HEIGHT - 1 && grid[row1 + 1][col1] === null;
    const canFall2 = row2 < GRID_HEIGHT - 1 && grid[row2 + 1][col2] === null;
    return canFall1 && canFall2;
  } else {
    // Vertical gun icon: the bottom block must be able to fall
    const bottomRow = Math.max(row1, row2);
    const topRow = Math.min(row1, row2);
    const col = col1; // Same column for vertical
    
    // Bottom block must have empty space below
    if (bottomRow >= GRID_HEIGHT - 1) return false;
    if (grid[bottomRow + 1][col] !== null) return false;
    
    // Top block must be able to move into bottom block's position
    return grid[bottomRow][col] === null || grid[bottomRow][col].type === 'gunIcon';
  }
};

// Apply gravity (make blocks fall) - only in specified columns, only moves blocks (not enemies)
// Gun icons (2-block pieces) must fall together - both blocks move or neither moves
export const applyGravity = (grid, affectedColumns = null) => {
  const newGrid = grid.map(row => [...row]);
  let moved = false;
  
  // Determine which columns to process
  const columnsToProcess = affectedColumns 
    ? new Set(affectedColumns) 
    : new Set(Array.from({ length: GRID_WIDTH }, (_, i) => i));
  
  // Track which cells we've already processed (to avoid moving the same gun icon twice)
  const processed = new Set();
  
  // FIRST PASS: Process gun icons (2-block pieces) from bottom to top
  // This ensures gun icons fall together properly
  for (let row = GRID_HEIGHT - 2; row >= 0; row--) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      // Only process affected columns
      if (!columnsToProcess.has(col)) continue;
      
      const cellKey = `${row}-${col}`;
      if (processed.has(cellKey)) continue;
      
      const cell = newGrid[row][col];
      // Only move blocks (gun icons), never enemies
      if (cell && cell.type === 'gunIcon') {
        // Check if this block is part of a gun icon
        const gunIconInfo = isPartOfGunIcon(newGrid, row, col);
        
        if (gunIconInfo) {
          // This is part of a gun icon - both blocks must fall together
          const { partnerRow, partnerCol, type: gunIconType } = gunIconInfo;
          const partnerKey = `${partnerRow}-${partnerCol}`;
          
          // Check if both blocks can fall
          if (canGunIconFall(newGrid, row, col, partnerRow, partnerCol, gunIconType)) {
            // Move both blocks together
            if (gunIconType === 'horizontal') {
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
        }
      }
    }
  }
  
  // SECOND PASS: Process single blocks (orphaned gun icon halves) from top to bottom
  // This ensures upper blocks move first, then lower blocks can fill the gaps
  for (let row = 0; row < GRID_HEIGHT - 1; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      // Only process affected columns
      if (!columnsToProcess.has(col)) continue;
      
      const cellKey = `${row}-${col}`;
      if (processed.has(cellKey)) continue;
      
      const cell = newGrid[row][col];
      // Only move blocks (gun icons), never enemies
      if (cell && cell.type === 'gunIcon') {
        // Check if this block is part of a gun icon
        const gunIconInfo = isPartOfGunIcon(newGrid, row, col);
        
        if (!gunIconInfo) {
          // Single block (not part of a gun icon) - fall to the lowest empty space in its column
          // Find the lowest empty space below this block
          let lowestEmptyRow = row;
          for (let checkRow = row + 1; checkRow < GRID_HEIGHT; checkRow++) {
            if (newGrid[checkRow][col] === null) {
              lowestEmptyRow = checkRow;
            } else {
              // Hit something (block or enemy) - stop here
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

// Check if level is complete (no mech enemies remaining)
export const isLevelComplete = (grid) => {
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      const cell = grid[row][col];
      if (cell && cell.type === 'enemy') {
        return false;
      }
    }
  }
  return true;
};

