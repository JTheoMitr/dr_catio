import { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_WIDTH, GRID_HEIGHT, STARTING_MECH_COUNT, MECHS_PER_LEVEL, BASE_SCORE_PER_MECH, MULTIPLIER_PER_ADDITIONAL_MECH, GAME_STATES, COLORS } from '../constants/GameConstants';
import {
  generateGunIcon,
  generateRandomMechs,
  canPlaceGunIcon,
  rotateGunIcon,
  findMatches,
  clearMatches,
  applyGravity,
  isGameOver,
  isLevelComplete,
} from '../utils/gameLogic';
import { playRotateSfx } from '../utils/sfx';


const FALL_INTERVAL = 1000; // 1 second per fall

const useGameState = () => {
  const [grid, setGrid] = useState(() => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
    return newGrid;
  });
  
  const [currentGunIcon, setCurrentGunIcon] = useState(null);
  const [gunIconPosition, setGunIconPosition] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOverReason, setGameOverReason] = useState(null); 
// e.g. 'stack' | 'energy' | null

  const [gameState, setGameState] = useState(GAME_STATES.PLAYING);
  const [particles, setParticles] = useState([]);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  const [energyUIResetCounter, setEnergyUIResetCounter] = useState(0);
  
  const fallTimerRef = useRef(null);
  const gravityTimerRef = useRef(null);
  const gridRef = useRef(grid);
  const currentGunIconRef = useRef(currentGunIcon);
  const gunIconPositionRef = useRef(gunIconPosition);
  const particleIdCounter = useRef(0);
  
  // Keep refs in sync
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  
  useEffect(() => {
    currentGunIconRef.current = currentGunIcon;
  }, [currentGunIcon]);
  
  useEffect(() => {
    gunIconPositionRef.current = gunIconPosition;
  }, [gunIconPosition]);

  // Initialize game
  const initializeLevel = useCallback((levelNum) => {
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
    const mechCount = STARTING_MECH_COUNT + (levelNum - 1) * MECHS_PER_LEVEL;
    const mechs = generateRandomMechs(mechCount);
    
    mechs.forEach(mech => {
      newGrid[mech.row][mech.col] = {
        type: 'enemy',
        color: mech.color,
      };
    });
    
    setGrid(newGrid);
    setCurrentGunIcon(generateGunIcon());
    setGunIconPosition({ row: 0, col: Math.floor(GRID_WIDTH / 2) - 1 });
    setGameState(GAME_STATES.PLAYING);
    setAnimationTrigger(null); // Reset animation trigger
    setGameOverReason(null);   // 👈 reset reason
  }, []);

  // Place gun icon on grid
  const placeGunIcon = useCallback((gunIcon, position, currentGrid) => {
    if (!gunIcon || !position) return;
    
    const newGrid = currentGrid.map(row => [...row]);
    const gunIconPositions = getGunIconPositions(gunIcon, position.row, position.col);
    
    gunIconPositions.forEach(({ row, col, isTop }) => {
      newGrid[row][col] = {
        type: 'gunIcon',
        color: isTop ? gunIcon.top : gunIcon.bottom,
      };
    });
    
    setGrid(newGrid);
    setCurrentGunIcon(generateGunIcon());
    setGunIconPosition({ row: 0, col: Math.floor(GRID_WIDTH / 2) - 1 });
    
    // Check for matches
    checkMatches(newGrid);
    
    return newGrid; // Return the new grid
  }, []);

  // Get gun icon positions
  const getGunIconPositions = (gunIcon, row, col) => {
    const positions = [];
    
    // 0°: horizontal, left-right (top color on left, bottom color on right)
    // 90°: vertical, top-bottom (top color on top, bottom color on bottom)
    // 180°: horizontal, right-left (top color on right, bottom color on left) - flipped
    // 270°: vertical, bottom-top (top color on bottom, bottom color on top) - flipped
    
    if (gunIcon.rotation === 0) {
      // Horizontal: left and right
      positions.push({ row, col, isTop: true });
      positions.push({ row, col: col + 1, isTop: false });
    } else if (gunIcon.rotation === 1) {
      // Vertical: top and bottom
      positions.push({ row, col, isTop: true });
      positions.push({ row: row + 1, col, isTop: false });
    } else if (gunIcon.rotation === 2) {
      // Horizontal: right and left (flipped)
      positions.push({ row, col: col + 1, isTop: true });
      positions.push({ row, col, isTop: false });
    } else if (gunIcon.rotation === 3) {
      // Vertical: bottom and top (flipped)
      positions.push({ row: row + 1, col, isTop: true });
      positions.push({ row, col, isTop: false });
    }
    
    return positions;
  };

  // Check for matches and clear them
  const checkMatches = useCallback((gridToCheck) => {
    let currentGrid = gridToCheck.map(row => [...row]);
    let totalMechsDestroyed = 0;
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
      totalMechsDestroyed += result.mechCount;
      
      // After clearing, ensure all columns with blocks that can fall are included
      // This catches orphaned blocks (the other half of a treat)
      for (let col = 0; col < GRID_WIDTH; col++) {
        for (let row = 0; row < GRID_HEIGHT - 1; row++) {
          const cell = currentGrid[row][col];
          // If there's a block with empty space below it, and this column is adjacent to affected columns
          // or is already affected, ensure it's processed
          if (cell && cell.type === 'gunIcon' && currentGrid[row + 1][col] === null) {
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
            totalMechsDestroyed += clearResult.mechCount;
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
    if (totalMechsDestroyed > 0) {
      // Matches with mechs: use existing scoring system
      let turnScore = BASE_SCORE_PER_MECH * totalMechsDestroyed;
      if (totalMechsDestroyed > 1) {
        turnScore = Math.floor(turnScore * Math.pow(MULTIPLIER_PER_ADDITIONAL_MECH, totalMechsDestroyed - 1));
      }
      setScore(prev => prev + turnScore);
      console.log(`Mechs destroyed: ${totalMechsDestroyed}, Score: ${turnScore}`);
      // Trigger match animation when mechs are destroyed
      setAnimationTrigger('match');
    } else if (allMatches.length > 0) {
      // Check if any of the matched cells were GEAR color
      const hadGearMatch = allMatches.some(({ row, col }) => {
        const key = `${row}-${col}`;
        const color = matchColors.get(key);
        return color === COLORS.GEAR;
      });
    
      // Base score for non-mech matches (you can tweak this if gear should be worth more)
      setScore(prev => prev + 25);
    
      if (hadGearMatch) {
        console.log('Gear match! Meter reset + 25 points');
        // Bump counter to tell the mech meter UI to restart
        setEnergyUIResetCounter(prev => prev + 1);
      } else {
        console.log('Match cleared (no mechs, no gear), Score: 25');
      }
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
      setGameOverReason('stack');  // 👈 standard “board filled” loss
    }
  }, []);

  // Move gun icon left
  const moveLeft = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentGunIcon || !gunIconPosition) return;
    
    const newCol = gunIconPosition.col - 1;
    if (canPlaceGunIcon(grid, currentGunIcon, gunIconPosition.row, newCol)) {
      setGunIconPosition({ ...gunIconPosition, col: newCol });
      console.log('Piece moved left');
    }
  }, [currentGunIcon, gunIconPosition, grid, gameState]);

  // Move gun icon right
  const moveRight = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentGunIcon || !gunIconPosition) return;
    
    const newCol = gunIconPosition.col + 1;
    if (canPlaceGunIcon(grid, currentGunIcon, gunIconPosition.row, newCol)) {
      setGunIconPosition({ ...gunIconPosition, col: newCol });
      console.log('Piece moved right');
    }
  }, [currentGunIcon, gunIconPosition, grid, gameState]);

  // Add this near your other callbacks (moveLeft, drop, etc.)
  const triggerMeterGameOver = useCallback(() => {
    // Only trigger if we’re actively playing
    if (gameState !== GAME_STATES.PLAYING) return;

    console.log('Game over from mech meter!');
    setGameState(GAME_STATES.GAME_OVER);
    setAnimationTrigger('lose');
    setGameOverReason('energy');   // 👈 this is the key
  }, [gameState]);

  // Rotate gun icon
  const rotate = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentGunIcon || !gunIconPosition) return;

     // 🔊 PLAY ROTATE SOUND
    playRotateSfx();
    
    const rotated = rotateGunIcon(currentGunIcon);
    const currentRow = gunIconPosition.row;
    const currentCol = gunIconPosition.col;
    
    // Try to place at current position
    if (canPlaceGunIcon(grid, rotated, currentRow, currentCol)) {
      setCurrentGunIcon(rotated);
      console.log(`Piece rotated: ${currentGunIcon.rotation} -> ${rotated.rotation}`);
      return;
    }
    
    // If rotation would cause collision, try shifting left/right for horizontal->vertical
    // or up for vertical->horizontal
    if (rotated.rotation === 1) {
      // Rotating to vertical - try shifting left
      if (canPlaceGunIcon(grid, rotated, currentRow, currentCol - 1)) {
        setCurrentGunIcon(rotated);
        setGunIconPosition({ ...gunIconPosition, col: currentCol - 1 });
        console.log('Piece rotated (shifted left)');
        return;
      }
      // Try shifting right
      if (canPlaceGunIcon(grid, rotated, currentRow, currentCol + 1)) {
        setCurrentGunIcon(rotated);
        setGunIconPosition({ ...gunIconPosition, col: currentCol + 1 });
        console.log('Piece rotated (shifted right)');
        return;
      }
    } else {
      // Rotating to horizontal - try shifting up
      if (canPlaceGunIcon(grid, rotated, currentRow - 1, currentCol)) {
        setCurrentGunIcon(rotated);
        setGunIconPosition({ ...gunIconPosition, row: currentRow - 1 });
        console.log('Piece rotated (shifted up)');
        return;
      }
    }
    
    console.log('Piece rotation blocked');
  }, [currentGunIcon, gunIconPosition, grid, gameState]);

  // Drop gun icon
  const drop = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING || !currentGunIcon || !gunIconPosition) return;
    
    // Get current grid from ref to avoid state update conflicts
    const currentGrid = gridRef.current;
    let newRow = gunIconPosition.row;
    
    // Find the lowest position the gun icon can be placed
    while (canPlaceGunIcon(currentGrid, currentGunIcon, newRow + 1, gunIconPosition.col)) {
      newRow++;
    }
    
    // Place the gun icon at the final position
    placeGunIcon(currentGunIcon, { ...gunIconPosition, row: newRow }, currentGrid);
    
    console.log('Piece dropped');
  }, [currentGunIcon, gunIconPosition, gameState, placeGunIcon]);

  // Fall timer
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;
    
    fallTimerRef.current = setInterval(() => {
      const currentGrid = gridRef.current;
      const currentGunIcon = currentGunIconRef.current;
      const currentPos = gunIconPositionRef.current;
      
      if (!currentGunIcon || !currentPos) return;
      
      // Move straight down: increase row, keep col the same
      const nextRow = currentPos.row + 1;
      const sameCol = currentPos.col;
      
      if (canPlaceGunIcon(currentGrid, currentGunIcon, nextRow, sameCol)) {
        setGunIconPosition({ row: nextRow, col: sameCol });
      } else {
        // Can't move down, place the gun icon
        placeGunIcon(currentGunIcon, currentPos, currentGrid);
      }
    }, FALL_INTERVAL);
    
    return () => {
      if (fallTimerRef.current) {
        clearInterval(fallTimerRef.current);
      }
    };
  }, [gameState, placeGunIcon]);

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
    currentGunIcon,
    gunIconPosition,
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
    energyUIResetCounter,
    triggerMeterGameOver,
    gameOverReason,
  };
};

export default useGameState;

