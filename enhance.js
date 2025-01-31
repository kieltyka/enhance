const fs = require('fs');
const axios = require('axios');
const csv = require('fast-csv');
const _ = require('lodash');
const cliProgress = require('cli-progress');
const dotenv = require('dotenv');
const crypto = require('crypto');
const readline = require('readline');
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the path to the CSV file: ', (csvFilePath) => {
  const fileName = csvFilePath.replace(/^.*[\\\/]/, '').replace(/\.csv$/, '');
  const outputCsvFilePath = `${fileName}_enhanced.csv`;
  const unprocessedCsvFilePath = `${fileName}_unprocessed.csv`;
  const mxEndpoint = 'https://int-api.mx.com/transactions/enhance';
  const requestDelay = 5; // Delay in ms between each request

  // Validate environment variable
  const mxCreds = process.env.MX_DEV_CREDS;
  if (!mxCreds) {
    console.error('MX_DEV_CREDS environment variable is not set.');
    process.exit(1);
  }

  const api = axios.create({
    baseURL: mxEndpoint,
    headers: {
      Accept: 'application/vnd.mx.api.v1+json',
      Authorization: `${mxCreds}`,
    },
  });

  const transactions = [];
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  let hasMerchantCategoryCode = false;

  // Utility to introduce delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Main process function
  async function processTransactions() {
    try {
      // Read and parse CSV file
      const parseCSV = () =>
        new Promise((resolve, reject) => {
          fs.createReadStream(csvFilePath)
            .pipe(csv.parse({
              headers: headers => {
                headers = headers.map(h => h.toLowerCase());
                hasMerchantCategoryCode = headers.includes('merchant_category_code');
                return headers;
              }
            }))
            .on('error', reject)
            .on('data', (row) => {
              if (!row.id) {
                row.id = crypto.randomUUID();
              }
              transactions.push(row);
            })
            .on('end', (rowCount) => resolve(rowCount));
        });

      const rowCount = await parseCSV();
      console.log(`Total transactions: ${rowCount}`);

      // Chunk transactions and setup progress bar
      const chunkedTransactions = _.chunk(transactions, 100);
      progressBar.start(chunkedTransactions.length, 0);

      const processedTransactions = [];
      const unprocessedTransactions = [];

      // Process transactions in chunks
      for (const chunk of chunkedTransactions) {
        await delay(requestDelay);

        try {
          const requestBody = {
            transactions: chunk.map((transaction) => {
              let txn = {
                amount: transaction.amount,
                description: transaction.description,
                id: transaction.id,
                type: transaction.type.toUpperCase(),
              };
              if (hasMerchantCategoryCode) {
                txn.merchant_category_code = transaction.merchant_category_code;
              }
              return txn;
            }),
          };

          const { data } = await api.post('', requestBody);

          if (data.transactions) {
            processedTransactions.push(...data.transactions);
          }
        } catch (error) {
          console.error(`Failed to process chunk: ${error.message}`);
          unprocessedTransactions.push(...chunk);
        }

        progressBar.increment();
      }

      progressBar.stop();
      console.log(`Total processed transactions: ${processedTransactions.length}`);
      console.log(`Total unprocessed transactions: ${unprocessedTransactions.length}`);

      // Calculate percentage of processed transactions meeting criteria
      const totalProcessed = processedTransactions.length;
      if (totalProcessed > 0) {
        const categorizedCount = processedTransactions.filter(txn => txn.category && txn.category !== 'Uncategorized').length;
        const merchantGuidCount = processedTransactions.filter(txn => txn.merchant_guid).length;
        const merchantLocationGuidCount = processedTransactions.filter(txn => txn.merchant_location_guid).length;

        console.log(`Percentage of processed transactions with a category other than 'Uncategorized': ${(categorizedCount / totalProcessed * 100).toFixed(2)}%`);
        console.log(`Percentage of processed transactions with a merchant_guid: ${(merchantGuidCount / totalProcessed * 100).toFixed(2)}%`);
        console.log(`Percentage of processed transactions with a merchant_location_guid: ${(merchantLocationGuidCount / totalProcessed * 100).toFixed(2)}%`);
      }

      // Write results to CSV files
      await Promise.all([
        writeCSV(outputCsvFilePath, processedTransactions),
        writeCSV(unprocessedCsvFilePath, unprocessedTransactions),
      ]);

      console.log(`Enhanced transactions written to ${outputCsvFilePath}`);
      console.log(`Unprocessed transactions written to ${unprocessedCsvFilePath}`);
    } catch (error) {
      console.error(`Error processing transactions: ${error.message}`);
    } finally {
      rl.close();
    }
  }

  // Write data to CSV file
  const writeCSV = (filePath, data) =>
    new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      csv.writeToStream(writeStream, data, { headers: true })
        .on('finish', resolve)
        .on('error', reject);
    });

  // Start processing
  processTransactions();
});
