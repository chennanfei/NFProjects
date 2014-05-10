TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    site: ['jquery']
  },

  modules: {
    site: 'br_site.js',
    jquery: 'lib/jquery-1.11.0.js' // 'http://code.jquery.com/jquery-1.11.0.min.js'
  },

  pages: {
    loading: {
      controller: 'br.controller.MainController',
      module: 'site'
    }
  }
});