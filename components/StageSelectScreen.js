// components/StageSelectScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

const StageSelectScreen = ({ campaignId, onBack, onSelectStage }) => {
  // For now, just show "Campaign 1" in the header; logic can expand later
  return (
    <ImageBackground
      source={require('../assets/backgrounds/stage_select_bg.png')} // 🔁 update if needed
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'} Campaigns</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Campaign {campaignId}</Text>
          <View style={{ width: 110 }} />
        </View>

        {/* Stage grid */}
        <View style={styles.centerContent}>
          <Text style={styles.subtitle}>Select Stage</Text>

          <View style={styles.stageGrid}>
            {Array.from({ length: 6 }).map((_, index) => {
              const stageNumber = index + 1;
              const isUnlocked = stageNumber === 1; // only stage 1 active for now

              if (isUnlocked) {
                return (
                  <TouchableOpacity
                    key={stageNumber}
                    style={[styles.stageButton, styles.stageActive]}
                    onPress={() => onSelectStage(stageNumber)}
                  >
                    <Text style={styles.stageText}>Stage {stageNumber}</Text>
                    <Text style={styles.stageSubText}>Levels {(stageNumber - 1) * 5 + 1}–{stageNumber * 5}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <View
                  key={stageNumber}
                  style={[styles.stageButton, styles.stageLocked]}
                >
                  <Text style={styles.stageText}>Stage {stageNumber}</Text>
                  <Text style={styles.stageSubText}>Locked</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 15, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    color: '#ddd',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  stageGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '80%',
  },
  stageButton: {
    width: '30%',
    aspectRatio: 1,
    margin: '3.33%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stageActive: {
    backgroundColor: 'rgba(0, 200, 255, 0.2)',
    borderColor: '#00f0ff',
  },
  stageLocked: {
    backgroundColor: 'rgba(50, 50, 60, 0.7)',
    borderColor: '#555',
  },
  stageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stageSubText: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 4,
  },
});

export default StageSelectScreen;
