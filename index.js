import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import User from "./models/User.js";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import dotenv from "dotenv";
import MongoStore from "connect-mongo";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.set("trust proxy", 1); // ✅ Required for proper session handling on Render

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),

    cookie: {
      // this means 1000ms->1s and 60 min and 60 sec and 24 hrs..which means a complete day -> so cookie won't expire for a day and I go directly to my page without logging in for a day
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Connect to MongoDB with logging
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Passport local strategy
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const foundUser = await User.findOne({ email: username });
      if (!foundUser) {
        return cb(null, false, { message: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, foundUser.password);

      if (isMatch) {
        return cb(null, foundUser);
      } else {
        return cb(null, false, { message: "Incorrect password" });
      }
    } catch (err) {
      return cb(err);
    }
  })
);

// ✅ Google Oauth Integration middleware
passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/secret`,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log("Google Profile:", profile); // ✅ Log profile to debug
      try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return cb(null, existingUser);
        }

        const newUser = new User({
          email: profile.email,
          googleId: profile.id,
        });

        await newUser.save();
        return cb(null, newUser);
      } catch (err) {
        console.error("Google Strategy Error:", err);
        return cb(err);
      }
    }
  )
);

// Passport session management
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

// Routes
app.get("/", (req, res) => {
  res.render("home.ejs", { user: req.user });
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { user: req.user });
});

app.get("/register", (req, res) => {
  res.render("register.ejs", { user: req.user });
});

// Secret route
app.get("/secret", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const usersWithSecrets = await User.find({
        secret: { $exists: true, $ne: [] },
      });
      const allSecrets = usersWithSecrets.flatMap((user) => user.secret);

      res.render("secret.ejs", { secrets: allSecrets, user: req.user });
    } catch (err) {
      console.log(err);
      res.send("Error fetching secrets.");
    }
  } else {
    res.redirect("/login");
  }
});

// Google Oauth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secret",
  passport.authenticate("google", {
    successRedirect: "/submit", // ✅ changed from /secret to /submit
    failureRedirect: "/login",
  })
);

// Logout button
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

// User submits a secret
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

// POST: Submit secret
app.post("/submit", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  const secret = req.body.secret;
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      if (!user.secret) user.secret = [];
      user.secret.push(secret);
      await user.save();
      res.redirect("/secret");
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
    res.send("Error saving secret.");
  }
});

// POST: Register
app.post("/register", async (req, res) => {
  const email = req.body["username"];
  const password = req.body.password;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.send("Email already registered. Please log in.");
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ email, password: hash });
    await newUser.save();

    req.login(newUser, (err) => {
      if (err) {
        console.log("Login after register failed");
        return res.send("Something went wrong");
      }
      return res.redirect("/submit");
    });
  } catch (err) {
    console.error(err);
    res.send("Error registering user.");
  }
});

// POST: Login
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/submit",
    failureRedirect: "/login",
  })
);

// Global error logging
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
