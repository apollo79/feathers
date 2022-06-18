import { generator, toFile, inject, before } from '@feathershq/pinion'
import { ConnectionGeneratorContext } from '../index'
import { getSource, renderSource } from '../../commons'

const template = ({}: ConnectionGeneratorContext) =>
  `import { MongoClient } from 'mongodb'
import type { Db } from 'mongodb'
import type { Application } from './declarations'

declare module './declarations' {
  interface Configuration {
    mongoClient: Promise<Db>
  }
}

export const mongodb = (app: Application) => {
  const connection = app.get('database')
  const database = connection.substring(connection.lastIndexOf('/') + 1)
  const mongoClient = MongoClient.connect(connection)
    .then(client => client.db(database))

  app.set('mongoClient', mongoClient)
}
`

const importTemplate = "import { mongodb } from './mongodb'"
const configureTemplate = 'app.configure(mongodb)'
const toAppFile = toFile<ConnectionGeneratorContext>(({ lib, language }) => [lib, `app.${language}`])

export const generate = (ctx: ConnectionGeneratorContext) =>
  generator(ctx)
    .then(
      renderSource(
        template,
        toFile<ConnectionGeneratorContext>(({ lib }) => lib, 'mongodb')
      )
    )
    .then(inject(getSource(importTemplate), before('import { services } from'), toAppFile))
    .then(inject(getSource(configureTemplate), before('app.configure(services)'), toAppFile))