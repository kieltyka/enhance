# enhance

**Open a new folder in your terminal and run the following**

```
npm install fs axios fast-csv lodash cli-progress dotenv --save
```

1. **Create a .env file**
    1. (can do so from the terminal with ‘touch .env’) that contains the following, where the MX_DEV_CREDS are your basic auth clientid:apikey
    2. `MX_DEV_CREDS="Basic xxxx"`
2. **Format CSV File**
    1. Ensure your CSV file is properly formatted, rename it to ‘raw_txns.csv’ and place it in the same folder you created in Step 1.
    2. The CSV file can have the following headers:
        1. Amount, Description, Type (needs to be credit or debit), ID (optional)
        2. If an ID isn’t provided the script will autogenerate an ID for the transaction as its required by MX
    3. Note: The current script only supports <1M rows in the CSV, if you have more than 1M rows:
        1. open terminal and enter
            1. `brew install csvkit`
        2. then:
            1. `csvsplit -c 500000 raw_txns.csv`
3. **Download the script** and add it to the folder: enhance.js
4. **Run the script** In your terminal run: ‘node enhance.js’
