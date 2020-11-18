import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

const options = JSON.parse('<%= serialize(options) %>')

export default ({ app }) => {
  const defaultLocale = options.defaultLanguage
  const messages = {}
  options.generateLanguages.forEach(lang => {
    messages[lang] = require('~/locales/' + lang + '.json')
  })
  app.i18n = new VueI18n({
    locale: 'ru',
    fallbackLocale: defaultLocale,
    messages: Object.freeze(messages),
    silentTranslationWarn: true
  })

  Vue.use({
    install (app) {
      app.mixin({
        beforeMount () {
          if (this.$i18n.locale !== defaultLocale) {
            this.$route.params.lang = this.$i18n.locale
            if (Object.keys(this.$route.query).length > 0) {
              this.$route.query = { ...this.$route.query }
            }
          }
        },
        head () {
          if (!this.$route) {
            return
          }
          return {
            htmlAttrs: {
              lang: this.$i18n.locale
            }
          }
        }
      })
    }
  })
}
