import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ph.edu.tcc.clinic',
  appName: 'TCC Clinic',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_clinic",
      iconColor: "#70091f",
    },
  },
};

export default config;
