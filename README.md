# משחק להרגעה ליהלומי קרב - SeachTen Therapeutic Soccer

## תיאור הפרויקט
משחק כדורגל טיפולי המיועד במיוחד ללוחמים עם PTSD. המשחק מציע חוויה מרגיעה ומהנה עם אלמנטים טיפוליים וצבאיים.

## Project Description
A therapeutic soccer game specifically designed for combat veterans with PTSD. The game offers a calming and enjoyable experience with therapeutic and military elements.

## תכונות עיקריות / Main Features

### דמויות לבחירה / Character Selection
- 🪖 קסדות צבאיות (מסוות, מדבר, עירוני) / Military Helmets (Camo, Desert, Urban)
- 🐕 לברדור (כלב טיפולי) / Labrador (Therapy Dog)
- 🚜 טנק / Tank
- 🌻 חמנייה (סמל לשלום) / Sunflower (Symbol of Peace)

### כדורים לבחירה / Ball Options
- 💣 רימון יד / Hand Grenade
- 💊 כדור תרופה / Pharmaceutical Pill
- 🌿 פרח קנאביס / Cannabis Flower

### עיצוב טיפולי / Therapeutic Design
- רקע עם צמחי קנאביס ויהלומים / Background with cannabis plants and diamonds
- לוגו של Seach Medical Group
- ערכת צבעים ירוקה מרגיעה / Calming green color scheme
- ממשק בעברית / Hebrew RTL Interface

## התקנה / Installation

### דרישות מוקדמות / Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### שלבי התקנה / Installation Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/seachten-therapeutic-game.git

# Navigate to project directory
cd seachten-therapeutic-game

# Install dependencies
npm install

# Start development server
npm start
```

## שימוש / Usage

### מצב שחקן בודד / Single Player Mode
- השתמש במקשי החצים לשליטה / Use arrow keys to control
- ↑ - קפיצה / Jump
- ←/→ - תזוזה / Move
- ↓ - אחיזה בכדור / Grab ball

### מצב שני שחקנים / Two Player Mode
**שחקן 1 (שמאל) / Player 1 (Left):**
- W - קפיצה / Jump
- A/D - תזוזה / Move
- S - אחיזה / Grab

**שחקן 2 (ימין) / Player 2 (Right):**
- ↑ - קפיצה / Jump
- ←/→ - תזוזה / Move
- ↓ - אחיזה / Grab

## מבנה הפרויקט / Project Structure

```
seachten-therapeutic-game/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── README.md
└── .gitignore
```

## טכנולוגיות / Technologies Used
- React 18
- Tailwind CSS
- HTML5 Canvas
- JavaScript ES6+

## פיתוח / Development

```bash
# Run development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## הרצה בשרת עם PM2 / Running on a Server with PM2

```bash
# Install PM2 globally (once)
npm install -g pm2

# Build the production bundle
npm run build

# Load .env and serve the build folder on the configured PORT
set -a
source .env
set +a
pm2 serve build "${PORT:-3000}" --name PTSD-Play --spa

# Save the PM2 process list for reboot persistence
pm2 save
```

## תרומה לפרויקט / Contributing
נשמח לקבל תרומות לפרויקט! אנא פתח issue או שלח pull request.

We welcome contributions! Please open an issue or submit a pull request.

## רישיון / License
MIT License - ראה את קובץ LICENSE למידע נוסף

## צור קשר / Contact
Seach Medical Group - https://seachmedical.com

## הקדשה / Dedication
המשחק הזה מוקדש לכל לוחמי ה-PTSD ומשפחותיהם. אתם לא לבד.

This game is dedicated to all PTSD veterans and their families. You are not alone.

---

Developed with ❤️ by Seach Medical Group
פותח באהבה על ידי Seach Medical Group
