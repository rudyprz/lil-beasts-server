# Backend setup

## Requirements

For development, you will only need Node.js and a node global package, npm, installed in your environement.

## Install dependencies setup

```
npm install
```

## Create and prepare a database server

- Configure a database server. In my case I used elephantsql whis is a PostgreSQL as a Service (https://www.elephantsql.com/)
- Restore the .sql.Izo database file using ElephantSQL web console or through the following command:

```
lzop -cd "$FILENAME" | psql "$DATABASE_NAME"
```

- Get a connection string from your database server

### Configure .env file

- Change extension file .envSample to .env
- Type the value of the connection string of PostgreSQL from your database server in the variable POSTGRES_URL inside .env file
- If you wish you can modify JWT_SECRET variable inside .env file

### Start the server

```
npm run dev
```
