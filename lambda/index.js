import { YALIES_API_KEY, OPENAI_API_KEY, AWS_SES_REGION } from "./secrets.js";
import OpenAI from "openai";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { EMAIL_TEMPLATE_HTML } from "./emailTemplates.js";

const DEBUG_ONLY_PROCESS_ONE_PERSON = false;
const DEBUG_DO_NOT_SEND_MAIL = false;
const DEBUG_SEND_MAIL_TO_ERIC = false;

const ses = new SESClient({ region: AWS_SES_REGION });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function fetchYaliesPeople() {
    const data = {
        boost_birthdays: true,
        filters: {
            school_code: ["YC"],
        },
        page: 1,
        page_size: 1,
    };
    const response = await fetch(`https://yalies.io/api/people`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${YALIES_API_KEY}`,
        },
        body: JSON.stringify(data),
    });
    const json = await response.json();
    return json;
}

async function debug_fetchPersonByQuery(query) {
    const data = {
        filters: {
            school_code: ["YC"],
        },
        query,
        page: 1,
        page_size: 1,
    };
    const response = await fetch(`https://yalies.io/api/people`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${YALIES_API_KEY}`,
        },
        body: JSON.stringify(data),
    });
    const json = await response.json();
    return json;
}

async function handlePerson(person) {
    const currentDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    if(person.birth_month != currentDate.getMonth() + 1) return;
    if(person.birth_day != currentDate.getDate()) return;

    if(!person.first_name || !person.email) return;
    const emailContent = await generateEmailContent(person);
    if (!emailContent) return;
    await sendEmail(emailContent, person);
}

async function generateEmailContent(person) {
    const systemPrompt = `
    You are the dean of Yale College, emailing students wishing them a happy birthday.
    You are extremely knowledgable about Yale. Yale has 14 residential colleges that undergraduates are sorted into.
    Your goal is to make a personalized poem for each student, referencing things related to their studies.
    You are not allowed to write anything inappropriate, offensive, racist, sexist, homophobic, or otherwise harmful.
    `;

    let textPrompt = `${person.first_name} is an undergraduate student in Yale College. Write a 10 to 20 line poem for them, wishing them a happy birthday. `;
    // textPrompt += `If possible, include a tasteful, respectful, and appropriate pun involving their name. `;
    if (person.year) textPrompt += `They are in the class of ${person.year}. Include their class year in the poem. `;
    if (person.college) textPrompt += `They are in the ${person.college} residential college. Include their residential college in the poem. `;
    if (person.major && person.major !== "Undeclared") textPrompt += `Their major is ${person.major}. Include their major in the poem. `;
    if(person.address) {
        let addressLastLine = person.address.split("\n").pop();
        addressLastLine = addressLastLine.replace(/\d/g, ""); // Scrub zip code
        textPrompt += `They are from ${addressLastLine}. Include their hometown in the poem. `;
    }
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: textPrompt },
        ],
    });
    if (response.choices.length === 0) return null;
    if (!response.choices[0].message || !response.choices[0].message.content) return null;

    return response.choices[0].message.content;
}

async function sendEmail(emailContent, person) {
    const openaiResponseHtml = emailContent.replace(/\n/g, "<br>");
    const htmlBody = EMAIL_TEMPLATE_HTML
        .replace("{{FIRST_NAME}}", person.first_name)
        .replace("{{OPENAI_RESPONSE}}", openaiResponseHtml);
    const subject = `Happy birthday, ${person.first_name}!`;
    const sendCommand = new SendEmailCommand({
        Destination: {
            BccAddresses: ["celebration@yalebirthdays.com"],
            ToAddresses: DEBUG_SEND_MAIL_TO_ERIC ? ["eric.yoon@yale.edu"] : [person.email],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: htmlBody,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: subject,
            },
        },
        Source: `"Yale Birthdays" <celebration@yalebirthdays.com>`,
    });
    console.log(`Sending email to ${person.email}: ${subject}`);
    if(!DEBUG_DO_NOT_SEND_MAIL) await ses.send(sendCommand);
}

export const handler = async (event, context) => {
    let people;
    try {
        people = await fetchYaliesPeople();
    } catch (e) {
        console.error("Error fetching people from Yalies API");
        console.error(e);
    }
    if(DEBUG_ONLY_PROCESS_ONE_PERSON) people = people.slice(0, 1);

    const promises = people.map(handlePerson);
    try {
        await Promise.all(promises);
    } catch (e) {
        console.error(e);
    }
    console.log(`Sent ${promises.length} birthday wishes.`);
    return context.logStreamName;
};
