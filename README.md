# LIFE - Emergency Alert & Safety Application

LIFE is a mobile and web-based emergency alert and safety application designed to help people quickly report emergencies and receive help. The system allows any user to submit an incident report, which immediately alerts the nearest rescue units and notifies other users in the area. LIFE also provides access to nearby evacuation shelters so users can quickly find safe locations during disasters or dangerous situations.

## Features

- 🚨 **Emergency Alert System**: Quick access to report emergencies with a large, easy-to-tap button
- 🔥 **Multiple Emergency Types**: Support for Fire, Accidents, Medical, and Police emergencies
- 📍 **Location Services**: Automatic location capture for accurate emergency reporting
- 🏠 **Evacuation Shelters**: Find nearby safe locations with distance calculations
- 📋 **Incident Tracking**: View recent emergency reports in your area
- 🔔 **Real-time Alerts**: Immediate notifications to rescue units and nearby users
- 👤 **User Authentication**: Secure login and signup system

## Emergency Types

Users can choose from 4 types of emergencies after tapping the alert button:

1. **Fire** 🔥 - Fire emergencies
2. **Accidents** 🚗 - Traffic or vehicle accidents
3. **Medical** 🏥 - Medical emergencies
4. **Police** 🚔 - Police assistance needed

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Firebase account (for backend services)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure Firebase:
   - Update `firebase.js` with your Firebase configuration
   - Ensure Firestore is enabled in your Firebase project

3. Start the app:

   ```bash
   npx expo start
   ```

   Then choose to run on:
   - iOS Simulator (press `i`)
   - Android Emulator (press `a`)
   - Web browser (press `w`)
   - Physical device (scan QR code with Expo Go app)

## Project Structure

```
app/
├── _layout.jsx          # Root layout
├── index.jsx            # Splash/loading screen
├── login.jsx            # Login screen
├── signup.jsx           # Signup screen
├── home1.jsx            # Main home screen with emergency button
├── shelters.jsx         # Evacuation shelters list
├── incidents.jsx        # Recent incidents list
└── emergency/
    ├── type.jsx         # Emergency type selection
    └── report.jsx       # Emergency report submission
```

## Key Features Implementation

### Emergency Reporting Flow

1. User taps the large emergency alert button on the home screen
2. User selects emergency type (Fire, Accidents, Medical, Police)
3. System captures current location automatically
4. User provides description of the emergency
5. Report is submitted to Firebase Firestore
6. Nearby users and rescue units are alerted

### Location Services

- Uses Expo Location for accurate GPS coordinates
- Reverse geocoding for human-readable addresses
- Distance calculations for evacuation shelters
- Location permissions handled gracefully

### Firebase Integration

- Firestore database for storing incidents
- Real-time updates for incident tracking
- User authentication with Firebase Auth
- Timestamp tracking for all reports

## Technologies Used

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **Firebase** - Backend services (Auth, Firestore)
- **Expo Router** - File-based routing
- **Expo Location** - Location services

## Safety & Privacy

- All location data is only used for emergency reporting
- User authentication ensures secure access
- Incident reports are stored securely in Firebase
- Location permissions are requested only when needed

## Future Enhancements

- Push notifications for nearby emergencies
- Integration with emergency services APIs
- Real-time map view of incidents
- Two-way communication with rescue units
- Offline mode support
- Multi-language support

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

---

**Remember**: In a real emergency, always call your local emergency services (911, 112, etc.) first. This app is designed to supplement, not replace, official emergency services.
