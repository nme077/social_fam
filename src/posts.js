const $ = require('jquery');
const axios = require('axios');

export default function home() {
    if(window.location.pathname === '/posts') {
        // Add active class to page button in header
        $('#home-btn').addClass('active');

        let postId = '';
        
        // Initialize height
        document.querySelector('textarea').style.height = '38px';

        $('textarea').on('keydown', () => {
            document.querySelector('textarea').style.height = '38px';
        })

        const editPostBtn = document.querySelectorAll('.edit-post-btn');

        // Handle edit button on posts
        editPostBtn.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                // Populate the modal with the post to edit
                const postText = $(`.${e.target.closest('.post').id}-text`).text();
                $('#message-text').text(postText);
                // Set current post id for update form
                postId = $(`.${e.target.closest('.post').id}-text`).attr('id').replace(/-text/, '');

                // Modal logic
                const modalSubmitBtn = document.querySelector('#saveEditedPost');
        
                // Handle form submission
                modalSubmitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const text = document.querySelector('#message-text').value;
                    console.log('clicked');
                    if(text) {
                        console.log('submitting request');
                        updatePost();
                    }
                })
            });
        })
        


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
                    $(`<div class="container alert-container">
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
                    $(`<div class="container alert-container">
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
    }
}