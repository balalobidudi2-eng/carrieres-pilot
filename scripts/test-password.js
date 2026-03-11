const bcrypt = require('bcryptjs');

const hash = '$2b$12$98q9OiPMBuj3gebrGKlxG.36eGfMxv48McxYAhZ0XyZchdA.yZEp6';
bcrypt.compare('12345678', hash).then(ok => {
  console.log('Mot de passe "12345678" valide :', ok);
});
