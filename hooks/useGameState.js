import { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_WIDTH, GRID_HEIGHT, STARTING_CAT_COUNT, CATS_PER_LEVEL, BASE_SCORE_PER_CAT, MULTIPLIER_PER_ADDITIONAL_CAT, GAME_STATES } from '../constants/GameConstants';
import {
  generateFishTreat,
  generateRandomCats,
  canPlaceFishTreat,
  rotateFishTreat,
  findMatches,
  clearMatches,
  applyGravity,
  isGameOver,
  isLevelComplete,
} from '../utils/gameLogic';

const FALL_INTERVAL = 1000; // 1 second per fall

const useGameState = () => {
  const [grid, setGrid] = useState(() => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
    return newGrid;
  });
  
  const [currentTreat, setCurrentTreat] = useState(null);
  const [treatPosition, setTreatPosition] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState(GAME_STATES.PLAYING);
  const [particles, setParticles] = useState([]);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  
  const fallTimerRef = useRef(null);
  const gravityTimerRef = useRef(null);
  const gridRef = useRef(grid);
  const currentTreatRef = useRef(currentTreat);
  const treatPositionRef = useRef(treatPosition);
  const particleIdCounter = useRef(0);
  
  // Keep refs in sync
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  
  useEffect(() => {
    currentTreatRef.current = currentTreat;
  }, [currentTreat]);
  
  useEffect(() => {
    treatPositionRef.current = treatPosition;
  }, [treatPosition]);

  // Initialize game
  const initializeLevel = useCallback((levelNum) => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
    const catCount = STARTING_CAT_COUNT + (levelNum - 1) * CATS_PER_LEVEL;
    const cats = generateRandomCats(catCount);
    
    cats.forEach(cat => {
      newGrid[cat.row][cat.col] = {
        type: 'cat',
        color: cat.color,
      };
    });
    
    setGrid(newGrid);
    setCurrentTreat(generateFishTreat());
    setTreatPosition({ row: 0, col: Math.floor(GRID_WIDTH / 2) - 1 });
    setGameState(GAME_STATES.PLAYING);
    setAnimationTrigger(null); // Reset animation trigger
  }, []);

  // Place treat on grid
  const placeTreat = useCallback((treat, position, currentGrid) => {
    if (!treat || !position) return;
    
    const newGrid = currentGrid.map(row => [...row]);
    const treatPositions = getTreatPositions(treat, position.row, position.col);
    
    treatPositions.forEach(({ row, col, isTop }) => {
      newGrid[row][col] = {
        type: 'treat',
        color: isTop ? treat.top : treat.bottom,
      };
    });
    
    setGrid(newGrid);
    setCurrentTreat(generateFishTreat());
    setTreatPosition({ row: 0, col: Math.floor(GRID_WIDTH / 2) - 1 });
    
    // Check for matches
    checkMatches(newGrid);
    
    return newGrid; // Return the new grid
  }, []);

  // Get treat positions
  const getTreatPositions = (treat, row, col) => {
    const positions = [];
    
    // 0°: horizontal, left-right (top color on left, bottom color on right)
    // 90°: vertical, top-bottom (top color on top, bottom color on bottom)
    // 180°: horizontal, right-left (top color on right, bottom color on left) - flipped
    // 270°: vertical, bottom-top (top color on bottom, bottom color on top) - flipped
    
    if (treat.rotation === 0) {
      // Horizontal: left and right
      positions.push({ row, col, isTop: true });
      positions.push({ row, col: col + 1, isTop: false });
    } else if (treat.rotation === 1) {
      // Vertical: top and bottom
      positions.push({ row, col, isTop: true });
      positions.push({ row: row + 1, col, isTop: false });
    } else if (treat.rotation === 2) {
      // Horizontal: right and left (flipped)
      positions.push({ row, col: col + 1, isTop: true });
      positions.push({ row, col, isTop: false });
    } else if (treat.rotation === 3) {
      // Vertical: bottom and top (flipped)
      positions.push({ row: row + 1, col, isTop: true });
      positions.push({ row, col, isTop: false });
    }
    
    return positions;
  };

  // Check for matches and clear them
  const checkMatches = useCallback((gridToCheck) => {
    let currentGrid = gridToCheck.map(row => [...row]);
    let totalCatsFed = 0;
    let allMatches = [];
    const matchColors = new Map(); // Store colors for particles
    const affectedColumns = new Set(); // Track which columns had cells cleared
    
    // Keep checking for matches until no more are found
    while (true) {
      const matches = findMatches(currentGrid);
      if (matches.length === 0) break;
      
      // Track ALL columns where cells will be cleared (important for treats spanning columns)
      // Also include adjacent columns to catch orphaned treat pieces (other half of a treat)
      matches.forEach(({ col }) => {
        affectedColumns.add(col);
        // Include adjacent columns to catch the other half of treats that span columns
        if (col > 0) affectedColumns.add(col - 1);
        if (col < GRID_WIDTH - 1) affectedColumns.add(col + 1);
      });
      
      // Store colors before clearing
      matches.forEach(({ row, col }) => {
        const cell = currentGrid[row][col];
        if (cell) {
          const key = `${row}-${col}`;
          matchColors.set(key, cell.color);
        }
      });
      
      allMatches = [...allMatches, ...matches];
      const result = clearMatches(currentGrid, matches);
      currentGrid = result.grid;
      totalCatsFed += result.catCount;
      
      // After clearing, ensure all columns with blocks that can fall are included
      // This catches orphaned blocks (the other half of a treat)
      for (let col = 0; col < GRID_WIDTH; col++) {
        for (let row = 0; row < GRID_HEIGHT - 1; row++) {
          const cell = currentGrid[row][col];
          // If there's a block with empty space below it, and this column is adjacent to affected columns
          // or is already affected, ensure it's processed
          if (cell && cell.type === 'treat' && currentGrid[row + 1][col] === null) {
            // Check if this column is adjacent to any affected column
            const isAdjacent = Array.from(affectedColumns).some(affectedCol => 
              Math.abs(col - affectedCol) <= 1
            );
            if (isAdjacent) {
              affectedColumns.add(col);
            }
          }
        }
      }
      
      // Apply gravity only to affected columns (where cells were cleared)
      // This will make any blocks above the cleared area fall, including
      // orphaned blocks (the other half of a treat if only one half was cleared)
      // The gravity loop continues until no more blocks can fall
      let moved = true;
      let gravityIterations = 0;
      const maxGravityIterations = GRID_HEIGHT * 2; // Safety limit
      
      while (moved && gravityIterations < maxGravityIterations) {
        gravityIterations++;
        const gravityResult = applyGravity(currentGrid, Array.from(affectedColumns));
        currentGrid = gravityResult.grid;
        moved = gravityResult.moved;
        
        // Check for new matches after gravity (only in affected columns)
        const newMatches = findMatches(currentGrid);
        if (newMatches.length > 0) {
          // Track columns of new matches
          const newAffectedColumns = new Set();
          newMatches.forEach(({ col }) => {
            if (affectedColumns.has(col)) {
              newAffectedColumns.add(col);
            }
          });
          
          if (newAffectedColumns.size > 0) {
            // Add any new affected columns from cascading matches
            newMatches.forEach(({ col }) => {
              affectedColumns.add(col);
            });
            
            newMatches.forEach(({ row, col }) => {
              const cell = currentGrid[row][col];
              if (cell) {
                const key = `${row}-${col}`;
                matchColors.set(key, cell.color);
              }
            });
            allMatches = [...allMatches, ...newMatches];
            const clearResult = clearMatches(currentGrid, newMatches);
            currentGrid = clearResult.grid;
            totalCatsFed += clearResult.catCount;
          }
        }
      }
    }
    
    setGrid(currentGrid);
    
    // Add particle effects for ALL matches (even if no cats were fed)
    if (allMatches.length > 0) {
      const newParticles = allMatches.map((match, index) => {
        const key = `${match.row}-${match.col}`;
        return {
          id: `particle-${particleIdCounter.current++}-${match.row}-${match.col}-${index}`,
          position: { row: match.row, col: match.col },
          color: matchColors.get(key) || 'red',
        };
      });
      setParticles(prev => [...prev, ...newParticles]);
    }
    
    // Calculate score
    if (totalCatsFed > 0) {
      // Matches with cats: use existing scoring system
      let turnScore = BASE_SCORE_PER_CAT * totalCatsFed;
      if (totalCatsFed > 1) {
        turnScore = Math.floor(turnScore * Math.pow(MULTIPLIER_PER_ADDITIONAL_CAT, totalCatsFed - 1));
      }
      setScore(prev => prev + turnScore);
      console.log(`Cats fed: ${totalCatsFed}, Score: ${turnScore}`);
      // Trigger match animation when cats are fed
      setAnimationTrigger('match');
    } else if (allMatches.length > 0) {
      // Matches with no cats: award 25 points
      setScore(prev => prev + 25);
      console.log(`Match cleared (no cats), Score: 25`);
    }
    
    // Check level complete
    if (isLevelComplete(currentGrid)) {
      console.log('Level complete!');
      setGameState(GAME_STATES.LEVEL_COMPLETE);
      setAnimationTrigger('win');
    }
    
    // Check game over
    if (isGameOver(currentGrid)) {
      console.log('Game over!');
      setGameState(GAME_STATES.GAME_OVER);
      setAnimationTrigger('lose');
    }
  }, []);

  // Move treat left
  const moveLeft = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentTreat || !treatPosition) return;
    
    const newCol = treatPosition.col - 1;
    if (canPlaceFishTreat(grid, currentTreat, treatPosition.row, newCol)) {
      setTreatPosition({ ...treatPosition, col: newCol });
      console.log('Piece moved left');
    }
  }, [currentTreat, treatPosition, grid, gameState]);

  // Move treat right
  const moveRight = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentTreat || !treatPosition) return;
    
    const newCol = treatPosition.col + 1;
    if (canPlaceFishTreat(grid, currentTreat, treatPosition.row, newCol)) {
      setTreatPosition({ ...treatPosition, col: newCol });
      console.log('Piece moved right');
    }
  }, [currentTreat, treatPosition, grid, gameState]);

  // Rotate treat
  const rotate = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentTreat || !treatPosition) return;
    
    const rotated = rotateFishTreat(currentTreat);
    const currentRow = treatPosition.row;
    const currentCol = treatPosition.col;
    
    // Try to place at current position
    if (canPlaceFishTreat(grid, rotated, currentRow, currentCol)) {
      setCurrentTreat(rotated);
      console.log(`Piece rotated: ${currentTreat.rotation} -> ${rotated.rotation}`);
      return;
    }
    
    // If rotation would cause collision, try shifting left/right for horizontal->vertical
    // or up for vertical->horizontal
    if (rotated.rotation === 1) {
      // Rotating to vertical - try shifting left
      if (canPlaceFishTreat(grid, rotated, currentRow, currentCol - 1)) {
        setCurrentTreat(rotated);
        setTreatPosition({ ...treatPosition, col: currentCol - 1 });
        console.log('Piece rotated (shifted left)');
        return;
      }
      // Try shifting right
      if (canPlaceFishTreat(grid, rotated, currentRow, currentCol + 1)) {
        setCurrentTreat(rotated);
        setTreatPosition({ ...treatPosition, col: currentCol + 1 });
        console.log('Piece rotated (shifted right)');
        return;
      }
    } else {
      // Rotating to horizontal - try shifting up
      if (canPlaceFishTreat(grid, rotated, currentRow - 1, currentCol)) {
        setCurrentTreat(rotated);
        setTreatPosition({ ...treatPosition, row: currentRow - 1 });
        console.log('Piece rotated (shifted up)');
        return;
      }
    }
    
    console.log('Piece rotation blocked');
  }, [currentTreat, treatPosition, grid, gameState]);

  // Drop treat
  const drop = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentTreat || !treatPosition) return;
    
    // Get current grid from ref to avoid state update conflicts
    const currentGrid = gridRef.current;
    let newRow = treatPosition.row;
    
    // Find the lowest position the treat can be placed
    while (canPlaceFishTreat(currentGrid, currentTreat, newRow + 1, treatPosition.col)) {
      newRow++;
    }
    
    // Place the treat at the final position
    placeTreat(currentTreat, { ...treatPosition, row: newRow }, currentGrid);
    
    console.log('Piece dropped');
  }, [currentTreat, treatPosition, gameState, placeTreat]);

  // Fall timer
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;
    
    fallTimerRef.current = setInterval(() => {
      const currentGrid = gridRef.current;
      const currentTreat = currentTreatRef.current;
      const currentPos = treatPositionRef.current;
      
      if (!currentTreat || !currentPos) return;
      
      // Move straight down: increase row, keep col the same
      const nextRow = currentPos.row + 1;
      const sameCol = currentPos.col;
      
      if (canPlaceFishTreat(currentGrid, currentTreat, nextRow, sameCol)) {
        setTreatPosition({ row: nextRow, col: sameCol });
      } else {
        // Can't move down, place the treat
        placeTreat(currentTreat, currentPos, currentGrid);
      }
    }, FALL_INTERVAL);
    
    return () => {
      if (fallTimerRef.current) {
        clearInterval(fallTimerRef.current);
      }
    };
  }, [gameState, placeTreat]);

  // Initialize first level
  useEffect(() => {
    initializeLevel(1);
  }, [initializeLevel]);

  // Next level
  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    initializeLevel(newLevel);
  }, [level, initializeLevel]);

  // Restart current level
  const restartLevel = useCallback(() => {
    initializeLevel(level);
  }, [initializeLevel, level]);

  // Remove particle after animation
  const removeParticle = useCallback((id) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  // Clear animation trigger after it's been processed
  const clearAnimationTrigger = useCallback(() => {
    setAnimationTrigger(null);
  }, []);

  return {
    grid,
    currentTreat,
    treatPosition,
    score,
    level,
    gameState,
    particles,
    moveLeft,
    moveRight,
    rotate,
    drop,
    nextLevel,
    restartLevel,
    removeParticle,
    initializeLevel,
    animationTrigger,
    clearAnimationTrigger,
  };
};

export default useGameState;

