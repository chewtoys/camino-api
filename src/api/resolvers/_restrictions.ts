import {
  IRestrictionsDomaines,
  IRestrictionsTypesAdministrations,
  IRestrictionsTypesStatuts,
  IRestrictionsTypesStatutsAdministrations,
  IRestrictionsEtapesTypes,
  IRestrictionsEtapesTypesAdministrations
} from '../../types'

import { debug } from '../../config/index'

import { typesGet, statutsGet } from '../../database/queries/metas'

import {
  restrictionsDomainesGet,
  restrictionsTypesAdministrationsGet,
  restrictionsTypesStatutsGet,
  restrictionsTypesStatutsAdministrationsGet,
  restrictionsEtapesTypesGet,
  restrictionsEtapesTypesAdministrationsGet
} from '../../database/queries/restrictions'

const restrictions = {
  domaines: [] as IRestrictionsDomaines[],
  typesAdministrations: [] as IRestrictionsTypesAdministrations[],
  typesStatuts: [] as IRestrictionsTypesStatuts[],
  statutIds: [] as string[],
  typesStatutsAdministrations: [] as IRestrictionsTypesStatutsAdministrations[],
  etapesTypes: [] as IRestrictionsEtapesTypes[],
  etapesTypesAdministrations: [] as IRestrictionsEtapesTypesAdministrations[]
}

const restrictionsInit = async () => {
  if (debug) return

  restrictions.domaines = await restrictionsDomainesGet()

  restrictions.typesAdministrations = await restrictionsTypesAdministrationsGet()

  restrictions.typesStatuts = await restrictionsTypesStatutsGet()

  const types = await typesGet()
  const statuts = await statutsGet()

  // calcule les statuts interdits pour tous les types
  // pour ne pas les afficher dans les filtres
  restrictions.statutIds = statuts.reduce((statutIds, statut) => {
    const typesRestricted = restrictions.typesStatuts.filter(
      t => t.statutId === statut.id && t.publicLectureInterdit
    )

    if (typesRestricted.length === types.length) {
      statutIds.push(statut.id)
    }

    return statutIds
  }, [] as string[])

  restrictions.typesStatutsAdministrations = await restrictionsTypesStatutsAdministrationsGet()

  restrictions.etapesTypes = await restrictionsEtapesTypesGet()

  restrictions.etapesTypesAdministrations = await restrictionsEtapesTypesAdministrationsGet()
}

export default restrictions

export { restrictionsInit }