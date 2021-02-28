const $ = require('jquery');

export default function groupSettings() {
    if(window.location.pathname === '/settings/group') {
        $('#group-settings-btn').addClass('active');
    }
}