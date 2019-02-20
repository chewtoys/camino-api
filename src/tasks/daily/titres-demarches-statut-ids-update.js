import { titreDemarcheStatutIdUpdate } from '../titre-demarches'
import titreDemarcheStatutIdFind from '../_utils/titre-demarche-statut-id-find'

// met à jour le statut des démarches
const titresDemarchesUpdate = async (titresDemarches, titres) => {
  const titresDemarchesUpdated = titresDemarches
    .reduce((arr, titreDemarche) => {
      const titreTypeId = titres.find(t => t.id === titreDemarche.titreId)
        .typeId
      const statutId = titreDemarcheStatutIdFind(titreDemarche, titreTypeId)

      const titreDemarcheUpdated = titreDemarcheStatutIdUpdate(
        titreDemarche,
        statutId
      )

      return titreDemarcheUpdated ? [...arr, titreDemarcheUpdated] : arr
    }, [])
    .map(q => q.then(log => console.log(log)))

  await Promise.all(titresDemarchesUpdated)

  return `Mise à jour: ${titresDemarchesUpdated.length} statuts de démarches.`
}

export default titresDemarchesUpdate
