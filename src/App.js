import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';

const TRANSLATIONS = {
  "he-IL": {
    "mainTitle": "משחקי היהלום",
    "gameTitle": "כדורגל טיפולי",
    "originalAuthor": "משחק מותאם ללוחמי PTSD",
    "adaptedBy": "פותח באהבה על ידי Seach Medical Group",
    "singlePlayer": "שחקן בודד",
    "multiplayer": "שני שחקנים",
    "selectDuration": "בחר משך משחק",
    "selectShape": "בחר את הדמות שלך",
    "selectBall": "בחר את הכדור שלך",
    "cyanTeam": "יהלומים זוהרים",
    "redTeam": "יהלומים מאירים",
    "versus": "נגד",
    "oneMinute": "דקה אחת",
    "twoMinutes": "2 דקות",
    "fourMinutes": "4 דקות",
    "eightMinutes": "8 דקות",
    "worldCup": "גביע עולם",
    "multiplayerControls1": "שחקן שמאל: W (קפיצה), A/D (תזוזה), S (אחיזה)",
    "multiplayerControls2": "שחקן ימין: ↑ (קפיצה), ←/→ (תזוזה), ↓ (אחיזה)",
    "singlePlayerControls1": "השתמש במקשי החצים: ↑ (קפיצה), ←/→ (תזוזה), ↓ (אחיזה)",
    "singlePlayerControls2": "החזק ↓ כדי לתפוס את הכדור כשהוא קרוב!",
    "backButton": "חזור",
    "nextButton": "הבא",
    "gameWinner": "ניצחון!",
    "gameDraw": "תיקו!",
    "backToMenu": "חזרה לתפריט",
    "helmetCamo": "קסדה מסוותת",
    "helmetDesert": "קסדת מדבר",
    "helmetUrban": "קסדה עירונית",
    "labrador": "לברדור",
    "tank": "טנק",
    "sunflower": "חמנייה",
    "grenade": "רימון יד",
    "pill": "כדור תרופה",
    "cannabis": "פרח קנאביס",
    "player1": "שחקן 1 (שמאל)",
    "player2": "שחקן 2 (ימין)",
    "chooseCharacter": "בחר את הדמות שלך",
    "remoteMultiplayer": "לשחק עם חבר",
    "waitingForPlayer": "ממתין לשחקן שני...",
    "scanQRCode": "סרקו את הקוד או שתפו את הקישור",
    "shareLink": "שתף קישור",
    "copyLink": "העתק קישור",
    "linkCopied": "הקישור הועתק!",
    "connecting": "מתחבר...",
    "connected": "מחובר!",
    "connectionFailed": "החיבור נכשל, נסו שוב",
    "youAreHost": "אתה המארח (שחקן שמאל)",
    "youAreGuest": "אתה האורח (שחקן ימין)",
    "startRemoteGame": "התחל משחק",
    "orShareLink": "או שתפו את הקישור:",
    "guestWaitingMessage": "סבלנות\nמחכה לתגובת החבר",
    "gameInstruction1": "המטרה - להבקיע גולים לשער",
    "gameInstruction2": "שימוש במקשי החיצים על המסך",
    "gameInstruction2Touch": "לחץ על המסך להזזת השחקן",
    "shareInviteIntro": "הוזמנת למשחק 💎אליפות יהלומים💎 בכדורגל"
  }
};

const appLocale = 'he-IL';
const browserLocale = navigator.languages?.[0] || navigator.language || 'he-IL';
const findMatchingLocale = (locale) => {
  return 'he-IL';
};
const locale = 'he-IL';
const t = (key) => TRANSLATIONS['he-IL']?.[key] || TRANSLATIONS['he-IL'][key] || key;

const GROUND_HEIGHT = 80;
const SIZE_MULTIPLIER = Number(
  process.env.REACT_APP_SIZE_MULTIPLIER ?? process.env.SIZE_MULTIPLIER ?? 1
) || 1;
const GRAVITY = 0.6;
const SLIME_SPEED = 5;
const SLIME_JUMP_POWER = -12;
const BALL_SPEED_MULTIPLIER = 0.5;
const BALL_GRAVITY = GRAVITY * BALL_SPEED_MULTIPLIER;
const BALL_DAMPING = 0.99;
const BALL_BOUNCE_DAMPING = 0.8;
const MAX_BALL_SPEED = 13 * BALL_SPEED_MULTIPLIER;
const AI_REACTION_DISTANCE = 300;
const AI_PREDICTION_TIME = 30;
const MULTI_IDLE_APPROACH_DELAY_MS = 1400;
const MULTI_IDLE_APPROACH_SPEED = 0.6;
const GAME_INSTRUCTION_HIDE_DELAY_MS = 20000;
const GAME_INSTRUCTION_HIDE_STEP_MS = 2000;
const WAIT_START = Number(
  process.env.REACT_APP_WAIT_START ?? process.env.WAIT_START ?? 18
) || 18;
const BUTTON_WAIT = Number(
  process.env.REACT_APP_BUTTON_WAIT ?? process.env.BUTTON_WAIT ?? 5
) || 5;
const CONTROL_MODE = (() => {
  const val = (process.env.REACT_APP_CONTROL ?? process.env.CONTROL ?? 'both').toLowerCase();
  return ['keys', 'touch', 'both'].includes(val) ? val : 'both';
})();
const DISPLAY_TOUCH_MODE = (() => {
  const val = (process.env.REACT_APP_DISPLAY_TOUCH ?? process.env.DISPLAY_TOUCH ?? 'personal').toLowerCase();
  return ['none', 'personal', 'both'].includes(val) ? val : 'personal';
})();
const BOARD_ALIGNMENT = (() => {
  const val = (process.env.REACT_APP_BOARD_ALIGNMENT ?? process.env.BOARD_ALIGNMENT ?? 'bottom_top').toLowerCase();
  return ['right_left', 'bottom_top'].includes(val) ? val : 'bottom_top';
})();
const TOUCH_MOVE_MIN_KEYS = 2;
const HISTORY_IMAGE_FILES = [
  '0bb921c5-b38c-4aa1-bed0-678ab0d8fa08.jpeg',
  '0f9a6eb6-b7ce-48b4-a477-5eaf7ee7dd15.jpeg',
  '138a7842-ba10-4fad-a3e5-641908465ea1.jpeg',
  '1690d42f-3598-464a-b673-ece65732e8ff.jpeg',
  '23aefebb-b848-48f0-a7b8-d8c7624e01d2.jpeg',
  '2ab838e0-79b6-4d2a-a34d-7309ab714cb3.jpeg',
  '2c811700-56df-4401-b5d3-889fd1eb6f68.jpeg',
  '448b1427-4284-44d9-8f65-503ac3f54856.jpeg',
  '4c748c76-d377-491d-a799-deeb3c32b986.jpeg',
  '7dfb5155-9971-4c05-8b38-4c14c74f0606.jpeg',
  '7e701eb4-c8c9-454e-a23b-09d4040c22f6.jpeg',
  '868b831a-3e34-404f-9400-c61fd558cced.jpeg',
  '99e1d415-8c12-4c99-a3a3-b78a71089f34.jpeg',
  '9c7aaf1a-1f9e-4951-b220-2bd016dcd81b.jpeg',
  '9d697cf0-d891-4a55-a877-066bf63fe060.jpeg',
  'a0805288-611a-46a1-84f3-849948c97018.jpeg',
  'a2385dc0-ff13-4c9d-a96a-a55cadd45446.jpeg',
  'a8bfa9f5-98a4-46a3-b6b7-8aa32d232518.jpeg',
  'abcbf278-e8c8-4ad4-8771-323c5a97ba1e.jpeg',
  'b74b1f9b-70b1-49d4-b31c-8b859734f142.jpeg',
  'b7c50973-2c1a-4eb3-b5db-6a269d695693.jpeg',
  'c3aef9f8-6be2-4fdb-b338-5c6ed2ecaf1e.jpeg',
  'd64ab708-3b31-4207-ab1f-645db849f74a.jpeg',
  'e053ddf1-a233-4c86-a110-0376d4c95537.jpeg',
  'e7ce24c4-b951-4fb3-a0c6-a4c3db9822b5.jpeg',
  'f0ca2a02-3f11-4027-8f07-32d8349e7d7c.jpeg',
  'f171321a-15a0-4d87-8347-880e71e19895.jpeg',
  'fb059a97-f6d8-4f71-89aa-b02a7026c964.jpeg'
];
const AVAILABLE_SHAPES = [
  'helmetCamo',
  'helmetDesert',
  'helmetUrban',
  'labrador',
  'tank',
  'sunflower',
];

// Generate a random room ID
const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// WebRTC configuration with free STUN servers
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

// Parse room ID from URL
const parseRoomIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
};

const normalizeSignalingUrl = (inputUrl) => {
  if (!inputUrl) return null;
  try {
    const url = new URL(inputUrl, window.location.origin);
    url.search = '';
    url.hash = '';
    if (url.protocol === 'http:') {
      url.protocol = 'ws:';
    } else if (url.protocol === 'https:') {
      url.protocol = 'wss:';
    }
    return url.toString();
  } catch (error) {
    console.warn('[signaling] invalid signaling url', error);
    return null;
  }
};

const getDefaultSignalingUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const envPort = process.env.REACT_APP_SIGNALING_PORT ?? process.env.SIGNALING_PORT ?? '';
  const port = envPort.trim() || null;

  if (isLocalhost) {
    return `${protocol}//${hostname}:${port ?? '3001'}`;
  }

  if (port) {
    return `${protocol}//${hostname}:${port}`;
  }

  return `${protocol}//${window.location.host}`;
};

const clampPercent = (value, min = 10, max = 100) => {
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, min), max);
};

const parsePercentValue = (value, min = 10, max = 100) => {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === 'string' ? Number(value.replace('%', '')) : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return clampPercent(numeric, min, max);
};

const parseSetSizeParam = () => {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('SetSize');
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    const goalpostPercent = parsePercentValue(
      parsed.goalpost_height ?? parsed.goalpostHeight ?? parsed.goalpost,
      10,
      100
    );
    const userAvatarPercent = parsePercentValue(
      parsed.user_avatar_size ?? parsed.userAvatarSize ?? parsed.avatar,
      10,
      100
    );
    const ballRadiusPercent = parsePercentValue(
      parsed.ball_radius_multiply ?? parsed.ballRadiusMultiply ?? parsed.ball,
      1,
      100
    );

    return {
      goalpostPercent,
      userAvatarPercent,
      ballRadiusMultiplier: ballRadiusPercent ? ballRadiusPercent / 100 : null,
    };
  } catch (error) {
    return null;
  }
};

const parseScreenSizeConfig = () => {
  const raw = process.env.REACT_APP_SCREEN_SIZE ?? process.env.SCREEN_SIZE;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const widthMultiplier = Number(parsed.width ?? parsed.widthMultiplier ?? 1);
    const heightMultiplier = Number(parsed.height ?? parsed.heightMultiplier ?? 1);
    const view = typeof parsed.view === 'string' ? parsed.view.toLowerCase() : null;

    return {
      widthMultiplier: Number.isFinite(widthMultiplier) && widthMultiplier > 0 ? widthMultiplier : 1,
      heightMultiplier:
        Number.isFinite(heightMultiplier) && heightMultiplier > 0 ? heightMultiplier : 1,
      view,
    };
  } catch (error) {
    return null;
  }
};

const getWindowDimensions = (screenSizeConfig) => {
  const baseWidth = window.innerWidth;
  const baseHeight = window.innerHeight;

  const widthMultiplier = screenSizeConfig?.widthMultiplier ?? 1;
  const heightMultiplier = screenSizeConfig?.heightMultiplier ?? 1;

  let width = Math.round(baseWidth * widthMultiplier);
  let height = Math.round(baseHeight * heightMultiplier);

  if (screenSizeConfig?.view === 'portrait' && width > height) {
    [width, height] = [height, width];
  }
  if (screenSizeConfig?.view === 'landscape' && height > width) {
    [width, height] = [height, width];
  }

  return { width, height };
};

// Helper functions to normalize positions/velocities to 0-1 range for cross-device sync
const normalizePosition = (x, y, width, height) => ({
  x: x / width,
  y: y / height,
});

const denormalizePosition = (normX, normY, width, height) => ({
  x: normX * width,
  y: normY * height,
});

const normalizeVelocity = (vx, vy, width, height) => ({
  vx: vx / width,
  vy: vy / height,
});

const denormalizeVelocity = (normVx, normVy, width, height) => ({
  vx: normVx * width,
  vy: normVy * height,
});

const SlimeSoccer = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const keysRef = useRef({});
  const lastFrameTimeRef = useRef(0);
  const backgroundImageRef = useRef(null);
  const logoImageRef = useRef(null);
  const goalAudioRef = useRef(null);
  const goalTimeoutRef = useRef(null);
  const startGameTimeoutRef = useRef(null);
  const idleAudioRef = useRef(null);
  const idleAudioTimeoutRef = useRef(null);
  const historyImageCountRef = useRef(0);
  // Refs for goal celebration callbacks (used for cross-device sync)
  const playGoalSoundRef = useRef(null);
  const triggerGoalCelebrationRef = useRef(null);
  const waitSoundPlayedRef = useRef(false);
  const multiIdleStartRef = useRef(null);
  
  // Game state
  const [gameMode, setGameMode] = useState(null);
  const [playerMode, setPlayerMode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [instructionVisibility, setInstructionVisibility] = useState({
    line1: true,
    line2: true,
  });
  const [winner, setWinner] = useState(null);
  const [selectionStep, setSelectionStep] = useState('mode'); // 'mode', 'remoteSetup', 'shape', 'ball', 'duration'
  const [selectedShapes, setSelectedShapes] = useState({ left: null, right: null });
  const [selectedBall, setSelectedBall] = useState(null);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [historyOverlay, setHistoryOverlay] = useState({
    src: '',
    position: { x: 0, y: 0 },
    visible: false
  });
  // Touch control state
  const [blinkingKeys, setBlinkingKeys] = useState({});
  const touchTargetRef = useRef({ left: null, right: null }); // Target position for touch-to-move
  const touchKeysCountRef = useRef({ left: 0, right: 0 }); // Count of simulated key presses
  const touchActiveRef = useRef({ left: false, right: false }); // Whether touch is active
  const touchIndicatorsRef = useRef([]); // Array of touch indicators for fingerprint display
  const fingerprintImageRef = useRef(null); // Fingerprint image for touch display

  // Goalpost logo visibility state (for bottom_top alignment)
  const [goalpostLogoOpacity, setGoalpostLogoOpacity] = useState(0);
  const gameStartTimeRef = useRef(null);

  // Remote multiplayer state
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle', 'waiting', 'connecting', 'connected', 'failed'
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const signalingSocketRef = useRef(null);
  const signalingQueueRef = useRef([]);
  const roomIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const isHostRef = useRef(false);

  const logDocumentAction = useCallback((action, details = {}) => {
    console.log('[document-action]', action, {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }, []);

  const logDataChannelEvent = useCallback((direction, payload) => {
    console.log('[data-channel]', direction, {
      timestamp: new Date().toISOString(),
      type: payload?.type,
      payload,
    });
  }, []);

  const resourceBaseUrl = `${process.env.PUBLIC_URL}/resources`;
  const signalingUrl = useMemo(() => {
    return normalizeSignalingUrl(process.env.REACT_APP_SIGNALING_URL) ?? getDefaultSignalingUrl();
  }, []);
  const displayHistoryImages =
    (process.env.REACT_APP_DISPLAY_HISTORY_IMAGES ?? process.env.DISPLAY_HISTORY_IMAGES ?? 'TRUE')
      .toUpperCase() !== 'FALSE';
  const setSizeConfig = useMemo(() => parseSetSizeParam(), []);
  const screenSizeConfig = useMemo(() => parseScreenSizeConfig(), []);
  const [gameDimensions, setGameDimensions] = useState(() => ({
    ...getWindowDimensions(screenSizeConfig),
  }));
  const GAME_WIDTH = gameDimensions.width;
  const GAME_HEIGHT = gameDimensions.height;
  const isLandscape = GAME_WIDTH > GAME_HEIGHT;
  const fullScreenSize = Math.min(GAME_WIDTH, GAME_HEIGHT);
  const defaultPlayerSize = (SIZE_MULTIPLIER * fullScreenSize) / 7;
  const defaultBallSize = (SIZE_MULTIPLIER * fullScreenSize) / 11; // Doubled ball size
  const defaultGoalSize = (SIZE_MULTIPLIER * fullScreenSize) / 4;
  const playerSize = setSizeConfig?.userAvatarPercent
    ? (setSizeConfig.userAvatarPercent / 100) * GAME_HEIGHT
    : defaultPlayerSize;
  const ballRadiusMultiplier = setSizeConfig?.ballRadiusMultiplier ?? null;
  const ballSize = ballRadiusMultiplier ? playerSize * ballRadiusMultiplier * 2 : defaultBallSize;
  const goalWidth = defaultGoalSize;
  const goalHeight = setSizeConfig?.goalpostPercent
    ? (setSizeConfig.goalpostPercent / 100) * GAME_HEIGHT
    : defaultGoalSize;
  const SLIME_RADIUS = playerSize / 1.3; // 2;
  const BALL_RADIUS = ballSize / 2;
  // For bottom_top alignment: goalpost is 50% of screen width, centered at top/bottom
  // For right_left alignment: goalpost is on left/right sides (original behavior)
  const GOAL_WIDTH = BOARD_ALIGNMENT === 'bottom_top' ? GAME_WIDTH * 0.5 : goalWidth;
  const GOAL_HEIGHT = BOARD_ALIGNMENT === 'bottom_top' ? GROUND_HEIGHT * 1.2 : goalHeight * 1.8;
  const computeStartPositions = useCallback(
    (fieldWidth, fieldHeight) => {
      if (BOARD_ALIGNMENT === 'bottom_top') {
        // rightSlime (user-controlled) at bottom, leftSlime (AI) at top
        const bottomY = fieldHeight - GROUND_HEIGHT;
        const topY = GROUND_HEIGHT + SLIME_RADIUS;
        return {
          leftX: fieldWidth / 2, // AI player (top) centered
          rightX: fieldWidth / 2, // User player (bottom) centered
          leftY: topY, // AI at top
          rightY: bottomY // User at bottom
        };
      } else {
        // Original right_left positioning
        const leftX = Math.max(SLIME_RADIUS + 10, GOAL_WIDTH * 0.6);
        const rightX = Math.min(fieldWidth - SLIME_RADIUS - 10, fieldWidth - GOAL_WIDTH * 0.6);
        return { leftX, rightX };
      }
    },
    [SLIME_RADIUS, GOAL_WIDTH]
  );

  useEffect(() => {
    const handleResize = () => {
      setGameDimensions({
        ...getWindowDimensions(screenSizeConfig),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkTouchSupport = () => {
      setIsTouchDevice(
        window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
      );
    };
    checkTouchSupport();
    window.addEventListener('resize', checkTouchSupport);
    return () => window.removeEventListener('resize', checkTouchSupport);
  }, []);

  useEffect(() => {
    console.log('[signaling] using url', signalingUrl);
  }, [signalingUrl]);

  // Keep roomIdRef in sync with roomId state for use in callbacks
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const pickRandomShape = useCallback((excludeShape) => {
    const available = AVAILABLE_SHAPES.filter((shape) => shape !== excludeShape);
    const pool = available.length ? available : AVAILABLE_SHAPES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // Generate join URL for remote multiplayer
  const getJoinUrl = useCallback((roomIdToUse) => {
    const baseUrl = new URL(`${window.location.origin}${window.location.pathname}`);
    baseUrl.searchParams.set('room', roomIdToUse);
    return baseUrl.toString();
  }, []);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  useEffect(() => {
    let isActive = true;
    if (!roomId) {
      setQrCodeDataUrl(null);
      return () => {
        isActive = false;
      };
    }

    const joinUrl = getJoinUrl(roomId);
    QRCode.toDataURL(joinUrl, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        if (isActive) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch((error) => {
        console.warn('[qr] failed to generate QR code', error);
        if (isActive) {
          setQrCodeDataUrl(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [roomId, getJoinUrl]);

  // Clean up WebRTC connection
  const cleanupConnection = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
  }, []);

  const cleanupSignaling = useCallback(() => {
    if (signalingSocketRef.current) {
      signalingSocketRef.current.close();
      signalingSocketRef.current = null;
    }
    signalingQueueRef.current = [];
  }, []);

  // Send data through WebRTC data channel
  const sendData = useCallback((data) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      logDataChannelEvent('send', data);
      dataChannelRef.current.send(JSON.stringify(data));
    } else {
      logDataChannelEvent('send-skipped', {
        reason: 'dataChannelNotOpen',
        data,
        readyState: dataChannelRef.current?.readyState,
      });
    }
  }, [logDataChannelEvent]);

  const flushSignalingQueue = useCallback(() => {
    const socket = signalingSocketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    signalingQueueRef.current.forEach((message) => socket.send(message));
    signalingQueueRef.current = [];
  }, []);

  const sendSignalingMessage = useCallback((message) => {
    const socket = signalingSocketRef.current;
    const payload = JSON.stringify(message);
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('[signaling] sending message', message.type, message.roomId, {
        timestamp: new Date().toISOString(),
        message,
      });
      socket.send(payload);
    } else {
      console.warn('[signaling] socket not ready, queueing', message.type, message.roomId, {
        timestamp: new Date().toISOString(),
        message,
      });
      signalingQueueRef.current.push(payload);
    }
  }, []);

  // Handle incoming data from peer
  const handlePeerData = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      logDataChannelEvent('receive', data);

      if (data.type === 'gameState') {
        // Sync game state from host
        const state = gameStateRef.current;
        if (!isHost) {
          // Guest receives state from host
          state.leftSlime.x = data.leftSlime.x;
          state.leftSlime.y = data.leftSlime.y;
          state.leftSlime.vx = data.leftSlime.vx;
          state.leftSlime.vy = data.leftSlime.vy;
          state.leftSlime.isGrabbing = data.leftSlime.isGrabbing;
          state.leftSlime.hasBall = data.leftSlime.hasBall;
          state.leftSlime.goalLineTime = data.leftSlime.goalLineTime;

          state.ball.x = data.ball.x;
          state.ball.y = data.ball.y;
          state.ball.vx = data.ball.vx;
          state.ball.vy = data.ball.vy;
          state.ball.grabbedBy = data.ball.grabbedBy;
          state.ball.grabAngle = data.ball.grabAngle;
          state.ball.grabAngularVelocity = data.ball.grabAngularVelocity;
        }
      } else if (data.type === 'input') {
        // Receive input from peer
        logDocumentAction('remote-input', {
          left: data.left,
          right: data.right,
          up: data.up,
          down: data.down,
          isHost,
        });
        if (isHost) {
          // Host receives guest (left player) input
          keysRef.current['a'] = data.left;
          keysRef.current['d'] = data.right;
          keysRef.current['w'] = data.up;
          keysRef.current['s'] = data.down;
        } else {
          // Guest receives host (right player) input
          keysRef.current['arrowleft'] = data.left;
          keysRef.current['arrowright'] = data.right;
          keysRef.current['arrowup'] = data.up;
          keysRef.current['arrowdown'] = data.down;
        }
      } else if (data.type === 'score') {
        setScore(data.score);
      } else if (data.type === 'timeLeft') {
        setTimeLeft(data.timeLeft);
      } else if (data.type === 'gameStart') {
        setSelectedShapes(data.selectedShapes);
        setSelectedBall(data.selectedBall);
        setGameMode(data.gameMode);
        setTimeLeft(data.timeLeft);
        setGameStarted(true);
      } else if (data.type === 'gameEnd') {
        setWinner(data.winner);
        setGameStarted(false);
      } else if (data.type === 'selectionStep') {
        // Guest receives selection step from host
        setSelectionStep(data.step);
        if (data.hostShape) {
          setSelectedShapes((prev) => ({ ...prev, right: data.hostShape }));
        }
      } else if (data.type === 'guestCharacterSelect') {
        // Host receives guest's character selection
        setSelectedShapes((prev) => ({ ...prev, left: data.shape }));
      } else if (data.type === 'hostState') {
        // Guest receives full state sync including right player position
        // Denormalize positions from 0-1 range to local screen dimensions
        const state = gameStateRef.current;

        // Denormalize right slime position and velocity
        const rightPos = denormalizePosition(data.rightSlime.x, data.rightSlime.y, GAME_WIDTH, GAME_HEIGHT);
        const rightVel = denormalizeVelocity(data.rightSlime.vx, data.rightSlime.vy, GAME_WIDTH, GAME_HEIGHT);
        state.rightSlime.x = rightPos.x;
        state.rightSlime.y = rightPos.y;
        state.rightSlime.vx = rightVel.vx;
        state.rightSlime.vy = rightVel.vy;
        state.rightSlime.isGrabbing = data.rightSlime.isGrabbing;
        state.rightSlime.hasBall = data.rightSlime.hasBall;
        state.rightSlime.goalLineTime = data.rightSlime.goalLineTime;

        // Denormalize left slime position and velocity
        const leftPos = denormalizePosition(data.leftSlime.x, data.leftSlime.y, GAME_WIDTH, GAME_HEIGHT);
        const leftVel = denormalizeVelocity(data.leftSlime.vx, data.leftSlime.vy, GAME_WIDTH, GAME_HEIGHT);
        state.leftSlime.x = leftPos.x;
        state.leftSlime.y = leftPos.y;
        state.leftSlime.vx = leftVel.vx;
        state.leftSlime.vy = leftVel.vy;
        state.leftSlime.isGrabbing = data.leftSlime.isGrabbing;
        state.leftSlime.hasBall = data.leftSlime.hasBall;
        state.leftSlime.goalLineTime = data.leftSlime.goalLineTime;

        // Denormalize ball position and velocity
        const ballPos = denormalizePosition(data.ball.x, data.ball.y, GAME_WIDTH, GAME_HEIGHT);
        const ballVel = denormalizeVelocity(data.ball.vx, data.ball.vy, GAME_WIDTH, GAME_HEIGHT);
        state.ball.x = ballPos.x;
        state.ball.y = ballPos.y;
        state.ball.vx = ballVel.vx;
        state.ball.vy = ballVel.vy;
        state.ball.grabbedBy = data.ball.grabbedBy;
        state.ball.grabAngle = data.ball.grabAngle;
        state.ball.grabAngularVelocity = data.ball.grabAngularVelocity;
      } else if (data.type === 'goalCelebration') {
        // Guest receives goal celebration notification from host
        if (playGoalSoundRef.current) playGoalSoundRef.current();
        if (triggerGoalCelebrationRef.current) triggerGoalCelebrationRef.current();
      } else if (data.type === 'touch' && DISPLAY_TOUCH_MODE === 'both') {
        // Show remote player's touch indicator
        const x = data.x * GAME_WIDTH;
        const y = data.y * GAME_HEIGHT;
        const playerId = isHost ? 'left' : 'right';
        touchIndicatorsRef.current.push({
          x,
          y,
          playerId,
          isLocal: false,
          createdAt: Date.now(),
          opacity: 0.7
        });
      }
    } catch (e) {
      console.error('Error parsing peer data:', e);
    }
  }, [isHost, logDataChannelEvent, logDocumentAction, GAME_WIDTH, GAME_HEIGHT]);

  // Setup data channel event handlers
  const setupDataChannel = useCallback((channel) => {
    console.log('[webrtc] setting up data channel:', channel.label);
    channel.onopen = () => {
      console.log('[webrtc] data channel opened');
      setConnectionStatus('connected');
      setRemoteConnected(true);
    };
    channel.onclose = () => {
      console.log('[webrtc] data channel closed');
      setRemoteConnected(false);
      setConnectionStatus('idle');
    };
    channel.onerror = (error) => {
      console.error('[webrtc] data channel error:', error);
      setConnectionStatus('failed');
    };
    channel.onmessage = handlePeerData;
    dataChannelRef.current = channel;
  }, [handlePeerData]);

  // Create WebRTC offer (host)
  const createOffer = useCallback(async (roomIdToUse) => {
    try {
      cleanupConnection();
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      const channel = pc.createDataChannel('game', { ordered: false });
      setupDataChannel(channel);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'iceCandidate',
            roomId: roomIdToUse,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[webrtc] connection state changed:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          setConnectionStatus('failed');
        } else if (pc.connectionState === 'connected') {
          console.log('[webrtc] peer connection established');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[webrtc] ICE connection state:', pc.iceConnectionState);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') resolve();
          };
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        }
      });

      return pc.localDescription;
    } catch (error) {
      console.error('Error creating offer:', error);
      setConnectionStatus('failed');
      return null;
    }
  }, [cleanupConnection, sendSignalingMessage, setupDataChannel]);

  // Handle WebRTC answer (host)
  const handleAnswer = useCallback(async (answer) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[signaling] host set remote description (answer)');

      // Flush any pending ICE candidates that arrived before the answer
      const pendingCandidates = pendingIceCandidatesRef.current;
      pendingIceCandidatesRef.current = [];
      console.log('[signaling] flushing', pendingCandidates.length, 'queued ICE candidates (host)');
      for (const candidate of pendingCandidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[signaling] failed to add queued ICE candidate (host)', err);
        }
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      setConnectionStatus('failed');
    }
  }, []);

  // Create WebRTC answer (guest)
  const createAnswer = useCallback(async (offer) => {
    try {
      cleanupConnection();
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'iceCandidate',
            roomId: roomIdRef.current,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[webrtc] connection state changed:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          setConnectionStatus('failed');
        } else if (pc.connectionState === 'connected') {
          console.log('[webrtc] peer connection established');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[webrtc] ICE connection state:', pc.iceConnectionState);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush any pending ICE candidates that arrived before remote description was set
      const pendingCandidates = pendingIceCandidatesRef.current;
      pendingIceCandidatesRef.current = [];
      console.log('[signaling] flushing', pendingCandidates.length, 'queued ICE candidates (guest)');
      for (const candidate of pendingCandidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[signaling] failed to add queued ICE candidate (guest)', err);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering
      await new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') resolve();
          };
          setTimeout(resolve, 5000);
        }
      });

      return pc.localDescription;
    } catch (error) {
      console.error('Error creating answer:', error);
      setConnectionStatus('failed');
      return null;
    }
  }, [cleanupConnection, sendSignalingMessage, setupDataChannel]);

  const handleSignalingMessage = useCallback(async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[signaling] received message', message.type, message.roomId);
      if (message.type === 'offer' && !isHostRef.current) {
        const answer = await createAnswer(message.offer);
        if (answer) {
          sendSignalingMessage({ type: 'answer', roomId: roomIdRef.current, answer });
        }
      } else if (message.type === 'answer' && isHostRef.current) {
        await handleAnswer(message.answer);
      } else if (message.type === 'iceCandidate') {
        const pc = peerConnectionRef.current;
        if (pc && message.candidate) {
          // Queue ICE candidates if remote description is not set yet (host waiting for answer)
          if (!pc.remoteDescription) {
            console.log('[signaling] queueing ICE candidate (no remote description yet)');
            pendingIceCandidatesRef.current.push(message.candidate);
          } else {
            console.log('[signaling] adding ICE candidate directly');
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
        }
      } else if (message.type === 'roomFull') {
        console.warn('[signaling] room full');
        setConnectionStatus('failed');
      } else if (message.type === 'peerLeft') {
        console.warn('[signaling] peer left');
        setConnectionStatus('failed');
        setRemoteConnected(false);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }, [createAnswer, handleAnswer, sendSignalingMessage]);

  const connectSignaling = useCallback(() => {
    const existingSocket = signalingSocketRef.current;
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (!signalingUrl) {
      console.error('[signaling] missing signaling url');
      setConnectionStatus('failed');
      return Promise.reject(new Error('Missing signaling URL'));
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(signalingUrl);
      signalingSocketRef.current = socket;

      socket.onopen = () => {
        if (settled) return;
        settled = true;
        console.log('[signaling] socket connected');
        flushSignalingQueue();
        resolve();
      };
      socket.onmessage = handleSignalingMessage;
      socket.onerror = (error) => {
        console.error('[signaling] socket error', error);
        if (settled) return;
        settled = true;
        setConnectionStatus('failed');
        reject(error instanceof Error ? error : new Error('Signaling socket error'));
      };
      socket.onclose = (event) => {
        console.warn('[signaling] socket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (settled) return;
        settled = true;
        if (!remoteConnected) {
          console.warn('[signaling] socket closed before connection established');
          setConnectionStatus('failed');
        }
        reject(new Error('Signaling socket closed before connection established'));
      };
    });
  }, [flushSignalingQueue, handleSignalingMessage, remoteConnected, signalingUrl]);

  // Start hosting a remote game
  const startHosting = useCallback(async () => {
    const newRoomId = generateRoomId();
    console.log('[remote] start hosting', newRoomId);
    setRoomId(newRoomId);
    setIsHost(true);
    isHostRef.current = true;
    setConnectionStatus('waiting');
    setPlayerMode('remote');
    setSelectionStep('remoteSetup');
    try {
      await connectSignaling();
    } catch (error) {
      console.error('[remote] failed to connect signaling server', error);
      setConnectionStatus('failed');
      return;
    }
    sendSignalingMessage({ type: 'host', roomId: newRoomId });

    const offer = await createOffer(newRoomId);
    if (offer) {
      sendSignalingMessage({ type: 'offer', roomId: newRoomId, offer });
    } else {
      console.warn('[remote] failed to create offer');
    }
  }, [connectSignaling, createOffer, sendSignalingMessage]);

  // Join a remote game
  const joinGame = useCallback(async (roomIdToJoin) => {
    console.log('[remote] join game', roomIdToJoin);
    roomIdRef.current = roomIdToJoin; // Set ref immediately for use in callbacks
    setRoomId(roomIdToJoin);
    setIsHost(false);
    isHostRef.current = false;
    setConnectionStatus('connecting');
    setPlayerMode('remote');
    try {
      await connectSignaling();
    } catch (error) {
      console.error('[remote] failed to connect signaling server', error);
      setConnectionStatus('failed');
      return;
    }
    sendSignalingMessage({ type: 'join', roomId: roomIdToJoin });

    setTimeout(() => {
      if (connectionStatus === 'connecting') {
        console.warn('[remote] connection timed out');
        setConnectionStatus('failed');
      }
    }, 60000);
  }, [connectSignaling, connectionStatus, sendSignalingMessage]);

  // Copy link to clipboard
  const copyLinkToClipboard = useCallback(() => {
    if (!roomId) return;
    const joinUrl = getJoinUrl(roomId);
    navigator.clipboard.writeText(joinUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(console.error);
  }, [roomId, getJoinUrl]);

  // Share link using Web Share API
  const shareLinkToMobile = useCallback(() => {
    if (!roomId) return;
    const joinUrl = getJoinUrl(roomId);
    if (navigator.share) {
      navigator.share({
        title: '💎אליפות יהלומים💎',
        text: `\n${t('shareInviteIntro')}\n${t('gameInstruction1')}\n${t('gameInstruction2')}\n`,
        url: joinUrl
      }).catch(console.error);
    } else {
      // Fallback to copy if Web Share API is not available
      copyLinkToClipboard();
    }
  }, [roomId, getJoinUrl, copyLinkToClipboard]);

  // Check for room ID in URL on mount
  useEffect(() => {
    const urlRoomId = parseRoomIdFromUrl();
    if (urlRoomId) {
      joinGame(urlRoomId);
      setSelectionStep('remoteSetup');
    }
  }, []);

  // Sync game state over network (host sends state to guest)
  // Positions are normalized to 0-1 range for cross-device compatibility
  useEffect(() => {
    if (!gameStarted || !remoteConnected || !isHost) return;

    const syncInterval = setInterval(() => {
      const state = gameStateRef.current;
      // Normalize positions and velocities to 0-1 range based on host's screen dimensions
      const leftPos = normalizePosition(state.leftSlime.x, state.leftSlime.y, GAME_WIDTH, GAME_HEIGHT);
      const leftVel = normalizeVelocity(state.leftSlime.vx, state.leftSlime.vy, GAME_WIDTH, GAME_HEIGHT);
      const rightPos = normalizePosition(state.rightSlime.x, state.rightSlime.y, GAME_WIDTH, GAME_HEIGHT);
      const rightVel = normalizeVelocity(state.rightSlime.vx, state.rightSlime.vy, GAME_WIDTH, GAME_HEIGHT);
      const ballPos = normalizePosition(state.ball.x, state.ball.y, GAME_WIDTH, GAME_HEIGHT);
      const ballVel = normalizeVelocity(state.ball.vx, state.ball.vy, GAME_WIDTH, GAME_HEIGHT);

      sendData({
        type: 'hostState',
        leftSlime: {
          x: leftPos.x,
          y: leftPos.y,
          vx: leftVel.vx,
          vy: leftVel.vy,
          isGrabbing: state.leftSlime.isGrabbing,
          hasBall: state.leftSlime.hasBall,
          goalLineTime: state.leftSlime.goalLineTime,
        },
        rightSlime: {
          x: rightPos.x,
          y: rightPos.y,
          vx: rightVel.vx,
          vy: rightVel.vy,
          isGrabbing: state.rightSlime.isGrabbing,
          hasBall: state.rightSlime.hasBall,
          goalLineTime: state.rightSlime.goalLineTime,
        },
        ball: {
          x: ballPos.x,
          y: ballPos.y,
          vx: ballVel.vx,
          vy: ballVel.vy,
          grabbedBy: state.ball.grabbedBy,
          grabAngle: state.ball.grabAngle,
          grabAngularVelocity: state.ball.grabAngularVelocity,
        },
      });
    }, 1000 / 30); // 30 times per second

    return () => clearInterval(syncInterval);
  }, [gameStarted, remoteConnected, isHost, sendData, GAME_WIDTH, GAME_HEIGHT]);

  // Send local input to peer
  useEffect(() => {
    if (!gameStarted || !remoteConnected) return;

    const inputInterval = setInterval(() => {
      const keys = keysRef.current;
      if (isHost) {
        // Host sends right player (arrow) input
        sendData({
          type: 'input',
          left: keys['arrowleft'] || false,
          right: keys['arrowright'] || false,
          up: keys['arrowup'] || false,
          down: keys['arrowdown'] || false,
        });
      } else {
        // Guest sends left player (WASD) input
        // In bottom_top mode, guest's view is flipped 180°, so invert input directions
        if (BOARD_ALIGNMENT === 'bottom_top') {
          sendData({
            type: 'input',
            left: keys['d'] || false,   // D on flipped view = left in game coords
            right: keys['a'] || false,  // A on flipped view = right in game coords
            up: keys['s'] || false,     // S on flipped view = up in game coords
            down: keys['w'] || false,   // W on flipped view = down in game coords
          });
        } else {
          sendData({
            type: 'input',
            left: keys['a'] || false,
            right: keys['d'] || false,
            up: keys['w'] || false,
            down: keys['s'] || false,
          });
        }
      }
    }, 1000 / 60); // 60 times per second

    return () => clearInterval(inputInterval);
  }, [gameStarted, remoteConnected, isHost, sendData]);

  // Sync score changes
  useEffect(() => {
    if (remoteConnected && isHost) {
      sendData({ type: 'score', score });
    }
  }, [score, remoteConnected, isHost, sendData]);

  // Sync time changes
  useEffect(() => {
    if (remoteConnected && isHost) {
      sendData({ type: 'timeLeft', timeLeft });
    }
  }, [timeLeft, remoteConnected, isHost, sendData]);

  // In remote mode, proceed to ball selection when both characters are selected
  useEffect(() => {
    if (
      playerMode === 'remote' &&
      isHost &&
      selectionStep === 'shape' &&
      selectedShapes.left &&
      selectedShapes.right
    ) {
      setSelectionStep('ball');
    }
  }, [playerMode, isHost, selectionStep, selectedShapes.left, selectedShapes.right]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnection();
      cleanupSignaling();
    };
  }, [cleanupConnection, cleanupSignaling]);

  // Load background images
  useEffect(() => {
    // Create canvas background with cannabis and diamonds
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = GAME_WIDTH;
    bgCanvas.height = GAME_HEIGHT;
    const bgCtx = bgCanvas.getContext('2d');
    
    // Create light green background for the game field
    bgCtx.fillStyle = '#b8e6a3';
    bgCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    backgroundImageRef.current = bgCanvas;
    
    // Load Seach logo
    const logoImg = new Image();
    logoImg.src = `${resourceBaseUrl}/seach-logo.png`;
    logoImg.onload = () => {
      logoImageRef.current = logoImg;
    };

    // Load fingerprint image for touch display
    if (DISPLAY_TOUCH_MODE !== 'none') {
      const fingerprintImg = new Image();
      fingerprintImg.src = `${resourceBaseUrl}/fingerprint.png`;
      fingerprintImg.onload = () => {
        fingerprintImageRef.current = fingerprintImg;
      };
    }
  }, [GAME_HEIGHT, GAME_WIDTH, resourceBaseUrl]);

  useEffect(() => {
    goalAudioRef.current = new Audio(`${resourceBaseUrl}/croud.mp3`);
    idleAudioRef.current = new Audio(`${resourceBaseUrl}/go.mp3`);
    if (goalAudioRef.current) {
      goalAudioRef.current.volume = 0.5;
    }
    if (idleAudioRef.current) {
      idleAudioRef.current.volume = 0.5;
    }

    return () => {
      if (goalTimeoutRef.current) {
        clearTimeout(goalTimeoutRef.current);
      }
      if (startGameTimeoutRef.current) {
        clearTimeout(startGameTimeoutRef.current);
      }
      if (idleAudioTimeoutRef.current) {
        clearTimeout(idleAudioTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const shouldRunButtonWait =
      selectionStep !== 'mode' && !gameStarted && !winner && BUTTON_WAIT > 0;

    const scheduleButtonWaitAudio = () => {
      if (idleAudioTimeoutRef.current) {
        clearTimeout(idleAudioTimeoutRef.current);
      }
      if (!shouldRunButtonWait) {
        return;
      }
      idleAudioTimeoutRef.current = setTimeout(() => {
        if (idleAudioRef.current) {
          idleAudioRef.current.currentTime = 0;
          idleAudioRef.current.play().catch(() => {});
        }
      }, BUTTON_WAIT * 1000);
    };

    const handleUserActivity = () => {
      scheduleButtonWaitAudio();
    };

    scheduleButtonWaitAudio();
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (idleAudioTimeoutRef.current) {
        clearTimeout(idleAudioTimeoutRef.current);
      }
    };
  }, [BUTTON_WAIT, gameStarted, selectionStep, winner]);

  const handleHistoryImageShown = useCallback(() => {
    if (waitSoundPlayedRef.current || WAIT_START <= 0) {
      return;
    }
    historyImageCountRef.current += 1;
    if (historyImageCountRef.current >= WAIT_START) {
      waitSoundPlayedRef.current = true;
      if (idleAudioRef.current) {
        idleAudioRef.current.currentTime = 0;
        idleAudioRef.current.play().catch(() => {});
      }
    }
  }, [WAIT_START]);

  useEffect(() => {
    // Show history images on all selection screens (not during actual game or winner display)
    const showImages = !gameStarted && !winner && displayHistoryImages;
    if (!showImages) {
      historyImageCountRef.current = 0;
      waitSoundPlayedRef.current = false;
      setHistoryOverlay((prev) => ({ ...prev, visible: false }));
      return;
    }

    let cancelled = false;
    const timeouts = [];
    const fadeDuration = 0;
    const visibleDuration = 1000;
    const pauseDuration = 0;
    // Keep round history images below the button area (lower 30% of the screen).
    const minCenterOffset = 5;
    const maxCenterOffset = 95;

    const scheduleCycle = () => {
      if (cancelled) return;
      const pick = HISTORY_IMAGE_FILES[Math.floor(Math.random() * HISTORY_IMAGE_FILES.length)];
      const position = {
        x: minCenterOffset + Math.random() * (maxCenterOffset - minCenterOffset),
        y: minCenterOffset + Math.random() * (maxCenterOffset - minCenterOffset)
      };

      setHistoryOverlay({
        src: `${resourceBaseUrl}/front-images/${pick}`,
        position,
        visible: false
      });

      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          setHistoryOverlay((prev) => ({ ...prev, visible: true }));
          handleHistoryImageShown();
        }, 50)
      );

      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          setHistoryOverlay((prev) => ({ ...prev, visible: false }));
        }, visibleDuration)
      );

      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          scheduleCycle();
        }, visibleDuration + fadeDuration + pauseDuration)
      );
    };

    historyImageCountRef.current = 0;
    waitSoundPlayedRef.current = false;
    scheduleCycle();

    return () => {
      cancelled = true;
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [displayHistoryImages, handleHistoryImageShown, resourceBaseUrl, gameStarted, winner]);

  const playGoalSound = useCallback(() => {
    if (goalAudioRef.current) {
      goalAudioRef.current.currentTime = 0;
      goalAudioRef.current.play().catch(() => {});
    }
  }, []);

  const triggerGoalCelebration = useCallback(() => {
    if (goalTimeoutRef.current) {
      clearTimeout(goalTimeoutRef.current);
    }
    setShowGoalCelebration(true);
    goalTimeoutRef.current = setTimeout(() => {
      setShowGoalCelebration(false);
    }, 1000);
  }, []);

  // Update refs for goal callbacks (used for cross-device sync)
  useEffect(() => {
    playGoalSoundRef.current = playGoalSound;
    triggerGoalCelebrationRef.current = triggerGoalCelebration;
  }, [playGoalSound, triggerGoalCelebration]);
  
  const drawCannabisLeaf = (ctx, x, y, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    // Central leaf
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.1, -size * 0.5, size * 0.15, 0);
    ctx.quadraticCurveTo(size * 0.1, size * 0.3, 0, size * 0.4);
    ctx.quadraticCurveTo(-size * 0.1, size * 0.3, -size * 0.15, 0);
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.5, 0, -size);
    ctx.fill();
    
    // Side leaves
    for (let angle = -60; angle <= 60; angle += 30) {
      if (angle === 0) continue;
      ctx.save();
      ctx.rotate((angle * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.7);
      ctx.quadraticCurveTo(size * 0.08, -size * 0.4, size * 0.1, 0);
      ctx.quadraticCurveTo(size * 0.05, size * 0.2, 0, size * 0.3);
      ctx.quadraticCurveTo(-size * 0.05, size * 0.2, -size * 0.1, 0);
      ctx.quadraticCurveTo(-size * 0.08, -size * 0.4, 0, -size * 0.7);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };
  
  const drawDiamond = (ctx, x, y, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    
    // Inner sparkle
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(size * 0.3, 0);
    ctx.lineTo(0, size * 0.5);
    ctx.lineTo(-size * 0.3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  
  // Game objects state
  const initialPositions = computeStartPositions(GAME_WIDTH, GAME_HEIGHT);
  const gameStateRef = useRef({
    leftSlime: {
      x: initialPositions.leftX,
      y: BOARD_ALIGNMENT === 'bottom_top'
        ? (initialPositions.leftY ?? GAME_HEIGHT - GROUND_HEIGHT)
        : GAME_HEIGHT - GROUND_HEIGHT,
      vx: 0,
      vy: 0,
      isGrabbing: false,
      hasBall: false,
      goalLineTime: 0,
      targetX: initialPositions.leftX,
      lastDecisionTime: 0,
      decisionCooldown: 0,
      stableStart: true
    },
    rightSlime: {
      x: initialPositions.rightX,
      y: BOARD_ALIGNMENT === 'bottom_top'
        ? (initialPositions.rightY ?? GAME_HEIGHT - GROUND_HEIGHT)
        : GAME_HEIGHT - GROUND_HEIGHT,
      vx: 0,
      vy: 0,
      isGrabbing: false,
      hasBall: false,
      goalLineTime: 0
    },
    ball: {
      x: GAME_WIDTH / 2,
      y: BOARD_ALIGNMENT === 'bottom_top' ? GAME_HEIGHT / 2 : 150, // Center for bottom_top
      vx: 0,
      vy: 0,
      grabbedBy: null,
      grabAngle: 0,
      grabAngularVelocity: 0,
      haltedUntil: 0
    }
  });

  // Handle keyboard input
  useEffect(() => {
    const remoteKeySets = {
      left: new Set(['a', 'd', 'w', 's', 'shift']),
      right: new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']),
    };

    const shouldHandleRemoteKey = (key) => {
      if (playerMode !== 'remote') return true;
      const allowedKeys = isHost ? remoteKeySets.right : remoteKeySets.left;
      return allowedKeys.has(key);
    };

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (!shouldHandleRemoteKey(key)) return;
      e.preventDefault();
      logDocumentAction('keydown', {
        key,
        code: e.code,
        repeat: e.repeat,
        target: e.target.tagName,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
      });
      keysRef.current[key] = true;
    };
    
    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (!shouldHandleRemoteKey(key)) return;
      e.preventDefault();
      logDocumentAction('keyup', {
        key,
        code: e.code,
        repeat: e.repeat,
        target: e.target.tagName,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
      });
      keysRef.current[key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHost, logDocumentAction, playerMode]);

  // Timer
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameStarted(false);
            determineWinner();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameStarted, timeLeft]);

  const determineWinner = () => {
    let winnerResult;
    if (score.left > score.right) {
      winnerResult = t('cyanTeam');
    } else if (score.right > score.left) {
      winnerResult = t('redTeam');
    } else {
      winnerResult = 'Draw';
    }
    setWinner(winnerResult);

    // Notify remote peer about game end
    if (playerMode === 'remote' && remoteConnected && isHost) {
      sendData({ type: 'gameEnd', winner: winnerResult });
    }
  };

  const resetPositions = () => {
    const state = gameStateRef.current;
    const positions = computeStartPositions(GAME_WIDTH, GAME_HEIGHT);
    state.leftSlime.x = positions.leftX;
    state.leftSlime.y = BOARD_ALIGNMENT === 'bottom_top'
      ? (positions.leftY ?? GAME_HEIGHT - GROUND_HEIGHT)
      : GAME_HEIGHT - GROUND_HEIGHT;
    state.leftSlime.vx = 0;
    state.leftSlime.vy = 0;
    state.leftSlime.isGrabbing = false;
    state.leftSlime.hasBall = false;
    state.leftSlime.goalLineTime = 0;
    state.leftSlime.targetX = positions.leftX;
    state.leftSlime.lastDecisionTime = 0;
    state.leftSlime.decisionCooldown = 0;
    state.leftSlime.stableStart = true;

    state.rightSlime.x = positions.rightX;
    state.rightSlime.y = BOARD_ALIGNMENT === 'bottom_top'
      ? (positions.rightY ?? GAME_HEIGHT - GROUND_HEIGHT)
      : GAME_HEIGHT - GROUND_HEIGHT;
    state.rightSlime.vx = 0;
    state.rightSlime.vy = 0;
    state.rightSlime.isGrabbing = false;
    state.rightSlime.hasBall = false;
    state.rightSlime.goalLineTime = 0;

    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = BOARD_ALIGNMENT === 'bottom_top' ? GAME_HEIGHT / 2 : 150;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.grabbedBy = null;
    state.ball.grabAngle = 0;
    state.ball.grabAngularVelocity = 0;
    // For bottom_top mode: ball stays in center until hit (haltedUntil = Infinity means halted forever until hit)
    // For right_left mode: 2 second delay before ball starts falling
    state.ball.haltedUntil = BOARD_ALIGNMENT === 'bottom_top' ? Infinity : Date.now() + 2000;
  };

  const resetGame = () => {
    resetPositions();
    setScore({ left: 0, right: 0 });
    setWinner(null);
  };

  const startGame = (mode) => {
    const times = {
      '1min': 60,
      '2min': 120,
      '4min': 240,
      '8min': 480,
      'worldcup': 300
    };

    if (startGameTimeoutRef.current) {
      clearTimeout(startGameTimeoutRef.current);
      startGameTimeoutRef.current = null;
    }
    resetGame();
    setGameMode(mode);
    setTimeLeft(times[mode]);
    setGameStarted(false);
    setGoalpostLogoOpacity(0); // Reset logo opacity
    startGameTimeoutRef.current = setTimeout(() => {
      setGameStarted(true);
      gameStartTimeRef.current = Date.now(); // Track game start time for logo fade
      // Notify remote peer about game start
      if (playerMode === 'remote' && remoteConnected && isHost) {
        sendData({
          type: 'gameStart',
          selectedShapes,
          selectedBall,
          gameMode: mode,
          timeLeft: times[mode],
        });
      }
    }, 2000);
  };

  // AI logic
  const updateAI = useCallback(() => {
    if (playerMode !== 'single') return;
    
    const state = gameStateRef.current;
    const ai = state.leftSlime;
    const opponent = state.rightSlime;
    const ball = state.ball;
    const currentTime = Date.now();
    const { leftX } = computeStartPositions(GAME_WIDTH);
    
    if (ai.decisionCooldown > 0) {
      ai.decisionCooldown--;
      const difference = ai.targetX - ai.x;
      const absDistance = Math.abs(difference);
      
      if (absDistance > 10) {
        const speedMultiplier = Math.min(absDistance / 50, 1.0);
        ai.vx = Math.sign(difference) * SLIME_SPEED * speedMultiplier;
      } else {
        ai.vx = 0;
      }
      return;
    }
    
    if (ai.stableStart && timeLeft > 55) {
      ai.targetX = leftX;
      ai.vx = 0;
      if (Math.abs(ball.x - ai.x) < 150 || timeLeft <= 55) {
        ai.stableStart = false;
        ai.decisionCooldown = 15;
      }
      return;
    }
    
    const FIELD_WIDTH = GAME_WIDTH;
    const OPPONENT_GOAL_X = FIELD_WIDTH - GOAL_WIDTH / 2;
    const AI_GOAL_X = GOAL_WIDTH / 2;
    
    const randomFactor = Math.sin(currentTime * 0.001) * 0.5 + 0.5;
    const aggressiveness = 0.8;
    
    let predictions = [];
    let tempX = ball.x;
    let tempY = ball.y;
    let tempVx = ball.vx;
    let tempVy = ball.vy;
    
    for (let t = 0; t < 100; t++) {
      tempVy += BALL_GRAVITY;
      tempVx *= BALL_DAMPING;
      tempX += tempVx;
      tempY += tempVy;
      
      if (tempX < BALL_RADIUS) {
        tempX = BALL_RADIUS;
        tempVx = -tempVx * BALL_BOUNCE_DAMPING;
      }
      if (tempX > FIELD_WIDTH - BALL_RADIUS) {
        tempX = FIELD_WIDTH - BALL_RADIUS;
        tempVx = -tempVx * BALL_BOUNCE_DAMPING;
      }
      
      predictions.push({ x: tempX, y: tempY, vx: tempVx, vy: tempVy, time: t });
      
      if (tempY > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS) {
        tempY = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;
        tempVy = -tempVy * BALL_BOUNCE_DAMPING;
        break;
      }
    }
    
    const ballDistanceToOpponentGoal = Math.abs(ball.x - OPPONENT_GOAL_X);
    const ballDistanceToAIGoal = Math.abs(ball.x - AI_GOAL_X);
    const aiDistanceToBall = Math.abs(ai.x - ball.x);
    const opponentDistanceToBall = Math.abs(opponent.x - ball.x);
    const ballMovingTowardsAIGoal = ball.vx < -1;
    const ballMovingTowardsOpponentGoal = ball.vx > 1;
    const ballHeight = GAME_HEIGHT - GROUND_HEIGHT - ball.y;
    
    if (!ai.lastBallY) ai.lastBallY = ball.y;
    if (!ai.stuckCounter) ai.stuckCounter = 0;
    
    const ballStuck = Math.abs(ball.y - ai.lastBallY) < 5 && Math.abs(ball.vx) < 2;
    if (ballStuck) {
      ai.stuckCounter++;
    } else {
      ai.stuckCounter = 0;
    }
    ai.lastBallY = ball.y;
    
    let newTargetX = ai.targetX;
    let shouldJump = false;
    let shouldGrab = false;
    let moveSpeed = SLIME_SPEED;
    
    if (ballDistanceToOpponentGoal < ballDistanceToAIGoal * 1.5 || 
        (ball.x > FIELD_WIDTH * 0.35 && !ballMovingTowardsAIGoal)) {
      
      const directAttackX = ball.x - 30;
      const overheadAttackX = ball.x - 45;
      const underAttackX = ball.x - 20;
      
      if (ballHeight > 60 && aiDistanceToBall < 150) {
        newTargetX = overheadAttackX;
      } else if (ballHeight < 30 && aiDistanceToBall < 100) {
        newTargetX = underAttackX;
      } else {
        newTargetX = directAttackX;
      }
      
      moveSpeed = SLIME_SPEED * 1.1;
      
      if (aiDistanceToBall < 100) {
        if (ai.stuckCounter > 30) {
          shouldJump = true;
          newTargetX = ball.x - 40;
        }
        else if (ballHeight < 35 && aiDistanceToBall < 60 && !ai.hasBall && ball.vy > -2) {
          shouldGrab = true;
        }
        else if ((ballHeight > 30 && ballHeight < 90) || 
                 (ball.x > FIELD_WIDTH * 0.6 && ballHeight < 120)) {
          if (ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
            const timeToReachBall = Math.abs(ai.x - ball.x) / SLIME_SPEED;
            const ballHeightWhenReached = ball.y + ball.vy * timeToReachBall + 0.5 * GRAVITY * timeToReachBall * timeToReachBall;
            
            if (ballHeightWhenReached > GAME_HEIGHT - GROUND_HEIGHT - 100 && 
                ballHeightWhenReached < GAME_HEIGHT - GROUND_HEIGHT - 20) {
              shouldJump = true;
            }
          }
        }
      }
      
      if (ai.hasBall) {
        const angleToGoal = Math.atan2(0, OPPONENT_GOAL_X - ai.x);
        if (Math.abs(angleToGoal) < 0.5 || ai.x > FIELD_WIDTH * 0.7) {
          shouldGrab = false;
        }
      }
    }
    else if (ball.x < FIELD_WIDTH * 0.65 || ballMovingTowardsAIGoal) {
      
      let bestInterceptX = ball.x;
      
      for (let pred of predictions) {
        if (pred.x < FIELD_WIDTH * 0.4) {
          const timeToReach = Math.abs(ai.x - pred.x) / (SLIME_SPEED * 1.2);
          if (timeToReach <= pred.time + 5) {
            bestInterceptX = pred.x;
            break;
          }
        }
      }
      
      newTargetX = bestInterceptX;
      
      if (ball.x < GOAL_WIDTH * 2.5 && ballMovingTowardsAIGoal) {
        newTargetX = Math.max(ball.x - 10, SLIME_RADIUS);
        moveSpeed = SLIME_SPEED * 1.2;
        
        if (aiDistanceToBall < 120 && ballHeight < 100) {
          shouldJump = true;
        }
      }
      
      if (ai.stuckCounter > 20 && ball.x < FIELD_WIDTH * 0.3) {
        shouldJump = true;
        newTargetX = ball.x + 30;
      }
    }
    else {
      newTargetX = FIELD_WIDTH * 0.4;
      
      for (let pred of predictions) {
        if (pred.y < GAME_HEIGHT - GROUND_HEIGHT - 50 && 
            Math.abs(pred.x - FIELD_WIDTH * 0.4) < 100) {
          const timeToReach = Math.abs(ai.x - pred.x) / SLIME_SPEED;
          if (timeToReach < pred.time && pred.time < 30) {
            newTargetX = pred.x;
            if (pred.time < 20 && ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
              shouldJump = true;
            }
            break;
          }
        }
      }
    }
    
    if (Math.abs(newTargetX - ai.targetX) > 15) {
      ai.targetX = newTargetX;
      ai.decisionCooldown = 10;
    }
    
    if (shouldGrab && !ai.isGrabbing && ai.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
      ai.isGrabbing = true;
    } else if (!shouldGrab) {
      ai.isGrabbing = false;
    }
    
    const difference = ai.targetX - ai.x;
    const absDistance = Math.abs(difference);
    
    if (absDistance > 10) {
      const speedMultiplier = Math.min(absDistance / 50, 1.0);
      ai.vx = Math.sign(difference) * moveSpeed * speedMultiplier;
    } else {
      ai.vx = 0;
    }
    
    if (shouldJump && ai.vy === 0 && !ai.isGrabbing) {
      ai.vy = SLIME_JUMP_POWER;
    }
    
  }, [
    BALL_RADIUS,
    GAME_HEIGHT,
    GAME_WIDTH,
    GOAL_WIDTH,
    SLIME_RADIUS,
    computeStartPositions,
    playerMode,
    timeLeft,
  ]);

  const updatePhysics = useCallback(() => {
    const state = gameStateRef.current;
    const keys = keysRef.current;
    const now = Date.now();
    let shouldAutoApproach = false;

    // In remote mode, guest doesn't run physics (receives state from host)
    if (playerMode === 'remote' && !isHost) {
      // Guest only draws, doesn't update physics
      return;
    }

    if (playerMode === 'multi' || playerMode === 'remote') {
      if (keys['a']) state.leftSlime.vx = -SLIME_SPEED;
      else if (keys['d']) state.leftSlime.vx = SLIME_SPEED;
      else state.leftSlime.vx = 0;

      if (BOARD_ALIGNMENT === 'bottom_top') {
        // In bottom_top mode, W/S control vertical movement
        if (keys['w']) state.leftSlime.vy = -SLIME_SPEED;
        else if (keys['s']) state.leftSlime.vy = SLIME_SPEED;
        else state.leftSlime.vy = 0;
        // Use shift key for grabbing in bottom_top mode
        state.leftSlime.isGrabbing = keys['shift'];
      } else {
        if (keys['w'] && state.leftSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.leftSlime.isGrabbing) {
          state.leftSlime.vy = SLIME_JUMP_POWER;
        }
        state.leftSlime.isGrabbing = keys['s'];
      }

      if (keys['arrowleft']) state.rightSlime.vx = -SLIME_SPEED;
      else if (keys['arrowright']) state.rightSlime.vx = SLIME_SPEED;
      else state.rightSlime.vx = 0;

      if (BOARD_ALIGNMENT === 'bottom_top') {
        // In bottom_top mode, Up/Down arrows control vertical movement
        if (keys['arrowup']) state.rightSlime.vy = -SLIME_SPEED;
        else if (keys['arrowdown']) state.rightSlime.vy = SLIME_SPEED;
        else state.rightSlime.vy = 0;
        // Use space key for grabbing in bottom_top mode
        state.rightSlime.isGrabbing = keys[' '];
      } else {
        if (keys['arrowup'] && state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.rightSlime.isGrabbing) {
          state.rightSlime.vy = SLIME_JUMP_POWER;
        }
        state.rightSlime.isGrabbing = keys['arrowdown'];
      }

      const noInput = !(
        keys['a'] ||
        keys['d'] ||
        keys['w'] ||
        keys['s'] ||
        keys['arrowleft'] ||
        keys['arrowright'] ||
        keys['arrowup'] ||
        keys['arrowdown']
      );
      const leftIdle =
        Math.abs(state.leftSlime.vx) < 0.1 &&
        Math.abs(state.leftSlime.vy) < 0.1 &&
        state.leftSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1;
      const rightIdle =
        Math.abs(state.rightSlime.vx) < 0.1 &&
        Math.abs(state.rightSlime.vy) < 0.1 &&
        state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1;

      if (noInput && leftIdle && rightIdle) {
        if (!multiIdleStartRef.current) {
          multiIdleStartRef.current = now;
        }
        shouldAutoApproach =
          now - multiIdleStartRef.current >= MULTI_IDLE_APPROACH_DELAY_MS;
      } else {
        multiIdleStartRef.current = null;
      }
    } else {
      if (keys['arrowleft']) state.rightSlime.vx = -SLIME_SPEED;
      else if (keys['arrowright']) state.rightSlime.vx = SLIME_SPEED;
      else state.rightSlime.vx = 0;

      if (BOARD_ALIGNMENT === 'bottom_top') {
        // In bottom_top mode, Up/Down arrows control vertical movement
        if (keys['arrowup']) state.rightSlime.vy = -SLIME_SPEED;
        else if (keys['arrowdown']) state.rightSlime.vy = SLIME_SPEED;
        else state.rightSlime.vy = 0;
        // Use space key for grabbing in bottom_top mode
        state.rightSlime.isGrabbing = keys[' '];
      } else {
        if (keys['arrowup'] && state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.rightSlime.isGrabbing) {
          state.rightSlime.vy = SLIME_JUMP_POWER;
        }
        state.rightSlime.isGrabbing = keys['arrowdown'];
      }

      updateAI();
    }

    if ((playerMode === 'multi' || playerMode === 'remote') && shouldAutoApproach) {
      const distanceToLeft = state.leftSlime.x - state.rightSlime.x;
      if (Math.abs(distanceToLeft) > 5) {
        state.rightSlime.vx =
          Math.sign(distanceToLeft) * SLIME_SPEED * MULTI_IDLE_APPROACH_SPEED;
      } else {
        state.rightSlime.vx = 0;
      }
    }
    
    [state.leftSlime, state.rightSlime].forEach((slime, index) => {
      if (BOARD_ALIGNMENT === 'bottom_top') {
        // In bottom_top mode, players move horizontally and have no gravity
        slime.x += slime.vx;
        slime.y += slime.vy;
        // Apply friction
        slime.vx *= 0.9;
        slime.vy *= 0.9;

        // Boundary checking - players can move full field up to opponent's goalpost
        const isBottomPlayer = index === 1; // rightSlime is bottom player (user-controlled)
        // In remote mode, allow full field movement (up to opponent's goal area)
        // In other modes, keep midline restriction
        const useFullField = playerMode === 'remote';
        const minY = isBottomPlayer
          ? (useFullField ? GROUND_HEIGHT + SLIME_RADIUS : GAME_HEIGHT / 2 + SLIME_RADIUS)
          : GROUND_HEIGHT + SLIME_RADIUS;
        const maxY = isBottomPlayer
          ? GAME_HEIGHT - GROUND_HEIGHT - SLIME_RADIUS
          : (useFullField ? GAME_HEIGHT - GROUND_HEIGHT - SLIME_RADIUS : GAME_HEIGHT / 2 - SLIME_RADIUS);

        if (slime.x < SLIME_RADIUS) slime.x = SLIME_RADIUS;
        if (slime.x > GAME_WIDTH - SLIME_RADIUS) slime.x = GAME_WIDTH - SLIME_RADIUS;

        if (slime.y < minY) slime.y = minY;
        if (slime.y > maxY) slime.y = maxY;

        // Goal line time for camping prevention
        const goalStart = (GAME_WIDTH - GOAL_WIDTH) / 2;
        const goalEnd = goalStart + GOAL_WIDTH;
        const inOwnGoalArea = (isBottomPlayer && slime.y > GAME_HEIGHT - GROUND_HEIGHT * 2 && slime.x > goalStart && slime.x < goalEnd) ||
                              (!isBottomPlayer && slime.y < GROUND_HEIGHT * 2 && slime.x > goalStart && slime.x < goalEnd);

        if (inOwnGoalArea) {
          slime.goalLineTime = Math.min(slime.goalLineTime + 1/60, 1);
        } else {
          slime.goalLineTime = 0;
        }
      } else {
        // Original right_left mode physics
        slime.vy += GRAVITY;
        slime.x += slime.vx;
        slime.y += slime.vy;

        if (slime.x < SLIME_RADIUS) slime.x = SLIME_RADIUS;
        if (slime.x > GAME_WIDTH - SLIME_RADIUS) slime.x = GAME_WIDTH - SLIME_RADIUS;

        if (slime.y > GAME_HEIGHT - GROUND_HEIGHT) {
          slime.y = GAME_HEIGHT - GROUND_HEIGHT;
          slime.vy = 0;
        }

        const isLeftSlime = index === 0;
        const inOwnGoalArea = (isLeftSlime && slime.x < GOAL_WIDTH) || (!isLeftSlime && slime.x > GAME_WIDTH - GOAL_WIDTH);

        if (inOwnGoalArea) {
          slime.goalLineTime = Math.min(slime.goalLineTime + 1/60, 1);
        } else {
          slime.goalLineTime = 0;
        }
      }
    });
    
    // Check if ball is halted (2 second delay before ball starts moving)
    const ballIsHalted = Date.now() < state.ball.haltedUntil;

    if (!ballIsHalted) {
      if (state.ball.grabbedBy) {
        const grabber = state.ball.grabbedBy === 'left' ? state.leftSlime : state.rightSlime;
        const slimeDirection = state.ball.grabbedBy === 'left' ? 1 : -1;

        state.ball.grabAngularVelocity += -grabber.vx * 0.008 * slimeDirection;

        state.ball.grabAngularVelocity *= 0.85;
        state.ball.grabAngle += state.ball.grabAngularVelocity;

        if (state.ball.grabbedBy === 'left') {
          if (state.ball.grabAngle < -Math.PI / 2) {
            state.ball.grabAngle = -Math.PI / 2;
            state.ball.grabAngularVelocity = 0;
          } else if (state.ball.grabAngle > Math.PI / 2) {
            state.ball.grabAngle = Math.PI / 2;
            state.ball.grabAngularVelocity = 0;
          }
        } else {
          while (state.ball.grabAngle < 0) state.ball.grabAngle += Math.PI * 2;
          while (state.ball.grabAngle > Math.PI * 2) state.ball.grabAngle -= Math.PI * 2;

          if (state.ball.grabAngle < Math.PI / 2 && state.ball.grabAngle >= 0) {
            state.ball.grabAngle = Math.PI / 2;
            state.ball.grabAngularVelocity = 0;
          } else if (state.ball.grabAngle > 3 * Math.PI / 2 ||
                     (state.ball.grabAngle < Math.PI / 2 && state.ball.grabAngle < 0)) {
            state.ball.grabAngle = 3 * Math.PI / 2;
            state.ball.grabAngularVelocity = 0;
          }
        }

        const holdDistance = SLIME_RADIUS + BALL_RADIUS - 5;
        state.ball.x = grabber.x + Math.cos(state.ball.grabAngle) * holdDistance;
        state.ball.y = grabber.y + Math.sin(state.ball.grabAngle) * holdDistance;

        state.ball.vx = grabber.vx;
        state.ball.vy = grabber.vy;

        if (!grabber.isGrabbing) {
          const releaseAngle = state.ball.grabAngle;
          const releaseSpeed = Math.abs(state.ball.grabAngularVelocity) * 20;
          state.ball.vx = (
            grabber.vx * 1.5 + Math.cos(releaseAngle) * (3 + releaseSpeed)
          ) * BALL_SPEED_MULTIPLIER;
          state.ball.vy = (
            grabber.vy - 2 + Math.sin(releaseAngle) * releaseSpeed * 0.3
          ) * BALL_SPEED_MULTIPLIER;
          state.ball.grabbedBy = null;
          state.ball.grabAngle = 0;
          state.ball.grabAngularVelocity = 0;
          grabber.hasBall = false;
        }
      } else {
        if (BOARD_ALIGNMENT === 'bottom_top') {
          // No gravity in bottom_top mode, ball moves only when hit
          // Apply friction/damping
          state.ball.vx *= BALL_DAMPING;
          state.ball.vy *= BALL_DAMPING;
          state.ball.x += state.ball.vx;
          state.ball.y += state.ball.vy;
        } else {
          // Original right_left mode with gravity
          state.ball.vy += BALL_GRAVITY;
          state.ball.vx *= BALL_DAMPING;
          state.ball.x += state.ball.vx;
          state.ball.y += state.ball.vy;

          // Random horizontal shift while falling (±10-40 pixels, ~3% chance per frame)
          if (state.ball.vy > 0 && Math.random() < 0.03) {
            const shiftAmount = (10 + Math.random() * 30) * (Math.random() < 0.5 ? -1 : 1);
            state.ball.x += shiftAmount;
          }
        }
      }
    }
    
    if (BOARD_ALIGNMENT === 'bottom_top') {
      // Bottom_top mode: walls on left/right, goals on top/bottom (centered, 50% width)
      const goalStart = (GAME_WIDTH - GOAL_WIDTH) / 2;
      const goalEnd = goalStart + GOAL_WIDTH;

      // Left/right wall bouncing
      if (state.ball.x < BALL_RADIUS) {
        state.ball.x = BALL_RADIUS;
        state.ball.vx = -state.ball.vx * BALL_BOUNCE_DAMPING;
      }
      if (state.ball.x > GAME_WIDTH - BALL_RADIUS) {
        state.ball.x = GAME_WIDTH - BALL_RADIUS;
        state.ball.vx = -state.ball.vx * BALL_BOUNCE_DAMPING;
      }

      // Bottom boundary - bounce unless in goal area (rightSlime/user's goal)
      if (state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS) {
        if (state.ball.x > goalStart && state.ball.x < goalEnd) {
          // Goal scored! leftSlime (AI at top) scores in bottom goal
          playGoalSound();
          triggerGoalCelebration();
          if (playerMode === 'remote' && remoteConnected && isHost) {
            sendData({ type: 'goalCelebration' });
          }
          setScore(prev => ({ ...prev, left: prev.left + 1 }));
          resetPositions();
        } else {
          state.ball.y = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;
          state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
        }
      }

      // Top boundary - bounce unless in goal area (leftSlime/AI's goal)
      if (state.ball.y < GROUND_HEIGHT + BALL_RADIUS) {
        if (state.ball.x > goalStart && state.ball.x < goalEnd) {
          // Goal scored! rightSlime (user at bottom) scores in top goal
          playGoalSound();
          triggerGoalCelebration();
          if (playerMode === 'remote' && remoteConnected && isHost) {
            sendData({ type: 'goalCelebration' });
          }
          setScore(prev => ({ ...prev, right: prev.right + 1 }));
          resetPositions();
        } else {
          state.ball.y = GROUND_HEIGHT + BALL_RADIUS;
          state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
        }
      }
    } else {
      // Original right_left mode
      if (state.ball.x < BALL_RADIUS) {
        state.ball.x = BALL_RADIUS;
        state.ball.vx = -state.ball.vx * BALL_BOUNCE_DAMPING;
      }
      if (state.ball.x > GAME_WIDTH - BALL_RADIUS) {
        state.ball.x = GAME_WIDTH - BALL_RADIUS;
        state.ball.vx = -state.ball.vx * BALL_BOUNCE_DAMPING;
      }

      if (state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS) {
        state.ball.y = GAME_HEIGHT - GROUND_HEIGHT - BALL_RADIUS;
        state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
      }

      if (state.ball.x <= BALL_RADIUS && state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT) {
        playGoalSound();
        triggerGoalCelebration();
        if (playerMode === 'remote' && remoteConnected && isHost) {
          sendData({ type: 'goalCelebration' });
        }
        setScore(prev => ({ ...prev, right: prev.right + 1 }));
        resetPositions();
      } else if (state.ball.x >= GAME_WIDTH - BALL_RADIUS && state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT) {
        playGoalSound();
        triggerGoalCelebration();
        if (playerMode === 'remote' && remoteConnected && isHost) {
          sendData({ type: 'goalCelebration' });
        }
        setScore(prev => ({ ...prev, left: prev.left + 1 }));
        resetPositions();
      }

      if (state.ball.y < BALL_RADIUS) {
        state.ball.y = BALL_RADIUS;
        state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
      }
    }
    
    // Ball-slime collision
    // In bottom_top mode, always check for collisions (ball starts halted and moves when hit)
    // In right_left mode, only check when ball is not halted
    const checkCollisions = BOARD_ALIGNMENT === 'bottom_top' || !ballIsHalted;
    if (checkCollisions) {
      [state.leftSlime, state.rightSlime].forEach((slime, index) => {
        const slimeName = index === 0 ? 'left' : 'right';
        const otherSlime = index === 0 ? state.rightSlime : state.leftSlime;
        const dx = state.ball.x - slime.x;
        const dy = state.ball.y - slime.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < SLIME_RADIUS + BALL_RADIUS) {
          // In bottom_top mode, unhalt the ball when hit
          if (BOARD_ALIGNMENT === 'bottom_top' && state.ball.haltedUntil === Infinity) {
            state.ball.haltedUntil = 0;
          }

          if (state.ball.grabbedBy && state.ball.grabbedBy !== slimeName) {
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(slime.vx * slime.vx + slime.vy * slime.vy);

            if (speed > 2 || Math.abs(slime.vy) > 5 || (BOARD_ALIGNMENT === 'bottom_top' && speed > 1)) {
              state.ball.grabbedBy = null;
              state.ball.grabAngle = 0;
              state.ball.grabAngularVelocity = 0;
              otherSlime.hasBall = false;

              state.ball.vx = (Math.cos(angle) * 8 + slime.vx) * BALL_SPEED_MULTIPLIER;
              state.ball.vy = (Math.sin(angle) * 8 + slime.vy) * BALL_SPEED_MULTIPLIER;
            }
          }
          else if (slime.isGrabbing && !state.ball.grabbedBy) {
            state.ball.grabbedBy = slimeName;
            state.ball.grabAngle = Math.atan2(dy, dx);
            state.ball.grabAngularVelocity = 0;
            slime.hasBall = true;
          }
          else if (!state.ball.grabbedBy) {
            const angle = Math.atan2(dy, dx);
            const targetX = slime.x + Math.cos(angle) * (SLIME_RADIUS + BALL_RADIUS);
            const targetY = slime.y + Math.sin(angle) * (SLIME_RADIUS + BALL_RADIUS);

            // In bottom_top mode, always allow collision from any direction
            const allowCollision = BOARD_ALIGNMENT === 'bottom_top' ||
              (state.ball.y < slime.y || Math.abs(angle) < Math.PI * 0.5);

            if (allowCollision) {
              state.ball.x = targetX;
              state.ball.y = targetY;

              const speed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
              const hitPower = BOARD_ALIGNMENT === 'bottom_top' ? 2.0 : 1.5; // Stronger hit in bottom_top
              state.ball.vx = (
                Math.cos(angle) * Math.max(speed, 3) * hitPower + slime.vx * 0.5
              ) * BALL_SPEED_MULTIPLIER;
              state.ball.vy = (
                Math.sin(angle) * Math.max(speed, 3) * hitPower + slime.vy * 0.5
              ) * BALL_SPEED_MULTIPLIER;

              const newSpeed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
              if (newSpeed > MAX_BALL_SPEED) {
                const scale = MAX_BALL_SPEED / newSpeed;
                state.ball.vx *= scale;
                state.ball.vy *= scale;
              }
            }
          }
        }
      });
    }
  }, [
    BALL_RADIUS,
    GAME_HEIGHT,
    GAME_WIDTH,
    GOAL_HEIGHT,
    GOAL_WIDTH,
    SLIME_RADIUS,
    isHost,
    playerMode,
    playGoalSound,
    triggerGoalCelebration,
    updateAI,
    sendData,
    remoteConnected,
  ]);

  const drawHelmet = (ctx, x, y, radius, type) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Base helmet color
    const colors = {
      'camo': ['#4a5f4a', '#3d4f3d', '#5a6f5a'],
      'desert': ['#d4a574', '#c69563', '#e6b885'],
      'urban': ['#666666', '#555555', '#777777']
    };
    
    const colorSet = colors[type] || colors['urban'];
    
    // Draw helmet dome
    ctx.fillStyle = colorSet[0];
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    
    // Camo/desert pattern
    if (type === 'camo' || type === 'desert') {
      ctx.fillStyle = colorSet[1];
      for (let i = 0; i < 5; i++) {
        const px = (Math.random() - 0.5) * radius;
        const py = -Math.random() * radius * 0.7;
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Helmet rim
    ctx.fillStyle = colorSet[2];
    ctx.fillRect(-radius * 0.9, -radius * 0.1, radius * 1.8, radius * 0.15);
    
    // Chin strap
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, -radius * 0.3);
    ctx.lineTo(-radius * 0.8, radius * 0.2);
    ctx.moveTo(radius * 0.7, -radius * 0.3);
    ctx.lineTo(radius * 0.8, radius * 0.2);
    ctx.stroke();
    
    ctx.restore();
  };
  
  const drawLabrador = (ctx, x, y, radius) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Body (golden color)
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    
    // Ears
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.6, -radius * 0.3, radius * 0.3, radius * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(radius * 0.6, -radius * 0.3, radius * 0.3, radius * 0.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Snout
    ctx.fillStyle = '#F4A460';
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.1, radius * 0.4, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, -radius * 0.25, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.4, radius * 0.08, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, -radius * 0.4, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };
  
  const drawTank = (ctx, x, y, radius) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Tank body
    ctx.fillStyle = '#4a5f4a';
    ctx.fillRect(-radius * 0.8, -radius * 0.5, radius * 1.6, radius * 0.6);
    
    // Turret
    ctx.fillStyle = '#3d4f3d';
    ctx.beginPath();
    ctx.arc(0, -radius * 0.3, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Cannon
    ctx.fillStyle = '#2d3f2d';
    ctx.fillRect(radius * 0.3, -radius * 0.35, radius * 0.6, radius * 0.15);
    
    // Tracks
    ctx.strokeStyle = '#1a2f1a';
    ctx.lineWidth = radius * 0.15;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, radius * 0.1);
    ctx.lineTo(radius * 0.7, radius * 0.1);
    ctx.stroke();
    
    // Track details
    for (let i = -0.6; i < 0.7; i += 0.3) {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(radius * i, radius * 0.05);
      ctx.lineTo(radius * i, radius * 0.15);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  const drawSunflower = (ctx, x, y, radius) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Petals
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(radius * 0.5, 0, radius * 0.35, radius * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Center
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Seeds pattern
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.3;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Leaves (semicircle base)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(0, radius * 0.3, radius * 0.2, 0, Math.PI);
    ctx.fill();
    
    ctx.restore();
  };
  
  const drawBall = (ctx, x, y, radius, type) => {
    ctx.save();
    ctx.translate(x, y);
    
    if (type === 'grenade') {
      // Grenade body
      ctx.fillStyle = '#4a5f4a';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Segments
      ctx.strokeStyle = '#2d3f2d';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-radius, radius * i * 0.5);
        ctx.lineTo(radius, radius * i * 0.5);
        ctx.stroke();
      }
      
      // Pin
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, -radius, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Ring
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -radius, radius * 0.5, 0, Math.PI);
      ctx.stroke();
    } else if (type === 'pill') {
      // Pill capsule
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, 0, radius * 0.7, Math.PI / 2, -Math.PI / 2);
      ctx.lineTo(radius * 0.3, -radius * 0.7);
      ctx.arc(radius * 0.3, 0, radius * 0.7, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      
      // Other half
      ctx.fillStyle = '#4ECDC4';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, 0, radius * 0.7, Math.PI / 2, Math.PI * 1.5);
      ctx.lineTo(radius * 0.3, radius * 0.7);
      ctx.arc(radius * 0.3, 0, radius * 0.7, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      ctx.fill();
      
      // Dividing line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.7);
      ctx.lineTo(0, radius * 0.7);
      ctx.stroke();
    } else if (type === 'cannabis') {
      // Cannabis flower
      ctx.fillStyle = '#2d5a3d';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Leaf structure
      ctx.fillStyle = '#3d6f4d';
      for (let i = 0; i < 7; i++) {
        const angle = (i * Math.PI * 2) / 7;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(radius * 0.4, 0, radius * 0.4, radius * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Center
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Trichomes (sparkles)
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = radius * 0.6;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    // Flip the view for remote guest so their character appears at bottom
    const shouldFlipView = playerMode === 'remote' && !isHost && BOARD_ALIGNMENT === 'bottom_top';
    if (shouldFlipView) {
      ctx.save();
      ctx.translate(GAME_WIDTH, GAME_HEIGHT);
      ctx.rotate(Math.PI);
    }

    if (BOARD_ALIGNMENT === 'bottom_top') {
      // Soccer field style background with stripes
      const stripeWidth = GAME_WIDTH / 10;
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#2d8a4e' : '#34a058';
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, GAME_HEIGHT);
      }

      // Draw goal areas (top and bottom)
      ctx.fillStyle = '#1a5f36';
      ctx.fillRect(0, 0, GAME_WIDTH, GROUND_HEIGHT); // Top goal area
      ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT); // Bottom goal area

      // Draw soccer field lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;

      // Field boundary
      const fieldTop = GROUND_HEIGHT;
      const fieldBottom = GAME_HEIGHT - GROUND_HEIGHT;
      const fieldHeight = fieldBottom - fieldTop;

      ctx.strokeRect(5, fieldTop, GAME_WIDTH - 10, fieldHeight);

      // Center line (horizontal)
      ctx.beginPath();
      ctx.moveTo(0, GAME_HEIGHT / 2);
      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);
      ctx.stroke();

      // Center circle
      const centerRadius = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.12;
      ctx.beginPath();
      ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, centerRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Center spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Goal areas (centered, 50% width)
      const goalStart = (GAME_WIDTH - GOAL_WIDTH) / 2;
      const goalAreaDepth = GAME_HEIGHT * 0.08;
      const penaltyAreaDepth = GAME_HEIGHT * 0.15;
      const penaltyAreaWidth = GOAL_WIDTH * 1.4;
      const penaltyStart = (GAME_WIDTH - penaltyAreaWidth) / 2;

      // Top penalty area
      ctx.strokeRect(penaltyStart, fieldTop, penaltyAreaWidth, penaltyAreaDepth);
      // Top goal area (smaller box)
      ctx.strokeRect(goalStart, fieldTop, GOAL_WIDTH, goalAreaDepth);

      // Bottom penalty area
      ctx.strokeRect(penaltyStart, fieldBottom - penaltyAreaDepth, penaltyAreaWidth, penaltyAreaDepth);
      // Bottom goal area (smaller box)
      ctx.strokeRect(goalStart, fieldBottom - goalAreaDepth, GOAL_WIDTH, goalAreaDepth);

      // Penalty arcs (semi-circles outside penalty areas)
      const penaltyArcRadius = GAME_HEIGHT * 0.06;
      // Top arc
      ctx.beginPath();
      ctx.arc(GAME_WIDTH / 2, fieldTop + penaltyAreaDepth, penaltyArcRadius, 0, Math.PI);
      ctx.stroke();
      // Bottom arc
      ctx.beginPath();
      ctx.arc(GAME_WIDTH / 2, fieldBottom - penaltyAreaDepth, penaltyArcRadius, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Corner arcs
      const cornerRadius = 15;
      ctx.beginPath();
      ctx.arc(0, fieldTop, cornerRadius, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(GAME_WIDTH, fieldTop, cornerRadius, Math.PI / 2, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, fieldBottom, cornerRadius, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(GAME_WIDTH, fieldBottom, cornerRadius, Math.PI, Math.PI * 1.5);
      ctx.stroke();

      // Draw goalposts at top and bottom (centered)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;

      // Top goalpost
      ctx.beginPath();
      ctx.moveTo(goalStart, 0);
      ctx.lineTo(goalStart, GROUND_HEIGHT);
      ctx.lineTo(goalStart + GOAL_WIDTH, GROUND_HEIGHT);
      ctx.lineTo(goalStart + GOAL_WIDTH, 0);
      ctx.stroke();

      // Top goal net
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = goalStart; i <= goalStart + GOAL_WIDTH; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GROUND_HEIGHT);
        ctx.stroke();
      }
      for (let j = 0; j <= GROUND_HEIGHT; j += 12) {
        ctx.beginPath();
        ctx.moveTo(goalStart, j);
        ctx.lineTo(goalStart + GOAL_WIDTH, j);
        ctx.stroke();
      }

      // Bottom goalpost
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(goalStart, GAME_HEIGHT);
      ctx.lineTo(goalStart, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(goalStart + GOAL_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(goalStart + GOAL_WIDTH, GAME_HEIGHT);
      ctx.stroke();

      // Bottom goal net
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = goalStart; i <= goalStart + GOAL_WIDTH; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT);
        ctx.lineTo(i, GAME_HEIGHT);
        ctx.stroke();
      }
      for (let j = GAME_HEIGHT - GROUND_HEIGHT; j <= GAME_HEIGHT; j += 12) {
        ctx.beginPath();
        ctx.moveTo(goalStart, j);
        ctx.lineTo(goalStart + GOAL_WIDTH, j);
        ctx.stroke();
      }

      // Draw logo on goalposts with fade effect
      if (logoImageRef.current && goalpostLogoOpacity > 0) {
        ctx.globalAlpha = goalpostLogoOpacity * 0.5; // Half transparent
        const logoWidth = GOAL_WIDTH; // Logo matches goalpost width
        const logoHeight = GROUND_HEIGHT * 0.8; // Keep height proportional to ground
        const logoX = GAME_WIDTH / 2 - logoWidth / 2;

        // Top goalpost logo
        ctx.drawImage(logoImageRef.current, logoX, (GROUND_HEIGHT - logoHeight) / 2, logoWidth, logoHeight);
        // Bottom goalpost logo
        ctx.drawImage(logoImageRef.current, logoX, GAME_HEIGHT - GROUND_HEIGHT + (GROUND_HEIGHT - logoHeight) / 2, logoWidth, logoHeight);

        ctx.globalAlpha = 1.0;
      }

      // Draw game instructions rotated 90 degrees to the left (vertical, in middle of screen)
      const instructionLines = [];
      if (instructionVisibility.line1) {
        instructionLines.push(t('gameInstruction1'));
      }
      if (instructionVisibility.line2) {
        instructionLines.push(t(CONTROL_MODE === 'touch' ? 'gameInstruction2Touch' : 'gameInstruction2'));
      }

      if (instructionLines.length > 0) {
        const fontSize = Math.round(GAME_HEIGHT * 0.025);
        ctx.save();
        ctx.translate(GAME_WIDTH * 0.08, GAME_HEIGHT / 2);
        ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise (to the left)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lineSpacing = fontSize * 1.5;
        instructionLines.forEach((line, index) => {
          ctx.fillText(line, 0, (index - (instructionLines.length - 1) / 2) * lineSpacing);
        });
        ctx.restore();
      }

      // Draw scores near goals
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Score for AI (leftSlime at top) - shows near bottom goal (where they score)
      ctx.fillStyle = score.left > score.right ? '#00ff00' : (score.left < score.right ? '#888888' : '#ffffff');
      ctx.fillText(String(score.left), GAME_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT - 30);

      // Score for User (rightSlime at bottom) - shows near top goal (where they score)
      ctx.fillStyle = score.right > score.left ? '#00ff00' : (score.right < score.left ? '#888888' : '#ffffff');
      ctx.fillText(String(score.right), GAME_WIDTH / 2, GROUND_HEIGHT + 30);

    } else {
      // Original right_left mode drawing
      // Draw background
      if (backgroundImageRef.current) {
        ctx.drawImage(backgroundImageRef.current, 0, 0);
      } else {
        ctx.fillStyle = '#0d3d1f';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      // Draw Seach logo in background (positioned below header)
      let logoMetrics = null;
      if (logoImageRef.current) {
        ctx.globalAlpha = 0.7;
        const originalWidth = logoImageRef.current.width;
        const originalHeight = logoImageRef.current.height;
        const targetWidth = GAME_WIDTH * 1.0;
        const targetHeight = GAME_HEIGHT * 1.0;
        const scale = Math.min(
          targetWidth / originalWidth,
          targetHeight / originalHeight
        );
        const logoWidth = originalWidth * scale;
        const logoHeight = originalHeight * scale;
        const headerOffset = GAME_HEIGHT * 0.08;
        ctx.drawImage(
          logoImageRef.current,
          GAME_WIDTH / 2 - logoWidth / 2,
          headerOffset,
          logoWidth,
          logoHeight
        );
        ctx.globalAlpha = 1.0;
        logoMetrics = { headerOffset, logoHeight };
      }

      const instructionLines = [];
      if (instructionVisibility.line1) {
        instructionLines.push(t('gameInstruction1'));
      }
      if (instructionVisibility.line2) {
        instructionLines.push(t(CONTROL_MODE === 'touch' ? 'gameInstruction2Touch' : 'gameInstruction2'));
      }

      if (instructionLines.length > 0) {
        const fontSize = Math.round(GAME_HEIGHT * 0.03);
        const lineSpacing = fontSize * 1.4;
        const baseOffset = logoMetrics
          ? logoMetrics.headerOffset + logoMetrics.logoHeight
          : GAME_HEIGHT * 0.15;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        instructionLines.forEach((line, index) => {
          ctx.fillText(line, GAME_WIDTH / 2, baseOffset + fontSize * 0.5 + index * lineSpacing);
        });
      }

      // Draw ground
      ctx.fillStyle = '#1a4d2e';
      ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

      // Ground pattern
      ctx.strokeStyle = '#2d5a3d';
      ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT);
        ctx.lineTo(i, GAME_HEIGHT);
        ctx.stroke();
      }

      // Draw goals
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;

      // Left goal
      ctx.beginPath();
      ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(GOAL_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.moveTo(GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
      ctx.stroke();

      // Left goal net
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < GOAL_WIDTH / 2; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
        ctx.lineTo(i, GAME_HEIGHT - GROUND_HEIGHT);
        ctx.stroke();
      }
      for (let j = GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT; j <= GAME_HEIGHT - GROUND_HEIGHT; j += 10) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(GOAL_WIDTH / 2, j);
        ctx.stroke();
      }

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;

      // Right goal
      ctx.beginPath();
      ctx.moveTo(GAME_WIDTH - GOAL_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.moveTo(GAME_WIDTH - GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT);
      ctx.lineTo(GAME_WIDTH - GOAL_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
      ctx.stroke();

      // Right goal net
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = GAME_WIDTH - GOAL_WIDTH / 2; i <= GAME_WIDTH; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT);
        ctx.lineTo(i, GAME_HEIGHT - GROUND_HEIGHT);
        ctx.stroke();
      }
      for (let j = GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT; j <= GAME_HEIGHT - GROUND_HEIGHT; j += 10) {
        ctx.beginPath();
        ctx.moveTo(GAME_WIDTH - GOAL_WIDTH / 2, j);
        ctx.lineTo(GAME_WIDTH, j);
        ctx.stroke();
      }
    }

    const getScoreColor = (currentScore, opponentScore) => {
      if (currentScore === opponentScore) {
        return '#FFFFFF';
      }
      return currentScore > opponentScore ? '#0f4f1c' : '#4b4b4b';
    };

    const drawScoreAboveGoal = (goalCenterX, currentScore, opponentScore) => {
      if (BOARD_ALIGNMENT === 'bottom_top') return; // Scores drawn differently in bottom_top mode
      const scoreY = GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT - 24;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = getScoreColor(currentScore, opponentScore);
      ctx.fillText(String(currentScore), goalCenterX, scoreY);
    };

    drawScoreAboveGoal(GOAL_WIDTH / 2, score.left, score.right);
    drawScoreAboveGoal(GAME_WIDTH - GOAL_WIDTH / 2, score.right, score.left);
    
    // Draw goal line timers
    const drawGoalLineTimer = (slime, goalX, goalWidth) => {
      if (slime.goalLineTime > 0) {
        const percentage = 1 - (slime.goalLineTime / 1);
        const timerWidth = goalWidth * percentage;
        
        ctx.strokeStyle = percentage > 0.3 ? '#FFFF00' : '#FF0000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(goalX, GAME_HEIGHT - GROUND_HEIGHT + 10);
        ctx.lineTo(goalX + timerWidth, GAME_HEIGHT - GROUND_HEIGHT + 10);
        ctx.stroke();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
      }
    };
    
    if (state.leftSlime.x < GOAL_WIDTH) {
      drawGoalLineTimer(state.leftSlime, 0, GOAL_WIDTH);
    }
    if (state.rightSlime.x > GAME_WIDTH - GOAL_WIDTH) {
      drawGoalLineTimer(state.rightSlime, GAME_WIDTH - GOAL_WIDTH, GOAL_WIDTH);
    }
    
    // Draw players
    const swapLocalMultiplayer = playerMode === 'multi';
    const leftShape =
      (swapLocalMultiplayer ? selectedShapes.right : selectedShapes.left) || 'helmetCamo';
    const rightShape =
      (swapLocalMultiplayer ? selectedShapes.left : selectedShapes.right) || 'helmetDesert';
    
    if (leftShape.startsWith('helmet')) {
      const type = leftShape.replace('helmet', '').toLowerCase();
      drawHelmet(ctx, state.leftSlime.x, state.leftSlime.y, SLIME_RADIUS, type);
    } else if (leftShape === 'labrador') {
      drawLabrador(ctx, state.leftSlime.x, state.leftSlime.y, SLIME_RADIUS);
    } else if (leftShape === 'tank') {
      drawTank(ctx, state.leftSlime.x, state.leftSlime.y, SLIME_RADIUS);
    } else if (leftShape === 'sunflower') {
      drawSunflower(ctx, state.leftSlime.x, state.leftSlime.y, SLIME_RADIUS);
    }
    
    if (rightShape.startsWith('helmet')) {
      const type = rightShape.replace('helmet', '').toLowerCase();
      drawHelmet(ctx, state.rightSlime.x, state.rightSlime.y, SLIME_RADIUS, type);
    } else if (rightShape === 'labrador') {
      drawLabrador(ctx, state.rightSlime.x, state.rightSlime.y, SLIME_RADIUS);
    } else if (rightShape === 'tank') {
      drawTank(ctx, state.rightSlime.x, state.rightSlime.y, SLIME_RADIUS);
    } else if (rightShape === 'sunflower') {
      drawSunflower(ctx, state.rightSlime.x, state.rightSlime.y, SLIME_RADIUS);
    }
    
    // Draw ball
    const ballType = selectedBall || 'cannabis';
    drawBall(ctx, state.ball.x, state.ball.y, BALL_RADIUS, ballType);

    // Draw touch indicators (fingerprint effect)
    if (DISPLAY_TOUCH_MODE !== 'none') {
      const now = Date.now();
      const indicatorLifespan = 500; // 500ms fade out

      // Remove expired indicators and update opacity
      touchIndicatorsRef.current = touchIndicatorsRef.current.filter(indicator => {
        const age = now - indicator.createdAt;
        if (age > indicatorLifespan) return false;
        indicator.opacity = 0.7 * (1 - age / indicatorLifespan);
        return true;
      });

      // Draw each indicator
      touchIndicatorsRef.current.forEach(indicator => {
        ctx.save();
        ctx.globalAlpha = indicator.opacity;

        // Different colors for different players
        const isLeftPlayer = indicator.playerId === 'left';
        const baseColor = indicator.isLocal
          ? (isLeftPlayer ? '#00BFFF' : '#FF6B6B')  // Cyan for left, coral for right (local)
          : (isLeftPlayer ? '#4169E1' : '#DC143C'); // Royal blue / crimson (remote)

        // Draw fingerprint-style ellipse
        const width = 40;
        const height = 50;

        // Outer glow
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 15;

        // Draw ellipse with fingerprint pattern
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;

        // Main ellipse
        ctx.beginPath();
        ctx.ellipse(indicator.x, indicator.y, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fingerprint lines
        ctx.lineWidth = 1;
        for (let i = 0.3; i <= 0.9; i += 0.2) {
          ctx.beginPath();
          ctx.ellipse(indicator.x, indicator.y, (width / 2) * i, (height / 2) * i, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Horizontal ridge lines
        ctx.beginPath();
        for (let y = -height / 3; y <= height / 3; y += 8) {
          const xOffset = Math.sqrt(1 - (y / (height / 2)) ** 2) * (width / 2) * 0.8;
          ctx.moveTo(indicator.x - xOffset, indicator.y + y);
          ctx.lineTo(indicator.x + xOffset, indicator.y + y);
        }
        ctx.stroke();

        ctx.restore();
      });
    }

    // Restore canvas state if we flipped the view for guest
    if (playerMode === 'remote' && !isHost && BOARD_ALIGNMENT === 'bottom_top') {
      ctx.restore();
    }
  }, [
    GAME_HEIGHT,
    GAME_WIDTH,
    GOAL_HEIGHT,
    GOAL_WIDTH,
    GROUND_HEIGHT,
    instructionVisibility,
    score,
    selectedShapes,
    selectedBall,
    playerMode,
    goalpostLogoOpacity,
    isHost
  ]);

  const gameLoop = useCallback((currentTime) => {
    if (gameStarted) {
      const targetFrameTime = 1000 / 60;
      
      if (currentTime - lastFrameTimeRef.current >= targetFrameTime) {
        updatePhysics();
        draw();
        lastFrameTimeRef.current = currentTime;
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, updatePhysics, draw]);

  useEffect(() => {
    if (gameStarted) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameLoop]);

  useEffect(() => {
    if (!gameStarted) {
      setInstructionVisibility({ line1: true, line2: true });
      return;
    }

    const hideFirst = setTimeout(() => {
      setInstructionVisibility((prev) => ({ ...prev, line1: false }));
    }, GAME_INSTRUCTION_HIDE_DELAY_MS);

    const hideSecond = setTimeout(() => {
      setInstructionVisibility((prev) => ({ ...prev, line2: false }));
    }, GAME_INSTRUCTION_HIDE_DELAY_MS + GAME_INSTRUCTION_HIDE_STEP_MS);

    return () => {
      clearTimeout(hideFirst);
      clearTimeout(hideSecond);
    };
  }, [gameStarted]);

  // Logo fade effect for bottom_top mode (appears 20s after start, fades after 10s, reappears after 20s)
  useEffect(() => {
    if (!gameStarted || BOARD_ALIGNMENT !== 'bottom_top') {
      setGoalpostLogoOpacity(0);
      return;
    }

    // Timing constants
    const FIRST_APPEAR_DELAY = 20000; // 20 seconds before first appearance
    const VISIBLE_DURATION = 10000;   // 10 seconds visible
    const HIDDEN_DURATION = 20000;    // 20 seconds hidden before reappearing
    const FADE_DURATION = 1000;       // 1 second fade in/out

    let fadeInterval = null;
    let cycleTimeout = null;
    let isMounted = true;

    const fadeIn = () => {
      let opacity = 0;
      fadeInterval = setInterval(() => {
        if (!isMounted) return;
        opacity += 0.05;
        if (opacity >= 1) {
          opacity = 1;
          clearInterval(fadeInterval);
          // Schedule fade out
          cycleTimeout = setTimeout(fadeOut, VISIBLE_DURATION - FADE_DURATION);
        }
        setGoalpostLogoOpacity(opacity);
      }, FADE_DURATION / 20);
    };

    const fadeOut = () => {
      let opacity = 1;
      fadeInterval = setInterval(() => {
        if (!isMounted) return;
        opacity -= 0.05;
        if (opacity <= 0) {
          opacity = 0;
          clearInterval(fadeInterval);
          // Schedule fade in again
          cycleTimeout = setTimeout(fadeIn, HIDDEN_DURATION);
        }
        setGoalpostLogoOpacity(opacity);
      }, FADE_DURATION / 20);
    };

    // Start the first fade in after delay
    cycleTimeout = setTimeout(fadeIn, FIRST_APPEAR_DELAY);

    return () => {
      isMounted = false;
      if (fadeInterval) clearInterval(fadeInterval);
      if (cycleTimeout) clearTimeout(cycleTimeout);
    };
  }, [gameStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const lightButtonClasses = 'bg-green-200 hover:bg-green-300 text-green-900 border-2 border-green-300 ellipse-button';
  const showRightTouchControls = playerMode !== 'remote' || isHost;
  const showLeftTouchControls = playerMode === 'multi' || (playerMode === 'remote' && !isHost);
  const showDualTouchControls = showRightTouchControls && showLeftTouchControls;

  const setKeyState = useCallback((key, pressed) => {
    keysRef.current[key] = pressed;
  }, []);

  // Simulate key press with blink effect (for touch-to-move in 'both' mode)
  const simulateKey = useCallback((key, pressed) => {
    keysRef.current[key] = pressed;
    if (CONTROL_MODE === 'both' && pressed) {
      setBlinkingKeys(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setBlinkingKeys(prev => ({ ...prev, [key]: false }));
      }, 100);
    }
  }, []);

  // Get canvas coordinates from pointer event
  const getCanvasCoords = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    // Flip coordinates for remote guest since their view is rotated 180 degrees
    if (playerMode === 'remote' && !isHost && BOARD_ALIGNMENT === 'bottom_top') {
      x = GAME_WIDTH - x;
      y = GAME_HEIGHT - y;
    }

    return { x, y };
  }, [playerMode, isHost, GAME_WIDTH, GAME_HEIGHT]);

  // Handle touch-to-move for a specific player
  const handleTouchMove = useCallback((playerSide, targetX, targetY) => {
    if (CONTROL_MODE === 'keys') return;

    const state = gameStateRef.current;
    const player = playerSide === 'left' ? state.leftSlime : state.rightSlime;
    const keys = playerSide === 'left'
      ? { left: 'a', right: 'd', up: 'w', down: 's' }
      : { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown' };

    // Calculate direction to target
    let dx = targetX - player.x;
    let dy = targetY - player.y;
    const threshold = 20; // Dead zone

    // For guest in remote mode with bottom_top alignment, pre-invert direction.
    // The touch coordinates are already flipped by getCanvasCoords, but the input
    // sender will invert the keys again (designed for keyboard). Pre-inverting here
    // makes the two inversions cancel out, giving correct touch behavior.
    if (playerMode === 'remote' && !isHost && BOARD_ALIGNMENT === 'bottom_top') {
      dx = -dx;
      dy = -dy;
    }

    // Horizontal movement
    if (Math.abs(dx) > threshold) {
      if (dx < 0) {
        simulateKey(keys.right, false);
        simulateKey(keys.left, true);
      } else {
        simulateKey(keys.left, false);
        simulateKey(keys.right, true);
      }
    } else {
      simulateKey(keys.left, false);
      simulateKey(keys.right, false);
    }

    // Vertical movement
    if (BOARD_ALIGNMENT === 'bottom_top') {
      // In bottom_top mode, allow continuous vertical movement like horizontal
      if (Math.abs(dy) > threshold) {
        if (dy < 0) {
          simulateKey(keys.down, false);
          simulateKey(keys.up, true);
        } else {
          simulateKey(keys.up, false);
          simulateKey(keys.down, true);
        }
      } else {
        simulateKey(keys.up, false);
        simulateKey(keys.down, false);
      }
    } else {
      // Jump if target is significantly above player (and player is on ground)
      if (dy < -50 && player.y >= GAME_HEIGHT - GROUND_HEIGHT - 1) {
        simulateKey(keys.up, true);
        setTimeout(() => simulateKey(keys.up, false), 100);
      }
    }

    // Update key count
    touchKeysCountRef.current[playerSide]++;
  }, [simulateKey, GAME_HEIGHT, GROUND_HEIGHT, playerMode, isHost, BOARD_ALIGNMENT]);

  // Add touch indicator for fingerprint display
  const addTouchIndicator = useCallback((x, y, playerId, isLocal = true) => {
    if (DISPLAY_TOUCH_MODE === 'none') return;
    if (DISPLAY_TOUCH_MODE === 'personal' && !isLocal) return;

    const indicator = {
      x,
      y,
      playerId,
      isLocal,
      createdAt: Date.now(),
      opacity: 0.7
    };
    touchIndicatorsRef.current.push(indicator);
  }, []);

  // Canvas touch handlers for touch-to-move
  const handleCanvasPointerDown = useCallback((event) => {
    if (CONTROL_MODE === 'keys') return;
    if (!gameStarted) return;

    event.preventDefault();
    const coords = getCanvasCoords(event);
    if (!coords) return;

    // Determine which player this controls based on position and mode
    let playerSide;
    if (playerMode === 'single' || playerMode === 'remote') {
      playerSide = isHost ? 'right' : 'left';
      if (playerMode === 'single') playerSide = 'right';
    } else {
      // Multi mode: split control based on board alignment
      if (BOARD_ALIGNMENT === 'bottom_top') {
        playerSide = coords.y < GAME_HEIGHT / 2 ? 'left' : 'right';
      } else {
        playerSide = coords.x < GAME_WIDTH / 2 ? 'left' : 'right';
      }
    }

    // Add touch indicator
    addTouchIndicator(coords.x, coords.y, playerSide, true);

    touchTargetRef.current[playerSide] = coords;
    touchActiveRef.current[playerSide] = true;
    touchKeysCountRef.current[playerSide] = 0;

    handleTouchMove(playerSide, coords.x, coords.y);

    // Send touch to remote player if needed
    if (playerMode === 'remote' && remoteConnected && DISPLAY_TOUCH_MODE === 'both') {
      sendData({ type: 'touch', x: coords.x / GAME_WIDTH, y: coords.y / GAME_HEIGHT });
    }
  }, [gameStarted, getCanvasCoords, addTouchIndicator, isHost, playerMode, handleTouchMove, remoteConnected, GAME_WIDTH, GAME_HEIGHT, BOARD_ALIGNMENT]);

  const handleCanvasPointerMove = useCallback((event) => {
    if (CONTROL_MODE === 'keys') return;
    if (!gameStarted) return;

    const coords = getCanvasCoords(event);
    if (!coords) return;

    // Determine which player and update movement
    let playerSide;
    if (playerMode === 'single' || playerMode === 'remote') {
      playerSide = isHost ? 'right' : 'left';
      if (playerMode === 'single') playerSide = 'right';
    } else {
      if (BOARD_ALIGNMENT === 'bottom_top') {
        playerSide = coords.y < GAME_HEIGHT / 2 ? 'left' : 'right';
      } else {
        playerSide = coords.x < GAME_WIDTH / 2 ? 'left' : 'right';
      }
    }

    // Update touch indicator position
    if (touchIndicatorsRef.current.length > 0) {
      const lastIndicator = touchIndicatorsRef.current[touchIndicatorsRef.current.length - 1];
      if (lastIndicator.isLocal && Date.now() - lastIndicator.createdAt < 100) {
        lastIndicator.x = coords.x;
        lastIndicator.y = coords.y;
        lastIndicator.playerId = playerSide;
      } else {
        addTouchIndicator(coords.x, coords.y, playerSide, true);
      }
    }

    if (touchActiveRef.current[playerSide]) {
      touchTargetRef.current[playerSide] = coords;
      handleTouchMove(playerSide, coords.x, coords.y);

      if (playerMode === 'remote' && remoteConnected && DISPLAY_TOUCH_MODE === 'both') {
        sendData({ type: 'touch', x: coords.x / GAME_WIDTH, y: coords.y / GAME_HEIGHT });
      }
    }
  }, [gameStarted, getCanvasCoords, addTouchIndicator, isHost, playerMode, handleTouchMove, remoteConnected, GAME_WIDTH, GAME_HEIGHT, BOARD_ALIGNMENT]);

  const handleCanvasPointerUp = useCallback((event) => {
    if (CONTROL_MODE === 'keys') return;

    const coords = getCanvasCoords(event);

    // Determine which player
    let playerSide;
    if (playerMode === 'single' || playerMode === 'remote') {
      playerSide = isHost ? 'right' : 'left';
      if (playerMode === 'single') playerSide = 'right';
    } else if (coords) {
      if (BOARD_ALIGNMENT === 'bottom_top') {
        playerSide = coords.y < GAME_HEIGHT / 2 ? 'left' : 'right';
      } else {
        playerSide = coords.x < GAME_WIDTH / 2 ? 'left' : 'right';
      }
    } else {
      // If no coords, deactivate both
      ['left', 'right'].forEach(side => {
        if (touchActiveRef.current[side] && touchKeysCountRef.current[side] >= TOUCH_MOVE_MIN_KEYS) {
          touchActiveRef.current[side] = false;
          touchTargetRef.current[side] = null;
          const keys = side === 'left'
            ? ['a', 'd', 'w', 's']
            : ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
          keys.forEach(k => simulateKey(k, false));
        }
      });
      return;
    }

    // Only release if minimum keys were simulated
    if (touchKeysCountRef.current[playerSide] >= TOUCH_MOVE_MIN_KEYS) {
      touchActiveRef.current[playerSide] = false;
      touchTargetRef.current[playerSide] = null;

      const keys = playerSide === 'left'
        ? ['a', 'd', 'w', 's']
        : ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
      keys.forEach(k => simulateKey(k, false));
    }
  }, [getCanvasCoords, isHost, playerMode, simulateKey, GAME_WIDTH, GAME_HEIGHT, BOARD_ALIGNMENT]);

  const TouchButton = ({ label, actionKey }) => {
    const isBlinking = blinkingKeys[actionKey];
    return (
      <button
        type="button"
        className={`touch-button ${isBlinking ? 'touch-button-blink' : ''}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          logDocumentAction('pointerdown', {
            actionKey,
            label,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
          });
          setKeyState(actionKey, true);
        }}
        onPointerUp={(event) => {
          event.preventDefault();
          logDocumentAction('pointerup', {
            actionKey,
            label,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
          });
          setKeyState(actionKey, false);
        }}
        onPointerCancel={(event) => {
          event.preventDefault();
          logDocumentAction('pointercancel', {
            actionKey,
            label,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
          });
          setKeyState(actionKey, false);
        }}
        onPointerLeave={(event) => {
          event.preventDefault();
          logDocumentAction('pointerleave', {
            actionKey,
            label,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
          });
          setKeyState(actionKey, false);
        }}
      >
        {label}
      </button>
    );
  };

  const ShapeButton = ({ shape, label, onClick, selected }) => (
    <button
      onClick={onClick}
      className={`px-6 py-4 border-2 transition-all ellipse-button ${
        selected
          ? 'bg-green-300 border-green-400 scale-105'
          : 'bg-green-200 border-green-300 hover:bg-green-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-green-700 text-gray-900 p-4" dir="rtl">
      {/* History images overlay - shown on all selection screens */}
      {!gameStarted && !winner && displayHistoryImages && historyOverlay.src && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <img
            src={historyOverlay.src}
            alt=""
            className="absolute"
            style={{
              width: '39vmin',
              height: '39vmin',
              left: `${historyOverlay.position.x}%`,
              top: `${historyOverlay.position.y}%`,
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              borderRadius: '9999px',
              opacity: historyOverlay.visible ? 0.6 : 0,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        </div>
      )}

      {selectionStep === 'mode' && !gameStarted && !winner && (
        <div className="text-center relative w-full z-10">
          <div className="fixed top-0 left-0 right-0 flex justify-center z-10">
            <img
              src={`${resourceBaseUrl}/diamonds.png`}
              alt="Diamonds"
              className="h-56 md:h-72 w-auto object-contain"
            />
          </div>
          <div className="relative z-10 pt-60 md:pt-72">
            <h1 className="text-5xl font-bold mb-6 text-green-300" style={{fontFamily: 'Arial, sans-serif'}}>
              {t('mainTitle')}
            </h1>
            <h2 className="text-3xl font-bold mb-4 text-green-400">{t('gameTitle')}</h2>
            <p className="mb-2 text-gray-300 text-lg">{t('originalAuthor')}</p>
            <p className="mb-8 text-gray-400 italic">{t('adaptedBy')}</p>
            
            <div className="flex flex-col gap-4 mb-8 items-center justify-center">
              <button
                onClick={() => {
                  setPlayerMode('single');
                  setSelectionStep('shape');
                }}
                className={`px-8 py-4 text-lg transition-all min-w-48 ${lightButtonClasses}`}
              >
                {t('singlePlayer')}
              </button>
              <button
                onClick={startHosting}
                className={`px-8 py-4 text-lg transition-all min-w-48 ${lightButtonClasses}`}
              >
                {t('remoteMultiplayer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectionStep === 'remoteSetup' && !gameStarted && !winner && (
       <div className="text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-green-400">
            {t('remoteMultiplayer')}
          </h2>

          {isHost ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-300 text-lg mb-2">
                {remoteConnected ? t('connected') : t('waitingForPlayer')}
              </p>

              {!remoteConnected && (
                <>
                  <p className="text-gray-400">{t('scanQRCode')}</p>

                  {qrCodeDataUrl && (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  )}

                  <p className="text-gray-400 mt-4">{t('orShareLink')}</p>

                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={roomId ? getJoinUrl(roomId) : ''}
                      className="px-3 py-2 rounded bg-green-800 text-white text-sm w-64 truncate"
                      onClick={(e) => e.target.select()}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={shareLinkToMobile}
                        className={`px-4 py-2 rounded ${lightButtonClasses}`}
                      >
                        {t('shareLink')}
                      </button>
                      <button
                        onClick={copyLinkToClipboard}
                        className={`px-4 py-2 rounded ${lightButtonClasses}`}
                      >
                        {linkCopied ? t('linkCopied') : t('copyLink')}
                      </button>
                    </div>
                  </div>

                  {connectionStatus === 'waiting' && (
                    <div className="flex items-center gap-2 mt-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                      <span className="text-gray-400">{t('waitingForPlayer')}</span>
                    </div>
                  )}
                </>
              )}

              {remoteConnected && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-green-400 text-lg">{t('youAreHost')}</p>
                  <button
                    onClick={() => setSelectionStep('shape')}
                    className={`px-8 py-4 rounded text-lg transition-all ${lightButtonClasses}`}
                  >
                    {t('nextButton')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {connectionStatus === 'connecting' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  <p className="text-gray-300">{t('connecting')}</p>
                </div>
              )}

              {connectionStatus === 'connected' && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-green-400 text-xl">{t('connected')}</p>
                  <p className="text-gray-300">{t('youAreGuest')}</p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  <p className="text-gray-400 text-sm whitespace-pre-line">{t('guestWaitingMessage')}</p>
                </div>
              )}

              {connectionStatus === 'failed' && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-red-400">{t('connectionFailed')}</p>
                  <button
                    onClick={() => {
                      setSelectionStep('mode');
                      setConnectionStatus('idle');
                      cleanupConnection();
                    }}
                    className={`px-6 py-3 rounded ${lightButtonClasses}`}
                  >
                    {t('backButton')}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setSelectionStep('mode');
              setPlayerMode(null);
              setConnectionStatus('idle');
              setRoomId(null);
              cleanupConnection();
            }}
            className={`mt-8 px-6 py-3 rounded ${lightButtonClasses}`}
          >
            {t('backButton')}
          </button>
        </div>
      )}

      {selectionStep === 'shape' && !gameStarted && !winner && (
        <div className="text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-green-400">{t('selectShape')}</h2>

          {/* Remote mode - Guest selects their own character */}
          {playerMode === 'remote' && !isHost && (
            <>
              <p className="mb-4 text-gray-300">{t('chooseCharacter')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {AVAILABLE_SHAPES.map((shape) => (
                  <ShapeButton
                    key={shape}
                    shape={shape}
                    label={t(shape)}
                    onClick={() => {
                      setSelectedShapes((prev) => ({ ...prev, left: shape }));
                      sendData({ type: 'guestCharacterSelect', shape });
                    }}
                    selected={selectedShapes.left === shape}
                  />
                ))}
              </div>
              {selectedShapes.left && (
                <div className="flex flex-col items-center gap-4 mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  <p className="text-gray-400 text-sm whitespace-pre-line">{t('guestWaitingMessage')}</p>
                </div>
              )}
            </>
          )}

          {/* Remote mode - Host selects their character and waits for guest */}
          {playerMode === 'remote' && isHost && (
            <>
              {!selectedShapes.right && (
                <>
                  <p className="mb-4 text-gray-300">{t('chooseCharacter')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {AVAILABLE_SHAPES.map((shape) => (
                      <ShapeButton
                        key={shape}
                        shape={shape}
                        label={t(shape)}
                        onClick={() => {
                          setSelectedShapes((prev) => ({ ...prev, right: shape }));
                          // Notify guest about selection step and host's choice
                          sendData({ type: 'selectionStep', step: 'shape', hostShape: shape });
                        }}
                        selected={selectedShapes.right === shape}
                      />
                    ))}
                  </div>
                </>
              )}
              {selectedShapes.right && !selectedShapes.left && (
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  <p className="text-gray-400 text-sm whitespace-pre-line">{t('guestWaitingMessage')}</p>
                </div>
              )}
            </>
          )}

          {/* Single player and local multiplayer modes */}
          {playerMode !== 'remote' && (
            <>
              <p className="mb-4 text-gray-300">
                {playerMode === 'multi' ? t('player1') : t('chooseCharacter')}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {AVAILABLE_SHAPES.map((shape) => (
                  <ShapeButton
                    key={shape}
                    shape={shape}
                    label={t(shape)}
                    onClick={() => {
                      setSelectedShapes((prev) => {
                        const key = playerMode === 'single' ? 'right' : 'left';
                        const next = { ...prev, [key]: shape };
                        if (playerMode === 'single') {
                          next.left = pickRandomShape(shape);
                        }
                        return next;
                      });
                      if (playerMode === 'single') {
                        setSelectionStep('ball');
                      }
                    }}
                    selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === shape}
                  />
                ))}
              </div>

              {playerMode === 'multi' && selectedShapes.left && !selectedShapes.right && (
                <>
                  <p className="mb-4 text-gray-300 mt-6">{t('player2')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {AVAILABLE_SHAPES.map((shape) => (
                      <ShapeButton
                        key={shape}
                        shape={shape}
                        label={t(shape)}
                        onClick={() => {
                          setSelectedShapes((prev) => ({ ...prev, right: shape }));
                          setSelectionStep('ball');
                        }}
                        selected={selectedShapes.right === shape}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => {
                setSelectionStep('mode');
                setSelectedShapes({ left: null, right: null });
              }}
              className={`px-6 py-3 rounded ${lightButtonClasses}`}
            >
              {t('backButton')}
            </button>
          </div>
        </div>
      )}
      
      {selectionStep === 'ball' && !gameStarted && !winner && (
        <div className="text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-green-400">{t('selectBall')}</h2>
          
          <div className="grid grid-cols-3 gap-6 mb-6 max-w-md mx-auto">
            <ShapeButton
              shape="grenade"
              label={t('grenade')}
              onClick={() => {
                setSelectedBall('grenade');
                setSelectionStep('duration');
              }}
              selected={selectedBall === 'grenade'}
            />
            <ShapeButton
              shape="pill"
              label={t('pill')}
              onClick={() => {
                setSelectedBall('pill');
                setSelectionStep('duration');
              }}
              selected={selectedBall === 'pill'}
            />
            <ShapeButton
              shape="cannabis"
              label={t('cannabis')}
              onClick={() => {
                setSelectedBall('cannabis');
                setSelectionStep('duration');
              }}
              selected={selectedBall === 'cannabis'}
            />
          </div>
          
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => {
                setSelectionStep('shape');
                setSelectedBall(null);
              }}
              className={`px-6 py-3 rounded ${lightButtonClasses}`}
            >
              {t('backButton')}
            </button>
          </div>
        </div>
      )}
      
      {selectionStep === 'duration' && !gameStarted && !winner && (
         <div className="text-center relative z-10">
          <h2 className="text-2xl font-bold mb-4">{t('selectDuration')}</h2>
          
          <div className="mb-4 text-lg">
            <span className="text-cyan-400">{t('cyanTeam')}</span>
            <span className="mx-4">{t('versus')}</span>
            <span className="text-red-400">{t('redTeam')}</span>
          </div>
          
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="flex justify-center w-full">
              <button
                onClick={() => startGame('1min')}
                className={`duration-button-large rounded duration-highlight ${lightButtonClasses}`}
              >
                {t('oneMinute')}
              </button>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                onClick={() => startGame('2min')}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('twoMinutes')}
              </button>
              <button
                onClick={() => startGame('4min')}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('fourMinutes')}
              </button>
              <button
                onClick={() => startGame('8min')}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('eightMinutes')}
              </button>
              <button
                onClick={() => startGame('worldcup')}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('worldCup')}
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            {playerMode === 'multi' ? (
              <>
                <p>{t('multiplayerControls1')}</p>
                <p>{t('multiplayerControls2')}</p>
              </>
            ) : (
              <>
                <p>{t('singlePlayerControls1')}</p>
                <p>{t('singlePlayerControls2')}</p>
              </>
            )}
          </div>
          
          <button
            onClick={() => {
              setSelectionStep('ball');
              setGameMode(null);
            }}
            className={`mt-4 px-4 py-2 rounded text-sm ${lightButtonClasses}`}
          >
            {t('backButton')}
          </button>
        </div>
      )}
      
      {(gameStarted || winner) && (
        <div className="fixed inset-0 flex flex-col items-center justify-start bg-green-700">
          {!isLandscape && (
            <div className="absolute top-0 left-0 right-0 bg-green-800 px-8 py-4 w-full flex justify-between items-center z-10">
              <span className="text-xl font-bold">{score.left}</span>
              <span className="text-xl font-bold">{score.right}</span>
            </div>
          )}
          
          <div className="relative w-full h-full">
            <div className="absolute top-2 left-1/2 z-10 -translate-x-1/2 game-timer">
              {formatTime(timeLeft)}
            </div>
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className="border-4 border-green-700 w-full h-full game-canvas"
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
            />
          </div>

          {gameStarted && isTouchDevice && CONTROL_MODE !== 'touch' && (
            <div className={`touch-controls${showDualTouchControls ? '' : ' touch-controls-centered'}`}>
              {showRightTouchControls && (
                <div className="touch-group">
                  <div className="touch-row">
                    <TouchButton label="↑" actionKey="arrowup" />
                  </div>
                  <div className="touch-row">
                    <TouchButton label="→" actionKey="arrowright" />
                    <TouchButton label="↓" actionKey="arrowdown" />
                    <TouchButton label="←" actionKey="arrowleft" />
                  </div>
                </div>
              )}
              {showLeftTouchControls && (
                <div className="touch-group">
                  <div className="touch-row">
                    <TouchButton label="W" actionKey="w" />
                  </div>
                  <div className="touch-row">
                    <TouchButton label="D" actionKey="d" />
                    <TouchButton label="S" actionKey="s" />
                    <TouchButton label="A" actionKey="a" />
                  </div>
                </div>
              )}
            </div>
          )}

          {showGoalCelebration && (
            <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
              <img
                src={`${resourceBaseUrl}/ball1.gif`}
                alt="Goal celebration"
                className="w-48 h-auto"
              />
              <div
                className="mt-4 text-green-700 font-bold goal-celebration-text"
                style={{ fontSize: '20vw' }}
              >
                גווווול
              </div>
            </div>
          )}
          
          {winner && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <h2 className="text-3xl font-bold mb-4 text-green-400">
                {winner === 'Draw' ? t('gameDraw') : `${winner} ${t('gameWinner')}`}
              </h2>
              <button
                onClick={() => {
                  setGameMode(null);
                  setPlayerMode(null);
                  setWinner(null);
                  setSelectionStep('mode');
                  setSelectedShapes({ left: null, right: null });
                  setSelectedBall(null);
                }}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('backToMenu')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlimeSoccer;
