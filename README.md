# Skribbl Clone

A real-time multiplayer drawing and guessing game built with **Next.js 14**, **Neon PostgreSQL Database**, **Clerk Authentication**, and **shadcn/ui**. Draw, guess, and compete with friends in a fully featured online Pictionary-style game!

> Inspired by [skribbl.io](https://skribbl.io)

---

## Screenshots

Here is a look at the game interface and flows:

### Welcome & Lobby

**Starting Page**
![Starting Page](public/screenshots/starting_page.png)

**Lobby / Room Setup**
![Room Page](public/screenshots/room_page.png)

### Gameplay Loop

**Word Choice**
![Choose The Word](public/screenshots/choose_the_word.png)

**Drawing Interface**
![Drawing Interface](public/screenshots/drawing_interface.png)

### Game Over, Stats & Leaderboard

**Game Over Screen**
![Game Over Page](public/screenshots/game_over_page.png)

**Profile & History**
![Profile Page](public/screenshots/profile_page.png)

**Leaderboard**
![Leaderboard Page](public/screenshots/leaderboard_page.png)

---

## Features

### Core Gameplay

- **Real-time drawing canvas** with multiple tools (pen, eraser, fill bucket, undo)
- **Live guessing** via chat with instant feedback on close guesses
- **Smart word hints** - letters progressively revealed as time runs out
- **Intelligent scoring system** - faster guesses earn more points, drawer earns bonus points
- **Multi-round support** - configurable rounds (1-10) and draw time (30-120s)
- **Random word selection** - 3 word choices per round

### Authentication & Identity

- **Clerk Integration** - Sign in to save your profile and use your real profile picture
- **Guest Support** - Play instantly without an account, guests get random generated avatars
- **Profile Synchronization** - Real-time display of player profile images in lobby and scoreboard
- **User Stats Tracking** - Games played, games won, total score stored per user

### Comprehensive Game History

- **Full game history** - Every game is recorded with complete details
- **Round-by-round breakdown** - See each round's word, drawer, and all guessers
- **Detailed participant stats** - Words guessed, rounds won, host status, final rank
- **Winner tracking** - Game winner name and score stored
- **Expandable game details** - Click to see full round history in profile page

### Multiplayer & Real-time

- **Room-based system** - create or join rooms with a 6-character code
- **2-8 players** per room
- **Real-time sync** - drawing strokes, chat, timer, and game state all broadcast instantly
- **Synchronized timer** - host broadcasts every second so all players see the same countdown
- **Player presence** - see who's online, who's drawing, and who's guessed correctly
- **Host controls** - only the room creator can start games and configure settings

### UI & Theming

- **Dark/Light mode toggle** with distinct color themes:
  - Dark mode - Violet/purple accent on deep navy
  - Light mode - Warm orange accent on cream
- **shadcn/ui components** - polished buttons, cards, badges, inputs, sliders
- **Custom Avatar System** - unique SVG avatars for guests, real profile pictures for signed-in users
- **Responsive layout** - works on desktop, tablet, and mobile (optimized for desktop)
- **Animated feedback** - confetti on game over, smooth transitions, chat animations

### Leaderboard

- **Global rankings** - top 50 players by total score
- **Win rate tracking** - percentage of games won
- **Games played counter** - total games for each player
- **Avatar display** - uses actual user avatars instead of emoji
- **Podium visualization** - top 3 players with medal icons

---

## Tech Stack

| Layer              | Technology                                                            | Purpose                                    |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| **Framework**      | [Next.js 14](https://nextjs.org)                                      | React framework with App Router            |
| **Authentication** | [Clerk](https://clerk.com)                                            | User authentication and profile management |
| **Database**       | [Neon PostgreSQL](https://neon.tech)                                  | Serverless PostgreSQL database             |
| **Real-time**      | [Pusher](https://pusher.com)                                          | Real-time pub/sub for game state           |
| **UI Components**  | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) | Polished, accessible components            |
| **Styling**        | [Tailwind CSS v4](https://tailwindcss.com)                            | Utility-first CSS framework                |
| **Icons**          | [Lucide React](https://lucide.dev)                                    | Beautiful, consistent icons                |
| **Canvas**         | HTML5 Canvas API                                                      | Drawing functionality                      |

---

## Project Structure

```
skribbl-clone/
├── src/
│   ├── app/
│   │   ├── api/pusher/auth/route.ts      # Pusher authentication
│   │   ├── leaderboard/page.tsx          # Leaderboard page
│   │   ├── login/page.tsx                # Login page
│   │   ├── profile/page.tsx              # User profile with game history
│   │   ├── room/[roomId]/page.tsx        # Game room page
│   │   ├── globals.css                   # Global styles & theme
│   │   └── page.tsx                      # Home page (lobby)
│   │
│   ├── components/
│   │   ├── Avatar.tsx                    # Custom SVG avatar component
│   │   ├── Canvas.tsx                    # Drawing canvas with toolbar
│   │   ├── Chat.tsx                      # Chat & guessing interface
│   │   ├── ClerkThemeProvider.tsx       # Dynamic Clerk theme sync
│   │   ├── GameOver.tsx                  # Game end results with confetti
│   │   ├── Lobby.tsx                     # Pre-game lobby with settings
│   │   ├── RoundEnd.tsx                  # Round results popup
│   │   ├── Scoreboard.tsx                # Player scores during game
│   │   ├── ThemeProvider.tsx             # Theme context provider
│   │   ├── ThemeToggle.tsx               # Dark/light mode toggle
│   │   ├── Timer.tsx                     # Circular countdown timer
│   │   ├── WordSelector.tsx              # Word choice modal for drawer
│   │   └── ui/                           # shadcn/ui components
│   │
│   ├── hooks/
│   │   └── useGameChannel.ts            # Core real-time game logic
│   │
│   ├── lib/
│   │   ├── auth.ts                       # Database operations
│   │   ├── constants.ts                  # Game configuration
│   │   ├── db.ts                         # Database connection & init
│   │   ├── game-logic.ts                 # Scoring & rankings logic
│   │   ├── pusher.ts                     # Pusher client
│   │   └── words.ts                      # Word list & hints
│   │
│   ├── middleware.ts                    # Authentication middleware
│   └── types/
│       └── declarations.d.ts             # TypeScript declarations
│
├── .env.local                           # Environment variables
├── next.config.ts                       # Next.js configuration
└── README.md                            # This file
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Neon PostgreSQL](https://neon.tech) database
- A [Clerk](https://clerk.com) application
- A [Pusher](https://pusher.com) account

### 1. Clone & Install

```bash
git clone https://github.com/Jainam116/skribbl-clone.git
cd skribbl-clone
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:

```env
# Neon Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Pusher (for real-time)
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
NEXT_PUBLIC_PUSHER_CLUSTER=your-pusher-cluster
PUSHER_APP_ID=your-pusher-app-id
```

### 3. Set Up Database

> Note: The database tables are automatically initialized and verified on application startup, so manual creation is not necessary.

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start playing!

---

## How to Play

1. **Sign In (Optional)** - Log in with Clerk to use your profile picture and save progress
2. **Create a Room** - Choose your nickname and click "Create Room"
3. **Share the Code** - Give the 6-character room code to your friends
4. **Start the Game** - The host configures rounds & draw time, then starts
5. **Draw** - When it's your turn, pick a word and draw it on the canvas
6. **Guess** - Type guesses in the chat; get feedback if you're close!
7. **Score** - Faster guesses = more points; drawer earns points too
8. **Win** - The player with the highest score after all rounds wins!

---

## Game Configuration

| Setting       | Default | Range   |
| ------------- | ------- | ------- |
| Players       | 2       | 2-8     |
| Rounds        | 3       | 1-10    |
| Draw Time     | 80s     | 30-120s |
| Word Choices  | 3       | -       |
| Choosing Time | 15s     | -       |

---

## Database Schema

### Tables

| Table               | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `profiles`          | User profile information from Clerk         |
| `game_history`      | Overall game information and winner         |
| `game_participants` | Participant details for each game           |
| `game_rounds`       | Round-by-round game details                 |
| `round_guessers`    | Players who guessed correctly in each round |

See the full schema initialization in [db.ts](src/lib/db.ts).

---

## Customization

### Add Custom Words

Edit `src/lib/words.ts`:

```typescript
export const WORDS = ["apple", "banana", "cat", "dog" /* ... */];
```

### Game Settings

Edit `src/lib/constants.ts`:

```typescript
export const GAME_CONFIG = {
  DEFAULT_ROUNDS: 3,
  DEFAULT_DRAW_TIME: 80,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  // ...
};
```

---

## License

This project is for **educational purposes**. Feel free to fork and modify!

---

Inspired by [skribbl.io](https://skribbl.io)

**Happy Drawing! 🎨**
