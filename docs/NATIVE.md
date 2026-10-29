# React Native companion

The `apps/mobile` Expo project is the shared native iOS/Android source and responsive browser application. React Native Web exports the HTML5 website; web-only semantic shell landmarks become native View containers on iOS/Android.

## Running development service

The Docker `native` profile starts Metro on **http://localhost:8081**:

```sh
docker compose --profile native up -d --build
```

Status: `http://localhost:8081/status` should report `packager-status:running`. iOS/Android bundle/manifest requests are served by this service. The default native API URL is `http://localhost:8080/api`, suitable for a native client on this computer's iOS simulator. Android emulator host access normally uses `http://10.0.2.2:8080/api`; set `EXPO_PUBLIC_API_URL` for that environment and restart Metro. Use an Expo client/development build compatible with the pinned SDK 58.

All services bind to the host loopback interface. A physical phone cannot use the computer's localhost address. Physical-device access needs a deliberately configured LAN endpoint or development tunnel with suitable access controls; this delivery does not expose financial/admin services to the public internet.

## Verified and unverified

TypeScript, Expo package compatibility (doctor 20/20), web export, iOS Hermes export, and Android Hermes export passed. Web browser desktop/mobile workflows were exercised through the running backend. The host has no usable Xcode simulator toolchain (`xcrun simctl` unavailable) and no Android `adb`, so actual native-device execution and signed APK/IPA distribution were not verified or delivered. An exported JS bundle is not an installable app-store binary.

## Distribution requirements

Before app-store distribution, set the real business bundle identifiers, privacy/support URLs, app icon/splash assets, Apple/Google developer accounts, signing credentials and native build configuration. Perform physical-device authentication, private file upload/download, keyboard, screen-reader, offline/error and payment-return checks. Provide the store-required account-deletion process and privacy disclosures. Connect provider-supported HTTPS endpoints and handle native payment-return/deep links through the approved payment/investment partner.

Secrets remain on the server. The native client stores only its random session bearer in Expo SecureStore; private evidence downloads authenticate before opening the native share interface and clean their temporary files. Production additionally needs OS backup/screenshot/data-retention policy and provider-hosted identity checks.
