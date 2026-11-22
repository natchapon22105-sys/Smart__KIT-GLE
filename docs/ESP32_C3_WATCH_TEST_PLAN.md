# ESP32-C3 Smartwatch Test Plan

## Agreed starting configuration

- Board: ESP32-C3 SuperMini
- Firmware: Arduino / PlatformIO
- Phone: iPhone
- Alerts: both phone and watch
- Planned watch parts: display, vibration motor, buzzer, heart-rate sensor, SpO2 sensor, temperature sensor, and button

The exact board vendor/revision and sensor part numbers are not selected yet. Confirm their pinout, voltage, and current requirements before wiring or assigning GPIO pins.

## Current project status

- The app can be exercised in Expo Go with mock BLE enabled. Mock mode tests the app UI and API flow, not a physical watch.
- Real BLE integration uses the native implementation in [`index.native.ts`](../frontend/src/services/ble/index.native.ts) and [`RealBleService.ts`](../frontend/src/services/ble/RealBleService.ts). The GATT UUIDs and payloads in [`protocol.ts`](../frontend/src/services/ble/protocol.ts) are placeholders until the watch firmware protocol is agreed.
- The app already has medication schedules and per-dose status APIs. Watch-originated dose events still need to be added to the BLE protocol and connected to those APIs.
- The Health page can receive health samples through the app/backend flow, but sensor accuracy and real-device operation have not been verified.

## Phase 1: Test the app without a watch

Purpose: verify sign-in, medication schedules, health UI, and app/API behavior before hardware is ready.

1. Start MySQL and the backend using the setup instructions in [`HANDOFF.md`](./HANDOFF.md).
2. Set `EXPO_PUBLIC_API_URL` to the computer's Wi-Fi IPv4 address, not `localhost`, so the iPhone can reach the backend.
3. Keep `EXPO_PUBLIC_USE_MOCK_BLE=true`.
4. Start Expo Go mode with `npx expo start --go`. If the usual Metro port is occupied, use an available port and scan the new QR code.
5. Connect the iPhone and computer to the same reachable network, open the project in Expo Go, and test:
   - Sign in and open Home.
   - Connect the mock watch and confirm the UI shows mock health readings.
   - Open Health and confirm sample/received data is displayed.
   - Add a medication, confirm it appears on Home, tap the status bar, and verify the status persists after reloading Home.
6. Confirm the iPhone can reach `http://<computer-wifi-ip>:4000/healthz`.

Expo Go is for app-flow and mock-BLE testing only. It does not validate the C3 firmware or real BLE pairing.

## Phase 2: Bench-test the watch electronics

Before connecting the board:

- Record the exact ESP32-C3 SuperMini vendor/revision and its pinout.
- Record each module's exact model, supply voltage, interface (I2C/SPI/GPIO), and current draw.
- Check that selected pins do not conflict with boot, USB, flash, or board-specific functions.
- Drive the vibration motor and buzzer through suitable driver circuitry; do not power them directly from a GPIO.
- Use a suitable battery charger/protection and regulator for the selected battery and board.
- Test each sensor and output separately with a small firmware sketch; measure battery life and heat under normal use.

Treat wrist heart-rate, SpO2, and temperature readings as prototype data until validated. They are not medical measurements by default.

## Phase 3: Define and test the BLE protocol

Agree on the GATT service and characteristic UUIDs and document the payload format before implementing both ends. Include:

- Pairing/device identity and protocol version.
- App-to-watch schedule updates: medication identifier, local time, days of week, enabled state, and timezone/time-sync information.
- Watch-to-app events: taken, snooze, dismiss, and delivery/error acknowledgements.
- Watch-to-app health samples: metric, value, units, and sample timestamp.
- Battery/connection status and behavior when a message is invalid.

Initial protocol test sequence:

1. Discover and connect to the watch from the iPhone development build.
2. Send a schedule and require an acknowledgement from the watch.
3. Restart the watch and verify the schedule is retained.
4. Disconnect the phone and verify the watch can still alert from its stored schedule.
5. Press the watch button and verify the event syncs to the app and dose log when reconnected.
6. Change or delete a schedule in the app and verify the watch updates it without duplicate alarms.

The watch should store schedules locally and keep time reliably when offline. Decide how it obtains time (sync from phone, network time, or an RTC) and what happens after a full power loss.

## Phase 4: Test real notifications and iPhone BLE

- Phone reminders need notification scheduling and a permission flow; this is separate from mock BLE.
- Watch reminders should be scheduled on the watch so they continue when the app is closed or BLE is disconnected.
- Decide how phone and watch alerts are coordinated to prevent unwanted duplicates.
- Test permission granted/denied, app backgrounded/closed, phone locked, BLE disconnect/reconnect, offline operation, schedule edits, timezone changes, and restart/reboot.
- Use a native iOS development build for real BLE. Expo Go remains in mock mode. On Windows, plan to use an EAS iOS build or a Mac with Xcode and the required Apple signing setup.

## Release checklist

- Verify BLE discovery, pairing, reconnect, schedule acknowledgement, and offline watch alerts on a physical iPhone and watch.
- Verify dose events reach the app/backend once, survive reconnects, and do not create duplicate logs.
- Verify sensor timestamps, units, missing readings, and data quality; validate sensors independently of the app.
- Confirm notification behavior and battery life over an extended run.
- Do not use prototype sensor output for medical decisions.

## Information needed before wiring/protocol implementation

- Product link or photo for the exact ESP32-C3 SuperMini board.
- Exact display, vibration motor, buzzer, heart-rate/SpO2, temperature, and battery/charger module models.
- Firmware repository or a starter PlatformIO project, if one exists.
- Desired button actions and alert pattern (for example: acknowledge, snooze, or dismiss).
