let currentPage = 1; // Current page of posts
let isLoading = false; // Flag to check if the server is currently loading more posts from the db
let morePostsAvailable = true; // Flag to check if there are more posts available
let searchMode = false;  // Flag to check if search mode is active
let lastSearchQuery = ''; // Store the last search query

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

function loadPosts(searchQuery = '') { // Function that loads posts to front page
    if (isLoading || !morePostsAvailable) return; // If the server is currently loading posts or there are no more posts available, return

    isLoading = true; // Set isLoading to true to prevent the server from loading more posts

    const loadingIndicator = document.createElement("div"); // Create loading indicator, add it to the DOM, and set its attributes
    loadingIndicator.textContent = "Loading...";
    loadingIndicator.id = "loading-indicator";
    postsContainer.appendChild(loadingIndicator);

    let url = `/posts/fetch-posts?page=${currentPage}`; // Default URL
    if (searchMode && searchQuery) { // If search mode is active and there is a search query
        url = `/posts/api/search?query=${encodeURIComponent(searchQuery)}&page=${currentPage}`; // Set URL to search endpoint
    }

    fetch(url) // Fetch posts from server
        .then(response => response.json()) // Parse response as JSON
        .then(posts => { // Handle posts
            isLoading = false; // Set isLoading to false to allow the server to load more posts
            if (posts.length > 0) { // If there are posts available
                posts.forEach(post => { // Iterate through posts and render them to the DOM
                    const postElement = document.createElement("div"); // Create post element and set its attributes
                    postElement.classList.add("post-item");
                    postElement.setAttribute("data-post-id", post.post_id);

                    const postMain = document.createElement("div"); // Create post main element and set its attributes
                    postMain.id = "post-data";
                    
                    const postInteract = document.createElement("div"); // Create post interact element and set its attributes
                    postInteract.id = "post-interact";

                    const likeCount = document.createElement("p"); // Create like count element and set its attributes
                    likeCount.textContent = post.likeCount;

                    const saveIcon = document.createElement("img"); // Create save icon element and set its attributes
                    saveIcon.src = post.saved ? "/public/assets/images/save2.svg" : "/public/assets/images/save.svg"; // If post saved, use filled in save icon, else use empty save icon
                    saveIcon.classList.add("save-icon"); // Changed from id to class
                    const likeIcon = document.createElement("img"); // Create like icon element and set its attributes
                    likeIcon.src = post.liked ? "/public/assets/images/like2.svg" : "/public/assets/images/like.svg"; // If post liked, use filled in like icon, else use empty like icon
                    likeIcon.classList.add("like-icon"); // Changed from id to class

                    postInteract.appendChild(likeIcon); // Append like icon, like count, and save icon to post interact element
                    postInteract.appendChild(likeCount);
                    postInteract.appendChild(saveIcon);

                    const postHeader = document.createElement("div") // Create post header element and set its attributes
                    postHeader.classList.add("post-header")
                    
                    const postTitle = document.createElement("h1"); // Create post title element and set its attributes
                    postTitle.textContent = post.title;

                    const postUser = document.createElement("p") // Create post user element and set its attributes
                    postUser.textContent = post.username
                    console.log(post.username)
                    postUser.classList.add("poster")
                    postUser.addEventListener("click", function () { // Add event listener to post username element
                      window.location.href = `view/${post.username}/profile`; // Redirect to user's profile page
                    })

                    const postContent = document.createElement("p"); // Create post content element and set its attributes
                    postContent.textContent = post.content;
                    const postTimestamp = document.createElement("p");
                    postTimestamp.textContent = post.timestamp;

                    postHeader.appendChild(postTitle) // Append post title and post user to post header element
                    postHeader.appendChild(postUser)
                    
                    postMain.appendChild(postHeader); // Append post header, post content, and post timestamp to post main element
                    postMain.appendChild(postContent);
                    postMain.appendChild(postTimestamp);
                    postElement.appendChild(postMain); // Append post main and post interact to post element
                    postElement.appendChild(postInteract);

                    postsContainer.appendChild(postElement); // Append post element to posts container

                });
                currentPage++; // Increment current page
                
                const loadingIndicator = document.getElementById("loading-indicator"); // Remove loading indicator
                if (loadingIndicator) { // Remove loading indicator
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

function performSearch() { // Function that loads post based on search input
        const searchQuery = document.getElementById('search-bar').value; // Get search query
        if (searchQuery !== lastSearchQuery) { // If the search query has changed
            currentPage = 1; // Reset current page
            morePostsAvailable = true; // Reset more posts available
            postsContainer.innerHTML = ''; // Clear existing posts
        }
        lastSearchQuery = searchQuery; // Update last search query
        searchMode = true; // Set search mode to true
        loadPosts(searchQuery); // Load posts based on search query
    }

document.addEventListener('DOMContentLoaded', function() { // Wait for the DOM to load
    const postsContainer = document.getElementById("postsContainer");
    const posters = document.getElementsByClassName("poster");

    // Event delegation for posts
    postsContainer.addEventListener('click', function(e) { // Event listener for posts
      if (e.target.classList.contains('like-icon')) { // If the like icon is clicked
        const post = e.target.closest('.post-item'); // Get the closest post element

        if(post){ // If the post exists
          fetch(`/user/api/like/${post.dataset.postId}`, {method: 'POST'}) // Send POST request to server to like the post that was clicked
            .then(response => { // Handle response
              if(response.status === 401){ // If user is not logged in
                window.location.href = '/login'; // Redirect to login page
              }
              else if(response.ok){ // If the request was successful
                e.target.src = "/public/assets/images/like2.svg"; // Change the like icon to the filled in version
                let likeCountElement = e.target.nextElementSibling; // Get the like count element
                let currentCount = parseInt(likeCountElement.textContent); // Get the current like count
                likeCountElement.textContent = (currentCount + 1).toString(); // Increment the like count on the client side
              }else{ // If the request was not successful
                e.target.src = "/public/assets/images/like.svg"; // Change the like icon to the empty version
                let likeCountElement = e.target.nextElementSibling; // Get the like count element
                let currentCount = parseInt(likeCountElement.textContent); // Get the current like count
                likeCountElement.textContent = (currentCount - 1).toString(); // Decrement the like count on the client side
              }
            })

            .catch(error => { // Handle errors
              console.error('Failed to like post:', error); // Log error
            })
        }

      }else if(e.target.classList.contains('save-icon')) { // If the save icon is clicked
        const post = e.target.closest('.post-item'); // Get the closest post element

        if(post){ // If the post exists
          fetch(`/user/api/save/${post.dataset.postId}`, {method: 'POST'}) // Send POST request to server to save the post that was clicked
            .then(response => { // Handle response
              if(response.status === 401){ // If user is not logged in
                window.location.href = '/login'; // Redirect to login page
              }
              else if(response.ok){ // If the request was successful
                e.target.src = "/public/assets/images/save2.svg"; // Change the save icon to the filled in version
              }else{ // If the request was not successful
                console.log("Post unsaved"); // Log error
                e.target.src = "/public/assets/images/save.svg"; // Change the save icon to the empty version
              }
            })

            .catch(error => { // Handle errors
              console.error('Failed to save post:', error); // Log error
            })
        }

        
      }else if (!e.target.classList.contains('like') && !e.target.classList.contains('save') && !e.target.classList.contains('poster')) { // If the post itself is clicked
    
        let post = e.target.closest('.post-item'); // Get the closest post element
        if (post) { // If post exists
          window.location.href = `/post/${post.dataset.postId}`; // Redirect to post's page
        }
      } 

      
});

      const searchForm = document.getElementById('searchForm'); // Get search form
      searchForm.addEventListener('submit', function(e) { // Event listener for search form
          e.preventDefault(); // Prevent default form submission
          performSearch(); // Perform search
      });

      
    // Debounce the onScroll function to optimize performance
    document.addEventListener('scroll', debounce(() => {
    if (nearBottomOfPage()) {
        if (searchMode) {
            loadPosts(lastSearchQuery);
        } else {
            loadPosts();
        }
    }
}, 100));

    loadPosts(); // Load the initial posts
});