let currentPage = 1;
let isLoading = false;
let morePostsAvailable = true;

function debounce(fn, delay) {
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn();
        }, delay);
    };
}

function nearBottomOfPage() {
    return (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500;
}

const postId = window.location.pathname.split('/')[2];
function loadComments(postId) {
    if (isLoading || !morePostsAvailable) return;

    isLoading = true;

    const loadingIndicator = document.createElement("div");
    loadingIndicator.textContent = "Loading...";
    loadingIndicator.id = "loading-indicator";
    document.getElementById("commentsContainer").appendChild(loadingIndicator);

    fetch(`/comments/${postId}?page=${currentPage}`)
        .then(response => response.json())
        .then(comments => {
            isLoading = false;
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            if (comments.length > 0) {
                comments.forEach(comment => {
                    appendComment(comment, 0); // Render each top-level comment and its replies
                });
                currentPage++;
            } else {
                morePostsAvailable = false;
            }
        })
        .catch(error => {
            isLoading = false;
            console.error('Failed to fetch posts:', error);
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        });
}

function appendComment(comment, depth) {
    const commentElement = document.createElement("div");
    commentElement.classList.add("post-item", `reply-level-${depth}`);
    commentElement.setAttribute("data-post-id", comment.comment_id);
    
    const commentContent = document.createElement("p");
    commentContent.textContent = comment.content;
    commentElement.appendChild(commentContent);

    const commentTimestamp = document.createElement("p");
    commentTimestamp.textContent = comment.timestamp;
    commentElement.appendChild(commentTimestamp);

    const replyBtn = document.createElement("img");
    replyBtn.setAttribute("src", "/public/assets/images/reply.svg");
    replyBtn.classList.add("reply-button");
    replyBtn.setAttribute("data-comment-id", comment.comment_id);
    replyBtn.setAttribute('data-parent-id', comment.comment_id);

    const commentForm = document.createElement("form");
    commentForm.id = "comment-form-" + comment.comment_id;
    commentForm.classList.add("comment-form");
    commentForm.style.display = "none"; // Initially hidden
    
    const textarea = document.createElement("textarea");
    textarea.id = "newcomment";
    textarea.setAttribute("maxlength", "500");
    textarea.setAttribute("name", "comment");

    const submitButton = document.createElement("button");
    submitButton.id = "post-comment";
    submitButton.type = "submit";
    submitButton.textContent = "Post";
                
    submitButton.addEventListener("click", function(event) {
        event.preventDefault();
        const parentId = replyBtn.getAttribute('data-parent-id'); // Get the parent ID
        const replyText = textarea.value;
        const postId = comment.post_id;

        // Send reply data to server
        const postUrl = '/comments/reply'; 

        const postData = {
            parentId: parentId,
            text: replyText,
            postId: postId
        };

        // Send the data to the server
        fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            const replyDepth = data.depth || 1;
            appendComment(data, replyDepth);
            textarea.value = '';
            commentForm.style.display = "none";
        
        })
        .catch((error) => {
            console.error('Error:', error);
            // Handle errors here
        });
    });

    // Append the textarea and button to the form
    commentForm.appendChild(textarea);
    commentForm.appendChild(submitButton);

    replyBtn.addEventListener("click", function() {
        commentForm.style.display = commentForm.style.display === "none" ? "block" : "none";
    });

    const commentReply = document.createElement("div");
    commentReply.id = "comment-reply";
    commentReply.appendChild(commentTimestamp);
    commentReply.appendChild(replyBtn);
    commentElement.appendChild(commentReply);
    commentElement.appendChild(commentForm);

    document.getElementById("commentsContainer").appendChild(commentElement);


    // Create a container for replies
    let container;
    if (depth === 0) { // Top-level comment
        container = document.createElement("div");
        container.classList.add("comment-container");
        container.appendChild(commentElement);
        document.getElementById("commentsContainer").appendChild(container);
    } else { // Reply to an existing comment
        const parentCommentElement = document.querySelector(`[data-post-id='${comment.parent_id}']`);
        const repliesContainer = parentCommentElement.querySelector(".replies-container") || document.createElement("div");
        repliesContainer.classList.add("replies-container");
        repliesContainer.appendChild(commentElement);
        parentCommentElement.appendChild(repliesContainer);
        container = commentElement;
    }

    // Process replies if they exist
    if (comment.replies && comment.replies.length > 0) {
        const repliesContainer = document.createElement("div");
        repliesContainer.classList.add("replies-container");
        comment.replies.forEach(reply => {
            const childCommentElement = appendComment(reply, depth + 1); // Handle deeper nesting
            repliesContainer.appendChild(childCommentElement); // Append child comment
        });
        if (repliesContainer.hasChildNodes()) {
            container.appendChild(repliesContainer); // Append the replies container
        }
    }

    return container; // Return the container for recursive nesting
}

document.addEventListener('DOMContentLoaded', function() {
    loadComments(postId);

    document.addEventListener('scroll', debounce(() => {
        if (nearBottomOfPage() && morePostsAvailable) {
            loadComments(postId);
        }
    }, 100));
});