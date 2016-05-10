import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import serve from 'serve-static'
import open from 'open'
import chalk from 'chalk'
import { getConfig } from './config'
import hsr from './hsr'
import { log } from './emit'

const SAVED_STATES = {}

export default function (argv) {
  const app = express()
  app.use(bodyParser.json({ limit: '100mb' }))
  app.use(cors())

  const root = path.resolve(getConfig().output)

  app.post('/__hsr__', (req, res, next) => {
    const { state } = req.body
    const ts = Date.now()

    SAVED_STATES[ts] = state
    res.json({ ts })
  })

  app.get('/__hsr__/:ts', (req, res, next) => {
    const state = SAVED_STATES[req.params.ts]

    if (!state) {
      res.send()
    } else {
      res.json(state)
    }
  })

  app.use((req, res, next) => {
    if (!path.extname(req.url)) {
      req.url = '/index.html'
    }

    next()
  })

  app.use(serve(root))

  const port = process.env.PORT = argv.port || argv.p || getConfig().server.port
  const host = process.env.HOST = argv.host || argv.h || getConfig().server.host

  return new Promise((resolve, reject) => {
    app.listen(port, host, () => {
      const uri = `http://${host}:${port}`

      if (argv.o || argv.open) open(uri)
      log('running at', chalk.underline(uri))

      resolve(hsr())
    })
  })
}
