const bcrypt = require('bcryptjs')
function encryption(e) {
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(e, salt)
  return hash;
}

function verification(e, hash) {
  return bcrypt.compareSync(e, hash);
}

module.exports = {
  encryption, verification
}