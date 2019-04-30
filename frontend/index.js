
// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/gmail.send';

var authorizeButton = document.getElementById('authorize_button');
var analysisButton = document.getElementById('analysis_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    analysisButton.onclick = handleAnalysisClick;
    signoutButton.onclick = handleSignoutClick;
  }, function (error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.disabled = true;
    analysisButton.disabled = false;
    signoutButton.disabled = false;
  } else {
    authorizeButton.disabled = false;
    analysisButton.disabled = true;
    signoutButton.disabled = true;
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 *  Triggers the analysis HTTP Request.
 */
function handleAnalysisClick(event) {
  console.log("handle the analysis")
  document.getElementById('spinner').classList.add('is-active');
  const resultElement = document.getElementById('result');
  fetch('http://us-central1-serverless-demos-234923.cloudfunctions.net/githubChart').then(response => {
    console.log('fetching all the things');
    console.log(response);
    document.getElementById('spinner').classList.remove('is-active');
    if (!response.ok) {
      console.log(`Wrong status code ${response.status}`);
      resultElement.innerHTML = "Sorry, something went wrong"
    }
    response.text().then(link => {
      console.log('this is the content:')
      console.log(link);
      const sheetLink = document.createElement('a')
      sheetLink.setAttribute('href', link);
      sheetLink.innerHTML = 'here';
      resultElement.innerHTML = `Response OK, get your sheet `;
      resultElement.appendChild(sheetLink);
      sendEmail();
    });
  }).catch(err => {
    alert(err);
    console.log(err);
    console.log('Error while triggering Cloud Function')
  })

}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/**
 * Print all Labels in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */
function sendEmail() {
  let rawEmail = createEmail();
  gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': { 'raw': rawEmail },
  }).then(function (response) {
    console.log("Email sent successfully.")
    console.log(response);
  }).catch(function (error) {
    console.log('Error sending email');
    console.log(error);
  });
}


function createEmail() {
  const email_lines = [];

  email_lines.push('From: asrivast@google.com');
  email_lines.push('To: franzih@google.com');
  email_lines.push('Content-type: text/html;charset=iso-8859-1');
  email_lines.push('MIME-Version: 1.0');
  email_lines.push('Subject: Hello via the Gmail API!');
  email_lines.push('');
  email_lines.push('testing testing');
  email_lines.push('Node is hard');

  const email = email_lines.join('\r\n').trim();

  let base64EncodedEmail = btoa(email);
  console.log(base64EncodedEmail);
  // base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');
  return base64EncodedEmail;
}
