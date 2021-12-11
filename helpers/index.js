const getUserByEmail = function (email, usersDatabase) {
  const keys = Object.keys(usersDatabase);
  for (const key of keys) {
    const user = usersDatabase[key];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

const generateRandomString = function () {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < characters.length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.slice(0, 6);
};

const urlsForUser = function (id, urlDatabase) {
  const usersUrls = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      usersUrls[url] = urlDatabase[url];
    }
  }

  return usersUrls;
};


module.exports = {
    urlsForUser,
    generateRandomString,
    getUserByEmail
}