# EliteCrew — Customer App

A premium React Native (Expo, JS) app for booking home services (AC, appliances,
electrical & more), built against the existing `backend/` API.

## Stack
- **Expo (managed)** + **expo-router** (file-based navigation)
- **@tanstack/react-query** for server state & caching
- **axios** API client with Bearer-token auth (`expo-secure-store`)
- **socket.io-client** for realtime booking/tracking updates

## Run it

```bash
# 1. Start the backend (from repo root)
cd ../backend && npm run dev          # serves on :8080

# 2. Point the app at your machine's LAN IP so a physical phone can reach it
cp .env.example .env
#   edit EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8080
#   (iOS simulator / Android emulator can use localhost / 10.0.2.2)

# 3. Start Expo and open in Expo Go
npm install
npx expo start
```

> The app auto-detects the dev host from the Expo packager, so on a simulator it
> usually works with no `.env`. For a real phone, set `EXPO_PUBLIC_API_URL`.

## What's inside (`app/` — expo-router)
- `(auth)/` — welcome, login, 3-step OTP register (email → code → profile)
- `(tabs)/` — Home (services), Bookings, Notifications, Profile
- `category/[cat]` — services in a category
- `service/[slug]` — service detail + price estimate
- `booking/new` — address → date → time slot → coupon → confirm
- `booking/[id]` — live status timeline, provider info + call, completion OTP, cancel
- `rate/[bookingId]` — star rating + tags + review
- `addresses` — saved address CRUD

Design tokens live in `src/theme/`, shared primitives in `src/components/ui.js`,
API hooks in `src/lib/queries.js`, auth in `src/store/auth.js`.

## Backend note
The customer flow relies on the auth endpoints returning a `token` in the JSON
body (added in `backend/controllers/authController.js`) so the app can store a
Bearer token. The web app continues to use the httpOnly cookie.
