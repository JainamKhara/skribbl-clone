# 🎨 Skribbl Clone

A real-time multiplayer drawing and guessing game built with **Next.js**, **Supabase Realtime**, **Clerk**, and **shadcn/ui**. Draw, guess, and compete with friends!

> Inspired by [skribbl.io](https://skribbl.io)

---

## ✨ Features

### 🎮 Core Gameplay
- **Real-time drawing canvas** with pen, eraser, fill bucket, and undo
- **Live guessing** via chat — get instant feedback on close guesses
- **Automatic word hints** — letters progressively revealed as time runs out
- **Smart scoring** — faster guesses earn more points; drawer earns points based on how many players guess correctly
- **Multi-round support** — configurable rounds (1–10) and draw time (30–120s)

### � Authentication & Identity
- **Clerk Integration** — Sign in to save your profile and use your real profile image
- **Guest Support** — Play instantly without an account; guests get random avatars
- **Profile Synchronization** — Real-time display of player profile images in the lobby and scoreboard

### �🔗 Multiplayer
- **Room-based system** — create or join rooms with a 6-character code
- **2–8 players** per room
- **Real-time sync** — drawing strokes, chat, timer, and game state all broadcast instantly via Supabase channels
- **Synchronized timer** — host broadcasts every second so all players see the same countdown
- **Player presence** — see who's online, who's drawing, and who's guessed correctly

### 🎨 UI & Theming
- **Dark/Light mode toggle** with distinct color themes:
  - 🟣 **Dark mode** — Violet/purple accent on deep navy
  - 🟠 **Light mode** — Warm orange accent on cream
- **shadcn/ui components** — polished buttons, cards, badges, inputs, sliders, and scroll areas
- **Responsive layout** — works on desktop and tablet
- **Animated feedback** — confetti on game over, smooth transitions, chat message animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js](https://nextjs.org) (App Router) |
| **Authentication** | [Clerk](https://clerk.com) |
| **Real-time** | [Supabase Realtime](https://supabase.com/docs/guides/realtime) (Broadcast + Presence) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Canvas** | HTML5 Canvas API |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/                # Clerk login/signup routes
│   ├── profile/               # User profile settings
│   ├── room/[roomId]/page.tsx # Game room page
│   ├── globals.css            # Theme variables (orange light / violet dark)
│   └── layout.tsx             # Root layout with Clerk & Theme providers
├── components/
│   ├── Canvas.tsx             # Drawing canvas with toolbar
│   ├── Chat.tsx               # Chat & guessing interface
│   ├── ClerkThemeProvider.tsx  # Dynamic Clerk themes (dark/light)
│   ├── GameOver.tsx            # Final results with confetti
│   ├── Lobby.tsx              # Pre-game lobby & settings
│   ├── RoundEnd.tsx           # Round results display
│   ├── Scoreboard.tsx         # Player list & scores
│   ├── Timer.tsx              # Circular countdown timer
│   ├── WordSelector.tsx       # Word choice modal for drawer
│   ├── ThemeToggle.tsx        # Theme switch button
│   └── ui/                   # shadcn/ui primitives
├── hooks/
│   └── useGameChannel.ts     # Core real-time game logic & state
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── game-logic.ts          # Scoring & rankings logic
│   ├── words.ts               # Word list & hint generation
│   └── supabase.ts            # Supabase client initialization
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application

### 1. Clone & Install

```bash
git clone https://github.com/Jainam116/skribbl-clone.git
cd skribbl-clone
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start playing!

---

## 🎯 How to Play

1. **Sign in (Optional)** — Log in with Clerk to use your profile image and save progress.
2. **Create a room** — Choose your nickname and click "Create Room".
3. **Share the code** — Give the 6-character room code to your friends.
4. **Start the game** — The host configures rounds & draw time, then starts.
5. **Draw** — When it's your turn, pick a word and draw it on the canvas.
6. **Guess** — Type guesses in the chat; you'll get feedback if you're close!
7. **Score** — faster guesses = more points; the drawer earns points too
8. **Win** — The player with the highest score after all rounds wins!

---

## 🎮 Game Configuration

| Setting | Default | Range |
|---------|---------|-------|
| Players | 2 | 2–8 |
| Rounds | 3 | 1–10 |
| Draw Time | 80s | 30–120s |
| Word Choices | 3 | — |
| Choosing Time | 15s | — |

---

## 📝 License

This project is for educational purposes. Feel free to fork and modify!

---


