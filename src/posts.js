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

         // Handle post text submission
         $('#submitPostText').on('click', (e) => {
            e.preventDefault();
            $('.postFormContainer').trigger('submit');
         });

        // ID to use when submitting update form
        let typeOfForm = '';
        let postId = '';
        let commentId = '';
        
        // Update character count on input field
        $('#postText').on('input', (e) => {
            const charCount = $('#postText').val().length;
            
            $('#curCharCount').text(charCount)
        });

        const editPostBtn = document.querySelectorAll('.edit-post-btn');
        const editCommentBtn = document.querySelectorAll('.edit-comment-btn');

        // Handle edit button on posts
        editPostBtn.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                typeOfForm = 'post';
                // Populate the modal with the post to edit
                const postText = $(`.${e.target.closest('.post').id}-text`).text();
                $('#message-text').text(postText);
                // Set title of modal
                document.querySelector('.modal-title').textContent = 'Edit Post';

                // Set current post id for update form
                postId = $(`.${e.target.closest('.post').id}-text`).attr('id').replace(/-text/, '');

                modalFormSubmit();
            });
        });

        // Handle edit button on comments
        editCommentBtn.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                typeOfForm = 'comment';
                const id = btn.id.replace(/-edit/, '');
                const commentText = $(`#${id}-text`).text();
                // Populate the modal with the text to edit
                $('#message-text').text(commentText);
                // Set title of modal
                document.querySelector('.modal-title').textContent = 'Edit Comment';

                // set id for form submission
                // Set current post id for update form
                postId = $(`.${e.target.closest('.post').id}-text`).attr('id').replace(/-text/, '');
                // Set comment id
                commentId = id;

                modalFormSubmit();
            });
        })

        function modalFormSubmit() {
            // Modal logic
            const modalSubmitBtn = document.querySelector('#saveEditedPost');
                    
            // Handle form submission
            modalSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const text = document.querySelector('#message-text').value;
                if(text) {
                    typeOfForm === 'post' ? updatePost() : updateComment();
                }
            })
        }

        styleCommentsBtn();
        
        function styleCommentsBtn() {
            const numOfCommentsArr = document.querySelectorAll('.numOfComments');

            numOfCommentsArr.forEach(num => {
                if(num.innerHTML === '0') {
                    num.parentElement.classList.add('disabled')
                }
            });
        }

        function updatePost() {
            const saveDialog = document.querySelector('#save-success');
            const text = document.querySelector('#message-text').value;

            // HTTP request
            axios({
                method: 'POST',
                withCredentials: true,
                credentials: "same-origin",
                url: `/posts/${postId}?_method=PUT`,
                data: `post[textNew]=${text}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((res) => {        
                // Show save success message
                location.reload();
                if(!saveDialog) {
                    $(`<div class="col-12 fixed-bottom">
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            Post Saved!
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>	
                    </div>`).insertBefore('footer');
                    fadeOutFlashMessage();
                }
            }).catch((res) => {
                // Show error message
                if(!saveDialog) {
                    $(`<div class="col-12 fixed-bottom">
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            Error, please try again
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>	
                    </div>`).insertBefore('footer');
                    fadeOutFlashMessage();
                }
            }); 
        }

        function updateComment() {
            const saveDialog = document.querySelector('#save-success');
            const text = document.querySelector('#message-text').value;

            // HTTP request
            axios({
                method: 'POST',
                withCredentials: true,
                credentials: "same-origin",
                url: `/posts/${postId}/comments/${commentId}?_method=PUT`,
                data: `comment[text]=${text}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((res) => {        
                // Show save success message
                location.reload();
                if(!saveDialog) {
                    $(`<div class="col-12 fixed-bottom">
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            Comment Saved!
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>	
                    </div>`).insertBefore('footer');
                    fadeOutFlashMessage();
                }
            }).catch((res) => {
                // Show error message
                if(!saveDialog) {
                    $(`<div class="col-12 fixed-bottom">
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            Error, please try again
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>	
                    </div>`).insertBefore('footer');
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

        $('.comment-btn').on('click', (e) => {
            // Hide all comment input groups

            $('.comment-input').attr('hidden', true);
            const $el = $(e.target).closest('.post').find('.comment-input');

            $el.attr('hidden', false);
        })

        $('.cancel-comment-btn').on('click', (e) => {
            const $el = $(e.target).closest('.post').find('.comment-input');

            $el.attr('hidden', true);
        });

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
    }
}