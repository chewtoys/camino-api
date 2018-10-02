const titreDemarchesSortAsc = require('./titre-demarches-sort-asc')

// retourne l'ordre (index + 1) d'une démarche
const titreDemarcheOrdreFind = (titreDemarcheId, titreDemarches) => {
  // index de la démarche parmi les démarches classées
  const titreDemarcheIndex = titreDemarchesSortAsc(titreDemarches).findIndex(
    titreDemarche => titreDemarche.id === titreDemarcheId
  )

  return titreDemarcheIndex !== -1 ? titreDemarcheIndex + 1 : 0
}

module.exports = titreDemarcheOrdreFind
