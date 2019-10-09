import * as dateFormat from 'dateformat'

import {
  geojsonFeatureMultiPolygon,
  geojsonFeatureCollectionPoints
} from '../../tools/geojson'

import { titreIsPublicCheck, titrePermissionCheck } from './_titre'

const titreEtapeFormatFields = {
  geojsonMultiPolygon: true,
  geojsonPoints: true,
  pays: true,
  sections: true
}

const titreDemarcheFormatFields = {
  etapes: titreEtapeFormatFields
}

const titreActiviteFormatFields = {
  periode: true,
  sections: true
}

const titreFormatFields = {
  surface: true,
  engagement: true,
  volume: true,
  geojsonMultiPolygon: true,
  geojsonPoints: true,
  pays: true,
  demarches: titreDemarcheFormatFields,
  activites: titreActiviteFormatFields,
  administrations: true
}

const titresFormat = (titres, user, fields = titreFormatFields) =>
  titres &&
  titres.reduce((acc, titre) => {
    const titreFormated = titreFormat(titre, user, fields)

    if (titreFormated) {
      acc.push(titreFormated)
    }

    return acc
  }, [])

// optimisation possible pour un expert SQL
// remplacer le contenu de ce fichier
// par des requêtes sql (dans /database/queries/titres)
// qui retournent les données directement formatées
const titreFormat = (t, user, fields = titreFormatFields) => {
  const titreIsPublic = titreIsPublicCheck(t)
  const userHasPermission = titrePermissionCheck(t, user, [
    'admin',
    'super',
    'editeur'
  ])

  if (!titreIsPublic && !userHasPermission) {
    return null
  }

  if (!userHasPermission) {
    t.activites = []
    t.activitesAbsentes = null
    t.activitesDeposees = null
    t.activitesEnConstruction = null
  }

  if (!fields) return t

  if (t.points && t.points.length) {
    if (fields.geojsonMultiPolygon) {
      t.geojsonMultiPolygon = geojsonFeatureMultiPolygon(t.points)
    }

    if (fields.geojsonPoints) {
      t.geojsonPoints = geojsonFeatureCollectionPoints(t.points)
    }
  }

  if (t.communes && t.communes.length && fields.pays) {
    t.pays = paysRegionsDepartementsCommunes(t.communes)
  }

  if (t.demarches && t.demarches.length && fields.demarches) {
    t.demarches = t.demarches.map(titreDemarche =>
      titreDemarcheFormat(titreDemarche, userHasPermission, fields.demarches)
    )
  }

  if (t.volumeEtape && fields.volume) {
    t.volume = t.volumeEtape.volume
  }

  if (t.engagementEtape && fields.engagement) {
    t.engagement = t.engagementEtape.engagement
  }

  if (t.surfaceEtape && fields.surface) {
    t.surface = t.surfaceEtape.surface
  }

  if (t.activites && t.activites.length && fields.activites) {
    t.activites = t.activites.map(titreActivite =>
      titreActiviteFormat(titreActivite, fields.activites)
    )
  }

  if (t.administrations && t.administrations.length && fields.administrations) {
    t.administrations.sort((a, b) => a.type.ordre - b.type.ordre)
  }

  return t
}

const paysRegionsDepartementsCommunes = communes => {
  const pays = communes.reduce((pays, commune) => {
    // "un pay", singulier de "des pays"
    let pay = pays.find(p => p.id === commune.departement.region.pays.id)

    if (!pay) {
      pay = {
        id: commune.departement.region.pays.id,
        nom: commune.departement.region.pays.nom,
        regions: []
      }
      pays.push(pay)
    }

    let region = pay.regions.find(r => r.id === commune.departement.region.id)

    if (!region) {
      region = {
        id: commune.departement.region.id,
        nom: commune.departement.region.nom,
        departements: []
      }
      pay.regions.push(region)
    }

    let departement = region.departements.find(
      d => d.id === commune.departement.id
    )

    if (!departement) {
      departement = {
        id: commune.departement.id,
        nom: commune.departement.nom,
        communes: []
      }
      region.departements.push(departement)
    }

    if (!departement.communes.find(c => c.id === commune.id)) {
      departement.communes.push({ id: commune.id, nom: commune.nom })
    }

    return pays
  }, [])

  // trie par ordre alphabétique
  pays.sort((a, b) => a.nom > b.nom)
  pays.forEach(p => {
    p.regions.sort((a, b) => (a.nom > b.nom ? 1 : -1))
    p.regions.forEach(r => {
      r.departements.sort((a, b) => (a.nom > b.nom ? 1 : -1))
      r.departements.forEach(d => {
        d.communes.sort((a, b) => (a.nom > b.nom ? 1 : -1))
      })
    })
  })

  return pays
}

const titreDemarcheFormat = (
  td,
  userHasPermission,
  fields = titreDemarcheFormatFields
) => {
  if (!fields) return td

  if (td.titreType.id && td.type && td.type.etapesTypes) {
    td.type.etapesTypes = td.type.etapesTypes.filter(
      e => e.typeId === td.titreType.id
    )
  }

  if (td.etapes && td.etapes.length && fields.etapes) {
    td.etapes = td.etapes.map(titreEtape =>
      titreEtapeFormat(titreEtape, userHasPermission, fields.etapes)
    )
  }

  return td
}

// - ne conserve que les sections qui contiennent des élements
const titreSectionsFormat = tea =>
  tea.type.sections.reduce((sections, s) => {
    const elements = s.elements.reduce((elements, e) => {
      // ne conserve que les éléments dont
      // - la période (si elle existe),
      // - la date de début et la date de fin
      // correspondent à l'activité
      if (
        (!e.frequencePeriodesIds ||
          e.frequencePeriodesIds.find(
            id => tea.periode && tea.periode.id === id
          )) &&
        (!e.dateFin || e.dateFin >= dateFormat(tea.date, 'yyyy-mm-dd')) &&
        (!e.dateDebut || e.dateDebut < dateFormat(tea.date, 'yyyy-mm-dd'))
      ) {
        elements.push(e)
      }

      return elements
    }, [])

    const section = {
      id: s.id,
      nom: s.nom,
      type: s.type,
      description: s.description,
      elements
    }

    if (section.elements.length) {
      sections.push(section)
    }

    return sections
  }, [])

const titreEtapeFormat = (
  te,
  userHasPermission,
  fields = titreEtapeFormatFields
) => {
  if (!fields) return te

  if (te.points && te.points.length) {
    if (fields.geojsonMultiPolygon) {
      te.geojsonMultiPolygon = geojsonFeatureMultiPolygon(te.points)
    }

    if (fields.geojsonPoints) {
      te.geojsonPoints = geojsonFeatureCollectionPoints(te.points)
    }
  }

  if (te.communes && te.communes.length && fields.pays) {
    te.pays = paysRegionsDepartementsCommunes(te.communes)
  }

  if (te.documents && !userHasPermission) {
    te.documents = te.documents.filter(ted => ted.public)
  }

  return te
}

const titreActiviteFormat = (ta, fields = titreActiviteFormatFields) => {
  // si
  // - le formatage de la période est requis
  // - l'activité a une périodicité
  // - le type d'activité a une fréquence qui contient un tableau de périodes
  // alors la période de l'activité en cours est définie
  if (
    fields.periode &&
    ta.frequencePeriodeId &&
    ta.type.frequence &&
    ta.type.frequence[ta.type.frequence.periodesNom] &&
    ta.type.frequence[ta.type.frequence.periodesNom].length
  ) {
    ta.periode = ta.type.frequence[ta.type.frequence.periodesNom].find(
      p => p.id === ta.frequencePeriodeId
    )
  }

  if (fields.sections && ta.type.sections) {
    // - les sections qui contiennent des élements sur cette activité
    ta.sections = titreSectionsFormat(ta)
  }

  return ta
}

export { titreFormat, titresFormat, titreActiviteFormat }