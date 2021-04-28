const $ = require('jquery');
const axios = require('axios');

export default function home() {
    if(window.location.pathname === '/posts') {
        // Add active class to page button in header
        $('.home-btn').addClass('active');
        
        // Handle file upload button
        $(".upload-button").on('click', function() {
            $(".file-upload").trigger('click');
         });

        // Update character count on input field
        $('#postText').on('input', (e) => {
            const charCount = $('#postText').val().length;
            
            $('#curCharCount').text(charCount)
        });

        // Handle fadeout of flash messages
        function fadeOutFlashMessage() {
            setTimeout(() => {
                $('.alert-container').fadeOut("slow")
            },10000);
        };

        // Photo upload preview
        const photoUpload = document.querySelector('#photoUpload');

        photoUpload.onchange = (e) => {
            readURL(e.target);
        }

        function readURL(input) {
            console.log(input.files)
            if (input.files && input.files[0]) {
                var reader = new FileReader();
          
                reader.onload = function (e) {
                    $('.image-preview').removeClass('d-none');
                    $('#photoPreview').attr('src', e.target.result);
                };

          
                reader.readAsDataURL(input.files[0]);
            }
          }

        function generateSuccessMessage(message) {
            return `
            <div class="col-md-4 col-sm-12 fixed-bottom alert-container">
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>	
            </div>`
        };

        function generateErrorMessage(message) {
            return `
            <div class="col-md-4 col-sm-12 fixed-bottom alert-container">
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>	
            </div>`
        }
    }
}