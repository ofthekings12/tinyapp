function generateRandomString() {
  var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < characters.length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result.slice(0, 6);
}


const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
app.use(cookieParser()); 

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW"
},
  "9sm5xK": {longURL: "http://www.google.com", userID: "bK59mX"}
};

const usersDatabase = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/*----------------
GET REQUESTS
---------------*/

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: usersDatabase[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: usersDatabase[req.cookies["user_id"]]  };
  if (!req.cookies["user_id"]) {
    res.redirect("/login", 403)
  } else {
  res.render("urls_new", templateVars);
}
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]){
    return res.status(403).send("Short URL doesnt exist!")
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: usersDatabase[req.cookies["user_id"]]};
  res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
const shortURL = req.params.shortURL
  res.redirect(`/urls/${shortURL}`)
});

app.get('/register', (req, res) => {
  const templateVars = { user: usersDatabase[req.cookies["user_id"]]  };
  res.render("urls_register", templateVars)
});

app.get('/login', (req, res) => {
  const templateVars = { user: usersDatabase[req.cookies["user_id"]] }
  res.render("urls_login", templateVars)
});

//POST REQUESTS

app.post('/register', (req, res) => {
  
  //extract user info
  const email = req.body.email;
  const password = req.body.password;
  
  if (email === "" || password === "") {
    res.status(400).send('Bad Request!');
    return;
  }

  for (let user in usersDatabase) {
    if (email === usersDatabase[user].email) {
      res.status(400).send('Email already registered. Try another email address!');
      return;
    }
    
  }

  //create a new user ID
  const userId = Math.random().toString(36).substr(2,8);

  const newUser = {
    id: userId, 
    email: email, 
    password: password,
  }
  
  //add user to db
  usersDatabase[userId] = newUser

  // set a cookie
  res.cookie('user_id', userId)

  //redirect to /urls
  res.redirect('/urls')

});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  for (let user in usersDatabase) {
    if (email === usersDatabase[user].email && password !== usersDatabase[user].password) {
      res.status(403).send("Incorrect password");
      return;
    }
    if (email === usersDatabase[user].email && password === usersDatabase[user].password) {
      res.cookie("user_id", usersDatabase[user].id);
      res.redirect("/urls")
      return;
    }
  }
  return res.status(403).send("Email not registered");
});

app.post("/logout", (req, res) => {
res.clearCookie("user_id");
res.redirect("/urls");
})

app.post("/urls", (req, res) => {
 const shortUrl = generateRandomString() 
 const longUrl = req.body.longURL
 const userID = req.cookies["user_id"]
 urlDatabase[shortUrl] = {longURL: longUrl, userID};
  res.redirect(`/urls/${shortUrl}`);
});


app.post("/urls/:shortURL", (req, res) => {
  shortURL = req.params.shortURL
  longUrl = req.body.newURL
  const userID = req.cookies["user_id"]
  urlDatabase[shortURL] = {longURL: longUrl, userID}
  res.redirect(`/urls/`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
const shortUrl = req.params.shortURL
delete urlDatabase[shortUrl];
  res.redirect("/urls");
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longUrl;
  if (!longURL) {
    return res.status(403).send("Short URL doesnt exist!")
  }
  res.redirect(longURL);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
