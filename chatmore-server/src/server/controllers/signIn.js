const dbCtrl = require('./dbCtrl.js')
function signin(req, res) {
  const { data, password } = req.body
  dbCtrl.userMatch(data, password, res)
}

module.exports = {
  signin
}