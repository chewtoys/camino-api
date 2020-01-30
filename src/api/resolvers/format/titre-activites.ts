import {
  ISections,
  ISectionsElement,
  IPeriodes,
  ITitresActivites,
  IUtilisateurs,
  ITrimestres,
  IMois,
  IAnnees
} from '../../../types'

import { permissionsCheck } from '../permissions/permissions-check'

const titreActiviteFormatFields = {
  periode: true,
  sections: true
}

// - ne conserve que les sections qui contiennent des élements
const titreSectionsFormat = (
  sections: ISections[],
  periode: IPeriodes,
  date: string
) =>
  sections.reduce((sections, s) => {
    const elements =
      s.elements &&
      s.elements.reduce((elements, e) => {
        // ne conserve que les éléments dont
        // - la période (si elle existe),
        // - la date de début et la date de fin
        // correspondent à l'élément
        if (
          (!e.frequencePeriodesIds ||
            e.frequencePeriodesIds.find(id => periode && periode.id === id)) &&
          (!e.dateFin || e.dateFin >= date) &&
          (!e.dateDebut || e.dateDebut < date)
        ) {
          elements.push(e)
        }

        return elements
      }, [] as ISectionsElement[])

    const section = {
      id: s.id,
      nom: s.nom,
      elements
    }

    if (section.elements?.length) {
      sections.push(section)
    }

    return sections
  }, [] as ISections[])

const titreActiviteFormat = (
  ta: ITitresActivites,
  user: IUtilisateurs,
  fields = titreActiviteFormatFields
) => {
  // si
  // - le formatage de la période est requis
  // - l'activité a une périodicité
  // - le type d'activité a une fréquence qui contient un tableau de périodes
  // alors la période de l'activité en cours est définie
  if (
    fields.periode &&
    ta.frequencePeriodeId &&
    ta.type.frequence &&
    ta.type.frequence.periodesNom &&
    ta.type.frequence[ta.type.frequence.periodesNom].length
  ) {
    ta.periode = ta.type.frequence[ta.type.frequence.periodesNom].find(
      p => p.id === ta.frequencePeriodeId
    ) as IAnnees | ITrimestres | IMois
  }

  // si les sections contiennent des élements sur cette activité
  if (fields.sections && ta.type.sections) {
    ta.sections = titreSectionsFormat(ta.type.sections, ta.periode, ta.date)
  }

  ta.editable =
    permissionsCheck(user, ['super', 'admin']) ||
    (permissionsCheck(user, ['entreprise']) && ta.statut.id !== 'dep')

  return ta
}

const titreActiviteCalc = (activites: ITitresActivites[], statutId: string) =>
  activites.reduce(
    (acc, activite) => (activite.statut.id === statutId ? ++acc : acc),
    0
  )

export { titreActiviteFormatFields, titreActiviteFormat, titreActiviteCalc }