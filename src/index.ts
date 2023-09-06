import express from "express";
import dotenv from "dotenv";
import { amocrmCode, readTokensFromFile } from "./tokens";
import { lead } from "./lead";

// amoCRM access and refresh tokens and the token expiry time
global.AMOCRM_AT = undefined;
global.AMOCRM_RT = undefined;
global.AMOCRM_EXPIRES_AT = 0;

async function main() {

    // Loading .env file
    dotenv.config();

    // Assigning tokens from file if they are valid.
    // Otherwise this server will have to wait until it receives the amoCRM auth code.
    readTokensFromFile();

    // Preparing the server
    const app = express();
    const PORT = 4444;
    app.use(express.json());

    // Route that receives amoCRM auth code and sets the tokens after receiving it
    app.get("/amocrm-code", amocrmCode);

    // Route that receives name, email and phone
    // Example request: https://obliging-raccoon-positively.ngrok-free.app/lead?name=examplename&email=example@gmail.com&phone=87279067635
    app.get("/lead", lead);

    app.listen(PORT, () => {
        console.log("Server is listening on port " + PORT);
    });
}

main();
