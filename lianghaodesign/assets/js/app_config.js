TM.configure({
  baseUrl: 'assets/js',
  debugEnabled: false,

  dependencies: {
    lh_admin: ['jquery'],
    lh_app: ['jquery']
  },

  modules: {
    lh_admin: 'lh_admin.js',
    lh_app: 'lh_site.js',
    jquery: 'http://code.jquery.com/jquery-1.11.0.min.js' // 'lib/jquery-1.11.0.js'
  },

  pages: {
    adminLogin: {
      controller: 'lh.controller.AdminLoginController',
      module: 'lh_admin'
    },
    loading: {
      controller: 'lh.controller.LoadingController',
      module: 'lh_app'
    },
    life: {
      controller: 'lh.controller.LifeController',
      module: 'lh_app'
    },
    work: {
      controller: 'lh.controller.WorkController',
      module: 'lh_app'
    }
  }
});