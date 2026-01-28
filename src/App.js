import React, { useState, useEffect, useRef, useCallback } from 'react';

const TRANSLATIONS = {
  "he-IL": {
    "mainTitle": "משחק להרגעה ליהלומי קרב",
    "gameTitle": "כדורגל טיפולי SeachTen",
    "originalAuthor": "משחק טיפולי ללוחמי PTSD",
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
    "chooseCharacter": "בחר את הדמות שלך"
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
const SLIME_RADIUS = 80;
const BALL_RADIUS = 20;
const GOAL_WIDTH = 160;
const GOAL_HEIGHT = 240;
const GRAVITY = 0.6;
const SLIME_SPEED = 5;
const SLIME_JUMP_POWER = -12;
const BALL_DAMPING = 0.99;
const BALL_BOUNCE_DAMPING = 0.8;
const MAX_BALL_SPEED = 13;
const AI_REACTION_DISTANCE = 300;
const AI_PREDICTION_TIME = 30;
const AVAILABLE_SHAPES = [
  'helmetCamo',
  'helmetDesert',
  'helmetUrban',
  'labrador',
  'tank',
  'sunflower',
];
const computeStartPositions = (fieldWidth) => {
  const leftX = Math.max(SLIME_RADIUS + 10, GOAL_WIDTH * 0.6);
  const rightX = Math.min(fieldWidth - SLIME_RADIUS - 10, fieldWidth - GOAL_WIDTH * 0.6);
  return { leftX, rightX };
};

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
  
  // Game state
  const [gameMode, setGameMode] = useState(null);
  const [playerMode, setPlayerMode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [selectionStep, setSelectionStep] = useState('mode'); // 'mode', 'shape', 'ball', 'duration'
  const [selectedShapes, setSelectedShapes] = useState({ left: null, right: null });
  const [selectedBall, setSelectedBall] = useState(null);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const resourceBaseUrl = `${process.env.PUBLIC_URL}/resources`;
  const [gameDimensions, setGameDimensions] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const GAME_WIDTH = gameDimensions.width;
  const GAME_HEIGHT = gameDimensions.height;

  useEffect(() => {
    const handleResize = () => {
      setGameDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
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

  const pickRandomShape = useCallback((excludeShape) => {
    const available = AVAILABLE_SHAPES.filter((shape) => shape !== excludeShape);
    const pool = available.length ? available : AVAILABLE_SHAPES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);
  
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
    logoImg.src = `${resourceBaseUrl}/logo2.png`;
    logoImg.onload = () => {
      logoImageRef.current = logoImg;
    };
  }, [GAME_HEIGHT, GAME_WIDTH, resourceBaseUrl]);

  useEffect(() => {
    goalAudioRef.current = new Audio(`${resourceBaseUrl}/goal.mp3`);

    return () => {
      if (goalTimeoutRef.current) {
        clearTimeout(goalTimeoutRef.current);
      }
      if (startGameTimeoutRef.current) {
        clearTimeout(startGameTimeoutRef.current);
      }
    };
  }, []);

  const triggerGoalCelebration = useCallback(() => {
    if (goalTimeoutRef.current) {
      clearTimeout(goalTimeoutRef.current);
    }
    setShowGoalCelebration(true);
    goalTimeoutRef.current = setTimeout(() => {
      setShowGoalCelebration(false);
    }, 1000);
    if (goalAudioRef.current) {
      goalAudioRef.current.currentTime = 0;
      goalAudioRef.current.play().catch(() => {});
    }
  }, []);
  
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
  const initialPositions = computeStartPositions(GAME_WIDTH);
  const gameStateRef = useRef({
    leftSlime: {
      x: initialPositions.leftX,
      y: GAME_HEIGHT - GROUND_HEIGHT,
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
      y: GAME_HEIGHT - GROUND_HEIGHT,
      vx: 0,
      vy: 0,
      isGrabbing: false,
      hasBall: false,
      goalLineTime: 0
    },
    ball: {
      x: GAME_WIDTH / 2,
      y: 150,
      vx: 0,
      vy: 0,
      grabbedBy: null,
      grabAngle: 0,
      grabAngularVelocity: 0
    }
  });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        keysRef.current[key] = true;
      } else {
        keysRef.current[key] = true;
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        keysRef.current[key] = false;
      } else {
        keysRef.current[key] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
    if (score.left > score.right) {
      setWinner(t('cyanTeam'));
    } else if (score.right > score.left) {
      setWinner(t('redTeam'));
    } else {
      setWinner('Draw');
    }
  };

  const resetPositions = () => {
    const state = gameStateRef.current;
    const { leftX, rightX } = computeStartPositions(GAME_WIDTH);
    state.leftSlime.x = leftX;
    state.leftSlime.y = GAME_HEIGHT - GROUND_HEIGHT;
    state.leftSlime.vx = 0;
    state.leftSlime.vy = 0;
    state.leftSlime.isGrabbing = false;
    state.leftSlime.hasBall = false;
    state.leftSlime.goalLineTime = 0;
    state.leftSlime.targetX = leftX;
    state.leftSlime.lastDecisionTime = 0;
    state.leftSlime.decisionCooldown = 0;
    state.leftSlime.stableStart = true;
    
    state.rightSlime.x = rightX;
    state.rightSlime.y = GAME_HEIGHT - GROUND_HEIGHT;
    state.rightSlime.vx = 0;
    state.rightSlime.vy = 0;
    state.rightSlime.isGrabbing = false;
    state.rightSlime.hasBall = false;
    state.rightSlime.goalLineTime = 0;
    
    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = 150;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.grabbedBy = null;
    state.ball.grabAngle = 0;
    state.ball.grabAngularVelocity = 0;
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
    startGameTimeoutRef.current = setTimeout(() => {
      setGameStarted(true);
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
      tempVy += GRAVITY;
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
    
  }, [GAME_HEIGHT, GAME_WIDTH, playerMode, timeLeft, gameMode]);

  const updatePhysics = useCallback(() => {
    const state = gameStateRef.current;
    const keys = keysRef.current;
    
    if (playerMode === 'multi') {
      if (keys['a']) state.leftSlime.vx = -SLIME_SPEED;
      else if (keys['d']) state.leftSlime.vx = SLIME_SPEED;
      else state.leftSlime.vx = 0;
      
      if (keys['w'] && state.leftSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.leftSlime.isGrabbing) {
        state.leftSlime.vy = SLIME_JUMP_POWER;
      }
      
      state.leftSlime.isGrabbing = keys['s'];
      
      if (keys['arrowleft']) state.rightSlime.vx = -SLIME_SPEED;
      else if (keys['arrowright']) state.rightSlime.vx = SLIME_SPEED;
      else state.rightSlime.vx = 0;
      
      if (keys['arrowup'] && state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.rightSlime.isGrabbing) {
        state.rightSlime.vy = SLIME_JUMP_POWER;
      }
      
      state.rightSlime.isGrabbing = keys['arrowdown'];
    } else {
      if (keys['arrowleft']) state.rightSlime.vx = -SLIME_SPEED;
      else if (keys['arrowright']) state.rightSlime.vx = SLIME_SPEED;
      else state.rightSlime.vx = 0;
      
      if (keys['arrowup'] && state.rightSlime.y >= GAME_HEIGHT - GROUND_HEIGHT - 1 && !state.rightSlime.isGrabbing) {
        state.rightSlime.vy = SLIME_JUMP_POWER;
      }
      
      state.rightSlime.isGrabbing = keys['arrowdown'];
      
      updateAI();
    }
    
    [state.leftSlime, state.rightSlime].forEach((slime, index) => {
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
        slime.goalLineTime += 1/60;
        
        if (slime.goalLineTime >= 1) {
          if (isLeftSlime) {
            setScore(prev => ({ ...prev, right: prev.right + 1 }));
          } else {
            setScore(prev => ({ ...prev, left: prev.left + 1 }));
          }
          resetPositions();
        }
      } else {
        slime.goalLineTime = 0;
      }
    });
    
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
        state.ball.vx = grabber.vx * 1.5 + Math.cos(releaseAngle) * (3 + releaseSpeed);
        state.ball.vy = grabber.vy - 2 + Math.sin(releaseAngle) * releaseSpeed * 0.3;
        state.ball.grabbedBy = null;
        state.ball.grabAngle = 0;
        state.ball.grabAngularVelocity = 0;
        grabber.hasBall = false;
      }
    } else {
      state.ball.vy += GRAVITY;
      state.ball.vx *= BALL_DAMPING;
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;
    }
    
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
      triggerGoalCelebration();
      setScore(prev => ({ ...prev, right: prev.right + 1 }));
      resetPositions();
    } else if (state.ball.x >= GAME_WIDTH - BALL_RADIUS && state.ball.y > GAME_HEIGHT - GROUND_HEIGHT - GOAL_HEIGHT) {
      triggerGoalCelebration();
      setScore(prev => ({ ...prev, left: prev.left + 1 }));
      resetPositions();
    }
    
    if (state.ball.y < BALL_RADIUS) {
      state.ball.y = BALL_RADIUS;
      state.ball.vy = -state.ball.vy * BALL_BOUNCE_DAMPING;
    }
    
    [state.leftSlime, state.rightSlime].forEach((slime, index) => {
      const slimeName = index === 0 ? 'left' : 'right';
      const otherSlime = index === 0 ? state.rightSlime : state.leftSlime;
      const dx = state.ball.x - slime.x;
      const dy = state.ball.y - slime.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < SLIME_RADIUS + BALL_RADIUS) {
        if (state.ball.grabbedBy && state.ball.grabbedBy !== slimeName) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(slime.vx * slime.vx + slime.vy * slime.vy);
          
          if (speed > 2 || Math.abs(slime.vy) > 5) {
            state.ball.grabbedBy = null;
            state.ball.grabAngle = 0;
            state.ball.grabAngularVelocity = 0;
            otherSlime.hasBall = false;
            
            state.ball.vx = Math.cos(angle) * 8 + slime.vx;
            state.ball.vy = Math.sin(angle) * 8 + slime.vy;
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
          
          if (state.ball.y < slime.y || Math.abs(angle) < Math.PI * 0.5) {
            state.ball.x = targetX;
            state.ball.y = targetY;
            
            const speed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
            state.ball.vx = Math.cos(angle) * speed * 1.5 + slime.vx * 0.5;
            state.ball.vy = Math.sin(angle) * speed * 1.5 + slime.vy * 0.5;
            
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
  }, [GAME_HEIGHT, GAME_WIDTH, playerMode, triggerGoalCelebration, updateAI]);

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
    
    // Draw background
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0);
    } else {
      ctx.fillStyle = '#0d3d1f';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    
    // Draw Seach logo in background
    if (logoImageRef.current) {
      ctx.globalAlpha = 0.7;
      const originalWidth = logoImageRef.current.width;
      const originalHeight = logoImageRef.current.height;
      const targetWidth = GAME_WIDTH * 0.5;
      const targetHeight = GAME_HEIGHT * 0.5;
      const scale = Math.min(
        targetWidth / originalWidth,
        targetHeight / originalHeight
      );
      const logoWidth = originalWidth * scale;
      const logoHeight = originalHeight * scale;
      ctx.drawImage(
        logoImageRef.current,
        GAME_WIDTH / 2 - logoWidth / 2,
        0,
        logoWidth,
        logoHeight
      );
      ctx.globalAlpha = 1.0;
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
    const leftShape = selectedShapes.left || 'helmetCamo';
    const rightShape = selectedShapes.right || 'helmetDesert';
    
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
  }, [GAME_HEIGHT, GAME_WIDTH, selectedShapes, selectedBall]);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const lightButtonClasses = 'bg-green-200 hover:bg-green-300 text-green-900 border-2 border-green-300';

  const setKeyState = useCallback((key, pressed) => {
    keysRef.current[key] = pressed;
  }, []);

  const TouchButton = ({ label, actionKey }) => (
    <button
      type="button"
      className="touch-button"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setKeyState(actionKey, true);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        setKeyState(actionKey, false);
      }}
      onPointerCancel={(event) => {
        event.preventDefault();
        setKeyState(actionKey, false);
      }}
      onPointerLeave={(event) => {
        event.preventDefault();
        setKeyState(actionKey, false);
      }}
    >
      {label}
    </button>
  );

  const ShapeButton = ({ shape, label, onClick, selected }) => (
    <button
      onClick={onClick}
      className={`px-6 py-4 rounded border-2 transition-all ${
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
      {selectionStep === 'mode' && (
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 text-green-300" style={{fontFamily: 'Arial, sans-serif'}}>
            {t('mainTitle')}
          </h1>
          <h2 className="text-3xl font-bold mb-4 text-green-400">{t('gameTitle')}</h2>
          <p className="mb-2 text-gray-300 text-lg">{t('originalAuthor')}</p>
          <p className="mb-8 text-gray-400 italic">{t('adaptedBy')}</p>
          
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => {
                setPlayerMode('single');
                setSelectionStep('shape');
              }}
              className={`px-8 py-4 rounded text-lg transition-all ${lightButtonClasses}`}
            >
              {t('singlePlayer')}
            </button>
            <button
              onClick={() => {
                setPlayerMode('multi');
                setSelectionStep('shape');
              }}
              className={`px-8 py-4 rounded text-lg transition-all ${lightButtonClasses}`}
            >
              {t('multiplayer')}
            </button>
          </div>
        </div>
      )}
      
      {selectionStep === 'shape' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-green-400">{t('selectShape')}</h2>
          <p className="mb-4 text-gray-300">
            {playerMode === 'multi' ? t('player1') : t('chooseCharacter')}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <ShapeButton
              shape="helmetCamo"
              label={t('helmetCamo')}
              onClick={() => setSelectedShapes({
                ...selectedShapes,
                [playerMode === 'single' ? 'right' : 'left']: 'helmetCamo',
              })}
              selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === 'helmetCamo'}
            />
            <ShapeButton
              shape="helmetDesert"
              label={t('helmetDesert')}
              onClick={() => setSelectedShapes({
                ...selectedShapes,
                [playerMode === 'single' ? 'right' : 'left']: 'helmetDesert',
              })}
              selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === 'helmetDesert'}
            />
            <ShapeButton
              shape="helmetUrban"
              label={t('helmetUrban')}
              onClick={() => setSelectedShapes({
                ...selectedShapes,
                [playerMode === 'single' ? 'right' : 'left']: 'helmetUrban',
              })}
              selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === 'helmetUrban'}
            />
            <ShapeButton
              shape="labrador"
              label={t('labrador')}
              onClick={() => setSelectedShapes({
                ...selectedShapes,
                [playerMode === 'single' ? 'right' : 'left']: 'labrador',
              })}
              selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === 'labrador'}
            />
            <ShapeButton
              shape="tank"
              label={t('tank')}
              onClick={() => setSelectedShapes({
                ...selectedShapes,
                [playerMode === 'single' ? 'right' : 'left']: 'tank',
              })}
              selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === 'tank'}
            />
            <ShapeButton
              shape="sunflower"
              label={t('sunflower')}
              onClick={() => setSelectedShapes({
                ...selectedShapes,
                [playerMode === 'single' ? 'right' : 'left']: 'sunflower',
              })}
              selected={(playerMode === 'single' ? selectedShapes.right : selectedShapes.left) === 'sunflower'}
            />
          </div>
          
          {playerMode === 'multi' && selectedShapes.left && !selectedShapes.right && (
            <>
              <p className="mb-4 text-gray-300 mt-6">{t('player2')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <ShapeButton
                  shape="helmetCamo"
                  label={t('helmetCamo')}
                  onClick={() => setSelectedShapes({...selectedShapes, right: 'helmetCamo'})}
                  selected={selectedShapes.right === 'helmetCamo'}
                />
                <ShapeButton
                  shape="helmetDesert"
                  label={t('helmetDesert')}
                  onClick={() => setSelectedShapes({...selectedShapes, right: 'helmetDesert'})}
                  selected={selectedShapes.right === 'helmetDesert'}
                />
                <ShapeButton
                  shape="helmetUrban"
                  label={t('helmetUrban')}
                  onClick={() => setSelectedShapes({...selectedShapes, right: 'helmetUrban'})}
                  selected={selectedShapes.right === 'helmetUrban'}
                />
                <ShapeButton
                  shape="labrador"
                  label={t('labrador')}
                  onClick={() => setSelectedShapes({...selectedShapes, right: 'labrador'})}
                  selected={selectedShapes.right === 'labrador'}
                />
                <ShapeButton
                  shape="tank"
                  label={t('tank')}
                  onClick={() => setSelectedShapes({...selectedShapes, right: 'tank'})}
                  selected={selectedShapes.right === 'tank'}
                />
                <ShapeButton
                  shape="sunflower"
                  label={t('sunflower')}
                  onClick={() => setSelectedShapes({...selectedShapes, right: 'sunflower'})}
                  selected={selectedShapes.right === 'sunflower'}
                />
              </div>
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
            {((playerMode === 'single' && selectedShapes.right) || 
              (playerMode === 'multi' && selectedShapes.left && selectedShapes.right)) && (
              <button
                onClick={() => {
                  if (playerMode === 'single') {
                    setSelectedShapes((prev) => ({
                      ...prev,
                      left: pickRandomShape(prev.right),
                    }));
                  }
                  setSelectionStep('ball');
                }}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('nextButton')}
              </button>
            )}
          </div>
        </div>
      )}
      
      {selectionStep === 'ball' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-green-400">{t('selectBall')}</h2>
          
          <div className="grid grid-cols-3 gap-6 mb-6 max-w-md mx-auto">
            <ShapeButton
              shape="grenade"
              label={t('grenade')}
              onClick={() => setSelectedBall('grenade')}
              selected={selectedBall === 'grenade'}
            />
            <ShapeButton
              shape="pill"
              label={t('pill')}
              onClick={() => setSelectedBall('pill')}
              selected={selectedBall === 'pill'}
            />
            <ShapeButton
              shape="cannabis"
              label={t('cannabis')}
              onClick={() => setSelectedBall('cannabis')}
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
            {selectedBall && (
              <button
                onClick={() => setSelectionStep('duration')}
                className={`px-6 py-3 rounded ${lightButtonClasses}`}
              >
                {t('nextButton')}
              </button>
            )}
          </div>
        </div>
      )}
      
      {selectionStep === 'duration' && !gameStarted && !winner && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('selectDuration')}</h2>
          
          <div className="mb-4 text-lg">
            <span className="text-cyan-400">{t('cyanTeam')}</span>
            <span className="mx-4">{t('versus')}</span>
            <span className="text-red-400">{t('redTeam')}</span>
          </div>
          
          <div className="flex gap-4 mb-8 flex-wrap justify-center">
            <button
              onClick={() => startGame('1min')}
              className={`px-6 py-3 rounded ${lightButtonClasses}`}
            >
              {t('oneMinute')}
            </button>
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
          <div className="absolute top-0 left-0 right-0 bg-green-800 px-8 py-4 w-full flex justify-between items-center z-10">
            <span className="text-xl font-bold">{t('cyanTeam')}: {score.left}</span>
            <span className="text-2xl font-mono">{formatTime(timeLeft)}</span>
            <span className="text-xl font-bold">{score.right} : {t('redTeam')}</span>
          </div>
          
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="border-4 border-green-700 w-full h-full game-canvas"
          />

          {gameStarted && isTouchDevice && (
            <div className="touch-controls">
              {playerMode === 'multi' && (
                <div className="touch-group">
                  <div className="touch-row">
                    <TouchButton label="W" actionKey="w" />
                  </div>
                  <div className="touch-row">
                    <TouchButton label="A" actionKey="a" />
                    <TouchButton label="S" actionKey="s" />
                    <TouchButton label="D" actionKey="d" />
                  </div>
                </div>
              )}
              <div className="touch-group">
                <div className="touch-row">
                  <TouchButton label="↑" actionKey="arrowup" />
                </div>
                <div className="touch-row">
                  <TouchButton label="←" actionKey="arrowleft" />
                  <TouchButton label="↓" actionKey="arrowdown" />
                  <TouchButton label="→" actionKey="arrowright" />
                </div>
              </div>
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
                גול
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
