import { create } from 'zustand';

// ── Types ──────────────────────────────────────────
export interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export type CanvasContentType =
  | 'markdown'
  | 'image'
  | 'html'
  | 'code'
  | 'table'
  | 'json'
  | 'pdf';

export interface CanvasContent {
  type: CanvasContentType;
  content: string;
  title?: string;
  language?: string;        // for code type
  style?: Record<string, string>;
}

export interface AvatarSet {
  neutral: string;
  speaking: string;
  happy: string;
  sad: string;
  thinking: string;
  surprised: string;
}

export interface AgentProtocol {
  text?: string;
  emotion?: string;
  speaking?: boolean;
  canvasContent?: CanvasContent;
  clearCanvas?: boolean;
}

// ── DiceBear ───────────────────────────────────────
function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/lorelei/png?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

function buildAvatarSet(seed: string): AvatarSet {
  return {
    neutral:   dicebearUrl(seed),
    speaking:  dicebearUrl(`${seed}-speaking`),
    happy:     dicebearUrl(`${seed}-happy`),
    sad:       dicebearUrl(`${seed}-sad`),
    thinking:  dicebearUrl(`${seed}-thinking`),
    surprised: dicebearUrl(`${seed}-surprised`),
  };
}

// ── Store ──────────────────────────────────────────
interface AppState {
  // Chat
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Avatar
  emotion: string;
  isSpeaking: boolean;
  avatarSeed: string;
  avatarSet: AvatarSet;
  setEmotion: (e: string) => void;
  setIsSpeaking: (s: boolean) => void;
  setAvatarSeed: (s: string) => void;
  generateAvatarSet: (seed: string) => void;

  // Canvas
  canvasContent: CanvasContent | null;
  setCanvasContent: (c: CanvasContent | null) => void;

  // Connection
  isConnected: boolean;
  isLoading: boolean;
  setIsConnected: (c: boolean) => void;
  setIsLoading: (l: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),
  clearMessages: () => set({ messages: [] }),

  emotion: 'neutral',
  isSpeaking: false,
  avatarSeed: 'pngchannel',
  avatarSet: buildAvatarSet('pngchannel'),
  setEmotion: (e) => set({ emotion: e }),
  setIsSpeaking: (s) => set({ isSpeaking: s }),
  setAvatarSeed: (s) => set({ avatarSeed: s }),
  generateAvatarSet: (seed) => set({ avatarSet: buildAvatarSet(seed), avatarSeed: seed }),

  canvasContent: null,
  setCanvasContent: (c) => set({ canvasContent: c }),

  isConnected: false,
  isLoading: false,
  setIsConnected: (c) => set({ isConnected: c }),
  setIsLoading: (l) => set({ isLoading: l }),
}));
