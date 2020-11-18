import consola from 'consola'
import fs from 'fs'
import { stringify } from './helpers'
const path = require('path')
const pathToRegexp = require('path-to-regexp')

const removePath = (name) => {
  if (fs.lstatSync(name).isDirectory()) {
    fs.rmdirSync(name)
  } else {
    fs.unlinkSync(name)
  }
}
const copyRecursive = (src, dest, remove = true) => {
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursive(path.join(src, childItemName),
        path.join(dest, childItemName), remove)
      if (remove) {
        removePath(path.join(src, childItemName))
      }
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

module.exports = function (moduleOptions) {
  const config = this.nuxt.options
  moduleOptions = {
    ...moduleOptions,
    ...config.staticGenerate
  }

  moduleOptions = parseModuleOptions(moduleOptions)
  moduleOptions = extendModuleOptions(moduleOptions)

  const router = config.router
  const distPath = config.generate.dir
  const tempDist = '__export_dist'

  function parseModuleOptions (options) {
    const defaults1 = {
      generateLanguages: ['ru'],
      redirectDefaultLang: true
    }
    options = Object.assign(defaults1, options)
    if (options.generateLanguages.length < 1) {
      throw new Error('At least one language should be configured.')
    }
    const defaults2 = {
      defaultLanguage: options.generateLanguages.find(e => !!e)
    }
    options = Object.assign(defaults2, options)
    if (!options.generateLanguages.includes(options.defaultLanguage)) {
      throw new Error(`Default language "${options.defaultLanguage}" must be included in list of languages.`)
    }
    return options
  }

  function extendModuleOptions (options) {
    let languagesExplicit = options.generateLanguages
    if (!options.redirectDefaultLang) {
      languagesExplicit = languagesExplicit.filter(lang => (lang !== options.defaultLanguage))
    }
    options.languagesExplicit = languagesExplicit

    return options
  }

  function addLangParamToRoute (path) {
    if (moduleOptions.languagesExplicit.length > 0) {
      const langs = moduleOptions.languagesExplicit.join('|')
      return `/:lang(${langs})?${path}`
    }

    return `/:lang?${path}`
  }

  function interpolateLangInRoute (path, payload) {
    const toPath = pathToRegexp.compile(path)
    const languageParamList = moduleOptions.languagesExplicit.concat(null)
    return languageParamList.map(prepareLanguageParam => {
      const languageParam = prepareLanguageParam === null
        ? moduleOptions.defaultLanguage
        : prepareLanguageParam
      return {
        route: toPath({ lang: languageParam }),
        payload: Object.assign({ lang: languageParam }, payload)
      }
    })
  }

  function flatRoutes (router, path = '', routes = []) {
    router.forEach(r => {
      if (r.children) {
        flatRoutes(r.children, path + r.path + '/', routes)
      } else {
        routes.push((r.path === '' && path[path.length - 1] === '/' ? path.slice(0, -1) : path) + r.path)
      }
    })
    return routes
  }

  this.nuxt.hook('export:distCopied', async generator => {
    consola.info('Копируем ресурсы')
    await copyRecursive(distPath, tempDist)
    consola.success('Ресурсы скопированы')
  })

  this.nuxt.hook('export:extendRoutes', function ({ routes }) {
    consola.info('Создаем пути для доступных языков')
    const routesToGenerate = []

    routes.forEach(route => {
      const routeWithLang = addLangParamToRoute(route.route)
      routesToGenerate.push(...interpolateLangInRoute(routeWithLang, route.payload))
    })

    let routesRouter = flatRoutes(router.routes)
    routesRouter = routesRouter.filter(route => {
      const tokens = pathToRegexp.parse(route)
      const params = tokens.filter(token => typeof token === 'object')
      return params.length === 1 && params[0].name === 'lang'
    })
    routesRouter.forEach(routeWithLang => {
      routesToGenerate.push(...interpolateLangInRoute(routeWithLang))
    })

    routes.splice(0, routes.length, ...routesToGenerate)
    consola.success('Пути созданы')
  })

  this.nuxt.hook('export:routeFailed', async (route, errors) => {
    const data = {
      route: route.route,
      errors: []
    }

    route.errors.map(el => {
      data.errors.push({
        type: String(el.type),
        description: String(el.error)
      })
    })

    const replaceRouteName = (route) => {
      return route.split('/').join('_')
    }
    const extraFilePath = path.join('dist', 'generate-error__' + replaceRouteName(route.route) + '.json')
    fs.writeFileSync(extraFilePath, stringify(data, null, 2), 'utf8', err => {
      if (err) return consola.warn('Ошибки генерации не записаны: ' + err)
    })
    consola.success('Записываем ошибки генерации')
  })

  this.nuxt.hook('export:done', async (generator, { errors }) => {
    consola.info('Копируем, то, что генерят модули')
    const defaultFiles = ['200.html'] //, '404.html', 'index.html'
    const copyFiles = [...defaultFiles, ...moduleOptions.requiredFilesModules]
    await copyFiles.map(file => {
      copyRecursive(path.join(distPath, file), path.join(tempDist, file))
      removePath(path.join(distPath, file))
    })
    consola.info('Копируем, payload')
    copyRecursive(path.join(distPath, '_nuxt'), path.join(tempDist, '_nuxt'))
    fs.rmdirSync(path.join(distPath, '_nuxt'))
    consola.success('Файлы модулей и payload скопированы')

    consola.info('Копируем в языковые папки')
    const languages = moduleOptions.generateLanguages
    const languagesLength = languages.length
    languages.map((lang, i) => {
      const needToRemove = languagesLength === i + 1
      copyRecursive(tempDist, path.join(distPath, lang), needToRemove)
      if (needToRemove) {
        fs.rmdirSync(tempDist)
      }
    })
    consola.success('Все готово!')
  })

  this.addTemplate({
    fileName: 'static-generate/helpers.js',
    src: path.resolve(__dirname, 'helpers.js')
  })

  this.addPlugin({
    fileName: 'static-generate/plugin.js',
    src: path.resolve(__dirname, 'plugin.js'),
    options: {
      ...moduleOptions
    }
  })
}

module.exports.meta = require('../../package.json')
