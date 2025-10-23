# StudyBuddy Pro

StudyBuddy Pro is a personal productivity and learning companion designed to help students focus, learn effectively, and stay motivated through gamification. This application features a local-first architecture, utilizing a React frontend and a Node.js Express backend with SQLite for data storage.

## Features

-   **Interactive Dashboard:** A personalized homepage displaying user stats like Coins, XP, and Study Streaks.
-   **Gamification:** Earn Coins and XP for completing tasks and Pomodoro sessions. Maintain a daily study streak.
-   **Configurable Pomodoro Timer:** A customizable Pomodoro timer to manage focus and break intervals, with rewards for completion.
-   **Task Manager:** A simple to-do list to keep track of study tasks.
-   **Smart Quizzes (Offline AI):** Generate multiple-choice quizzes from your notes using an intelligent, local-only algorithm.
-   **Smart Flashcards (Offline AI):** Create flashcards from your notes with automatically identified keywords and answers, powered by a local-only algorithm.
-   **Note Summarizer (Offline AI):** Get concise summaries of your notes using a local-only algorithm.
-   **User Authentication:** Secure user registration and login.
-   **Theme Toggle:** Switch between light and dark modes.
-   **User Profile Settings:** Customize your profile with a name and study goals.
-   **Enhanced UI:** A polished and professional user interface with a new theme and branding.

## Local Development Setup

To get StudyBuddy Pro running on your local machine, follow these steps:

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm (Node Package Manager)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd studybuddy-pro
```

### 2. Install Dependencies

Install dependencies for both the frontend and the backend.

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd studybuddy-pro-backend
npm install
cd .. # Go back to the root directory
```

### 3. Configure Backend Environment Variables

The backend requires a `.env` file for configuration. A template has been provided.

1.  Navigate to the backend directory:
    ```bash
    cd studybuddy-pro-backend
    ```
2.  Rename the example environment file:
    ```bash
    rename .env.example .env
    ```
3.  Open the newly renamed `.env` file and fill in the placeholder values:
    -   `JWT_SECRET`: A strong, random string for JWT token signing.
    -   `GOOGLE_CLIENT_ID`: Your Google Client ID for OAuth (if you plan to use Google Sign-In).
    -   `GOOGLE_GENAI_API_KEY`: This is no longer strictly needed for the offline AI, but if you want to re-integrate a cloud LLM in the future, you'd place it here. For now, you can leave it as a placeholder or remove it if you don't intend to use it.
    -   `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_ID`: These are for Firebase Admin SDK initialization. Even though we are using SQLite, the Google Sign-In still attempts to initialize Firebase Admin SDK. You will need to provide these from your Firebase project's service account JSON file. **Crucially, for `FIREBASE_PRIVATE_KEY`, ensure it's wrapped in double quotes with `\n` for newlines.**

    Example `.env` structure:
    ```env
    PORT=5000
    JWT_SECRET=your_jwt_secret_here
    GOOGLE_CLIENT_ID=your_google_client_id_here

    # Firebase Admin SDK credentials (required for Google Sign-In)
    FIREBASE_PROJECT_ID=your_firebase_project_id
    FIREBASE_PRIVATE_KEY_ID=your_private_key_id
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n"
    FIREBASE_CLIENT_EMAIL=your_client_email
    FIREBASE_CLIENT_ID=your_client_id

    # Google AI API Key (optional for offline AI)
    GOOGLE_GENAI_API_KEY=your_google_genai_api_key
    ```
4.  Go back to the root directory:
    ```bash
    cd ..
    ```

### 4. Configure Frontend Environment Variables

The frontend also requires a `.env` file for Firebase client-side configuration (for Google Sign-In).

1.  In the root directory (`studybuddy-pro`), create a file named `.env`.
2.  Fill it with your Firebase client-side configuration details. You can find these in your Firebase project settings under "Web app configuration."

    Example `.env` structure:
    ```env
    REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
    ```

### 5. Run the Application

You will need two separate terminal windows for this.

**Terminal 1: Start the Backend Server**

```bash
cd studybuddy-pro-backend
node server.js
```
Keep this terminal open and running. You should see messages like "Server running on port 5000" and "Connected to the SQLite database."

**Terminal 2: Start the Frontend Application**

```bash
cd .. # If you are still in studybuddy-pro-backend
npm start
```
This will open the application in your web browser (usually `http://localhost:3000`).

## Deployment

These instructions are for deploying the **frontend** of the application to GitHub Pages. The backend server cannot be hosted on GitHub Pages and must be deployed to a different service (like Heroku, Vercel, etc.).

### 1. Install `gh-pages`

```bash
npm install gh-pages --save-dev
```

### 2. Update `package.json`

Add the following two properties to your `package.json` file.

First, a `homepage` property. **Remember to replace `<your-github-username>` and `<your-repo-name>` with your actual details.**

```json
"homepage": "https://<your-github-username>.github.io/<your-repo-name>"
```

Second, add `predeploy` and `deploy` scripts inside the existing `scripts` object:

```json
"scripts": {
  // ... other scripts
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

### 3. Deploy the App

Run the deploy script from your project's root directory:

```bash
npm run deploy
```

This will build your application and push the contents of the `build` folder to a new `gh-pages` branch on your GitHub repository.

### 4. Configure GitHub Repository Settings

1.  Navigate to your repository on GitHub.
2.  Go to **Settings** > **Pages**.
3.  Under "Build and deployment", select **Deploy from a branch** as the source.
4.  Set the branch to **`gh-pages`** with the folder as **`/ (root)`**.
5.  Click **Save**.

Your site should be live at the `homepage` URL within a few minutes.