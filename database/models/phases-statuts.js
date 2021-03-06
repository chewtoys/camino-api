const { Model } = require('objection')

class PhasesStatuts extends Model {
  static get tableName() {
    return 'phasesStatuts'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'nom', 'couleur'],

      properties: {
        id: { type: 'string', maxLength: 3 },
        nom: { type: 'string' },
        couleur: { type: 'string', maxLength: 8 }
      }
    }
  }
}

module.exports = PhasesStatuts
