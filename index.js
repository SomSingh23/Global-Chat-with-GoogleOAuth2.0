require("dotenv").config();
let express = require("express");
let mongoose = require("mongoose");
let session = require("express-session");
let passport = require("passport");
let strategy = require("passport-local");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
let path = require("path");
let User = require("./models/user");
let app = express();
const MongoStore = require("connect-mongo");
let Quote = require("./models/quote");
let flash = require("connect-flash");
var findOrCreate = require("mongoose-findorcreate");
let moveNext = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("error", "You must be logged in to write anything 🧑‍💻");
    res.redirect("/login");
  }
};
mongoose
  .connect(process.env.CLOUD_DB)
  .then(() => {
    console.log("MongoDB");
  })
  .catch((err) => {
    console.log("Not connected");
  });
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl: process.env.CLOUD_DB,
    }),
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new strategy(User.authenticate()));
// ----------------------------------------------------------------
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
// ----------------------------------------------------------------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLINT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/path",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      User.findOrCreate(
        { googleId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);
app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);
app.get(
  "/auth/google/path",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to new.
    res.redirect("/new");
  }
);
app.get("/", async (req, res) => {
  let isLogedIn = false;

  if (req.user === undefined) isLogedIn = false;
  else isLogedIn = true;

  let data = await Quote.find({}).sort({ createdAt: -1 });
  res.render("home", { data, message: req.flash("success"), isLogedIn });
});
app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/new");
  }
  req.flash("error", "login failed"),
    res.render("login", { message: req.flash("error") });
});
app.post("/register", async (req, res) => {
  try {
    let { username, password, email } = req.body;
    let newUser = new User({ username, email });
    let data = await User.register(newUser, password);

    req.login(data, (err) => {
      if (err) {
        res.send(err.message);
      } else {
        req.flash("success", "Successfully registered and logged in");
        res.redirect("/new");
      }
    });
  } catch (err) {
    res.send(err.message);
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "login success");
    res.redirect("/new");
  }
);
app.get("/new", moveNext, (req, res) => {
  res.render("makeQuote", { message: req.flash("success") });
});
app.post("/new", moveNext, async (req, res) => {
  try {
    let data = new Quote({ quote: req.body.quote, author: req.user.username });
    await data.save();
    req.flash("success", "quote added successfully");
    res.redirect("/");
  } catch (err) {
    res.sendStatus(500);
  }
});
app.get("/logout", (req, res) => {
  res.render("logout");
});
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(400).send("error");
    } else {
      req.flash("success", "logout successfully");
      res.redirect("/");
    }
  });
});
app.get("*", moveNext, (req, res) => {
  res.sendStatus(404);
});
