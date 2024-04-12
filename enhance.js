const fs = require('fs');
const axios = require('axios');
const csv = require('fast-csv');
const _ = require('lodash');
const cliProgress = require('cli-progress');
const dotenv = require('dotenv');
const crypto = require('crypto');
dotenv.config();

const csvFilePath = 'raw_txns.csv';
const outputCsvFilePath = 'enhanced_transactions.csv';
const unprocessedCsvFilePath = 'unprocessed_transactions.csv';
const mxEndpoint = 'https://int-api.mx.com/transactions/enhance';
const requestDelay = 5; // delay in ms between each request

const mxCreds = process.env.MX_DEV_CREDS;
const api = axios.create({
  baseURL: mxEndpoint,
  headers: {
    Accept: 'application/vnd.mx.api.v1+json',
    Authorization: `${mxCreds}`,
  },
});

const transactions = [];

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

fs.createReadStream(csvFilePath)
  .pipe(csv.parse({ headers: headers => headers.map(h => h.toLowerCase()) }))
  .on('error', (error) => console.error(error))
  .on('data', (row) => {
    if (!row.id || row.id === '') {
      row.id = crypto.randomUUID(); // Use generateGUID function to create a new id
    }
    transactions.push(row);
  })
  .on('end', async (rowCount) => {
    console.log(`Parsed ${rowCount} rows`);

    const chunkedTransactions = _.chunk(transactions, 100);
    progressBar.start(chunkedTransactions.length, 0);

    const processedTransactions = [];
    const unprocessedTransactions = [];

    for (const chunk of chunkedTransactions) {
      await delay(requestDelay);

      try {
        const requestBody = {
          transactions: chunk.map((transaction) => ({
            amount: transaction.amount,
            description: transaction.description,
            id: transaction.id,
            type: transaction.type.toUpperCase()
          })),
        };

        const response = await api.post('', requestBody);

        if (response.data.transactions) {
          processedTransactions.push(...response.data.transactions);
        }
      } catch (error) {
        console.error(`Failed to send API request: ${error}`);
        unprocessedTransactions.push(...chunk);
      }

      progressBar.increment();
    }

    const writeStream = fs.createWriteStream(outputCsvFilePath);
    const unprocessedWriteStream = fs.createWriteStream(unprocessedCsvFilePath);

    csv.writeToStream(writeStream, processedTransactions, { headers: true });
    csv.writeToStream(unprocessedWriteStream, unprocessedTransactions, { headers: true });

    progressBar.stop();

    console.log(`Enhanced transactions written to ${outputCsvFilePath}`);
    console.log(`Unprocessed transactions written to ${unprocessedCsvFilePath}`);
  });