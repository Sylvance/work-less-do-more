const fs = require('fs');
const readline = require('readline-promise').default;
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
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

async function createSheet(sheets, title) {
    const resource = {
        properties: {
            title,
        }
    }
    const { data } = await sheets.spreadsheets.create({ resource });

    console.log(`Created new spreadsheet with ID: ${data.spreadsheetId}`);
    return data.spreadsheetId;
}

async function writeHeader(sheets, spreadsheetId) {
    const values = [['Timestamp', 'Unique Views', 'Unique Clones']];
    const resource = {
        values,
    };
    const range = 'A1:C1';
    const valueInputOption = 'USER_ENTERED'

    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        resource,
        valueInputOption,
    })
    console.log('Updated cells: ' + response.data.totalUpdatedCells);
}


const main = async () => {
    const content = fs.readFileSync('credentials.json');
    const auth = await authorize(JSON.parse(content));
    const sheets = google.sheets({ version: 'v4', auth });

    const title = 'Views and Clones';
    let id = await createSheet(sheets, title);
    await writeHeader(sheets, id, 0);
}


main();