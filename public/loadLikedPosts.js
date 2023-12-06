let currentPage = 1; // Current page of posts
let isLoading = false; // Flag to check if the server is currently loading more posts from the db
let morePostsAvailable = true; // Flag to check if there are more posts available

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

function loadPosts() { // Function that loads posts to front page
    if (isLoading || !morePostsAvailable) return; // If the server is already loading posts or there are no more posts available, return

    isLoading = true; // Set isLoading to true to prevent the server from loading more posts while the current request is still being processed

    // Create loading indicator and append it to bottom of posts container
    const loadingIndicator = document.createElement("div");
    loadingIndicator.textContent = "Loading...";
    loadingIndicator.id = "loading-indicator";
    postsContainer.appendChild(loadingIndicator);

    const username = document.getElementById("username").textContent // Get username from hidden element in DOM

    fetch(`/posts/post-history/${username}/?page=${currentPage}`) // Fetch posts from server
        .then(response => response.json()) // Parse response as JSON
        .then(posts => { // Handle posts
            isLoading = false; // Set isLoading to false to allow the server to load more posts
            if (posts.length > 0) { // If there are posts available
                posts.forEach(post => { // Iterate through posts and render them to the DOM
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
                currentPage++; // Increment current page
                
                const loadingIndicator = document.getElementById("loading-indicator"); // Remove loading indicator
                if (loadingIndicator) {
                   loadingIndicator.remove();
                }
                
            } else { // If there are no more posts available
                morePostsAvailable = false; // No more posts left to fetch
                const loadingIndicator = document.getElementById("loading-indicator"); // Remove loading indicator
                if (loadingIndicator) {
                   loadingIndicator.remove();
                }
            }
        })
        .catch(error => { // Handle errors
            isLoading = false; // Set isLoading to false to allow the server to load more posts
            console.error('Failed to fetch posts:', error); // Log error

            const loadingIndicator = document.getElementById("loading-indicator"); // Remove loading indicator
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        });
}


document.addEventListener('DOMContentLoaded', function() { // Wait for the DOM to load
    const postsContainer = document.getElementById("postsContainer");

    // Event delegation for posts
    postsContainer.addEventListener('click', function(e) {
      if (e.target.classList.contains('like-icon')) { // If the like icon is clicked
        const post = e.target.closest('.post-item'); // Get the closest post element

        if(post){ // If post exists
          fetch(`api/like/${post.dataset.postId}`, {method: 'POST'}) // Send POST request to server to like the post that was clicked
            .then(response => { // Handle response
              if(response.status === 401){ // If user is not logged in
                window.location.href = '/login'; // Redirect to login page
              }
              else if(response.ok){ // If the request was successful
                e.target.src = "/public/assets/images/like2.svg"; // Change the like icon to the filled in version
              }else{ // If the request was not successful
                e.target.src = "/public/assets/images/like.svg"; // Change the like icon to the empty version
              }
            })

            .catch(error => { // Handle errors
              console.error('Failed to like post:', error); // Log error
            })
        }

      }else if(e.target.classList.contains('save-icon')) { // If the save icon is clicked
        const post = e.target.closest('.post-item'); // Get the closest post element

        if(post){ // If post exists
          fetch(`api/save/${post.dataset.postId}`, {method: 'POST'}) // Send POST request to server to save the post that was clicked
            .then(response => { // Handle response
              if(response.status === 401){ // If user is not logged in
                window.location.href = '/login'; // Redirect to login page
              }
              else if(response.ok){ // If the request was successful
                e.target.src = "/public/assets/images/save2.svg"; // Change the save icon to the filled in version
              }else{// If the request was not successful
                e.target.src = "/public/assets/images/save.svg"; // Change the save icon to the empty version
              }
            })

            .catch(error => { // Handle errors
              console.error('Failed to save post:', error); // Log error
            })
        }

        
      }else if (!e.target.classList.contains('like') && !e.target.classList.contains('save')) { // If the post itself is clicked
    
        let post = e.target.closest('.post-item'); // Get the closest post element
        if (post) { // If post exists
          window.location.href = `/post/${post.dataset.postId}`; // Redirect to post's page
        }
      } 

      
});

    // Debounce the onScroll function to optimize performance
    document.addEventListener('scroll', debounce(() => {
    if (nearBottomOfPage()) {
        loadPosts();
        
    }
}, 100));

    loadPosts(); // Load the initial posts
});