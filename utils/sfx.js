import { Audio } from 'expo-av';

let rotateSound;

export async function playRotateSfx() {
  try {
    // Load only once (lazy-load)
    if (!rotateSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sfx/SFX_Sound Effect_Button_Click-48.mp3')
      );
      rotateSound = sound;
    }

    // Replay from start every time
    await rotateSound.replayAsync();

  } catch (e) {
    console.warn('Error playing rotate SFX:', e);
  }
}

// Optionally clean up on app exit
export function unloadAllSfx() {
  if (rotateSound) {
    rotateSound.unloadAsync();
    rotateSound = null;
  }
}
