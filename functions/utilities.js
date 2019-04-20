const { google } = require('googleapis');
const Octokit = require('@octokit/rest');
const githubUtilities = require('./githubUtilities');
const fs = require('fs').promises;

addUser = async (drive, id, emailAddress) => {
    try {
        let { data } = await drive.permissions.create({
            fileId: id,
            type: 'user',
            resource: {
                type: 'user',
                // TODO(asrivast): Lower this permission level. 
                role: 'writer',
                emailAddress,
                transferOwnership: false,
            },
        });
        console.log(`Permission Id: ${data.id}`);
    } catch (err) {
        console.error(`Failed sharing with ${emailAddress}`);
        console.error(err);
    }
}

appendCloneData = async (sheets, spreadsheetId, cloneData) => {
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
    console.log(`Appending data: ${response.status}`);
}

exports.setUp = async(title) => {
    let auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });
  
    let id = await createSpreadsheet(sheets, title);
  
 
  
    const token = (await fs.readFile('./githubToken.json')).toString().trim();
    const octokit = new Octokit({ auth: `token ${token}` });
    console.log('Fetching github data');
   
    try {
      const cloneData = await githubUtilities.numberOfClones(octokit, 
        'GoogleCloudPlatform', 'nodejs-getting-started');
      await appendCloneData(sheets, id, cloneData.clones).catch(err => console.error(err));
    } catch (err) {
      console.error(`Error: ${err}`);
      }
    
    //  TODO(asrivast): Use IAM, read email from request.  
    await addUser(drive, id, 'gsuite.demos@gmail.com');
    await addUser(drive, id, 'fhinkel.demo@gmail.com');

    return id;
  }
  
  /**
   * Creates a spreadsheet with the given title.
   */
  async function createSpreadsheet(sheets, title) {
    const resource = {
      properties: {
        title,
      }
    }
    try {
      const { data } = await sheets.spreadsheets.create({ resource });
      console.log(`Created new spreadsheet with ID: ${ data.spreadsheetId } `);
      return data.spreadsheetId;
    } catch (err) {
      console.log(`error: ${ err } `);
      return err;
    }
  }
  
  
  
  
  