let currentPage = 1;
let isLoading = false;
let morePostsAvailable = true;

/*
Improves performance by limiting the rate at which scroll function (fn) is executed.
It waits for a specified delay (in milliseconds) before executing the scroll function.
If the scroll function is triggered again before the delay is over, the timer is reset.
*/
function debounce(fn, delay) {
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn();
        }, delay);
    };
}

/*
Determines if the user has scrolled near the bottom of the page.
Checks if the sum of the current scroll position (window.scrollY) and the viewport height (window.innerHeight)
is close to the total height of the document, indicating that the bottom is near.
*/
function nearBottomOfPage() {
    return (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500;
}

/*
Loads comments asynchronously from the server for a specific post.
Checks if comments are currently being loaded or if all comments have been loaded.
Shows a loading indicator while fetching comments.
Fetches comments using the fetch API from the /comments/:postId endpoint.
Adds each fetched comment to the DOM using appendComment.
Handles pagination through currentPage.
*/
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

/*
Dynamically creates and appends comment elements to the DOM.
Builds the structure of a comment including content, timestamp, and reply button.
Handles nested replies by recursively calling itself and adjusting the depth.
Adds a collapse button for comment threads with replies.
Manages visibility of replies and their containers.
*/
function appendComment(comment, depth) { // depth is used to handle nested replies
    const commentElement = document.createElement("div"); // Create a new comment element
    commentElement.classList.add("post-item", `reply-level-${depth}`); // Add classes for styling
    commentElement.setAttribute("data-post-id", comment.comment_id); // Set the comment ID as a data attribute

    const posterInfo = document.createElement("div"); // Create a container for the poster's info
    posterInfo.classList.add("poster-info"); // Add classes for styling

    const deleteConfirmModal = document.getElementById("deleteCommentConfirmModal");
    const confirmDeleteBtn = document.getElementById("confirmCommentDeleteBtn");
    const cancelDeleteBtn = document.getElementById("cancelCommentDeleteBtn");

    fetch(`/user/${comment.user_id}`) // Fetch the user's info
        .then(response => response.json()) // Parse the response as JSON
        .then(user => { // Pass the user object to the next .then()
            const username = document.createElement("p"); // Create a <p> tag for the username
            username.textContent = user.username; // Set the username as the text content of the <p> tag
            username.classList.add("poster"); // Add classes for styling
            username.addEventListener("click", function () { // Add an event listener for clicking the username
                window.location.href = `/view/${user.username}/profile`; // Redirect to the user's profile page
            });

            const userImage = document.createElement("img"); // Create an <img> tag for the user's profile picture
            if(user.image_path == ""){ // If the user has no profile picture
                userImage.setAttribute("src", "public/assets/images/default-profile.png"); // Set the default profile picture
            }else{ // If the user has a profile picture
                userImage.setAttribute("src", "/" + user.image_path); // Set the user's profile picture
            }

            posterInfo.appendChild(userImage); // Append the user's profile picture to the poster info container
            posterInfo.appendChild(username); // Append the username to the poster info container
            if (comment.isOwner) {
                const deleteBtn = document.createElement("button");
                deleteBtn.id = "comment-delete";
                deleteBtn.innerHTML = "X";

                deleteBtn.addEventListener("click", () => {
                    deleteConfirmModal.style.display = "block";

                    // Remove previous click event to avoid duplicate handlers
                    confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
                    const newConfirmDeleteBtn = document.getElementById("confirmCommentDeleteBtn");

                    newConfirmDeleteBtn.addEventListener("click", () => {
                        fetch(`/comments/${comment.comment_id}`, {
                            method: "DELETE"
                        })
                        .then(response => {
                            if (!response.ok) {
                                console.log("Something went wrong");
                            }
                            deleteConfirmModal.style.display = "none";
                            commentElement.remove(); // Remove comment from DOM
                        })
                        .catch(error => console.error("Error deleting comment:", error));
                    });
                });

                cancelDeleteBtn.addEventListener("click", () => {
                    deleteConfirmModal.style.display = "none";
                });

                posterInfo.appendChild(deleteBtn);
            }
        })
        .catch(error => { // Catch any errors
            console.error('Failed to fetch user:', error); // Log the error
        });

        

    commentElement.appendChild(posterInfo); // Append the poster info container to the comment element

    const commentContent = document.createElement("p"); // Create a <p> tag for the comment content
    commentContent.textContent = comment.content; // Set the comment content as the text content of the <p> tag
    commentElement.appendChild(commentContent); // Append the comment content to the comment element

    const commentTimestamp = document.createElement("p"); // Create a <p> tag for the comment timestamp
    commentTimestamp.textContent = comment.timestamp; // Set the comment timestamp as the text content of the <p> tag
    commentElement.appendChild(commentTimestamp); // Append the comment timestamp to the comment element

    const replyBtn = document.createElement("img"); // Create an <img> tag for the reply button
    replyBtn.setAttribute("src", "/public/assets/images/reply.svg"); // Set the reply button icon
    replyBtn.classList.add("reply-button"); // Add classes for styling
    replyBtn.setAttribute("data-comment-id", comment.comment_id); // Set the comment ID as a data attribute
    replyBtn.setAttribute('data-parent-id', comment.comment_id); // Set the parent ID as a data attribute

    const commentForm = document.createElement("form"); // Create a <form> tag for the comment form
    commentForm.id = "comment-form-" + comment.comment_id; // Set the comment ID as the form ID
    commentForm.classList.add("comment-form"); // Add classes for styling
    commentForm.style.display = "none"; // Initially hidden

    const inlineToast = document.createElement("div");
    inlineToast.id = "inline-toast-" + comment.comment_id;
    inlineToast.classList.add("inline-toast");
    inlineToast.style.display = "none";
    
    const textarea = document.createElement("textarea"); // Create a <textarea> tag for the comment text
    textarea.id = "newcomment"; // Set the comment ID as the textarea ID
    textarea.setAttribute("maxlength", "500"); // Set the maximum length of the comment
    textarea.setAttribute("name", "comment"); // Set the name of the comment

    const submitButton = document.createElement("button"); // Create a <button> tag for the submit button
    submitButton.id = "post-comment"; // Set the comment ID as the submit button ID
    submitButton.type = "submit"; // Set the type of the button to submit
    submitButton.textContent = "Post"; // Set the text content of the button
                
    submitButton.addEventListener("click", function(event) {
        event.preventDefault();
        const parentId = replyBtn.getAttribute('data-parent-id');
        const replyText = textarea.value;
        const postId = comment.post_id;
    
        const postUrl = '/comments/reply';
        const postData = {
            parentId: parentId,
            text: replyText,
            postId: postId
        };
    
        fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
        .then(response => {
            if (response.status === 401) { // Handle unauthorized response
                return response.json().then(data => {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl; // Redirect to login
                    }
                });
            }
            else if (response.status === 429) {
                // Rate limit exceeded, but the response may not be in JSON format
                response.text().then(text => {
                    try {
                        // Try to parse the text as JSON
                        const data = JSON.parse(text);
                        const message = data.message || "You're sending requests too quickly. Please slow down.";
                        displayRateLimitMessage(message);
                    } catch (e) {
                        // If it's not JSON, use the text directly
                        displayRateLimitMessage(text);
                    }
                });
                return; // Prevent further processing
            } else if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if(data) {
                console.log('Success:', data);
                const replyDepth = data.depth || 1;
                appendComment(data, replyDepth);
                textarea.value = '';
                commentForm.style.display = "none";
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            // Optionally, handle other network errors
        });

        function displayRateLimitMessage(message) {
            const inlineToast = document.getElementById("inline-toast-" + comment.comment_id);
            inlineToast.textContent = message;
            inlineToast.style.display = 'block';
        }
    });

    // Append the textarea and button to the form
    commentForm.appendChild(textarea);
    commentForm.appendChild(submitButton);
    commentForm.appendChild(inlineToast);

    replyBtn.addEventListener("click", function() { // Add an event listener for clicking the reply button
        commentForm.style.display = commentForm.style.display === "none" ? "block" : "none"; // Toggle the visibility of the comment form
        if (commentForm.style.display === "block") { // If the comment form is visible
            // Find the username <p> tag
            const usernameEl = commentElement.querySelector('.poster');
            if (usernameEl) {
                // Prepend '@username ' to the textarea
                textarea.value = `@${usernameEl.textContent.trim()} `;
                textarea.focus(); // Focus the textarea to start typing immediately
            }
        }
    });

    const commentReply = document.createElement("div"); // Create a <div> tag for the comment reply container
    commentReply.id = "comment-reply"; // Set the comment ID as the reply container ID
    commentReply.appendChild(commentTimestamp); // Append the comment timestamp to the reply container
    if(depth < 5){
        commentReply.appendChild(replyBtn); // Append the reply button to the reply container
    }
    commentElement.appendChild(commentReply); // Append the reply container to the comment element
    commentElement.appendChild(commentForm); // Append the comment form to the comment element

    document.getElementById("commentsContainer").appendChild(commentElement); // Append the comment element to the comments container


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
    
    //TODO: Process replies via fetch method on fetchReplies endpoint and load them using pagination.
    //Add a load more button that increments the page number and fetches more replies.
    if (comment.replies && comment.replies.length > 0) {
        const repliesContainer = document.createElement("div");
        repliesContainer.classList.add("replies-container");
        comment.replies.forEach(reply => {
            const childCommentElement = appendComment(reply, depth + 1); // Handle deeper nesting
            repliesContainer.appendChild(childCommentElement); // Append child comment
        });
        if (repliesContainer.hasChildNodes()) {
            const collapseBtn = document.createElement("img");
            collapseBtn.id = "collapseButton";
            collapseBtn.setAttribute("src" , "/public/assets/images/minus.svg");

            collapseBtn.addEventListener("click", function(){
            // Locate the replies container that is a sibling of the collapse button
            let repliesContainer = collapseBtn.nextSibling;

            if (repliesContainer && repliesContainer.classList.contains("replies-container")) {
                // Toggle visibility of the replies container
                repliesContainer.style.display = repliesContainer.style.display === "none" ? "block" : "none";
                
                // Change the icon of the collapse button to indicate state
                collapseBtn.setAttribute("src", repliesContainer.style.display === "none" ? "/public/assets/images/plus.svg" : "/public/assets/images/minus.svg");
            }

                          
            })

            container.appendChild(collapseBtn);
            container.appendChild(repliesContainer); // Append the replies container
        }
    }

    return container; // Return the container for recursive nesting
}

/*
Loads initial comments and their replies.
Adds scroll event listener to document for scroll load functionality.
*/
document.addEventListener('DOMContentLoaded', function() {
    loadComments(postId);

    document.addEventListener('scroll', debounce(() => {
        if (nearBottomOfPage() && morePostsAvailable) {
            loadComments(postId);
        }
    }, 100));

    document.getElementById('comment-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const form = event.target;
        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (response.status === 401) { // Handle unauthorized response
                return response.json().then(data => {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl; // Redirect to login
                    }
                });
            }
            else if (response.status === 429) {
                // Handle rate limiting
                document.getElementById('inline-toast-main').textContent = "You're submitting too fast. Please wait a moment.";
                document.getElementById('inline-toast-main').style.display = 'block';
                return null; // Ensure no further processing for this promise chain
            } else if (!response.ok) {
                // Handle other HTTP errors
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            return response.json(); // Parse JSON data from the response
        })
        .then(data => {
            if (data && data.content) {
                // Assuming 'appendComment' is correctly implemented to update the DOM
                appendComment(data, 0);

                // Clear the comment form after successful submission
                form.reset();
            } else {
                // Handle the case where 'data.comment' is not available
                console.error('Comment data is missing');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

});