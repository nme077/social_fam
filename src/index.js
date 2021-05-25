import 'bootstrap/dist/css/bootstrap.min.css';
import './main.scss'
const $ = require('jquery');
import 'bootstrap';
import 'popper.js';


import login from './login';
import register from './register';
import home from './posts';
import groupSettings from './groupSettings';
import app from './app';

//Document ready function
window.addEventListener('load', function() {
  // Bootstrap form validation
  (function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  })();

  // Fadeout flash messages
  setTimeout(() => {
    $('.alert-container').fadeOut("slow")
  },10000);
  
  // Run code from other js files
  login();
  register();
  home();
  groupSettings();
  app();

});