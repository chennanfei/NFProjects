TM.declare('lh.controller.AdminLoginController').inherit('thinkmvc.Controller').extend({
  events: {
    'submit #loginForm': 'login'
  },

  selectors: {
    logID: 'input[name=logID]',
    pwd: 'input[name=password]'
  },

  login: function(event) {
    event.preventDefault();

    var el = this._el;
    this.U.createInstance('lh.model.Login', el.$logID.val(), el.$pwd.val()).doLogin();
  }
});

TM.declare('lh.model.Login').inherit('thinkmvc.Model').extend({
  viewPath: 'lh.view.LoginView',

  initialize: function(userID, password) {
    this.invoke('thinkmvc.Model:initialize');
    this._userID = userID;
    this._password = password;
  },

  doLogin: function() {
    var validator = this.U.createInstance('thinkmvc.val.Validator', this);
    if (validator.hasErrors()) {
      this.trigger('show-error', validator.getMessage());
      return;
    }

    this.trigger('redirect');
  },

  validate: function(validator) {
    if (this._userID !== 'admin' || this._password !== '123456') {
      validator.createError('login', 'Your user ID and password do not match!')
    }
  }
});

TM.declare('lh.view.LoginView').inherit('thinkmvc.View').extend({
  events: {
    'redirect': 'redirect',
    'show-error': 'showError'
  },

  selectors: {
    alert: '#loginAlert',
    btns: '.tm-button',
    logID: 'input[name=logID]'
  },

  redirect: function() {
    var el = this._el;
    el.$alert.hide();
    el.$btns.toggle();

    location.href = location.href.replace('admin_login', 'admin_temp');
  },

  showError: function(evt) {
    var el = this._el;
    el.$alert.html(evt.data).show();
    el.$logID.focus();
  }
});