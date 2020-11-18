import axios from 'axios'
import pkg from './package'
import sitemapOptions from './plugins/json/sitemapOptions'
import articlesRoutes from './plugins/json/articles/meta'
import clientsRoutes from './plugins/json/clients/meta'
import crmForBusinessRoutes from './plugins/json/crm-for-business/meta'
import updatesRoutes from './plugins/json/updates/updatesList'

const env = require('dotenv-flow').config({
  path: '../environments'
})

const siteMapData = {
  host: process.env.HOST_NAME,
  date: new Date().toISOString()
}

export default {
  env: {
    ...env.parsed,
    sectionBlogId: 2
  },
  server: {
    port: process.env.HOST_PORT
  },
  mode: 'universal',
  target: 'static',
  pageTransition: 'tweakOpacity',
  vue: {
    config: {
      ignoredElements: ['noindex']
    }
  },
  /*
  ** Headers of the page
  */
  head: {
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
      { hid: 'og:title', name: 'og:title', content: pkg.ogtitle },
      { name: 'google-site-verification', content: '7BujgsECawQKKB6ODzUyEy-7zwZ5BExcyJ4Wf14s4cw' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: '/upload/fonts/fontawesome/css/all.min.css', async: true }
    ]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: '~/components/elements/loading-bar.vue',

  /*
  ** Global CSS
  */
  css: [
    '~/assets/style/bootstrap/bootstrap.css',
    '~/assets/style/style.scss'
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    '~/plugins/api-context.js',
    '~/plugins/i18n.js',
    '~/plugins/directives.js',
    { src: '~/plugins/additional.js', ssr: false }
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    '@nuxtjs/sitemap',
    '@nuxtjs/markdownit',
    '@nuxtjs/sentry',
    '@nuxtjs/axios',
    'nuxt-webfontloader',
    '@nuxtjs/style-resources',
    '@/plugins/static-generate/module.js',
    [
      '@nuxtjs/yandex-metrika',
      {
        id: '62813944',
        webvisor: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true
      }
    ]
  ],

  buildModules: [
    '@nuxtjs/gtm',
    '@nuxtjs/moment',
    'nuxt-purgecss'
  ],

  staticGenerate: {
    generateLanguages: ['ru', 'ua', 'kz', 'by'],
    requiredFilesModules: ['sitemap.xml']
  },

  purgeCSS: {
    enabled: true,
    paths: [
      'components/**/*.vue',
      'layouts/**/*.vue',
      'pages/**/*.vue',
      'plugins/**/*.js'
    ],
    styleExtensions: ['.css'],
    extractors: () => [
      {
        extractor: content => content.match(/[\w-:/]+(?<!:)/g) || [],
        extensions: ['html', 'vue', 'js']
      }
    ]
  },

  moment: {
    locales: ['ru']
  },

  markdownit: {
    linkify: true,
    injected: true,
    html: true
  },

  gtm: {
    id: process.env.GTM_ID,
    scriptDefer: true,
    pageTracking: true
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
    config: {
      environment: process.env.SENTRY_ENVIRONMENT
    },
    clientIntegrations: {
      Vue: { attachProps: true }
    }
  },

  webfontloader: {
    events: false,
    google: {
      families: ['Roboto:400,500,600:cyrillic&display=swap']
    },
    timeout: 5000
  },

  styleResources: {
    scss: ['./assets/style/vars.scss']
  },

  /**
   * Генерируем статический контент в папку /front/dist
   */

  generate: {
    async routes () {
      const routes = []

      // await articlesRoutes.pages.map(page => routes.push('/news/articles/' + page.slug + '/'))
      // await clientsRoutes.pages.map(page => routes.push('/clients/' + page.slug + '/'))
      // await crmForBusinessRoutes.pages.map(page => routes.push('/crm-for-business/' + page.slug + '/'))
      // await updatesRoutes.pages.map(page => routes.push('/updates/' + page.link + '/'))
      // // Новости
      // await axios.get(siteMapData.host + '/adm/api/blog-posts/sitemap?siteId=1').then((res) => {
      //   res.data.map(page => routes.push('/news/' + page.catslug + '/'))
      //   res.data.map(page => routes.push('/news/' + page.catslug + '/' + page.slug + '/'))
      // }).catch((e) => {
      //   console.log(e.message)
      //   throw e
      // })
      // // Блог
      // await axios.get(siteMapData.host + '/adm/api/blog-posts/sitemap?siteId=2').then((res) => {
      //   res.data.map(page => routes.push('/blog/' + page.catslug + '/'))
      //   res.data.map(page => routes.push('/blog/' + page.catslug + '/' + page.slug + '/'))
      // }).catch((e) => {
      //   console.log(e.message)
      //   throw e
      // })
      return routes
    }
  },

  /*
   ** Генерируем карту сайта
   */
  sitemap: {
    hostname: siteMapData.host,
    cacheTime: 1000 * 60 * 15,
    exclude: sitemapOptions.excludes,
    defaults: {
      changefreq: 'daily',
      priority: 1,
      lastmodISO: siteMapData.date
    },
    async routes () {
      const newRoutes = []
      await sitemapOptions.pages.map((page) => {
        page.lastmodISO = siteMapData.date
        newRoutes.push(page)
      })

      await articlesRoutes.pages.map((page) => {
        newRoutes.push({
          url: '/news/articles/' + page.slug + '/',
          changefreq: 'daily',
          priority: 1,
          lastmodISO: siteMapData.date
        })
      })

      await clientsRoutes.pages.map((page) => {
        newRoutes.push({
          url: '/clients/' + page.slug + '/',
          changefreq: 'daily',
          priority: 1,
          lastmodISO: siteMapData.date
        })
      })

      await crmForBusinessRoutes.pages.map((page) => {
        newRoutes.push({
          url: '/crm-for-business/' + page.slug + '/',
          changefreq: 'daily',
          priority: 1,
          lastmodISO: siteMapData.date
        })
      })
      // Новости
      await axios.get(siteMapData.host + '/adm/api/blog-posts/sitemap?siteId=1').then((res) => {
        res.data.map((page) => {
          newRoutes.push({
            url: '/news/' + page.catslug + '/' + page.slug + '/',
            changefreq: 'daily',
            priority: 1,
            lastmodISO: siteMapData.date
          })
        })
      }).catch((e) => {
        console.log(e.message)
        throw e
      })
      // Блог
      await axios.get(siteMapData.host + '/adm/api/blog-posts/sitemap?siteId=2').then((res) => {
        res.data.map((page) => {
          newRoutes.push({
            url: '/blog/' + page.catslug + '/' + page.slug + '/',
            changefreq: 'daily',
            priority: 1,
            lastmodISO: siteMapData.date
          })
        })
      }).catch((e) => {
        console.log(e.message)
        throw e
      })

      return newRoutes
    }
  },

  render: {
    resourceHints: false
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    transpile: [
      'vue-lazy-hydration',
      'intersection-observer'
    ],
    optimizeCSS: true,
    extractCSS: true,
    filenames: {
      app: ({ isDev }) => isDev ? '[name].js' : 'js/[contenthash].js',
      chunk: ({ isDev }) => isDev ? '[name].js' : 'js/[contenthash].js',
      css: ({ isDev }) => isDev ? '[name].css' : 'css/[contenthash].css',
      img: ({ isDev }) => isDev ? '[path][name].[ext]' : 'upload/[contenthash:7].[ext]'
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.(css|vue|js)$/,
            chunks: 'all',
            enforce: true
          }
        }
      }
    },
    /*
    ** You can extend webpack config here
    */
    extend (config, { isDev, isClient }) {
      if (isClient && isDev) {
        config.optimization.splitChunks.maxSize = 51200
      }
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
      config.resolve.alias.vue = process.env.NODE_ENV === 'production' ? 'vue/dist/vue.min' : 'vue/dist/vue.js'
    },
    splitChunks: {
      layouts: true
    }
  }
}
