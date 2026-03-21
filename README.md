# StudyOS 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-blue?logo=google-gemini)](https://deepmind.google/technologies/gemini/)

StudyOS is a powerful, all-in-one productivity and study management platform designed to help students and professionals focus, track their progress, and achieve their goals. It consists of a modern **Next.js Web Application** and a companion **Chrome Extension** for smart site blocking and session synchronization.

---

## ✨ Key Features

### 🌐 Web Application
- **Personal Dashboard**: Visualize your study sessions, focus time, and productivity trends.
- **Smart Planner**: Organize your tasks and schedule study sessions effortlessly.
- **Collaborative Rooms**: Join focus rooms to study with others or create your own categorized environments.
- **Detailed Analytics**: Gain insights into your habits with interactive charts and reports.
- **Gamified Leaderboard**: Compete with friends and the community to stay motivated.
- **AI Study Assistant**: Powered by Google's Gemini AI to help you understand complex topics and plan better.
- **Secure Authentication**: Robust login system integrated with Firebase.
- **Premium Features**: Integrated payments via Razorpay for advanced productivity tools.

### 🧩 Chrome Extension
- **Intelligent Site Blocking**: Automatically block distracting websites during active focus sessions.
- **Seamless Synchronization**: Real-time sync between your web app and extension using Firebase.
- **Quick-Access Popup**: Start/stop sessions and manage your blocklist directly from your browser toolbar.
- **Focus Mode**: A dedicated "Blocked" page to keep you grounded when you try to visit distracting sites.

---

## 🛠️ Tech Stack

### Frontend & App
- **Next.js 14**: Modern React framework for the web app.
- **Tailwind CSS**: Sleek, responsive design.
- **Framer Motion**: Smooth, interactive animations.
- **Lucide React**: Beautiful icons.
- **Recharts**: Data visualization for productivity stats.

### Backend & Cloud
- **Firebase**: 
  - **Authentication**: Secure user login.
  - **Firestore**: Scalable NoSQL database for user data.
  - **Realtime Database**: High-speed sync for focus sessions.
  - **Cloud Messaging**: Push notifications for study reminders.

### Tools & Services
- **Gemini AI**: AI-driven study assistance.
- **Mixpanel**: Advanced user analytics to improve the platform.
- **Sentry**: Real-time error monitoring and performance tracking.
- **Razorpay**: Secure payment gateway for premium subscriptions.

---

## 📁 Project Structure

```text
StudyOS/
├── Extension/          # Chrome Extension source code
│   └── extension/      # Manifest, backgrounds, and popup scripts
├── app/                # Next.js App Router (Pages & API routes)
├── components/         # Reusable React components
├── hooks/              # Custom React hooks (e.g., Extension Sync)
├── lib/                # Utility libraries and shared configurations
├── services/           # External service integrations (Firebase, AI)
├── public/             # Static assets and service workers
└── scripts/            # Build and maintenance scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- Firebase Account
- Google Cloud Project (for Gemini AI)

### 1. Web Application Setup


🌟 Live Demo: Check out the working application here: [StudyOS](https://study-os-zeta.vercel.app/)

### Local Setup
If you'd like to run the project locally on your machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/StudyOS.git](https://github.com/your-username/StudyOS.git)
   cd StudyOS

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/StudyOS.git
   cd StudyOS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   # Fill in your Firebase, Gemini, Mixpanel, and Sentry credentials
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

### 2. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `Extension/extension` folder from your local StudyOS directory.
5. The StudyOS icon should now appear in your extension bar!

---

## 🔒 Security & Rules

Ensure your Firebase security rules are set up correctly:
- **Firestore**: Use `firestore.rules`.
- **Realtime Database**: Use `database.rules.json`.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
