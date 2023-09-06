import fs from "fs";

// Function that handles the "amocrm-code" route
async function amocrmCode(req, res) {

    // Getting the auth code
    if (!req.query || !req.query.code) {
        console.log("Invalid amoCRM request");
        console.log(req);
        return;
    }

    const authCode = req.query.code;

    // Fetching access and refresh tokens with the received auth code
    // @ts-ignore
    const tokenInfo = await fetch(`${process.env.AMOCRM_URL}/oauth2/access_token`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "client_id": process.env.AMOCRM_INTEGRATION_ID,
            "client_secret": process.env.AMOCRM_SECRET_KEY,
            "grant_type": "authorization_code",
            "code": authCode,
            "redirect_uri": process.env.AMOCRM_REDIRECT_URI
        })
    })
        .then(res => {
            if (!res.ok) {
                console.log("Could not get tokens");
            }
            return res.json();
        })
        .catch(err => {
            console.log("Could not get tokens");
            console.error(err);
        });

    // Checking if the returned object is correct
    if (!tokenInfo || !tokenInfo.expires_in || !tokenInfo.access_token || !tokenInfo.refresh_token) {
        console.log("Invalid tokenInfo");
        console.log(tokenInfo);
        return;
    }

    // Setting the expiry time and the tokens
    global.AMOCRM_AT = tokenInfo.access_token;
    global.AMOCRM_RT = tokenInfo.refresh_token;
    global.AMOCRM_EXPIRES_AT = (new Date()).getTime() + (tokenInfo.expires_in * 1000);

    saveTokensToFile();
    console.log("Got tokens from auth code");
}

// Function that updates the amoCRM tokens from the refresh token
async function updateTokens(): Promise<boolean> {

    // Pretty much the same as getting them with auth code
    // @ts-ignore
    const tokenInfo = await fetch(`${process.env.AMOCRM_URL}/oauth2/access_token`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "client_id": process.env.AMOCRM_INTEGRATION_ID,
            "client_secret": process.env.AMOCRM_SECRET_KEY,
            "grant_type": "refresh_token",
            "refresh_token": global.AMOCRM_RT,
            "redirect_uri": process.env.AMOCRM_REDIRECT_URI
        })
    })
        .then(res => {
            if (!res.ok) {
                console.log("Could not update tokens");
            }
            return res.json();
        })
        .catch(err => {
            console.log("Could not update tokens");
            console.error(err);
        });

    if (!tokenInfo || !tokenInfo.expires_in || !tokenInfo.access_token || !tokenInfo.refresh_token) {
        console.log("Invalid tokenInfo");
        console.log(tokenInfo);
        return false;
    }

    global.AMOCRM_AT = tokenInfo.access_token;
    global.AMOCRM_RT = tokenInfo.refresh_token;
    global.AMOCRM_EXPIRES_AT = (new Date()).getTime() + (tokenInfo.expires_in * 1000);

    saveTokensToFile();
    console.log("Got tokens from refresh token");
    return true;
}

// Checks amoCRM token expiry time.
// Accounts for extra time that might be needed for a further requests (10 seconds it this case).
function tokenHasExpired() {
    return (global.AMOCRM_EXPIRES_AT - 10000) <= (new Date()).getTime();
}

function readTokensFromFile() {
    fs.readFile("./latest_tokens.json", { encoding: "utf-8"}, (err, data) => {
        if (!err) {
            try {
                const tokenInfo = JSON.parse(data);

                if (tokenInfo.access_token &&
                    tokenInfo.refresh_token &&
                    tokenInfo.expires_at) {

                    global.AMOCRM_AT = tokenInfo.access_token;
                    global.AMOCRM_RT = tokenInfo.refresh_token;
                    global.AMOCRM_EXPIRES_AT = tokenInfo.expires_at;
                }
            } catch (err) {
                return;
            }
        }
    });
}

function saveTokensToFile() {
    const data = JSON.stringify({
        access_token: global.AMOCRM_AT,
        refresh_token: global.AMOCRM_RT,
        expires_at: global.AMOCRM_EXPIRES_AT
    });

    fs.writeFile("./latest_tokens.json", data, (err) => {}); 
}

export { amocrmCode, updateTokens, tokenHasExpired, readTokensFromFile };
