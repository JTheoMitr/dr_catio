// components/CampaignSelectScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import MenuBackground from './MenuBackground';
import GameText from './GameText';
import GameButton from './GameButton';

const CampaignSelectScreen = ({ onBack, onSelectCampaign }) => {
  return (
    <MenuBackground
    >
      <View style={styles.overlay}>
      

        <View style={styles.centerContent}>
        <GameText style={[styles.title]}>Select Campaign</GameText>
          {/* Campaign 1 - active */}
          <TouchableOpacity
            style={[styles.campaignButton, styles.campaignActive]}
            onPress={() => onSelectCampaign(1)}
          >
            <GameText style={styles.campaignTitle}>Campaign 1</GameText>
            <GameText style={styles.campaignSubtitle}>Main Story</GameText>
          </TouchableOpacity>

          {/* Campaign 2 - inactive / locked */}
          <View style={[styles.campaignButton, styles.campaignDisabled]}>
            <GameText style={styles.campaignTitle}>Campaign 2</GameText>
            <GameText style={styles.campaignSubtitle}>Coming Soon</GameText>
          </View>

          {/* Campaign 3 - inactive / locked */}
          <View style={[styles.campaignButton, styles.campaignDisabled]}>
            <GameText style={styles.campaignTitle}>Campaign 3</GameText>
            <GameText style={styles.campaignSubtitle}>Coming Soon</GameText>
          </View>
          <GameButton
        title="Back"
        variant="ghost"
        small
        onPress={onBack}
        style={{ alignSelf: 'center', marginTop: 14 }}
        />
        </View>
      </View>
    </MenuBackground>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    alignSelf: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  campaignButton: {
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  campaignActive: {
    backgroundColor: 'rgba(0, 200, 255, 0.2)',
    borderColor: '#00f0ff',
  },
  campaignDisabled: {
    backgroundColor: 'rgba(50, 50, 60, 0.7)',
    borderColor: '#555',
  },
  campaignTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  campaignSubtitle: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 4,
  },
});

export default CampaignSelectScreen;
