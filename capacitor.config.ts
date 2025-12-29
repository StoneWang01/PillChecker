import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.pillchecker',
  appName: 'pillchecker',
  webDir: 'dist',

  server: {
    androidScheme: 'http'
  },

  plugins: {
    Camera: {
      permissions: ['CAMERA']  // 允许使用摄像头权限
    }
  }
};

export default config;
