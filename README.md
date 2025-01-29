# 🐝 Hive Forum

Hive Forum is a **full-stack community-driven discussion platform** where users can **create, join, and interact** with various communities. It is designed to offer a smooth and interactive user experience, featuring **authentication, post filtering, media uploads, and more**.

---

## 🚀 Features

### ✅ Implemented Features

#### 🔐 User Authentication
- Secure login and registration system using **JWT authentication with refresh tokens**.
- **Password reset & email confirmation** using **Nodemailer**.

#### 🏠 Community System
- Users can **create and join** communities ("hives").
- Community pages display **posts and statistics**.

#### 📝 Post & Media Management
- Users can **create, edit, and delete** posts.
- Support for **image and video uploads**.
- **Like and save posts** functionality.

#### 💬 Comments & Replies
- Users can **create, edit, and delete** comments and replies.
- **Nested comment system** (up to 5 levels deep).

#### 🔄 Infinite Scroll & Pagination
- Posts and comments **load dynamically** to improve performance.

#### 🔍 Search & Filtering _(Partial)_
- Users can **search for posts** by keywords.
- Filtering by **tags and categories** _(still in progress)._

#### 🔒 Rate Limiting & Security
- API **rate limiting** to prevent spam.

---

## 🛠️ Architecture & Tech Stack

### ⚙️ Backend
- **Node.js & Express** – RESTful API.
- **MySQL** – Relational database for structured data storage.
- **JWT Authentication** – Secure token-based authentication.
- **Multer** – For **handling media uploads**.
- **Rate Limiting** – To prevent API abuse.

### 🎨 Frontend
- **HTML, CSS, JavaScript (Vanilla)** – No frontend framework yet.
- **AJAX Fetch API** – Handles dynamic content loading.
- **Custom Styling & Responsive Design** – _(Some pages still need improvements)._

---

## ⚠️ Work in Progress 🚧

- **Community Moderation** – Ability to edit/delete communities.
- **Advanced Post Filtering** – Sort by **new, top, and hot** posts.
- **User Profiles** – Customizable profile pages with **avatars and bios**.
- **Improved Mobile Responsiveness** – _(Some pages are not fully optimized yet)._
- **Deployment** – _Currently only available locally; hosting is planned._
- **CSRF protection** and secure **cookie handling**.
- **Google OAuth** integration for easy sign-in.

---

## 🔑 Environment Variables Setup

Before running Hive Forum, you need to configure **environment variables** in a `.env` file.

### 📜 Create a `.env` File:
Inside the **root directory**, create a file named `.env` and add the following:

```ini
# 🔹 Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=forumdb

# 🔹 JWT Authentication
TOKEN_SECRET=your_jwt_secret
TOKEN_REFRESH_SECRET=your_refresh_token_secret
TOKEN_RESET_SECRET=your_password_reset_secret

# 🔹 Nodemailer (OAuth2 for Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_CLIENT_ID=your-google-api-client-id
EMAIL_CLIENT_SECRET=your-google-api-secret
EMAIL_REFRESH_TOKEN=your-oauth-refresh-token
EMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground

```

---

## 📊 Database Schema Overview 

**To manually set up the database, refer to the /database/schema.sql file for table creation queries.**

### 📌 Users Table

| Column Name        | Data Type        | Constraints                            | Description                        |
|--------------------|------------------|----------------------------------------|------------------------------------|
| `user_id`          | INT              | PRIMARY KEY, AUTO_INCREMENT            | Unique user ID                     |
| `username`         | VARCHAR(255)     | NOT NULL, UNIQUE                       | Unique username                    |
| `password`         | VARCHAR(500)     | NOT NULL                               | Hashed password                    |
| `email`            | VARCHAR(255)     | NOT NULL, UNIQUE                       | Unique email address               |
| `registration_date`| TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP              | Date of registration               |
| `reset_link`       | VARCHAR(255)     | NULLABLE                               | Password reset token               |
| `bio`              | VARCHAR(150)     | NULLABLE                               | User bio (optional)                |

### 📌 Posts Table

| Column Name       | Data Type        | Constraints                                 | Description                         |
|-------------------|------------------|---------------------------------------------|-------------------------------------|
| `post_id`         | INT              | PRIMARY KEY, AUTO_INCREMENT                 | Unique post ID                      |
| `user_id`         | INT              | FOREIGN KEY (users) ON DELETE CASCADE       | ID of user who created the post     |
| `title`           | VARCHAR(255)     | NOT NULL                                    | Title of the post                   |
| `content`         | TEXT             | NOT NULL                                    | Content of the post                 |
| `media_path`      | VARCHAR(255)     | NULLABLE                                    | Path to uploaded media (optional)   |
| `timestamp`       | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP                   | When the post was created           |
| `likeCount`       | INT              | DEFAULT 0                                   | Number of likes                     |
| `community_id`    | INT              | FOREIGN KEY (communities) ON DELETE CASCADE | Community the post belongs to       |
| `tags`            | JSON             | NULLABLE                                    | Tags associated with the post       |

### 📌 Comments Table

| Column Name      | Data Type        | Constraints                            | Description                           |
|------------------|------------------|----------------------------------------|---------------------------------------|
| `comment_id`     | INT              | PRIMARY KEY, AUTO_INCREMENT            | Unique comment ID                     |
| `post_id`        | INT              | FOREIGN KEY (posts) ON DELETE CASCADE  | Post the comment belongs to           |
| `user_id`        | INT              | FOREIGN KEY (users) ON DELETE CASCADE  | ID of the user who posted the comment |
| `content`        | TEXT             | NOT NULL                               | Comment text                          |
| `timestamp`      | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP              | Time comment was posted               |
| `parent_id`      | INT              | NULLABLE                               | Parent comment ID for nested comments |

### 📌 Communities Table

| Column Name      | Data Type        | Constraints                            | Description                         |
|------------------|------------------|----------------------------------------|-------------------------------------|
| `id`             | INT              | PRIMARY KEY, AUTO_INCREMENT            | Unique community ID                 |
| `name`           | VARCHAR(255)     | NOT NULL, UNIQUE                       | Unique community name               |
| `description`    | TEXT             | NULLABLE                               | Community description               |
| `created_at`     | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP              | Community creation timestamp        |
| `created_by`     | INT              | FOREIGN KEY (users) ON DELETE CASCADE  | User who created the community      |
| `logo_path`      | VARCHAR(255)     | NULLABLE                               | Path to community logo              |

### 📌 Community Memberships Table

| Column Name      | Data Type        | Constraints                                 | Description                         |
|------------------|------------------|---------------------------------------------|-------------------------------------|
| `id`             | INT              | PRIMARY KEY, AUTO_INCREMENT                 | Unique membership ID                |
| `user_id`        | INT              | FOREIGN KEY (users) ON DELETE CASCADE       | ID of user in the community         |
| `community_id`   | INT              | FOREIGN KEY (communities) ON DELETE CASCADE | ID of community                     |
| `role`           | ENUM             | DEFAULT 'member'                            | Role in the community               |
| `joined_at`      | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP                   | When the user joined the community  |

### 📌 Likes Table

| Column Name      | Data Type        | Constraints                             | Description                         |
|------------------|------------------|-----------------------------------------|-------------------------------------|
| `like_id`        | INT              | PRIMARY KEY, AUTO_INCREMENT             | Unique like ID                      |
| `user_id`        | INT              | FOREIGN KEY (users)                     | ID of user who liked the post       |
| `post_id`        | INT              | FOREIGN KEY (posts)                     | ID of post that was liked           |

### 📌 Saves Table

| Column Name      | Data Type        | Constraints                             | Description                         |
|------------------|------------------|-----------------------------------------|-------------------------------------|
| `save_id`        | INT              | PRIMARY KEY, AUTO_INCREMENT             | Unique save ID                      |
| `user_id`        | INT              | FOREIGN KEY (users)                     | ID of user who saved the post       |
| `post_id`        | INT              | FOREIGN KEY (posts)                     | ID of post that was saved           |

### 📌 Profile Pictures Table

| Column Name      | Data Type        | Constraints                              | Description                         |
|------------------|------------------|------------------------------------------|-------------------------------------|
| `picture_id`     | INT              | PRIMARY KEY, AUTO_INCREMENT              | Unique profile picture ID           |
| `user_id`        | INT              | FOREIGN KEY (users)                      | ID of user                          |
| `image_path`     | VARCHAR(255)     | NULLABLE                                 | Path to profile picture             |
| `uploaded_on`    | DATETIME         | DEFAULT CURRENT_TIMESTAMP                | Upload date                         |

### 📌 Registry Table

| Column Name               | Data Type       | Constraints | Description                           |
|---------------------------|-----------------|-------------|---------------------------------------|
| `email`                   | VARCHAR(255)    | NULLABLE    | Email used for registration           |
| `password`                | VARCHAR(255)    | NULLABLE    | Password hash                         |
| `username`                | VARCHAR(255)    | NULLABLE    | Username associated with registration |
| `register_link`           | VARCHAR(255)    | NULLABLE    | Registration confirmation link        |
| `register_link_timestamp` | VARCHAR(255)    | NULLABLE    | Timestamp for link expiry             |

---

## 📜 Setup & Installation

### 🔧 Prerequisites
- **Node.js & npm**
- **MySQL database**

### 🖥️ Steps to Run Locally
```sh
# Clone the repository
git clone https://github.com/lucamarsman/hive-forum.git
cd hive-forum

# Install dependencies
npm install

# Set up environment variables (.env file)
# Example:
DATABASE_URL=mysql://user:password@localhost/hiveforum
JWT_SECRET=your_secret_key

# Start the server
node server.js
