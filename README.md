# CSV Transaction Enhancer

This script (`enhance.js`) processes a CSV file containing financial transactions, enhances them using the MX API, and outputs both processed and unprocessed transactions into separate CSV files.

## Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 14 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. Clone this repository:
   ```sh
   git clone https://github.com/kieltyka/enhance.git
   cd enhance
   ```
2. Install the required dependencies using the package.json file:
   ```sh
   npm install
   ```

## Configuration

1. Create a `.env` file in the same directory as the script and add your MX API credentials:
   ```sh
   MX_DEV_CREDS=base64encodedclientID:apikey
   ```

## Usage

Run the script using the following command:
```sh
node enhance.js
```

You will be prompted to enter the path to the CSV file that needs processing.

### Expected CSV Format
The input CSV should contain transaction details with the following headers:
- `id` (optional, will be generated if missing)
- `amount`
- `description`
- `type`
- `merchant_category_code` (optional)

### Output Files
Two output files will be generated in the same directory as the input file:
- `{input_filename}_enhanced.csv` - Contains successfully processed transactions.
- `{input_filename}_unprocessed.csv` - Contains transactions that failed processing.

### Console Output
After processing, the script will display:
- Total number of transactions.
- Total processed transactions.
- Total unprocessed transactions.
- Percentage of processed transactions that:
  - Have a category other than 'Uncategorized'.
  - Have a `merchant_guid`.
  - Have a `merchant_location_guid`.

## Troubleshooting
- If you see an error related to `MX_DEV_CREDS`, ensure you have properly set it in the `.env` file.
- If the script does not process transactions correctly, verify that your input CSV format matches the expected structure.
- For API errors, check MX API documentation or ensure your credentials have the necessary permissions.

## License
This project is licensed under the MIT License.

