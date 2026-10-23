# SUPABASE SETUP GUIDE — LIFE Emergency Response App

> **Who this guide is for:** Student developers setting up the LIFE app for the first time.  
> **What it covers:** Every manual configuration step you must complete before the app works end-to-end.

---

## Table of Contents

- [Section A: Supabase Project Setup](#section-a-supabase-project-setup)
- [Section B: Google/Gmail Authentication Setup](#section-b-googlegmail-authentication-setup)
- [Section C: Supabase Storage Setup](#section-c-supabase-storage-setup)
- [Section D: Supabase Database Tables (incidents + profiles)](#section-d-supabase-database-tables-incidents--profiles)
- [Section E: Firebase Configuration (Keep These)](#section-e-firebase-configuration-keep-these)
- [Section F: Environment Variables and Configuration](#section-f-environment-variables-and-configuration)
- [Section G: Install Dependencies and Run the App](#section-g-install-dependencies-and-run-the-app)
- [Section H: Testing Checklist](#section-h-testing-checklist)
- [Section I: Troubleshooting](#section-i-troubleshooting)

---

## Section A: Supabase Project Setup

### Step 1 — Create or log into a Supabase account

1. Open your browser and go to [https://supabase.com](https://supabase.com).
2. Click **Start your project** (or **Sign In** if you already have an account).
3. You can sign up using GitHub, Google, or an email address.

### Step 2 — Create a new project

1. After logging in, click **New Project** (top-right area of the dashboard).
2. Select your **Organization** (Supabase creates a personal org for you automatically).
3. Fill in:
   - **Name:** `LIFE-Emergency` (or any name you choose)
   - **Database Password:** Create a strong password. **Save it somewhere safe** — you will need it if you ever connect directly to the database.
   - **Region:** Choose the region closest to your users (e.g., `Southeast Asia (Singapore)` if deploying in the Philippines).
4. Click **Create new project**.
5. Wait 1–2 minutes for initialization to complete. The dashboard will show a loading screen.

### Step 3 — Locate your project URL and publishable anon key

Once your project is initialized:

1. In the Supabase dashboard, click **Project Settings** (gear icon, bottom-left sidebar).
2. Click **API** under the Project Settings section.
3. You will see:
   - **Project URL** — looks like: `https://abcdefghijklmn.supabase.co`
   - **Project API keys → anon / public** — a long string starting with `eyJ...`

> ⚠️ **Only copy the `anon` key**. Never use the `service_role` key in your mobile app.

### Step 4 — Configure environment variables

Open the file `.env` in the project root (the same folder as `package.json`):

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Replace `YOUR_PROJECT_ID` with the actual subdomain from your Project URL, and replace `YOUR_SUPABASE_ANON_KEY` with the `anon` key you copied.

**Example (not real values):**
```
EXPO_PUBLIC_SUPABASE_URL=https://xyzabcdef123456.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5 — Verify connectivity

After setting the environment variables and restarting Expo (see Section G), the app's `isSupabaseConfigured()` function will return `true` and all incident data will be stored in Supabase instead of Firestore as the primary backend.

---

## Section B: Google/Gmail Authentication Setup

> **Current implementation:** The app uses **Firebase Authentication** (email + password) as its primary login system. Google sign-in via Supabase is pre-coded in `lib/supabaseAuth.js` and is ready to activate — but it requires configuration in both Google Cloud Console and Supabase before it will work.
>
> **Important:** The login and signup screens (`app/login.jsx` and `app/signup.jsx`) currently use Firebase Auth only. The Supabase Google sign-in code is ready in `lib/supabaseAuth.js` and can be wired to a "Sign in with Google" button.

### Step 1 — Enable Google provider in Supabase

1. In the Supabase dashboard, go to **Authentication → Providers** (left sidebar under Authentication).
2. Find **Google** in the list and click on it to expand the settings.
3. Toggle **Enable Sign in with Google** to ON.
4. You will see two fields: **Client ID** and **Client Secret**. Leave these open — you will fill them in after Step 4.
5. Also note the **Callback URL** shown on this page. It will look like:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   **Copy this URL exactly** — you need it in Google Cloud Console.

### Step 2 — Open Google Cloud Console

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Sign in with a Google account.
3. Click the project selector dropdown (top-left, next to "Google Cloud").
4. Click **New Project** and create a project called `LIFE-Emergency` (or select an existing one).

### Step 3 — Configure the OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services → OAuth consent screen**.
2. Choose **External** as the user type (unless this is an internal app for a Google Workspace org).
3. Click **Create**.
4. Fill in:
   - **App name:** `LIFE Emergency Response`
   - **User support email:** your email address
   - **Developer contact information:** your email address
5. Click **Save and Continue** through the Scopes and Test Users sections.
6. On the **Test Users** page, add your own Google email address (and any testers). This is required while the app is in "Testing" mode.
7. Click **Save and Continue**, then **Back to Dashboard**.

### Step 4 — Create an OAuth 2.0 Client ID

1. In the left sidebar, go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. For **Application type**, select **Web application** (Supabase handles the OAuth flow server-side even for mobile apps).
4. Give it a name like `LIFE Supabase OAuth`.
5. Under **Authorized redirect URIs**, click **Add URI** and paste the Supabase Callback URL from Step 1:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
6. Click **Create**.
7. A popup will show your **Client ID** and **Client Secret**. Copy both.

### Step 5 — Enter credentials in Supabase

1. Go back to the Supabase dashboard → **Authentication → Providers → Google**.
2. Paste your **Client ID** and **Client Secret** from Step 4.
3. Click **Save**.

### Step 6 — Configure the app redirect URI and deep linking

The app's scheme is already configured as `LIFE` in `app.json`. This means:
- The Expo deep link redirect URL for native Android/iOS will be: `LIFE://auth/callback`
- When using Expo Go for development, it will be something like: `exp://YOUR_LOCAL_IP:8081/--/auth/callback`

The `signInWithGoogle()` function in `lib/supabaseAuth.js` uses `Linking.createURL('auth/callback')` which automatically generates the correct redirect URL for your current environment.

> **You do NOT need to add the Expo deep link URL to Google Cloud Console.** Supabase handles the OAuth exchange server-side. Only the Supabase Callback URL (`https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`) needs to be in Google Cloud Console.

### Step 7 — Add a "Sign in with Google" button (optional)

The code is already in `lib/supabaseAuth.js`. To wire it to a button in `app/login.jsx`:

```jsx
import { signInWithGoogle } from '../lib/supabaseAuth';

// Inside your Login component:
const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithGoogle();
    if (result?.role === 'responder') {
      router.replace('/responder');
    } else if (result) {
      router.replace('/home1');
    }
    // result is null if the user cancelled
  } catch (error) {
    Alert.alert('Sign In Failed', error.message);
  }
};
```

> ⚠️ **Important compatibility note:** Supabase Google sign-in uses Supabase Auth, which is a separate identity system from Firebase Auth. The app's Firestore data, roles, and existing user accounts are stored under Firebase Auth UIDs. Supabase-authenticated users will have Supabase UUIDs, not Firebase UIDs. If you activate Google sign-in through Supabase, incidents and roles created under Firebase Auth will not automatically be linked to the Supabase user. For now, the safest approach is to keep using Firebase email/password for login and use Supabase only for image storage and the incidents database.

---

## Section C: Supabase Storage Setup

This section covers the `incident-photos` storage bucket used to store emergency evidence images.

### Step 1 — Open Storage in the dashboard

1. In the Supabase dashboard, click **Storage** in the left sidebar.
2. Click **New bucket**.

### Step 2 — Create the incident-photos bucket

Fill in:
- **Bucket name:** `incident-photos` ← **Use this exact name.** The code references it directly.
- **Public bucket:** Toggle this **ON** if you want images to be viewable directly via a public URL (simpler, no signed URLs needed). Toggle it **OFF** if you want images to require authentication to view.

**Recommendation for LIFE app:** Set the bucket to **Public**. The image URLs are stored inside incident documents which are already protected by Supabase Row Level Security. Reporters and responders won't see images they're not supposed to see because they access images through the incident records, not by browsing the bucket directly.

- **File size limit:** Set to `10 MB` (10485760 bytes).
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

Click **Create bucket**.

### Step 3 — Configure Storage Access Policies

After creating the bucket, click on it to open it, then click the **Policies** tab.

You need two policies:

#### Policy 1: Allow authenticated users to upload

Click **New policy** → **For full customization** → fill in:

- **Policy name:** `Authenticated users can upload incident images`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **Policy definition (WITH CHECK expression):**
  ```sql
  bucket_id = 'incident-photos'
  ```

Click **Review** → **Save policy**.

#### Policy 2: Allow public read access to uploaded images

If the bucket is **public**, this is handled automatically. If the bucket is **private**, click **New policy** and fill in:

- **Policy name:** `Authenticated users can view incident images`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated`
- **Policy definition (USING expression):**
  ```sql
  bucket_id = 'incident-photos'
  ```

Click **Review** → **Save policy**.

> 💡 If you chose a public bucket, you only need the INSERT policy above — public buckets allow anyone to read the files.

### Step 4 — Verify upload works

After starting the app and logging in as a reporter:
1. Go to an emergency report screen.
2. Attach a photo from the gallery.
3. Submit the report.
4. In the Supabase dashboard → Storage → `incident-photos`, you should see a file appear under the `incidents/` folder.

### Step 5 — Verify responder image viewing

After a reporter submits a report with an image:
1. Log in as a responder.
2. Open the Responder Dashboard.
3. The incident card should show a thumbnail of the attached image.
4. Tapping the thumbnail should open a full-screen preview.

---

## Section D: Supabase Database Tables (incidents + profiles)

The app stores incidents in Supabase when credentials are configured. You must create the required tables.

### Step 1 — Open the SQL Editor

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.

### Step 2 — Create the incidents table

Paste and run the following SQL:

```sql
-- Create the incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type          text NOT NULL DEFAULT 'medical',
  type_label    text NOT NULL DEFAULT 'Emergency',
  description   text NOT NULL DEFAULT '',
  latitude      double precision,
  longitude     double precision,
  address       text NOT NULL DEFAULT '',
  reported_by   text,
  reported_by_email text NOT NULL DEFAULT '',
  image_url     text,
  status        text NOT NULL DEFAULT 'pending',
  responder_id  text,
  responder_email text,
  status_history jsonb DEFAULT '[]'::jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can INSERT (reporters submitting reports)
CREATE POLICY "Authenticated users can create incidents"
  ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can SELECT (reporters see their own, responders see all)
CREATE POLICY "Authenticated users can read incidents"
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can UPDATE status (for responders)
CREATE POLICY "Authenticated users can update incidents"
  ON public.incidents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE incidents (admin use only)
CREATE POLICY "Authenticated users can delete incidents"
  ON public.incidents
  FOR DELETE
  TO authenticated
  USING (true);
```

Click **Run** (the green button or Ctrl+Enter).

> 📌 **Security note:** These policies allow any authenticated Supabase user to read and update all incidents. This is intentional for an emergency response app — responders must see all reports and reporters must be able to track their own. If you use Supabase Auth (Google sign-in), you can tighten the UPDATE policy to only allow responders to update status fields.

### Step 3 — Enable Realtime on the incidents table

For the responder dashboard to receive new reports instantly:

1. In the Supabase dashboard, click **Database → Replication** (or **Database → Publications**).
2. Find or click on **supabase_realtime** publication.
3. Ensure the `incidents` table is toggled **ON**.

Alternatively, run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
```

### Step 4 — Create the profiles table (for Supabase Auth users)

This table stores role information for users who sign in via Supabase (e.g., Google OAuth). Only needed if you activate Supabase Google sign-in.

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role  text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

---

## Section E: Firebase Configuration (Keep These)

> Do NOT delete or disable any of the following Firebase settings. These are used by the existing login, signup, role management, and Firestore backup.

### Firebase Authentication (keep enabled)

The app currently uses Firebase email/password authentication for all logins. Do not disable this provider in the Firebase Console.

- **Console location:** [Firebase Console](https://console.firebase.google.com) → Your Project → **Authentication → Sign-in method**
- Keep **Email/Password** enabled.

### Firestore Database (keep)

Firestore is used as the primary or backup database for incidents (when Supabase is not configured) and for user role documents.

**Collection structure:**
- `incidents/{incidentId}` — stores emergency reports
- `users/{userId}` — stores user role (`user` or `responder`)

**Security rules** (already configured in `firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incidents/{incidentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

To deploy these rules, run:
```bash
firebase deploy --only firestore:rules
```
(Requires Firebase CLI: `npm install -g firebase-tools` then `firebase login`)

### Firebase Storage Rules (keep)

Already configured in `storage.rules` for `incidents/` prefix. Deploy with:
```bash
firebase deploy --only storage
```

### Existing Firebase environment variables

Firebase credentials are currently hard-coded in `firebase.js`. This is acceptable for the client-side `apiKey` (it is a public identifier, not a secret). The existing `firebase.js` does not need to be changed.

---

## Section F: Environment Variables and Configuration

### Complete list of environment variables

| Variable | Purpose | Where to find it | Safe for mobile client? | Restart needed? |
|---|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project endpoint | Supabase Dashboard → Project Settings → API → Project URL | ✅ Yes | ✅ Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key | Supabase Dashboard → Project Settings → API → anon/public key | ✅ Yes | ✅ Yes |

### What you must NOT put in `.env`

- ❌ `SUPABASE_SERVICE_ROLE_KEY` — this key bypasses all Row Level Security. Never put it in the mobile app.
- ❌ Google OAuth Client Secret — belongs in the Supabase dashboard only.
- ❌ Firebase service account JSON — only for server-side use.

### Which file should contain `.env`?

Place `.env` in the **project root directory** — the same folder that contains `package.json`, `app.json`, and `firebase.js`.

```
LIFE-main/
├── .env          ← HERE
├── package.json
├── app.json
├── firebase.js
├── supabase.js
└── app/
```

Expo automatically reads `EXPO_PUBLIC_*` variables from `.env` at startup.

> ⚠️ The `.env` file is listed in `.gitignore` and will not be committed to version control. Each team member must create their own `.env` file.

---

## Section G: Install Dependencies and Run the App

### Step 1 — Install dependencies

Open a terminal in the project root (`LIFE-main/` folder) and run:

```bash
npm install
```

The `expo-file-system` and `base64-arraybuffer` packages are already listed in `package.json`, so no additional installs are needed for the image upload fix.

### Step 2 — Start the development server (with cache cleared)

Always clear the cache after changing environment variables or installing packages:

```bash
npx expo start --clear
```

### Step 3 — Open the app

- **Physical Android device:** Install **Expo Go** from the Google Play Store, scan the QR code shown in the terminal.
- **Android Emulator:** Press `a` in the terminal after running `npx expo start`.
- **iOS Simulator (Mac only):** Press `i` in the terminal.

> ⚠️ **Note:** This app uses `expo-dev-client` as a dependency. For full functionality (especially camera permissions and deep linking for OAuth), you may eventually need to build a **development build** instead of using Expo Go. However, core features including incident submission and Supabase integration should work in Expo Go for development.

### Step 4 — Test accounts you need to create

You must create at least two accounts to test the full flow:

**Reporter account:**
1. Open the app → tap **Sign up**
2. Select **Reporter** role
3. Register with an email and password

**Responder account:**
1. Open the app → tap **Sign up**
2. Select **Responder** role
3. Enter authorization code: `LIFE911` or `RESPONDER2026`
4. Register with a different email

---

## Section H: Testing Checklist

Complete each item in order. Check it off when it passes.

### Authentication
- [ ] Reporter can register a new account on the Signup screen
- [ ] Reporter can log in with email/password
- [ ] Responder can register using a valid authorization code
- [ ] Responder can log in and reaches the Responder Dashboard
- [ ] Non-responder cannot access the Responder Dashboard (redirected to reporter home)
- [ ] App restores login session after being fully closed and reopened

### Incident Submission (reporter)
- [ ] Reporter can submit a report **without** an image
- [ ] Reporter can attach an image from the gallery before submitting
- [ ] Reporter can take a new photo with the camera before submitting
- [ ] Reporter can remove/replace a selected image before submitting
- [ ] Submitting with an image works and image URL appears in the Supabase dashboard → Table Editor → `incidents`
- [ ] If image upload fails (e.g., turn off WiFi), the report is still submitted without the image and the reporter sees an appropriate notification (not an error that blocks submission)
- [ ] After successful submission, the reporter is taken to the live tracking screen (rescue.jsx)
- [ ] Reporter cannot submit the same report twice by tapping Submit rapidly

### Real-time responder reception
- [ ] After a reporter submits a report, it appears on the Responder Dashboard **without requiring a manual refresh**
- [ ] The incident includes the correct type, description, address, and coordinates
- [ ] If an image was attached, the responder can see a thumbnail and tap it for a full-screen view
- [ ] If no image was attached, the image section does not appear (no broken image icon)

### Status updates
- [ ] Responder can tap **Accept** to change status from Pending → Accepted
- [ ] Status change is visible on both the reporter's rescue tracking screen and the responder dashboard
- [ ] Responder can tap **Dispatch: Responders En Route** (Accepted → On the Way)
- [ ] Responder can tap **Mark Incident Resolved** after confirming
- [ ] Resolved incidents appear in the Resolved filter tab

### Cross-device / cross-network
- [ ] Reporter submits on one device (or Expo Go session), responder receives on a different device with a different network connection
- [ ] Both devices do not need to be on the same WiFi

### Security
- [ ] A user logged in as a reporter cannot see the Responder Dashboard controls
- [ ] A user cannot change their own role by editing local state
- [ ] Supabase anon key is visible in the `.env` file but the service_role key is NOT present anywhere in the codebase

---

## Section I: Troubleshooting

### App cannot connect to Supabase

**Symptom:** Reports go to Firestore, no data appears in Supabase dashboard.  
**Cause:** `isSupabaseConfigured()` is returning false.  
**Fix:**
1. Verify your `.env` file exists in the project root (same folder as `package.json`).
2. Verify the values do not contain `YOUR_PROJECT_ID` or `YOUR_SUPABASE_ANON_KEY`.
3. Stop Expo and restart with `npx expo start --clear`.
4. Add `console.log(process.env.EXPO_PUBLIC_SUPABASE_URL)` temporarily to `supabase.js` to verify the value is being read.

### Invalid Supabase URL

**Symptom:** Error message: `TypeError: Failed to fetch` or `invalid URL`.  
**Fix:** Check that `EXPO_PUBLIC_SUPABASE_URL` starts with `https://` and ends with `.supabase.co`. No trailing slash.

### Incident submission fails entirely

**Symptom:** Pressing Submit shows an error alert, reporter cannot submit.  
**Possible causes and fixes:**
1. **Not logged in:** The app checks `auth.currentUser` — ensure the user is logged in.
2. **Firebase authentication error / token expired:** Sign out and sign back in.
3. **Firestore permission denied:** Go to Firebase Console → Firestore → Rules and verify the rules match those shown in Section E.
4. **Network error:** Check the device's internet connection.

### Image does not appear on responder dashboard

**Symptom:** Incident card shows no image thumbnail even though reporter attached one.  
**Possible causes:**
1. Image upload failed silently — check the `image_url` field in Supabase Table Editor or Firestore. If it is `null`, the upload failed.
2. Supabase Storage bucket is **not** named `incident-photos` exactly.
3. The Storage INSERT policy was not created.
4. The bucket is private but no SELECT policy was created.

### Storage upload permission denied

**Symptom:** Console shows `new row violates row-level security policy` or `Unauthorized`.  
**Fix:** Go to Supabase → Storage → `incident-photos` → Policies and verify the INSERT policy exists with `authenticated` role.

### Google sign-in opens browser but returns to app without logging in

**Symptom:** Browser opens, user selects account, browser closes, but user is not logged in.  
**Cause:** The Supabase callback URL was not added to Google Cloud Console, or the tokens are not being parsed.  
**Fix:**
1. Verify that `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback` is in the **Authorized redirect URIs** list in Google Cloud Console → APIs & Services → Credentials → your OAuth client.
2. Verify that the Google Client ID and Secret are correctly saved in Supabase → Authentication → Providers → Google.

### OAuth redirect mismatch error

**Symptom:** Google shows an error: `redirect_uri_mismatch`.  
**Fix:** The URL in Google Cloud Console does not exactly match what Supabase sends. Go to Google Cloud Console → Credentials → your OAuth Client → copy the exact URL from Supabase → Authentication → Providers → Google (the Callback URL field) and paste it into the Authorized Redirect URIs, then click Save.

### Reports not appearing on responder dashboard in real-time

**Symptom:** Reporter submits, responder has to pull-to-refresh to see new reports.  
**Fix:**
1. Check that the `incidents` table is added to the `supabase_realtime` publication (see Section D, Step 3).
2. Check the Supabase dashboard → Realtime → Inspector — it should show events when incidents are inserted.
3. If using Firestore fallback (Supabase not configured), the Firestore `onSnapshot` listener handles real-time updates automatically.

### Expo package compatibility issue

**Symptom:** Error about mismatched package version during `npm install` or at runtime.  
**Fix:** This project uses **Expo SDK 57**. If you need to install additional packages, use:
```bash
npx expo install [package-name]
```
This command automatically selects the version compatible with your SDK version.

### App is stuck on loading screen

**Symptom:** App shows the splash screen but never navigates to login or home.  
**Cause:** The `index.jsx` splash screen waits for Firebase Auth to check the current user. If Firebase fails to initialize (wrong credentials in `firebase.js`), it may stall.  
**Fix:** Verify the Firebase credentials in `firebase.js` match your Firebase project. Go to Firebase Console → Project Settings → Your apps → Web app → Config.

### Expo Go vs. Development Build

If you encounter issues with camera permissions, deep linking for Google OAuth, or native modules not working in Expo Go, you may need to create a **development build**:

```bash
npx expo run:android
```

This compiles a native APK with all plugins included. Refer to the [Expo dev builds documentation](https://docs.expo.dev/develop/development-builds/introduction/) for full instructions.

---

## Quick Reference: Which Service Handles What

| Feature | Service | Notes |
|---|---|---|
| Login / Signup | **Firebase Auth** | Email + password via Firebase |
| User roles (reporter/responder) | **Firebase Firestore** (`users` collection) | Role checked from `users/{uid}.role` |
| Incident reports database | **Supabase** (primary) → Firestore (fallback) | Supabase used when credentials are configured |
| Real-time incident updates (responder dashboard) | **Supabase Realtime** → Firestore `onSnapshot` | Automatic based on which backend is active |
| Image uploads | **Supabase Storage** (`incident-photos`) → Firebase Storage | Supabase tried first, Firebase as fallback |
| Google sign-in | **Supabase Auth** | Pre-coded but requires manual activation (Section B) |
| App deep linking / routing | **Expo Router** | Scheme: `LIFE://` (configured in `app.json`) |

---

*This guide was written for the LIFE Emergency Response App (Expo SDK 57, React Native 0.86.3, Firebase 12, Supabase JS 2.x).*
