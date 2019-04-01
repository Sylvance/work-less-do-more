const fs = require('fs').promises;
const { google } = require('googleapis');
const Octokit = require('@octokit/rest');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function createSpreadsheet(sheets, title) {
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

  const { data } = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    resource,
    valueInputOption,
  })
  console.log('Updated cells: ' + data.updatedCells);
}

async function appendCloneData(sheets, spreadsheetId, cloneData) {
  const range = 'Sheet1!A2:C';
  const valueInputOption = 'USER_ENTERED';
  const values = [];
  for (const entry of cloneData) {
    values.push([entry.timestamp, , entry.uniques]);
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    resource: {
      values
    }
  })
  console.log(response.status);
}

const numberOfClones = async (octokit) => {
  try {

    // https://octokit.github.io/rest.js/#api-Repos-getClones
    const { data } = await octokit.repos.getClones({
      owner: 'GoogleCloudPlatform', repo: 'nodejs-getting-started',
    });
    console.log(`Clones: ${data.count}`);
    // Array of 2 weeks
    return data.clones;
  } catch (err) {
    console.log(err.HttpError);
  }
}

const addUser = async (id, auth) => {
  var body = {
    value: 'fhinkel.demo@gmail.com',
    type: 'user',
    role: 'owner',
  };
  const drive = google.drive({ version: 'v3', auth })

  try {

    let { data } = await drive.permissions.create({
      fileId: id,
      type: 'user',
      resource: {
        type: 'user',
        role: 'writer',
        emailAddress: 'fhinkel.demo@gmail.com',
        transferOwnership: false,
      },
    });
    console.log(`Permission Id: ${data.id}`);
  } catch (err) {
    console.log('err!!!')
    console.log(err);
  }
}

const main = async () => {
  const auth = await google.auth.getClient({ scopes: SCOPES });
  const sheets = google.sheets({ version: 'v4', auth });

  // TODO move GitHub set up into helper method
  const token = (await fs.readFile('githubToken.json')).toString().trim();
  const octokit = new Octokit({ auth: `token ${token}` });

  const title = 'Generated GitHub Data';
  let id = await createSpreadsheet(sheets, title);
  await writeHeader(sheets, id, 0);
  let cloneData = await numberOfClones(octokit);
  // await appendCloneData(sheets, id, cloneData);
  // await addUser(id, auth);
}


main();