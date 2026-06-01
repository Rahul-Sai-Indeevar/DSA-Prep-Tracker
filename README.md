# DSA Prep Tracker

A high-performance, feature-rich dashboard built to track Data Structures and Algorithms (DSA) interview preparation. Designed to replace clunky Excel spreadsheets with a modern, analytics-driven workflow.

![Dashboard Preview](./images/dashboard-preview.png)

## The Motivation
While preparing for a 6-week Software Engineering Internship prep sprint, I realized tracking my progress in Google Sheets was inefficient and unmotivating. I needed a tool that not only logged my problems but provided actionable insights—like identifying weak topics, tracking average solve times by difficulty, and maintaining a daily streak. 

Instead of searching for a third-party app, I decided to build a custom solution tailored specifically for competitive programming and interview prep.

## Features
* **Smart Auto-Fill:** Paste a LeetCode or Codeforces URL, and the app instantly parses the problem name and platform.
* **Goal-Based Streak Tracking:** Calculates required daily problem limits based on user-defined Weekly or Monthly targets.
* **Advanced Multi-Filtering:** Instantly filter log history using a combination of Platform, Difficulty/Rating, Status, and **Multi-Tag** (`AND` logic) parameters.
* **Dynamic Analytics (Chart.js):** Real-time data visualization showing Difficulty Spread, Top 5 Practiced Tags, and Average Time per Difficulty/Rating.
* **Seamless State Management:** Full CRUD capabilities with LocalStorage persistence.
* **Responsive Dark/Light UI:** Modern CSS Grid layout with smooth collapsible accordion notes and native dark mode support.

## Tech Stack
* **Frontend:** HTML5, Semantic UI
* **Styling:** CSS3, CSS Grid, Flexbox, CSS Variables
* **Logic:** Vanilla JavaScript (ES6+), DOM Manipulation
* **Data Visualization:** Chart.js
* **Icons:** FontAwesome

## Struggles Encountered & Solutions
Building this application without a frontend framework (like React) required careful handling of the DOM and application state. Here are a few challenges I overcame:

1. **Complex UI State Bugs During Editing:** 
   * *Struggle:* When editing a previously logged problem, expanding the "Notes" section and then submitting would leave the UI in a broken state (e.g., the button said "Hide Notes" while the panel was closed).
   * *Solution:* Built a centralized `resetForm()` function that guarantees the DOM, hidden inputs, timer intervals, and UI toggles are strictly reset to their default states regardless of whether the user clicks "Save", "Update", or "Cancel".

2. **Smooth Animations without Fixed Heights:**
   * *Struggle:* CSS cannot natively transition a `height: auto` property, making dropdowns (like the notes panel or table details) look choppy.
   * *Solution:* Implemented an advanced CSS Grid trick using `grid-template-rows: 0fr` to `1fr`. This allowed for buttery-smooth animations while letting the browser naturally calculate the content height.

3. **Chart.js Memory Leaks & Overlaps:**
   * *Struggle:* Every time the user filtered the table, the charts would redraw on top of each other, eventually lagging the browser and causing visual glitches.
   * *Solution:* Added strict Chart instance tracking in JavaScript. Before calling `new Chart()`, the app checks if an instance exists and calls `chartInstance.destroy()` to safely clear the canvas context.

## Screenshots

### Dark Mode & Advanced Filtering
![Dark Mode View](./images/dark-mode.png)

### Dynamic Chart Insights
![Insights View](./images/charts.png)

## How to Run Locally
Because this project uses Vanilla JS and LocalStorage, there are no dependencies or build steps required!
1. Clone the repository: `git clone https://github.com/Rahul-Sai-Indeevar/dsa-tracker.git`
2. Open the folder.
3. Double click `index.html` to run it in your browser.

---
*Built with ❤️ for the internship grind.*