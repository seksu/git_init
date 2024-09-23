const path = require('path');

module.exports = {
  test: {
    dialect: 'sqlite',
    // storage: ':memory:',
    storage: path.join(__dirname, '../database.sqlite'),
  },
};
