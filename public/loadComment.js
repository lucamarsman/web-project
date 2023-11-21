let currentPage = 1;
let isLoading = false;
let morePostsAvailable = true;  // New flag to check if more posts are left

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
 comments.appendChild(loadingIndicator);

 console.log(comments)

 fetch(`/comments/${postId}?page=${currentPage}`)
     .then(response => response.json())
     .then(comments => {
         isLoading = false;
         if (comments.length > 0) {
             comments.forEach(comment => {
                 const commentElement = document.createElement("div");
                 commentElement.classList.add("post-item");
                 commentElement.setAttribute("data-post-id", comment.post_id);

                 const commentContent = document.createElement("p");
                 commentContent.textContent = comment.content;
                 const commentTimestamp = document.createElement("p");
                 commentTimestamp.textContent = comment.timestamp;

                 commentElement.appendChild(commentContent);
                 commentElement.appendChild(commentTimestamp);

                 commentsContainer.appendChild(commentElement);
             });
             currentPage++;
             
             const loadingIndicator = document.getElementById("loading-indicator");
             if (loadingIndicator) {
                loadingIndicator.remove();
             }
             
         } else {
             morePostsAvailable = false; // No more posts left to fetch
             const loadingIndicator = document.getElementById("loading-indicator");
             if (loadingIndicator) {
                loadingIndicator.remove();
             }
         }
     })
     .catch(error => {
         isLoading = false;
         console.error('Failed to fetch posts:', error);

         const loadingIndicator = document.getElementById("loading-indicator");
         if (loadingIndicator) {
             loadingIndicator.remove();
         }
     });
}

document.addEventListener('DOMContentLoaded', function() {
 const commentsContainer = document.getElementById("commentsContainer");
 loadComments(postId)

 // Debounce the onScroll function to optimize performance
 document.addEventListener('scroll', debounce(() => {
     if (nearBottomOfPage()) {
         loadComments(postId);
     }
 }, 100));

 loadComments(); // Load the initial posts
});