// utils/sfx.js
import { Audio } from 'expo-av';

// 🔊 Config per sound: file + default volume (0.0–1.0)
const SOUND_CONFIG = {
  rotate: {
    file: require('../assets/sfx/SFX_Sound Effect_Button_Click-48.mp3'),
    volume: 0.5,
  },
  drop: {
    file: require('../assets/sfx/SFX_Sound Effect_Button_Click-23-drop.mp3'),
    volume: 0.6,
  },
  match: {
    file: require('../assets/sfx/SFX_Sound Effect_Button_Click-36-match.mp3'),
    volume: 0.7,
  },
  kill: {
    file: require('../assets/sfx/SFX_Sound Effect_Button_Click-76-mechdestroy.mp3'),
    volume: 1.0,
  },
  energy: {
    file: require('../assets/sfx/DSGNTonl_Anime_Cartoon_Comedy_13_ROXY_SOUND_ACE-energy.mp3'),
    volume: 0.9,
  },
};

// 🔁 Cache of loaded sounds so we only load each once
const loadedSounds = {};

/**
 * Play a named SFX (rotate, drop, match, kill, energy)
 * Uses per-sound volume from SOUND_CONFIG.
 */
export async function playSfx(type) {
  try {
    const config = SOUND_CONFIG[type];
    if (!config) {
      console.warn(`playSfx: unknown sound type "${type}"`);
      return;
    }

    // Lazy-load the sound if we haven't yet
    if (!loadedSounds[type]) {
      const { sound } = await Audio.Sound.createAsync(config.file);
      loadedSounds[type] = sound;

      // Set per-sound volume
      if (typeof config.volume === 'number') {
        await sound.setVolumeAsync(config.volume);
      }
    }

    const sound = loadedSounds[type];

    // Replay from start, even if it was already playing
    await sound.replayAsync();
  } catch (e) {
    console.warn(`Error playing SFX "${type}":`, e);
  }
}

/**
 * Optional: clean up all loaded SFX (e.g., on app exit)
 */
export async function unloadAllSfx() {
  const entries = Object.entries(loadedSounds);
  for (const [key, sound] of entries) {
    try {
      await sound.unloadAsync();
    } catch (e) {
      console.warn(`Error unloading SFX "${key}":`, e);
    }
    delete loadedSounds[key];
  }
}
