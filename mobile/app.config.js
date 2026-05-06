module.exports = {
  expo: {
    name: "UsoLuz",
    slug: "uso-luz",
    version: "1.0.0",
    scheme: "usoluz",
    platforms: ["ios", "android"],
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#1565C0",
          sounds: [],
        },
      ],
    ],
    android: {
      package: "es.jgm1997.usoluz",
      versionCode: 1,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1565C0",
      },
    },
    ios: {
      bundleIdentifier: "es.jgm1997.usoluz",
      buildNumber: "1",
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
      supportsTablet: false,
    },
    extra: {
      eas: {
        projectId: "34a45df3-cbaa-4ba2-84d6-83068879abb4",
      },
    },
  },
};
