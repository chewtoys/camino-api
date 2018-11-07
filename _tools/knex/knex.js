require('dotenv').config()
const { knexSnakeCaseMappers } = require('objection')

const connection = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
}

const knexConfig = {
  client: 'pg',
  connection,
  migrations: {
    directory: './_tools/knex/migrations'
  },
  seeds: {
    directory: './_tools/knex/seeds'
  },
  ...knexSnakeCaseMappers()
}

module.exports = knexConfig
