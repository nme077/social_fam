const $ = require('jquery');
const axios = require('axios');

export default function groupSettings() {
    if(window.location.pathname === '/settings/group') {
        $('.group-settings-btn').addClass('active');

        $(".upload-button").on('click', function() {
            $(".file-upload").trigger('click');
         });

         $('#profilePhotoContainer').on('mouseenter', (e) => {
             $('.profilePhotoOptions').removeClass('d-none');
         });

         $('#profilePhotoContainer').on('mouseleave', (e) => {
            $('.profilePhotoOptions').addClass('d-none');
        });

        const photoUpload = document.querySelector('#photoUpload');

        photoUpload.onchange = (e) => {
            readURL(e.target);
        }

        function readURL(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
          
                reader.onload = function (e) {
                    $('#profilePicture').attr('src', e.target.result);

                    $('#photoUploadForm').trigger('submit');
                };

          
                reader.readAsDataURL(input.files[0]);
            }
          }


        const userInfoTextArr = document.querySelectorAll('.userInfoText');

         userInfoTextArr.forEach(el => {
             // Show edit icon
             el.addEventListener('mouseenter', e => {
                const childNodes = e.target.childNodes;

                childNodes.forEach(node => {
                    if(node.classList && node.classList.contains('editIcon')) {
                        if(!node.classList.contains('d-lg-inline')) {
                            node.classList.remove('d-none');
                            node.classList.add('d-lg-inline');
                        }
                    }
                });
             });
             // Hide edit icon
             el.addEventListener('mouseleave', e => {
                const childNodes = e.target.childNodes;

                childNodes.forEach(node => {
                    if(node.classList && node.classList.contains('editIcon')) {
                        if(node.classList.contains('d-lg-inline')) {
                            node.classList.add('d-none');
                            node.classList.remove('d-lg-inline');
                        }
                    }
                });
             });
         })
    }

    // Form triggers
    $('#deletePhotoBtn').on('click', (e) => {
        e.preventDefault();
        $('#deletePhotoForm').trigger('submit');
    });

    $('#sendInvite').on('click', (e) => {
        const form = document.querySelector('#inviteMemberEmail');

        if (form.checkValidity()) {
        // Loading
            $('#loadingSpinnerEmailInvite').removeClass('d-none');
            $('#emailInviteBtnTxt').addClass('d-none');
        }
        //$('#inviteMemberEmail').trigger('submit');
    });

    $('#deleteProfilePhoto').on('click', (e) => {
        e.preventDefault();
        $('#deleteProfilePhotoForm').trigger('submit');
    });


    // Handle generate invite link button
    $('#generateInviteBtn').on('click', (e) => {
        $('#loadingSpinnerInviteLink').removeClass('d-none');
        $('#generateInviteBtnTxt').addClass('d-none');
    });

    const inviteLink = document.querySelector('#inviteLink');

    if(inviteLink !== null) {
        inviteLink.onclick = function() {
            document.execCommand("copy");
        }

        inviteLink.addEventListener("copy", function(e) {
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.setData("text/plain", inviteLink.textContent);
                const successMessage = generateSuccessMessage('Invite link copied to clipboard');
                $(successMessage).insertBefore('footer');
                fadeOutFlashMessage();
            }
        });
    }

    // Handle fadeout of flash messages
    function fadeOutFlashMessage() {
        setTimeout(() => {
            $('.alert-container').fadeOut("slow")
        },10000);
    };

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
}