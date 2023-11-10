let currentPage = 1;
let isLoading = false; // Flag to check if the server is currently loading more posts from the db
let morePostsAvailable = true; // Flag to check if there are more posts available
let currentCategory = 'post-history'; // Default to 'post-history'
const username = document.getElementById("username").textContent

function debounce(fn, delay) { // Debounce function for scroll event listener
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn();
        }, delay);
    };
}

function nearBottomOfPage() { // Function to check if the user has scrolled to the bottom of page
    return (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500;
}

function loadPosts(url) { // Function that loads posts to front page
    if (isLoading || !morePostsAvailable) return;

    isLoading = true;

    const loadingIndicator = document.createElement("div");
    loadingIndicator.textContent = "Loading...";
    loadingIndicator.id = "loading-indicator";
    postsContainer.appendChild(loadingIndicator);

    fetch(url)
        .then(response => response.json())
        .then(posts => {
            isLoading = false;
            if (posts.length > 0) {
                posts.forEach(post => {
                    const postElement = document.createElement("div");
                    postElement.classList.add("post-item");
                    postElement.setAttribute("data-post-id", post.post_id);

                    const postMain = document.createElement("div");
                    postMain.id = "post-data";

                    const postHeader = document.createElement("div")
                    postHeader.classList.add("post-header")
                    
                    const postTitle = document.createElement("h1");
                    postTitle.textContent = post.title;

                    const postUser = document.createElement("p")
                    postUser.textContent = post.username
                    postUser.classList.add("poster")

                    const postContent = document.createElement("p");
                    postContent.textContent = post.content;
                    const postTimestamp = document.createElement("p");
                    postTimestamp.textContent = post.timestamp;

                    postHeader.appendChild(postTitle)
                    postHeader.appendChild(postUser)
                    
                    postMain.appendChild(postHeader);
                    postMain.appendChild(postContent);
                    postMain.appendChild(postTimestamp);
                    postElement.appendChild(postMain);

                    postsContainer.appendChild(postElement);

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
    const postsContainer = document.getElementById("postsContainer");

    const postHistory = document.getElementById("postHistory");
    const commentHistory = document.getElementById("commentHistory");
    const likedHistory = document.getElementById("likedPosts");
    const savedHistory = document.getElementById("savedPosts");

    postHistory.classList.add("active");

    postHistory.addEventListener("click", function() {
      currentPage = 1;
      isLoading = false;
      morePostsAvailable = true; 

      currentCategory = 'post-history';

      document.getElementById('postsContainer').innerHTML = '';
      loadPosts(`/api/post-history/${username}/?page=${currentPage}`);
    });

    commentHistory.addEventListener("click", function() {
      currentPage = 1;
      isLoading = false;
      morePostsAvailable = true; 

      currentCategory = 'comment-history';

      document.getElementById('postsContainer').innerHTML = '';
      loadPosts(`/api/post-comment-history/${username}/?page=${currentPage}`)
    });

    likedHistory.addEventListener("click", function() {
      currentPage = 1;
      isLoading = false;
      morePostsAvailable = true; 

      currentCategory = 'like-history';

      document.getElementById('postsContainer').innerHTML = '';
      loadPosts(`/api/post-like-history/${username}/?page=${currentPage}`)
    });

    savedHistory.addEventListener("click", function() {
      currentPage = 1;
      isLoading = false;
      morePostsAvailable = true; 

      currentCategory = 'save-history';

      document.getElementById('postsContainer').innerHTML = '';
      loadPosts(`/api/post-save-history/${username}/?page=${currentPage}`)
    });

    // Event delegation for posts
    postsContainer.addEventListener('click', function(e) {
      if (e.target.classList.contains('like-icon')) {
        console.log('Like'); // Handle liking posts
        const post = e.target.closest('.post-item');

        if(post){
          fetch(`api/like/${post.dataset.postId}`, {method: 'POST'})
            .then(response => {
              if(response.status === 401){
                window.location.href = '/login';
              }
              else if(response.ok){
                console.log("Post liked");
                e.target.src = "/public/assets/images/like2.svg";
              }else{
                console.log("Post unliked");
                e.target.src = "/public/assets/images/like.svg";
              }
            })

            .catch(error => {
              console.error('Failed to like post:', error);
            })
        }

      }else if(e.target.classList.contains('save-icon')) {
        console.log('Save'); 
        const post = e.target.closest('.post-item');

        if(post){
          fetch(`api/save/${post.dataset.postId}`, {method: 'POST'})
            .then(response => {
              if(response.status === 401){
                window.location.href = '/login';
              }
              else if(response.ok){
                console.log("Post saved");
                e.target.src = "/public/assets/images/save2.svg";
              }else{
                console.log("Post unsaved");
                e.target.src = "/public/assets/images/save.svg";
              }
            })

            .catch(error => {
              console.error('Failed to save post:', error);
            })
        }

        
      }else if (!e.target.classList.contains('like') && !e.target.classList.contains('save')) {
    
        let post = e.target.closest('.post-item');
        if (post) {
          window.location.href = `/post/${post.dataset.postId}`;
        }
      } 

      
});

    // Debounce the onScroll function to optimize performance
    document.addEventListener('scroll', debounce(() => {
    if (nearBottomOfPage()) {   

      if(currentCategory == "post-history"){
        loadPosts(`/api/post-history/${username}/?page=${currentPage}`);
      }else if(currentCategory == "comment-history"){
        loadPosts(`/api/post-comment-history/${username}/?page=${currentPage}`);
      }else if(currentCategory == "like-history"){
        loadPosts(`/api/post-like-history/${username}/?page=${currentPage}`);
      }else if (currentCategory == "save-history"){
        loadPosts(`/api/post-save-history/${username}/?page=${currentPage}`);
      }
        
    }
}, 100));

    loadPosts(`/api/post-history/${username}/?page=${currentPage}`); // Load the initial posts
});