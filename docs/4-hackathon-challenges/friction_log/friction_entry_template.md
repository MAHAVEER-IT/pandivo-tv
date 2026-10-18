# Friction Log Entry Template

> **Usage**: Whenever you hit a bug, cryptic error, confusing Amazon documentation, or clunky workflow while testing or sideloading, copy this template and add it as a new numbered entry into `docs/friction_log/AMAZON_FRICTION_LOG.md`.

---

### [FL-###] <Short Descriptive Title of the Friction / Issue>

- **Date & Time**: `YYYY-MM-DD HH:mm (Timezone)`
- **Category**: `[Fire OS Porting / Sideloading / Amazon Docs / Developer Console / Remote Navigation / Permissions / Audio Pipeline]`
- **Severity**: `[Blocker / High / Medium / Low / Cosmetic]`
- **Testing Environment**:
  - **Device / Model**: `[e.g., Android TV Emulator (Television_1080p, API 33) / Fire TV Stick 4K Max (Fire OS 7/8)]`
  - **OS Version / API Level**: `[e.g., Fire OS 7.6.5.2 / Android 9.0 API 28 / Android TV API 33]`
  - **App Package**: `com.firetv.musicpoc`
  - **Commit / Build**: `[e.g., commit hash or debug build apk]`

#### 1. What was the goal / What were you trying to do?
<!-- Describe what feature, workflow, or Amazon Developer guide you were following. -->
*Example: Attempted to run the app using `launch_gui_app.ps1` and establish Metro bundle connection over ADB.*

#### 2. Official Guidance Followed (if applicable)
<!-- Reference the Amazon Developer documentation link or Android TV leanback guide. -->
*Example: Amazon Developer Docs: "Setting up ADB on Fire TV" (https://developer.amazon.com/docs/fire-tv/connecting-adb-to-fire-tv.html)*

#### 3. What actually happened? (The Friction)
<!-- Describe the unexpected behavior, cryptic log, UI failure, or broken assumption. -->
*Example: The app crashed on launch with `E/AndroidRuntime: FATAL EXCEPTION: main` due to missing Leanback banner or audio permission rejection.*

#### 4. Error Logs / Stack Trace / Screenshots
```text
[Paste terminal output, adb logcat snippet, or Metro packager error here]
```
<!-- Attach screenshot or video link if applicable: e.g., ![Screenshot](path/to/image.png) -->

#### 5. Root Cause Analysis
<!-- Why did this happen? (e.g. Fire OS does not include Google Play Services; Fire TV remote handles keycode 85 differently; Leanback launcher requires banner attribute). -->

#### 6. Workaround / Solution Implemented
<!-- How did our team solve or bypass this problem in our codebase? -->

#### 7. Direct Feedback for Amazon Engineering / DevRel
<!-- What should Amazon change in their SDK, Developer Portal, or Documentation to save other developers from this friction? -->
*Example: Amazon should provide updated Expo/React Native TV samples, or clarify in documentation that permission dialogs in Fire OS 7 do not automatically focus on "Allow" via D-Pad.*
