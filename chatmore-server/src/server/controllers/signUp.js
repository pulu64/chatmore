const dbCtrl = require('./dbCtrl.js')
function signup(req, res) {
  const { username, password, email } = req.body
  dbCtrl.buildUser(username, password, email, res)
}

module.exports = {
  signup
}