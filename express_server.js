const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
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

const getUserByEmail = (email) => {
  let emailArray = Object.values(users);
  //callback function to return truthy value for email
  return emailArray.find(user => email === user.email);
};
const generateRandomString = () => {
  let shortUrl = [];
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i <= 5; i++) {
    shortUrl.push(characters.charAt(Math.floor(Math.random() * characters.length)));
  }
  return shortUrl.join('');
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//login page route
app.get("/login", (req, res) => {
  let  user = users[req.cookies["user_id"]];
  const templateVars = { id: req.params.id, longURL: urlDatabase, user: user};
  res.render("login", templateVars);
});

//post login route
app.post("/login" , (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!getUserByEmail(email) || password !== getUserByEmail(email).password) {
    res.status(403).send("Invalid email and/or password");
    return;
  }
  
  const userID = getUserByEmail(email).id;
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

//post logout route
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//register route
app.get("/register", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars =  {id: req.params.id, longURL: urlDatabase, user: user};
  res.render("register", templateVars);
});

//register post route
app.post("/register", (req, res) => {
  let id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (email.length === 0 || password.length === 0) {
    res.status(400).send("Invalid email and/or password");
    return;
  } else if (getUserByEmail(email)) {
    res.status(400).send("Email already exists");
    return;
  } else {
  
    users[id] = {id: id, email: email, password: password};
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});
//shortURL route
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);

});


app.get("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = { id: req.params.id, urls: urlDatabase, user: user};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = {user: user};
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = { id: req.params.id, longURL: urlDatabase, user: user};
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});


app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});





