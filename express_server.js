const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const {getUserByEmail} = require("./helpers");
const bcrypt = require("bcryptjs");
const morgan = require("morgan");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["user_id"],
  maxAge: 24 * 60 * 60 * 1000 //24 hours
}));
app.use(morgan("dev"));


const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  }
};

const users = {

  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$a2tKIupQkbDQYgqez.74WeOmdVCLRzlCOYWz67C8foVi0neAWukvu",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$.iH/l7cgWl7ov/uuBkQIHedhvlJXIk8RVIaB0yWgUDTytvY0xWgkq",
  },
};


const generateRandomString = () => {
  let shortUrl = [];
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i <= 5; i++) {
    shortUrl.push(characters.charAt(Math.floor(Math.random() * characters.length)));
  }
  return shortUrl.join('');
};


const loginCheck = (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    
  }
  return true;
};


const urlsForUser = (userID) => {
  let urlArray = Object.entries(urlDatabase);
  urlArray = urlArray.filter(url => userID === url[1].userID);
  let userObj = {};
  for (const url of urlArray) {
    userObj[url[0]] = url[1];
  }
  return userObj;
};




app.get("/", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//login page route
app.get("/login", (req, res) => {
  let  user = users[req.session.user_id];
  const templateVars = {user: user};
  res.render("login", templateVars);
});

//post login route
app.post("/login" , (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!getUserByEmail(email, users) || !bcrypt.compareSync(password, getUserByEmail(email, users).password)) {
    res.status(403).send("Invalid email and/or password");
    return;
  }
  
  const userID = getUserByEmail(email, users).id;
  req.session.user_id = userID;
  res.redirect("/urls");
});

//post logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//register route
app.get("/register", (req, res) => {
  let user = users[req.session.user_id];
  const templateVars =  {id: req.params.id, longURL: urlDatabase[req.params.id], user: user};
  res.render("register", templateVars);
});

//register post route
app.post("/register", (req, res) => {
  let id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email.length === 0 || password.length === 0) {
    res.status(400).send("Invalid email and/or password");
    return;
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("Email already exists");
    return;
  } else {
  
    users[id] = {id: id, email: email, password: hashedPassword};
    req.session.user_id = id;
    res.redirect("/urls");
  }
});
//shortURL route
app.post("/urls", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }

  console.log(req.body); // Log the POST request body to the console
  let id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${id}`);

});


app.get("/urls", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }

  let user = users[req.session.user_id];
  let urls = urlsForUser(req.session.user_id);
  const templateVars = { longURL: urls, user: user};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }
  let user = users[req.session.user_id];
  const templateVars = {user: user};
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }
  let user = users[req.session.user_id];
  if (!urlsForUser(req.session.user_id)[req.params.id]) {
    res.status(406).send("This url is invalid. Please go back!");
  }
 
  let url = urlDatabase[req.params.id];
  let longURL = url.longURL;
  const templateVars = { longURL: longURL, id: req.params.id, user: user};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {

  const longURL = urlDatabase[req.params.id];
  if (longURL  === undefined) {
    res.status(404).send("no short url");
  }
  res.redirect(longURL.longURL);

});


app.post("/urls/:id", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }
  
  let longURL = urlDatabase[req.params.id];
  longURL.longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!loginCheck(req, res)) {
    res.redirect("/login");
  }
  if (!urlsForUser(req.session.user_id)[req.params.id]) {
    res.status(406).send("Cannot Delete. This url is invalid. Please go back!");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/urls/:id/delete", (req, res) => {
  if (!loginCheck(req, res)) {
    res.status(407).send("Cannot Delete. Please log in");
  }
  if (!urlsForUser(req.session.user_id)[req.params.id]) {
    res.status(406).send("Cannot Delete. This url is invalid. Please go back!");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


