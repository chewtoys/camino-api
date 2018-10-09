require('dotenv').config()
const bcrypt = require('bcrypt')
require('../postgres')
const { utilisateurAdd } = require('../postgres/queries/utilisateurs')

const password = process.env.ADMIN_PASSWORD

const utilisateur = {
  id: process.env.ADMIN_ID,
  email: process.env.ADMIN_EMAIL,
  permissions: [{ id: 'super' }]
}

const run = async () => {
  utilisateur.motDePasse = await bcrypt.hash(password, 10)
  await utilisateurAdd(utilisateur)
  console.log('Utilisateur créé')
  process.exit()
}

run()
