import { Model, Pojo, QueryContext, RelationMappings } from 'objection'
import { join } from 'path'
import { paysFormat } from './_format'
import Administrations from './administrations'
import Communes from './communes'
import Devises from './devises'
import Domaines from './domaines'
import Entreprises from './entreprises'
import Pays from './pays'
import Statuts from './statuts'
import Substances from './substances'
import TitresActivites from './titres-activites'
import TitresDemarches from './titres-demarches'
import TitresEtapes from './titres-etapes'
import TitresPoints from './titres-points'
import TitresReferences from './titres-references'
import Types from './types'
import Unites from './unites'

import { ITitres } from '../../types'

interface Titres extends ITitres {}

class Titres extends Model {
  public static tableName = 'titres'

  public static jsonSchema = {
    type: 'object',
    required: ['id', 'nom', 'domaineId', 'typeId'],
    properties: {
      id: { type: 'string' },
      nom: { type: 'string' },
      domaineId: { type: 'string', maxLength: 1 },
      typeId: { type: 'string', maxLength: 3 },
      statutId: { type: 'string', maxLength: 3 },
      dateDebut: { type: ['string', 'null'] },
      dateFin: { type: ['string', 'null'] },
      dateDemande: { type: ['string', 'null'] },
      activitesDeposees: { type: ['number', 'null'] },
      activitesEnConstruction: { type: ['number', 'null'] },
      activitesAbsentes: { type: ['number', 'null'] },
      substancesTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      pointsTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      titulairesTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      amodiatairesTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      administrationsTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      surfaceTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      volumeTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      volumeUniteIdTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      communesTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      engagementTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      },
      engagementDeviseIdTitreEtapeId: {
        type: ['string', 'null'],
        maxLength: 128
      }
    }
  }

  public static relationMappings = (): RelationMappings => ({
    domaine: {
      relation: Model.BelongsToOneRelation,
      modelClass: Domaines,
      join: { from: 'titres.domaineId', to: 'domaines.id' }
    },

    type: {
      relation: Model.BelongsToOneRelation,
      modelClass: Types,
      join: { from: 'titres.typeId', to: 'types.id' }
    },

    statut: {
      relation: Model.BelongsToOneRelation,
      modelClass: Statuts,
      join: { from: 'titres.statutId', to: 'statuts.id' }
    },

    demarches: {
      relation: Model.HasManyRelation,
      modelClass: TitresDemarches,
      join: { from: 'titres.id', to: 'titresDemarches.titreId' }
    },

    surfaceEtape: {
      relation: Model.BelongsToOneRelation,
      modelClass: TitresEtapes,
      join: {
        from: 'titres.surfaceTitreEtapeId',
        to: 'titresEtapes.id'
      },
      modify: builder => builder.select('surface')
    },

    volumeEtape: {
      relation: Model.BelongsToOneRelation,
      modelClass: TitresEtapes,
      join: {
        from: 'titres.volumeTitreEtapeId',
        to: 'titresEtapes.id'
      },
      modify: builder => builder.select('volume')
    },

    volumeUnite: {
      relation: Model.HasOneThroughRelation,
      modelClass: Unites,
      join: {
        from: 'titres.volumeUniteIdTitreEtapeId',
        through: {
          from: 'titresEtapes.id',
          to: 'titresEtapes.volumeUniteId'
        },
        to: 'unites.id'
      }
    },

    engagementEtape: {
      relation: Model.BelongsToOneRelation,
      modelClass: TitresEtapes,
      join: {
        from: 'titres.engagementTitreEtapeId',
        to: 'titresEtapes.id'
      },
      modify: builder => builder.select('engagement')
    },

    engagementDevise: {
      relation: Model.HasOneThroughRelation,
      modelClass: Devises,
      join: {
        from: 'titres.engagementDeviseIdTitreEtapeId',
        through: {
          from: 'titresEtapes.id',
          to: 'titresEtapes.engagementDeviseId'
        },
        to: 'devises.id'
      }
    },

    substances: {
      relation: Model.ManyToManyRelation,
      modelClass: Substances,
      join: {
        from: 'titres.substancesTitreEtapeId',
        through: {
          from: 'titresSubstances.titreEtapeId',
          to: 'titresSubstances.substanceId',
          extra: ['ordre', 'connexe']
        },
        to: 'substances.id'
      }
    },

    points: {
      relation: Model.HasManyRelation,
      modelClass: TitresPoints,
      join: {
        from: 'titres.pointsTitreEtapeId',
        to: 'titresPoints.titreEtapeId'
      }
    },

    titulaires: {
      relation: Model.ManyToManyRelation,
      modelClass: Entreprises,
      join: {
        from: 'titres.titulairesTitreEtapeId',
        through: {
          from: 'titresTitulaires.titreEtapeId',
          to: 'titresTitulaires.entrepriseId',
          extra: ['operateur']
        },
        to: 'entreprises.id'
      }
    },

    amodiataires: {
      relation: Model.ManyToManyRelation,
      modelClass: Entreprises,
      join: {
        from: 'titres.amodiatairesTitreEtapeId',
        through: {
          from: 'titresAmodiataires.titreEtapeId',
          to: 'titresAmodiataires.entrepriseId',
          extra: ['operateur']
        },
        to: 'entreprises.id'
      }
    },

    administrationsGestionnaires: {
      relation: Model.ManyToManyRelation,
      modelClass: Administrations,
      join: {
        from: 'titres.id',
        through: {
          from: 'titresAdministrationsGestionnaires.titreId',
          to: 'titresAdministrationsGestionnaires.administrationId',
          extra: ['associee']
        },
        to: 'administrations.id'
      }
    },

    administrationsLocales: {
      relation: Model.ManyToManyRelation,
      modelClass: Administrations,
      join: {
        from: 'titres.administrationsTitreEtapeId',
        through: {
          from: 'titresAdministrationsLocales.titreEtapeId',
          to: 'titresAdministrationsLocales.administrationId',
          extra: ['associee', 'coordinateur']
        },
        to: 'administrations.id'
      }
    },

    communes: {
      relation: Model.ManyToManyRelation,
      modelClass: Communes,
      join: {
        from: 'titres.communesTitreEtapeId',
        through: {
          from: 'titresCommunes.titreEtapeId',
          to: 'titresCommunes.communeId',
          extra: ['surface']
        },
        to: 'communes.id'
      }
    },

    activites: {
      relation: Model.HasManyRelation,
      modelClass: join(__dirname, 'titres-activites'),
      join: { from: 'titres.id', to: 'titresActivites.titreId' }
    },

    references: {
      relation: Model.HasManyRelation,
      modelClass: TitresReferences,
      join: { from: 'titres.id', to: 'titresReferences.titreId' }
    }
  })

  public $parseDatabaseJson(json: Pojo) {
    json = super.$parseDatabaseJson(json)
    json.pays = paysFormat(json.communes)

    return json
  }

  public $formatDatabaseJson(json: Pojo) {
    json = super.$formatDatabaseJson(json)

    if (!json.id && json.domaineId && json.typeId && json.nom) {
      json.id = `${json.domaineId}-${json.typeId}-${json.nom}-9999`
    }

    delete json.geojsonMultiPolygon
    delete json.geojsonPoints
    delete json.pays
    delete json.engagement
    delete json.surface
    delete json.volume
    delete json.engagementEtape
    delete json.surfaceEtape
    delete json.volumeEtape

    return json
  }
}

export default Titres