import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.grounded.racequest',
  appName: 'RaceQuest',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      permissions: ['location']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    BackgroundMode: {
      enabled: true,
      title: 'RaceQuest is tracking your location',
      text: 'Tap to return to the app',
      silent: false
    },
    BackgroundGeolocation: {
      notificationTitle: 'RaceQuest Location',
      notificationText: 'Tracking your race progress',
      enableHighAccuracy: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;