// JS that spans multiple pages
const $ = require('jquery');
const axios = require('axios');

export default function app() {

    if(window.location.pathname === '/posts' || window.location.pathname.includes('/user')) {
        let postId = '';

        const toggleLikeBtn = document.querySelectorAll('.likeBtn');

        toggleLikeBtn.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                postId = $(`.${e.target.closest('.post').id}-text`).attr('id').replace(/-text/, '');
                toggleLike(e);
            });
        })

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
    }
}