const WORD_LIST: Record<string, string[]> = {
  animals: [
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "butterfly",
    "octopus", "kangaroo", "chameleon", "flamingo", "hedgehog", "jellyfish",
    "lobster", "parrot", "peacock", "rabbit", "seahorse", "turtle", "whale",
    "zebra", "crocodile", "hamster", "koala", "panda", "snake", "spider",
    "squirrel", "tiger", "wolf", "bear", "eagle", "fox", "frog", "gorilla",
    "horse", "lion", "monkey", "owl", "shark", "snail",
  ],
  food: [
    "pizza", "hamburger", "sushi", "taco", "pancake", "donut", "ice cream",
    "watermelon", "banana", "cookie", "cupcake", "french fries", "hot dog",
    "sandwich", "spaghetti", "broccoli", "cheese", "chocolate", "popcorn",
    "pretzel", "avocado", "bacon", "burrito", "cherry", "grape", "lemon",
    "mushroom", "pineapple", "strawberry", "waffle",
  ],
  objects: [
    "umbrella", "telescope", "keyboard", "headphones", "sunglasses",
    "backpack", "bicycle", "camera", "candle", "clock", "compass",
    "envelope", "flashlight", "guitar", "hammer", "ladder", "lantern",
    "magnet", "microphone", "mirror", "paintbrush", "pencil", "piano",
    "pillow", "scissors", "skateboard", "sword", "trophy", "violin",
    "wheelbarrow", "balloon", "battery", "binoculars", "book", "broom",
    "bucket", "calculator", "chair", "crown", "diamond",
  ],
  actions: [
    "dancing", "swimming", "cooking", "sleeping", "running", "flying",
    "singing", "painting", "fishing", "surfing", "climbing", "diving",
    "dreaming", "juggling", "laughing", "reading", "skating", "skiing",
    "sneezing", "wrestling", "yawning", "baking", "boxing", "camping",
    "crying", "digging", "eating", "fighting", "gardening", "hiking",
  ],
  places: [
    "beach", "castle", "desert", "forest", "hospital", "island",
    "library", "mountain", "museum", "pyramid", "restaurant", "school",
    "stadium", "temple", "volcano", "waterfall", "airport", "aquarium",
    "barn", "bridge", "cave", "church", "circus", "factory", "farm",
    "fountain", "garage", "garden", "greenhouse", "igloo",
  ],
  things: [
    "rainbow", "tornado", "lightning", "sunset", "snowflake", "campfire",
    "fireworks", "treasure chest", "robot", "alien", "ghost", "dragon",
    "unicorn", "mermaid", "pirate", "wizard", "angel", "astronaut",
    "ninja", "superhero", "vampire", "zombie", "cloud", "moon", "star",
    "comet", "earth", "galaxy", "planet", "satellite",
  ],
};

const allWords = Object.values(WORD_LIST).flat();

export function getRandomWords(count: number): string[] {
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function isCloseGuess(guess: string, word: string): boolean {
  const g = guess.toLowerCase().trim();
  const w = word.toLowerCase().trim();
  if (g === w) return false;
  if (g.length < 2) return false;
  if (w.includes(g) || g.includes(w)) return true;
  const distance = levenshteinDistance(g, w);
  return distance <= Math.max(1, Math.floor(w.length * 0.3));
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function getWordHint(word: string, revealedCount: number): string {
  const chars = word.split("");
  const indices = chars
    .map((_, i) => i)
    .filter((i) => chars[i] !== " ");

  // Deterministic shuffle: sort by a hash derived from position and word
  // This ensures the same letters are always revealed for a given word
  const sorted = [...indices].sort((a, b) => {
    const hashA = (word.charCodeAt(a) * 31 + a * 17 + word.length) % 997;
    const hashB = (word.charCodeAt(b) * 31 + b * 17 + word.length) % 997;
    return hashA - hashB;
  });

  const toReveal = new Set(sorted.slice(0, revealedCount));
  return chars
    .map((char, i) => {
      if (char === " ") return "  ";
      if (toReveal.has(i)) return char;
      return "_";
    })
    .join(" ");
}

export function getBlankWord(word: string): string {
  return word
    .split("")
    .map((char) => (char === " " ? "  " : "_"))
    .join(" ");
}
