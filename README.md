# TinyOps API

A REST API for managing Arma gaming events and community interactions, built with Hono, Prisma, and TypeScript.

## Developer Setup

1. Clone the repo

    ```sh
    $ git clone https://github.com/tinyopsdotgg/tinyops-api
    ```

2. Create database container

    ```sh
    $ docker compose up -d
    ```

3. Create `.env` at root of project and add the following:

    - Use this command: `$ openssl rand -base64 32` to create a SESSION_SECRET env var, if you are using **Bash/ZSH**
    - Use this command: `$ [Convert]::ToBase64String((1..32|%{Get-Random -Maximum 256}))` to create a SESSION_SECRET env var, if you are using **PowerShell**

    ```sh
    DATABASE_URL="mysql://root:password@localhost:3306/armasocial"
    SESSION_SECRET="place_here"
    NODE_ENV="development"
    PORT=3000
    MINIO_ENDPOINT="http://localhost:9000"
    MINIO_ACCESS_KEY="minioadmin"
    MINIO_SECRET_KEY="minioadmin"
    MINIO_BUCKET_NAME="attachments"
    CORS_ORIGIN="http://localhost:5173"
    RATE_LIMIT_WINDOW_MS=900000
    RATE_LIMIT_MAX_REQUESTS=50
    MAX_FILE_SIZE=10485760
    ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp"
    ```

4. Run `$ npm install` at root of project to install the dependencies

    - This will kick off the postinstall script, which will run `$ npx prisma generate` to generate the Prisma client

5. Run database migrations

    ```sh
    $ npx prisma migrate dev
    ```

6. Finally, run `$ npm run dev` to start the server

The API will be available at `http://localhost:3000`
