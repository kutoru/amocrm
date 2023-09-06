
// Get contact from amoCRM by query. Query can be name, email or phone
async function getContact(query: string) {

    // @ts-ignore
    return fetch(`${process.env.AMOCRM_URL}/api/v4/contacts?query=${query}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${global.AMOCRM_AT}`
        }
    })
        .then(res =>{
            if (!res.ok) {
                console.log("Could not get contact info");
                console.log(res);
            } else if (res.status === 200) {
                return res.json();
            }
        })
        .catch(err => {
            console.log("Could not get contact info");
            console.error(err);
        });
}

// Add contact to amoCRM
async function addContact(name: string, email: string, phone: string) {

    // @ts-ignore
    return fetch(`${process.env.AMOCRM_URL}/api/v4/contacts`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": `Bearer ${global.AMOCRM_AT}`
        },
        body: JSON.stringify([{
            "name": name,
            "custom_fields_values": [
                {
                    "field_code": "EMAIL",
                    "values": [{ "value": email }]
                },
                {
                    "field_code": "PHONE",
                    "values": [{ "value": phone }]
                }
            ]
        }])
    })
        .then(res =>{
            if (!res.ok) {
                console.log("Could not add new contact info");
                console.log(res);
            } else {
                return res.json();
            }
        })
        .catch(err => {
            console.log("Could not add new contact info");
            console.error(err);
        });
}

// Update contact by their id
async function updateContact(contactId: number, name: string, email: string, phone: string) {

    // @ts-ignore
    return fetch(`${process.env.AMOCRM_URL}/api/v4/contacts/${contactId}`, {
        method: "PATCH",
        headers: {
            "content-type": "application/json",
            "Authorization": `Bearer ${global.AMOCRM_AT}`
        },
        body: JSON.stringify({
            "id": contactId,
            "name": name,
            "custom_fields_values": [
                {
                    "field_code": "EMAIL",
                    "values": [{ "value": email }]
                },
                {
                    "field_code": "PHONE",
                    "values": [{ "value": phone }]
                }
            ]
        })
    })
        .then(res =>{
            if (!res.ok) {
                console.log("Could not update contact info");
                console.log(res);
            } else {
                return res.json();
            }
        })
        .catch(err => {
            console.log("Could not update contact info");
            console.error(err);
        });
}

export { getContact, addContact, updateContact };
