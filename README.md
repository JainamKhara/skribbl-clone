# 🎨 Skribbl Clone

A real-time multiplayer drawing and guessing game built with **Next.js**, **Supabase Realtime**, and **shadcn/ui**. Draw, guess, and compete with friends — no sign-up required!

> Inspired by [skribbl.io](https://skribbl.io)

---

## ✨ Features

### 🎮 Core Gameplay
- **Real-time drawing canvas** with pen, eraser, fill bucket, and undo
- **Live guessing** via chat — get instant feedback on close guesses
- **Automatic word hints** — letters progressively revealed as time runs out
- **Smart scoring** — faster guesses earn more points; drawer earns points based on how many players guess correctly
- **Multi-round support** — configurable rounds (1–10) and draw time (30–120s)

### 🔗 Multiplayer
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
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Real-time** | [Supabase Realtime](https://supabase.com/docs/guides/realtime) (Broadcast + Presence) |
| **Canvas** | HTML5 Canvas API |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (create/join room)
│   ├── room/[roomId]/page.tsx # Game room page
│   ├── globals.css            # Theme variables (orange light / violet dark)
│   └── layout.tsx             # Root layout with ThemeProvider
├── components/
│   ├── Canvas.tsx             # Drawing canvas with toolbar
│   ├── Chat.tsx               # Chat & guessing interface
│   ├── GameOver.tsx            # Final results with confetti
│   ├── Lobby.tsx              # Pre-game lobby & settings
│   ├── RoundEnd.tsx           # Round results display
│   ├── Scoreboard.tsx         # Player list & scores
│   ├── Timer.tsx              # Circular countdown timer
│   ├── WordSelector.tsx       # Word choice modal for drawer
│   ├── ThemeProvider.tsx      # Dark/Light theme context
│   ├── ThemeToggle.tsx        # Theme switch button
│   └── ui/                   # shadcn/ui primitives
├── hooks/
│   └── useGameChannel.ts     # All real-time game logic
└── lib/
    ├── constants.ts           # Game & canvas config
    ├── game-logic.ts          # Scoring, rankings, state types
    ├── words.ts               # Word list, hints, close-guess detection
    └── utils.ts               # Utility helpers (cn)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/Jainam116/skribbl-clone.git
cd skribbl-clone
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> You can find these in your Supabase dashboard under **Settings → API**.
> No database tables are needed — the game uses only Supabase **Realtime Broadcast** and **Presence**.

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start playing!

---

## 🎯 How to Play

1. **Create a room** — enter your nickname and click "Create Room"
2. **Share the code** — give the 6-character room code to your friends
3. **Start the game** — the host configures rounds & draw time, then starts
4. **Draw** — when it's your turn, pick a word and draw it on the canvas
5. **Guess** — type your guesses in the chat; you'll get feedback if you're close
6. **Score** — faster guesses = more points; the drawer earns points too
7. **Win** — after all rounds, the player with the highest score wins!

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

<p align="center">
  Built with ❤️ using Next.js & Supabase
</p>
