// Game Constants
export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 16;

export const COLORS = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue',
};

export const COLOR_VALUES = [COLORS.RED, COLORS.YELLOW, COLORS.GREEN, COLORS.BLUE];

// Scoring
export const BASE_SCORE_PER_CAT = 100;
export const MULTIPLIER_PER_ADDITIONAL_CAT = 1.5;

// Game progression
export const STARTING_CAT_COUNT = 2;
export const CATS_PER_LEVEL = 1;

// Game states
export const GAME_STATES = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  LEVEL_COMPLETE: 'levelComplete',
};

