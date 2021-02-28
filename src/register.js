const $ = require('jquery');

export default function register() {
    if(window.location.pathname === '/register') {
        $('#register-btn').addClass('active');
    }
}