const utilisateurs = {
  eager: '[permissions, administration, entreprise]',
  update: {
    relate: ['permissions', 'administration', 'entreprise'],
    unrelate: ['permissions', 'administration', 'entreprise']
  }
}

const administrations = {
  eager: `utilisateurs.permissions`
}

const entreprises = {
  eager: `utilisateurs.permissions`
}

const substances = {
  eager: `legales.[code, domaine]`
}

const points = {
  eager: `references`
}

const etapes = {
  eager: `[points.${points.eager}, type, statut, documents, substances.${
    substances.eager
  }, titresSubstances, titulaires.${
    entreprises.eager
  }, titresTitulaires, amodiataires.${
    entreprises.eager
  }, titresAmodiataires, administrations.${
    administrations.eager
  }, titresAdministrations, emprises, titresEmprises]`
}

const phases = {
  eager: 'statut'
}

const demarches = {
  eager: `[type, statut, phase.${phases.eager}, etapes(orderDesc).${
    etapes.eager
  }]`
}

const titres = {
  eager: `[type, domaine, statut, points, substances.${
    substances.eager
  }, titulaires.${entreprises.eager}, amodiataires.${
    entreprises.eager
  }, administrations.${administrations.eager}, demarches(orderDesc).${
    demarches.eager
  }, surfaceEtape, volumeEtape]`,
  update: {
    relate: ['type', 'domaine', 'statut', 'substances'],
    unrelate: ['type', 'domaine', 'statut', 'substances'],
    insertMissing: ['phases', 'phases.points']
  }
}

module.exports = {
  utilisateurs,
  phases,
  etapes,
  demarches,
  titres,
  substances,
  entreprises
}
