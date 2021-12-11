const bcrypt = require("bcryptjs");

const helpers = require("./helpers");
const { getUserByEmail, generateRandomString, urlsForUser } = helpers;
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieSession = require("cookie-session");
app.use(cookieSession({ keys: ["password"] }));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "bK59mX" },
};

const usersDatabase = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// GET REQUESTS THAT HAVE NO REAL FUNCTION/PURPOSE BUT COMPASS TOLD US TO
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


/*----------------
GET REQUESTS
---------------*/

//GET REQUEST TO VIEW URL HOME PAGE
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
// users can only view their own created urls
  let usersUrls = urlsForUser(req.session["user_id"], urlDatabase);

  const templateVars = {
    urls: usersUrls,
    user: usersDatabase[req.session["user_id"]],
  };

  res.render("urls_index", templateVars);
});

//GET REQUEST TO VIEW "CREATE NEW URL PAGE"
app.get("/urls/new", (req, res) => {
  const templateVars = { user: usersDatabase[req.session["user_id"]] };
  // only registered/logged in users can create a new url
  if (!req.session["user_id"]) {
    res.redirect(403, "/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//GET REQUEST TO VIEW PAGE WITH NEWLY CREATED URL
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(403).send("🙅‍♂️Short URL doesn't exist!🙅‍♂️");
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: usersDatabase[req.session["user_id"]],
  };
  res.render("urls_show", templateVars);
});

// GET REQUEST FOR WHEN SHORT URL IS CREATED FROM CREATE PAGE
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// GET REQUEST TO VIEW REGISTRATION PAGE
app.get("/register", (req, res) => {
  const templateVars = { user: usersDatabase[req.session["user_id"]] };

  res.render("urls_register", templateVars);
});

// GET REQUEST TO VIEW LOGIN PAGE
app.get("/login", (req, res) => {
  const templateVars = { user: usersDatabase[req.session["user_id"]] };
  res.render("urls_login", templateVars);
});

//POST REQUESTS

/////REGISTER POST REQUEST
app.post("/register", (req, res) => {
  //extract user info
  const email = req.body.email;
  const password = req.body.password;
  const encryptedPassword = bcrypt.hashSync(password);
  // register form logic/error messages
  if (email === "" || password === "") {
    res.status(400).send("🤮Bad Request!🤮");
    return;
  }
  for (let user in usersDatabase) {
    if (email === usersDatabase[user].email) {
      res
        .status(400)
        .send("🙅‍♂️Email already registered. Try another email address!🙅‍♂️");
      return;
    }
  }
  //create a new user ID
  const userId = Math.random().toString(36).substr(2, 8);
  const newUser = {
    id: userId,
    email: email,
    password: encryptedPassword,
  };
  //add user to db
  usersDatabase[userId] = newUser;
  req.session["user_id"] = userId;
  // set a cookie
  res.cookie("user_id", userId);
  //redirect to /urls
  res.redirect("/urls");
});

////LOGIN POST REQUEST
app.post("/login", (req, res) => {
  //extract user info
  const email = req.body.email;
  const password = req.body.password;

  //password encryption and login form logic
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send("🤷🏽‍♂️Cannot leave fields empty🤷🏽‍♂️");
  }
  let user = getUserByEmail(email, usersDatabase);

  if (!user) {
    return res.status(403).send("🧐User Not Found🧐");
  }
  if (user) {
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(403).send("🤨Email or Password does not match records🤨");
    }
  }
  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

///LOGOUT POST REQUEST
app.post("/logout", (req, res) => {
  ///upon logout delete cookies and redirect to home page
  req.session = null;
  res.redirect("/urls");
});

/// POST REQUEST FOR WHEN NEW SHORTURL IS CREATED AND USER's URL DATABASE UPDATES TO SHOW NEW URL
app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString();
  const longUrl = req.body.longURL;
  const userID = req.session["user_id"];
  urlDatabase[shortUrl] = { longURL: longUrl, userID };
  res.redirect(`/urls/${shortUrl}`);
});

//POST REQUEST FOR NEWLY CREATED URLS
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session["user_id"];
/// permission logic/error codes
  if (!userId) {
    res.status(403).send("😬You must be logged in to edit urls...😬");
    return;
  } else {
    if (urlDatabase[req.params.shortURL].userID !== userId) {
      res.status(403).send("👀Users can only edit their own urls.👀");
      return;
    }
    ///DISPLAYS NEWLY CREATED SHORTURL BY USER
    shortURL = req.params.shortURL;
    longUrl = req.body.newURL;
    const userID = req.session["user_id"];
    urlDatabase[shortURL] = { longURL: longUrl, userID };
    res.redirect(`/urls/`);
  }
});

// POST REQUEST TO DELETE URLS
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session["user_id"];
/// more permission logic/error codes
  if (!userId) {
    res.status(403).send("😤You must be logged in to delete urls...😤");
    return;
  } else {
    if (urlDatabase[req.params.shortURL].userID !== userId) {
      res.status(403).send("😮‍💨Users can only delete their own urls.😮‍💨");
      return;
    }
    const shortUrl = req.params.shortURL;
    delete urlDatabase[shortUrl];
    res.redirect("/urls");
  }
});

//POST REQUEST FOR NON-EXISTANT/INVALID SHORTURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longUrl;
  //error code logic
  if (!longURL) {
    return res.status(403).send("😧Short URL doesnt exist!😧");
  }
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
