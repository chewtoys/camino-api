import PQueue from 'p-queue'

import dbToSpreadsheet from './db-to-spreadsheets'
import spreadsheetsTitres from './spreadsheets/titres'
import spreadsheetDocuments from './spreadsheets/documents'
import spreadsheetUtilisateurs from './spreadsheets/utilisateurs'
import spreadsheetActivites from './spreadsheets/titres-activites'
import spreadsheetAdministrations from './spreadsheets/administrations'
import spreadsheetEntreprises from './spreadsheets/entreprises'
import spreadsheetTerritoires from './spreadsheets/territoires'
import spreadsheetTravaux from './spreadsheets/titres-travaux'
import spreadsheetForets from './spreadsheets/forets'

const ssExport = async () => {
  try {
    console.info('Export en cours…')

    // construit un tableau de promesses avec
    // - les requête en base de données
    // - les appels à l'API Google Sheets
    const spreadsheetsPromises = [
      ...spreadsheetsTitres,
      spreadsheetDocuments,
      spreadsheetUtilisateurs,
      spreadsheetActivites,
      spreadsheetAdministrations,
      spreadsheetEntreprises,
      spreadsheetTerritoires,
      spreadsheetForets,
      spreadsheetTravaux
    ].map(({ id, name, get, tables }) => () =>
      dbToSpreadsheet({
        id,
        name,
        get,
        tables
      })
    )

    // utilise une queue plutôt que Promise.all
    // pour ne pas surcharger l'API de google
    const queue = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: 1000
    })

    await queue.addAll(spreadsheetsPromises)

    console.info('Export terminé')
  } catch (e) {
    console.error(e)

    throw e
  }
}

export default ssExport