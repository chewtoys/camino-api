import { ITitreDemarche } from '../../types'
import PQueue from 'p-queue'

import { titreDemarcheUpdate } from '../../database/queries/titres-demarches'
import { titresGet } from '../../database/queries/titres'
import titreDemarchesSortAsc from '../utils/titre-elements-sort-asc'

const titresDemarchesOrdreUpdate = async (titresIds?: string[]) => {
  console.info()
  console.info('ordre des démarches…')

  const queue = new PQueue({ concurrency: 100 })

  const titres = await titresGet(
    { ids: titresIds },
    { fields: { demarches: { etapes: { id: {} } } } },
    'super'
  )

  const titresDemarchesIdsUpdated = [] as string[]

  titres.forEach(titre => {
    const titreDemarchesSorted = titreDemarchesSortAsc(
      titre.demarches!
    ) as ITitreDemarche[]

    titreDemarchesSorted.forEach(
      (titreDemarche: ITitreDemarche, index: number) => {
        if (titreDemarche.ordre !== index + 1) {
          queue.add(async () => {
            await titreDemarcheUpdate(
              titreDemarche.id,
              { ordre: index + 1 },
              { fields: { id: {} } },
              'super',
              titre
            )

            const log = {
              type: 'titre / démarche : ordre (mise à jour) ->',
              value: `${titreDemarche.id}: ${index + 1}`
            }

            console.info(log.type, log.value)

            titresDemarchesIdsUpdated.push(titreDemarche.id)
          })
        }
      }
    )
  })

  await queue.onIdle()

  return titresDemarchesIdsUpdated
}

export default titresDemarchesOrdreUpdate
