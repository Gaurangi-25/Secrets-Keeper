# 🔐 Secrets App

A secure web application that lets users anonymously share their secrets. Users can register, log in, and submit their secrets. The app also supports Google OAuth for quick login/signup.

---

## 🌟 Features

- User registration with email & password
- Secure authentication using Passport.js (Local & Google OAuth 2.0)
- Encrypted password storage using bcrypt
- Session handling with express-session
- Submit and view anonymous secrets
- Aesthetic UI with custom CSS

---

## 📦 Tech Stack

- **Frontend**: EJS templating, HTML, CSS
- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js (Local Strategy + Google OAuth 2.0)
- **Database**: MongoDB (Mongoose)
- **Security**: bcrypt hashing, sessions

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/secrets-app.git
cd secrets-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

### 4. Start MongoDB

Make sure MongoDB is running locally.

```bash
mongod
```

### 5. Start the server

```bash
npm start
```

The app should now be running at:  
📍 `http://localhost:3000`

---


## 🙌 Credits

Built with ❤️ using Node.js, Express, and Passport.js.
