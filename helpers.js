const getUserByEmail = (email, database) => {
  let emailArray = Object.values(database);
  //callback function to return truthy value for email
  return emailArray.find(user => email === user.email);
};


module.exports = {getUserByEmail};