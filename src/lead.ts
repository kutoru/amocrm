import { updateTokens, tokenHasExpired } from "./tokens";
import { getContact, addContact, updateContact } from "./contacts";

// Function that handles the "lead" route
async function lead(req, res) {

    // Checking if amoCRM tokens exist.
    // If they don't, this server never received an authorization code from amoCRM
    if (!global.AMOCRM_AT || !global.AMOCRM_RT) {
        res.statusCode = 500;
        res.json({
            success: false,
            message: "tokens for amoCRM are missing"
        });
        return;
    }

    // Checking if the request is valid
    const name = req.query.name;
    const email = req.query.email;
    const phone = req.query.phone;

    if (name === undefined ||
        email === undefined ||
        phone === undefined) {
        res.statusCode = 400;
        res.json({
            success: false,
            message: "missing one of the following fields: name, email or phone"
        });
        return;
    }

    // Checking if the tokens has expired, trying to update them if they are
    if (tokenHasExpired()) {
        const success = await updateTokens();
        if (!success) {
            res.statusCode = 500;
            res.json({
                success: false,
                message: "failed to update amoCRM tokens"
            });
            return;
        }
    }

    // Trying to get the contact from amoCRM either from email or from phone
    let contactId = -1;

    let result = await getContact(email);
    if (!result) {
        result = await getContact(phone);
    }

    // If it does exist, updating it
    if (result) {
        contactId = result["_embedded"].contacts[0].id;
        result = await updateContact(contactId, name, email, phone);

        if (!result) {
            res.statusCode = 500;
            res.json({
                success: false,
                message: "failed to update contact"
            });
            return;
        }

        console.log("Updated contact with id:", contactId);
    }

    // If it doesn't exist, adding it
    if (!result) {
        result = await addContact(name, email, phone);

        if (!result) {
            res.statusCode = 500;
            res.json({
                success: false,
                message: "failed to add new contact"
            });
            return;
        }

        contactId = result["_embedded"].contacts[0].id;
        console.log("Created contact with id:", contactId);
    }

    // Creating a new lead
    result = await createLead(contactId);
    if (!result) {
        res.statusCode = 500;
        res.json({
            success: false,
            message: "failed to create new lead"
        });
        return;
    }
    const leadId = result["_embedded"].leads[0].id;
    console.log("Created lead with id:", leadId)

    // Preparing and sending the response
    const resBody = {
        success: true,
        contactId: contactId,
        leadId: leadId
    }

    res.statusCode = 200;
    res.json(resBody);
}

// Function that adds a new lead to amoCRM
async function createLead(contactId: number) {

    // @ts-ignore
    return fetch(`${process.env.AMOCRM_URL}/api/v4/leads`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": `Bearer ${global.AMOCRM_AT}`
        },
        body: JSON.stringify([{
            "_embedded": {
                "contacts": [
                    { "id": contactId }
                ]
            }
        }])
    })
        .then(res =>{
            if (!res.ok) {
                console.log("Could not create a lead");
                console.log(res);
            } else {
                return res.json();
            }
        })
        .catch(err => {
            console.log("Could not create a lead");
            console.error(err);
        });
}

export { lead };
