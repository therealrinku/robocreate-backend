<div align="center">
    <img src="https://cdn-icons-png.flaticon.com/128/12435/12435234.png" alt="Logo" width="80" height="80">
    <h3>robocreate</h3>
    <p>minimalistic and futuristic social media management application</p>
</div>

## Features

✨ Create post on your preferred social media pages (facebook page only for now)


✨ Clean and Minimal dashboard to see the latest posts 


✨ Analytics to see the posts engagement and more analytics coming soon


🔥 Support for other social media coming soon 


🔥 Ability to create bulk posts(same post for multiple social media at once) coming soon


## Technologies Used
<img src="https://img.shields.io/badge/node-000000?style=for-the-badge&logo=nodedotjs&logoColor=yellow"/>
<img src="https://img.shields.io/badge/postgres-000000?style=for-the-badge&logo=postgresql&logoColor=blue"/>

## Development

To run this project locally, follow these steps:

1. Clone the repository.
   ```bash
   git clone https://github.com/therealrinku/robocreate-backend.git

2. Install the dependencies.
   ```bash
   yarn install
   
3. Add POSTGRES_DB_URL and REDIS_URL to .env


4. Create the required db tables by running this inside database folder
   ```bash
     node createTables.js

6. Run the project.
   ```bash
   yarn run dev
