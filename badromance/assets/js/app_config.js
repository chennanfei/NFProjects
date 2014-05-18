TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    site: ['jquery', 'parallax']
  },

  modules: {
    parallax: 'lib/parallax-scroll-v2.js',
    jquery: 'lib/jquery-1.11.0.js', // 'http://code.jquery.com/jquery-1.11.0.min.js'
    site: 'br_site_v2.js'
  },

  pages: {
    loading: {
      controller: 'br.controller.MainController',
      module: 'site'
    }
  }
});