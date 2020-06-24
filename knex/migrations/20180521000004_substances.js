exports.up = knex => {
  return knex.schema
    .createTable('substancesLegalesCodes', table => {
      table.string('id').primary()
      table.string('nom')
      table.string('code').notNullable()
      table.text('description')
      table.string('lien').notNullable()
    })
    .createTable('substancesLegales', table => {
      table.string('id').primary()
      table.string('nom').notNullable()
      table
        .string('domaineId', 1)
        .notNullable()
        .index()
        .references('domaines.id')
      table.text('description')
      table
        .string('substanceLegaleCodeId')
        .index()
        .references('substancesLegalesCodes.id')
        .notNullable()
    })
    .createTable('substances', table => {
      table.string('id', 4).primary()
      table.string('nom').notNullable()
      table.string('symbole')
      table.integer('gerep')
      table.string('description', 2048)
    })
    .createTable('substances__substancesLegales', table => {
      table
        .string('substanceId')
        .index()
        .references('substances.id')
        .notNullable()
        .onDelete('CASCADE')
      table
        .string('substanceLegaleId')
        .index()
        .references('substancesLegales.id')
        .notNullable()
      table.primary(['substanceId', 'substanceLegaleId'])
    })
}

exports.down = knex => {
  return knex.schema
    .dropTable('substances__substancesLegales')
    .dropTable('substances')
    .dropTable('substancesLegales')
    .dropTable('substancesLegalesCodes')
}
