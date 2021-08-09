// JS that spans multiple pages
const $ = require('jquery');
const axios = require('axios');

export default function app() {

    if(window.location.pathname === '/posts' || window.location.pathname.includes('/user')) {
        // Like logic
        let postId = '';

        const toggleLikeBtn = document.querySelectorAll('.likeBtn');

        toggleLikeBtn.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                postId = $(`.${e.target.closest('.post').id}-text`).attr('id').replace(/-text/, '');
                toggleLike(e);
            });
        });

        function toggleLike(e) {
            const saveDialog = document.querySelector('#save-success');
            let likeCount = $(`#${postId}-likeCount`).text() * 1;

            if($(`#${postId}-likeIcon`).hasClass('likedByCurUser')) {
                const incLikeCount = likeCount - 1 > 0 ? likeCount - 1 : '';
                $(`#${postId}-likeCount`).text(`${incLikeCount}`);
                $(`#${postId}-likeIcon`).removeClass('fas');
                $(`#${postId}-likeIcon`).addClass('far');
                $(`#${postId}-likeIcon`).removeClass('likedByCurUser');
            } else {
                const decLikeCount = likeCount + 1;
                $(`#${postId}-likeCount`).text(`${decLikeCount}`);
                $(`#${postId}-likeIcon`).removeClass('far');
                $(`#${postId}-likeIcon`).addClass('fas');
                $(`#${postId}-likeIcon`).addClass('likedByCurUser');
            }

            // HTTP request
            axios({
                method: 'POST',
                withCredentials: true,
                credentials: "same-origin",
                url: `/posts/${postId}/like`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((res) => {
                /*
                $(`#${postId}-likeBtn`).load(document.URL +  ` #${postId}-contents`,(el) => {
                    if($(`#${postId}-likeIcon`).hasClass('likedByCurUser')) {
                        console.log('yes')
                        $(`#${postId}-likeIcon`).removeClass('far');
                        $(`#${postId}-likeIcon`).addClass('fas');
                    } else {
                        $(`#${postId}-likeIcon`).removeClass('fas');
                        $(`#${postId}-likeIcon`).addClass('far');
                    }
                });
                */
                // Show save success message
                /*
                if(!saveDialog) {
                    const successMessage = generateSuccessMessage('This post will live long and prosper!');
                    $(successMessage).insertBefore('footer');
                    fadeOutFlashMessage();
                } */
            }).catch((res) => {
                // Show error message
                if(!saveDialog) {
                    const errorMessage = generateErrorMessage('Error, please try again!');
                    $(errorMessage).insertBefore('footer');
                    fadeOutFlashMessage();
                }
            }); 
        }
    };
    // End like logic

    // Edit logic
    // ID to use when submitting update form
    let typeOfForm = '';
    let postId = '';
    let commentId = '';

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
                num.parentElement.classList.add('disabled');
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
                const successMessage = generateSuccessMessage('Post Saved!');
                $(successMessage).insertBefore('footer');
                fadeOutFlashMessage();
            }
        }).catch((res) => {
            // Show error message
            if(!saveDialog) {
                const errorMessage = generateErrorMessage('Error, please try again!');
                $(errorMessage).insertBefore('footer');
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
                const successMessage = generateSuccessMessage('Comment saved!');
                $(successMessage).insertBefore('footer');
                fadeOutFlashMessage();
            }
        }).catch((res) => {
            // Show error message
            if(!saveDialog) {
                const errorMessage = generateErrorMessage('Error, please try again!');
                $(errorMessage).insertBefore('footer');
                fadeOutFlashMessage();
            }
        }); 
    }

    // Commment logic
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
    // End Comment logic

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
    };
}