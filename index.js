const fs = require('fs');
const readline = require('readline-promise').default;
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    const authorizedClient = await getNewToken(oAuth2Client);
    return authorizedClient;
  }
}

async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await rl.questionAsync('Enter the code form that page here: ');
  rl.close();
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);
  return oAuth2Client;
}

async function readNumbers(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const ranges = ['Sheet1!A2:A', 'Sheet1!C2:C'];
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
    ranges,
  })
  if (data.valueRanges.length) {
    const numbers = data.valueRanges[0].values;
    const letters = data.valueRanges[1].values;
    console.log('Fancy Number, Favorite Letter:');
    for (let i = 0; i < numbers.length; i++) {
      console.log(`${numbers[i]}, ${letters[i]}`);
    }
  } else {
    console.log('No data found.');
  }
}

async function writeMoreNumbers(auth, i) {
  const sheets = google.sheets({ version: 'v4', auth });
  const data = [{
    range: `Sheet1!A${i}:A`,
    values: [[100, 101, 102, 103, 104, 105, 106]],
    majorDimension: "COLUMNS",
  },
  {
    range: `Sheet1!C${i}:C`,
    values: [['X', 'Y', 'Z', 'U', 'V', 'W', 'R']],
    majorDimension: "COLUMNS",
  }];
  const resource = {
    valueInputOption: 'USER_ENTERED',
    data,
  };

  const result = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: '1Xk_Ga95VxShd-Df5olg_8dV0Ydw8B0l6bw5E2boUzmY',
    resource
  })
  console.log('Updated cells: ' + result.updatedCells);
}

const main = async () => {
  const content = fs.readFileSync('credentials.json');
  const oAuthClient = await authorize(JSON.parse(content));
  await writeMoreNumbers(oAuthClient, 7)
  await readNumbers(oAuthClient);
}


main();