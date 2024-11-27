import sql from 'mssql';

import { NextApiRequest, NextApiResponse } from 'next';  // types for api routes

// interface for the expected structure of data from the database
interface Data {
  id: number;
  name: string;
}


export default async function db_handler(req: NextApiRequest, res: NextApiResponse, query: string) {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const server = process.env.DB_SERVER;
  const database = process.env.DB_DATABASE;

  // check that all environment variables are set
  if (!user || !password || !server || !database) {
    return res.status(500).json({message: 'Missing environment variables for DB connection'});
  }

  // configuration for connecting to Azure SQL Database
  const config = {
    user: user,
    password: password,
    server: server,
    database: database,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };

  const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    // Perform query
    return pool.request().query(query);
  })
  .catch(err => {
    console.log(err);
    throw err;
  });

  try {
    const result = await poolPromise;
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error executing SQL query' });
  }
}