const $ = require('jquery');
export default function login() {
    if(window.location.pathname === '/login') {
        $('#login-btn').addClass('active');
    }

    if(window.location.pathname === '/select_group') {
        const groupSelector = document.querySelector('#groupSelect');

        groupSelector.addEventListener('change', (e) => {
            if(e.target.value) {
                document.querySelector('#submitGroup').disabled = false;
            } else {
                document.querySelector('#submitGroup').disabled = true;
            }
        })
        }
}