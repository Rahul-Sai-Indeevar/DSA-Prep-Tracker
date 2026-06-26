# DSA & Interview Prep Tracker (Full-Stack)

A high-performance, full-stack dashboard built to track Software Engineering and Data Science interview preparation. Designed to replace clunky Excel spreadsheets with a modern, AI-powered, analytics-driven workflow.

![Dashboard Preview](./images/dashboard-preview.png)

## The Motivation
While preparing for a 6-week Software Engineering & Data Science internship sprint, I realized tracking my progress in Google Sheets was inefficient. I needed a tool that not only logged my problems but provided actionable insights—like identifying weak topics, tracking average solve times by difficulty, and maintaining a balanced daily streak across different categories.

Instead of searching for a third-party app, I built a custom full-stack solution tailored specifically for competitive programming (LeetCode/Codeforces), SQL, Pandas, and Machine Learning prep.

## Features
* **Smart Auto-Fill:** Paste a LeetCode or Codeforces URL, and the app instantly parses the problem name and platform.
* **AI Cheat Sheet Generator:** Sends your logged mistakes and tricks to an AI model to dynamically generate a customized weakness analysis and revision cheat sheet.
* **Goal-Based Streak Tracking:** Calculates required daily problem limits based on user-defined Weekly or Monthly targets.
* **Category-Specific Goals:** Set granular daily/weekly/monthly targets (e.g., "2 DSA, 2 SQL, 1 ML per day") and track streak maintenance based on total quotas.
* **Dynamic Analytics (Chart.js):** Real-time data visualization showing Difficulty Spread, Top 5 Practiced Tags, and Average Time per Difficulty/Rating. Automatically adapts between standard difficulties (Easy/Med/Hard) and Codeforces ratings (800, 1200, etc.).
* **Advanced Multi-Filtering:** Instantly filter log history using a combination of Platform, Category, Difficulty, Status, and **Multi-Tag** (`AND` logic) parameters.
* **Seamless UI/UX:** Responsive CSS Grid layout, native Dark/Light mode, and buttery-smooth collapsible accordion notes.

## Tech Stack
**Frontend:**
* HTML5, CSS3 (CSS Grid, Variables)
* Vanilla JavaScript (ES6+), DOM Manipulation, Fetch API
* Chart.js (Data Visualization) & FontAwesome (UI Icons)
* Deployed on **Vercel**

**Backend & Database:**
* **Python 3** & **FastAPI** (High-performance REST API)
* **PostgreSQL** (Relational Database hosted on **Neon.tech**)
* SQLAlchemy (ORM) & Pydantic (Data Validation)
* Deployed on **Render**

## Engineering Challenges & Solutions
Building this application required bridging a complex interactive frontend with a strict relational backend. Here are a few challenges I overcame:

1. **Migrating from LocalStorage to a PostgreSQL API:** 
   * *Challenge:* Transitioning the app to a remote database introduced asynchronous delays and strict type-checking, crashing the frontend if users left optional fields (like `tags` or `time`) blank.
   * *Solution:* Implemented Pydantic models in FastAPI using `Optional` types, and added robust fallback logic in the JavaScript rendering cycle to display clean UI placeholders (e.g., `-`) instead of throwing `null` errors.

2. **Smooth Animations without Fixed Heights:**
   * *Challenge:* CSS cannot natively transition a `height: auto` property, making dropdowns (like the notes panel or table details) look choppy. Adding padding to hidden elements also caused text to "leak" out of collapsed rows.
   * *Solution:* Implemented an advanced CSS Grid trick using `grid-template-rows: 0fr` to `1fr`. I wrapped the content inside an inner `div` containing the padding, allowing for buttery-smooth layout shifts without layout breaking.

3. **Chart.js Memory Leaks & Data Syncing:**
   * *Challenge:* Every time the user filtered the table, the charts would redraw on top of each other, eventually lagging the browser. Furthermore, switching to Dark Mode while charts were rendering caused visual desyncs.
   * *Solution:* Added strict Chart instance tracking. Before calling `new Chart()`, the app checks if an instance exists and calls `chartInstance.destroy()`. I also bound the Chart re-render function directly to the CSS theme toggle event listener to ensure font colors update instantly.

## Screenshots

### Dark Mode & Advanced Filtering
![Dark Mode View](./images/dark-mode.png)

### Dynamic Chart Insights
![Insights View](./images/charts.png)

## How to Run Locally

### 1. Set up the Backend
1. Clone the repository: `git clone https://github.com/Rahul-Sai-Indeevar/dsa-tracker.git`
2. Open a terminal and navigate to the `backend` folder.
3. Create a virtual environment: `python -m venv venv`
4. Activate it: 
   * Windows: `venv\Scripts\activate`
   * Mac/Linux: `source venv/bin/activate`
5. Install dependencies: `pip install -r requirements.txt`
6. Create a `.env` file in the `backend` directory and add your PostgreSQL connection string: `DATABASE_URL=postgresql://user:password@host:5432/dbname` (Or use `sqlite:///./dsa_tracker.db` for local testing).
7. Start the server: `uvicorn main:app --reload` (Runs on `localhost:8000`)

### 2. Set up the Frontend
1. Open `script.js` and ensure `API_BASE_URL` is set to `http://localhost:8000/api`.
2. Open `index.html` in your web browser. 
3. Start logging problems!
---
*Built with ❤️ for the Software Engineering & Data Science grind.*