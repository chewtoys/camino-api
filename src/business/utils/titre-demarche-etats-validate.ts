// valide la date et la position de l'étape en fonction des autres étapes
import {
  ITitre,
  ITitreEtape,
  IDemarcheType,
  ITitreCondition
} from '../../types'

import { contenuConditionMatch } from '../../tools/index'
import {
  demarcheEtatsDefinitionGet,
  IEtapeTypeIdCondition,
  IEtapeTypeIdDefinition,
  IDemarcheEtatsDefinition
} from '../demarches-etats-definitions/demarches-etats-definitions'
import titreEtapesSortAscByDate from './titre-etapes-sort-asc-by-date'

const sameContenuCheck = (conditionTitre: ITitreCondition, titre: ITitre) =>
  conditionTitre.contenu &&
  Object.keys(conditionTitre.contenu).every(key =>
    contenuConditionMatch(
      conditionTitre.contenu[key],
      titre.contenu ? titre.contenu[key] : null
    )
  )

const titreEtapeTypeIdRestrictionsFind = (
  titreEtapeTypeIdRestrictions: IEtapeTypeIdDefinition[],
  etapeTypeId: string
) => {
  const restrictions = titreEtapeTypeIdRestrictions.find(restriction => {
    return restriction.etapeTypeId === etapeTypeId
  })

  if (restrictions) {
    return restrictions
  }

  throw new Error(
    `L’étape ${etapeTypeId} n’existe pas dans cet arbre d’instructions`
  )
}

const etapesEnAttenteGet = (
  etapeTypeIdDefinition: IEtapeTypeIdDefinition[],
  demarcheType: IDemarcheType,
  titreDemarcheEtapes: ITitreEtape[],
  titreTypeId: string
) => {
  const titreEtapesAscSort = titreEtapesSortAscByDate(
    titreDemarcheEtapes,
    demarcheType,
    titreTypeId
  )

  return etapesSuivantesEnAttenteGet(
    titreEtapesAscSort,
    titreEtapesAscSort,
    [],
    etapeTypeIdDefinition
  )
}

const etapesSuivantesEnAttenteGet = (
  titreDemarcheEtapes: ITitreEtape[],
  titreDemarcheEtapesSuivantes: ITitreEtape[],
  etapesEnAttente: ITitreEtape[],
  etapeTypeIdDefinitions: IEtapeTypeIdDefinition[]
): ITitreEtape[] => {
  if (!titreDemarcheEtapesSuivantes || !titreDemarcheEtapesSuivantes.length) {
    return etapesEnAttente
  }

  const etapeCourante = titreDemarcheEtapesSuivantes.slice(0, 1)[0]
  const etapesSuivantes = titreDemarcheEtapesSuivantes.slice(1)

  if (!etapesEnAttente || !etapesEnAttente.length) {
    return etapesSuivantesEnAttenteGet(
      titreDemarcheEtapes,
      etapesSuivantes,
      [etapeCourante],
      etapeTypeIdDefinitions
    )
  }

  const etapeCouranteConditions = etapeTypeIdDefinitions.find(
    definition => definition.etapeTypeId === etapeCourante.typeId
  ) as IEtapeTypeIdDefinition

  // on cherche quelles étapes en attente ont permis d’atteindre cette étape
  if (etapeCouranteConditions.justeApres) {
    etapesEnAttente.forEach(etape => {
      const predicatCheck = etapeCouranteConditions!
        .justeApres!.flat()
        .find(c => c?.etapeTypeId === etape.typeId)

      if (predicatCheck) {
        // si cette étape a permis d’atteindre l’étape courante, alors on la remplace dans les étapes en attente
        etapesEnAttente = etapesEnAttente.filter(e => {
          const etapeSeparationHas = etapeTypeIdDefinitions.find(
            definition =>
              definition.etapeTypeId === e.typeId && definition.separation
          )

          if (etapeSeparationHas) {
            return !etapeSeparationHas.separation!.includes(
              etapeCourante.typeId!
            )
          }

          return e.typeId !== etape.typeId
        })
      }
    })
  }
  if (etapeCouranteConditions.apres) {
    titreDemarcheEtapes.forEach(etape => {
      const predicatCheck = etapeCouranteConditions
        .apres!.flat()
        .find(c => c?.etapeTypeId === etape.typeId)

      if (predicatCheck) {
        if (
          (etapeCouranteConditions.justeApres.length &&
            etapeCouranteConditions.justeApres[0].length) ||
          !etapeCouranteConditions.final
        ) {
          etapesEnAttente = etapesEnAttente.filter(
            e =>
              !etapeCouranteConditions.justeApres
                .flatMap(d => d)
                .map(a => a.etapeTypeId)
                .includes(e.typeId!)
          )
        } else {
          // Si c’est une étape sans de « justeAprès », c’est que c’est une interruption de la démarche
          etapesEnAttente = []
        }
      }
    })
  }
  etapesEnAttente.push(etapeCourante)

  return etapesSuivantesEnAttenteGet(
    titreDemarcheEtapes,
    etapesSuivantes,
    etapesEnAttente,
    etapeTypeIdDefinitions
  )
}

const etapeTypeIdConditionsCheck = (
  titre: ITitre,
  titreDemarcheEtapes: ITitreEtape[],
  conditions: IEtapeTypeIdCondition[][]
) =>
  conditions.some(condition =>
    condition.every(c => {
      if (c.titre && !sameContenuCheck(c.titre, titre)) {
        return false
      }

      return titreDemarcheEtapes.find(etape => {
        let result = true

        if (c.etapeTypeId) {
          result = result && c.etapeTypeId === etape.typeId
        }
        if (c.statutId) {
          result = result && c.statutId === etape.statutId
        }

        return result
      })
    })
  )

const etapesEnAttenteToString = (titreEtapesEnAttente: ITitreEtape[]) =>
  titreEtapesEnAttente
    .map(t => (t.type ? t.type.nom : t.typeId))
    .map(t => `"${t}"`)
    .join(', ')

const titreEtapeTypeIdRestrictionsCheck = (
  etapeTypeIdDefinition: IEtapeTypeIdDefinition[],
  etapeTypeId: string,
  demarcheType: IDemarcheType,
  titreDemarcheEtapes: ITitreEtape[],
  titre: ITitre
) => {
  const errors = []
  const titreEtapesEnAttente = etapesEnAttenteGet(
    etapeTypeIdDefinition,
    demarcheType,
    titreDemarcheEtapes,
    titre.typeId
  )

  if (titreEtapesEnAttente.find(e => e.typeId === etapeTypeId)) {
    errors.push(
      `L’étape "${etapeTypeId}" ne peut-être effecutée 2 fois d’affilée`
    )
  }

  const titreEtapeRestrictions = titreEtapeTypeIdRestrictionsFind(
    etapeTypeIdDefinition,
    etapeTypeId
  )

  const { avant, apres, justeApres } = titreEtapeRestrictions

  if (
    !errors.length &&
    avant &&
    etapeTypeIdConditionsCheck(titre, titreDemarcheEtapes, avant)
  ) {
    errors.push(
      `L’étape "${etapeTypeId}" n’est plus possible après ${etapesEnAttenteToString(
        titreEtapesEnAttente
      )}`
    )
  }

  if (
    !errors.length &&
    apres &&
    !etapeTypeIdConditionsCheck(titre, titreDemarcheEtapes, apres)
  ) {
    errors.push(
      `L’étape "${etapeTypeId}" n’est pas possible après ${etapesEnAttenteToString(
        titreEtapesEnAttente
      )}`
    )
  }

  if (
    !errors.length &&
    justeApres.length &&
    !etapeTypeIdConditionsCheck(titre, titreEtapesEnAttente, justeApres)
  ) {
    errors.push(
      `L’étape "${etapeTypeId}" n’est pas possible juste après ${etapesEnAttenteToString(
        titreEtapesEnAttente
      )}`
    )
  }

  if (!errors.length) {
    if (!justeApres.length || justeApres.some(c => !c.length)) {
      if (titreDemarcheEtapes.map(e => e.typeId).includes(etapeTypeId)) {
        errors.push(`L’étape "${etapeTypeId}" existe déjà`)
      }
    }
  }

  return errors
}

const titreEtapesSortAsc = (
  titreEtapes: ITitreEtape[],
  restrictions: IEtapeTypeIdDefinition[]
) =>
  titreEtapes.slice().sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)

    if (dateA < dateB) return -1
    if (dateA > dateB) return 1

    // si les deux étapes ont la même date
    // on utilise l'arbre pour trouver quelle étape provoque l’autre
    const aRestriction = restrictions.find(r => r.etapeTypeId === a.typeId)

    if (
      aRestriction!.justeApres.flat(2).find(a => a?.etapeTypeId === b.typeId)
    ) {
      return 1
    }

    const bRestriction = restrictions.find(r => r.etapeTypeId === b.typeId)
    if (
      bRestriction!.justeApres.flat(2).find(b => b?.etapeTypeId === a.typeId)
    ) {
      return -1
    }

    return a.ordre! - b.ordre!
  })

const titreDemarcheEtatsValidate = (
  demarcheEtatsDefinition: IDemarcheEtatsDefinition,
  demarcheType: IDemarcheType,
  titreEtapes: ITitreEtape[],
  titre: ITitre
) => {
  // Si on tente d’insérer ou de modifier une étape, il faut regarder
  // qu’on puisse la mettre avec son nouveau etapeTypeId à la nouvelle date souhaitée
  // et que les étapes après celle-ci soient toujours possibles

  // Vérifie que toutes les étapes existent dans l’arbre
  const etapeTypeIdsValid = demarcheEtatsDefinition.restrictions.map(
    r => r.etapeTypeId
  )
  const etapeInconnue = titreEtapes.find(
    etape => !etapeTypeIdsValid.includes(etape.typeId!)
  )
  if (etapeInconnue) {
    return `L’étape ${etapeInconnue.typeId} n’existe pas dans l’arbre`
  }

  titreEtapes = titreEtapesSortAsc(
    titreEtapes,
    demarcheEtatsDefinition.restrictions
  )

  for (let i = 0; i < titreEtapes.length; i++) {
    const titreEtapeTypeIdErrors = titreEtapeTypeIdRestrictionsCheck(
      demarcheEtatsDefinition.restrictions,
      titreEtapes[i].typeId!,
      demarcheType,
      titreEtapes.slice(0, i),
      titre
    )

    if (titreEtapeTypeIdErrors.length) {
      return titreEtapeTypeIdErrors.join('\n')
    }
  }

  return null
}

const titreEtapeTypeIdValidate = (
  demarcheType: IDemarcheType,
  titreDemarcheEtapes: ITitreEtape[],
  titre: ITitre,
  titreEtape: ITitreEtape,
  supprimer = false
) => {
  const demarcheEtatsDefinition = demarcheEtatsDefinitionGet(
    titre.typeId,
    demarcheType.id
  )
  // pas de validation pour les démarches qui n'ont pas d'arbre d’instructions
  if (!demarcheEtatsDefinition) return null

  // pas de validation si la démarche est antérieure au 31 octobre 2019
  // pour ne pas bloquer l'édition du cadastre historique (moins complet)
  if (
    titreDemarcheEtapes.length &&
    titreDemarcheEtapes.reverse()[0].date < '2019-10-31'
  )
    return null

  if (!titreEtape.date) {
    titreEtape.date = '2300-01-01'
  }

  let titreEtapes = JSON.parse(
    JSON.stringify(titreDemarcheEtapes)
  ) as ITitreEtape[]

  // Si nous n’ajoutons pas une nouvelle étape
  if (titreEtape.id) {
    // On supprime l’étape en cours de modification ou de suppression
    titreEtapes = titreEtapes.filter(e => e.id !== titreEtape.id)
  }

  // Si nous ne sommes pas en cours de suppression de l’étape
  if (!supprimer) {
    // On ajoute la nouvelle étape à la démarche que l’on souhaite ajouter
    titreEtapes.push(titreEtape)
  }

  // On vérifie que la nouvelle démarche respecte son arbre d’instructions
  return titreDemarcheEtatsValidate(
    demarcheEtatsDefinition,
    demarcheType,
    titreEtapes,
    titre
  )
}

export {
  titreEtapeTypeIdValidate,
  etapesSuivantesEnAttenteGet,
  titreDemarcheEtatsValidate,
  titreEtapesSortAsc,
  titreEtapeTypeIdRestrictionsFind
}
