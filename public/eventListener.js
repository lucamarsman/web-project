document.addEventListener("DOMContentLoaded", function() { // Wait for the DOM to load
    let posts = document.querySelectorAll(".post"); // Select all the post elements

    posts.forEach(function(post) { // Attach an event listener to each post
        post.addEventListener("click", function() {
            let postId = post.getAttribute("data-postid"); // Retrieve the data-postid attribute from the clicked post
            window.location.href = `/post/${postId}`; // Redirect to post route
        });
    });
});