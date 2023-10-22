document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    let isLoading = false;

    const postsContainer = document.getElementById("postsContainer");

    // Event delegation for posts
    postsContainer.addEventListener("click", function(event) {
        // Check if the clicked element is a post
        if (event.target.classList.contains("post-item")) {
            // Handle the click event here
            const postId = event.target.dataset.postId;
            // Redirect to post view or handle as desired
            window.location.href = `/post/${postId}`;
        }
    });

    function loadPosts() {
        if (isLoading) return;

        isLoading = true;
        fetch(`/api/posts?page=${currentPage}`)
            .then(response => response.json())
            .then(posts => {
                if (posts.length > 0) {
                    posts.forEach(post => {
                        const postElement = document.createElement("div");
                        postElement.classList.add("post-item");
                        postElement.setAttribute("data-post-id", post.post_id);
                        postElement.textContent = post.title; // You can adjust this to include more post details
                        postsContainer.appendChild(postElement);
                    });
                    currentPage++;
                    isLoading = false;
                } else {
                    document.removeEventListener('scroll', onScroll);
                }
            });
    }

    function nearBottomOfPage() {
        return (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100;
    }

    function onScroll() {
        if (nearBottomOfPage()) {
            loadPosts();
        }
    }

    document.addEventListener('scroll', onScroll);
    loadPosts(); // Load the initial posts
});