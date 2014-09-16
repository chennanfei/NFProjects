TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    first: ['jquery']
  },

  modules: {
    first: 'lh-site-min.js',
    jquery: 'lib/jquery-1.11.0.js' // 'http://code.jquery.com/jquery-1.11.0.min.js'
  },

  pages: {
    loading: {
      controller: 'lh.controller.LoadingController',
      module: 'first'
    },
    life: {
      controller: 'lh.controller.LifeController',
      module: 'first'
    },
    work: {
      controller: 'lh.controller.WorkController',
      module: 'first'
    }
  }
});