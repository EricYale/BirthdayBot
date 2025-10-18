// Google Cloud Function for Yale Birthday Bot
// Migrated from AWS Lambda, now uses Gemini API and Gmail SMTP

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { EMAIL_TEMPLATE_HTML } from "./emailTemplates.js";
import { GEMINI_API_KEY, AWS_SES_REGION } from "./secrets.js";
import { fetchYaliesPeople } from "./yalies.js";
import fs from "fs";
import path from "path";

const DEBUG_ONLY_PROCESS_ONE_PERSON = false;
const DEBUG_DO_NOT_SEND_MAIL = false;
const DEBUG_SEND_MAIL_TO_ERIC = false;

const awsCredPath = path.resolve("./aws-credentials.json");
let awsCred = JSON.parse(fs.readFileSync(awsCredPath, "utf8"));

const ses = new SESClient({
    region: AWS_SES_REGION,
    credentials: {
        accessKeyId: awsCred.accessKeyId,
        secretAccessKey: awsCred.secretAccessKey,
    },
});
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


async function handlePerson(person) {
    const currentDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));

    // Sanity checks
    if(person.birth_month != currentDate.getMonth() + 1) return;
    if(person.birth_day != currentDate.getDate()) return;

    if(!person.first_name || !person.email) return;
    let emailContent;
    try {
        emailContent = await generateEmailContent(person);
    } catch(e) {
        console.error("Error generating Gemini content for " + person.first_name);
        console.error(e);
    }
    if (!emailContent) return;
    try {
        await sendEmail(emailContent, person);
    } catch(e) {
        console.error("Error sending email to " + person.first_name);
        console.error(e);
    }
}

async function generateEmailContent(person) {
    const systemPrompt = `
    You are the dean of Yale College, emailing students wishing them a happy birthday.
    You are extremely knowledgable about Yale. Yale has 14 residential colleges that undergraduates are sorted into.
    Your goal is to make a personalized poem for each student, referencing things related to their studies.
    You are not allowed to write anything inappropriate, offensive, racist, sexist, homophobic, or otherwise harmful.
    Return ONLY the poem; do not include any sign-offs, closing remarks, etc.
    `;

    let textPrompt = `${person.first_name} is an undergraduate student in Yale College. Write a short poem for them, wishing them a happy birthday. `;

    const rand = Math.random();

    if(rand < 0.33) {
        textPrompt += "Your poem should be in the format of four limericks, although they should not include sexual or suggestive content. There should be a line break between each limerick. ";
        console.log(`Generating limerick for ${person.first_name}`);
    } else if(rand < 0.66) {
        textPrompt += "Your poem should follow an AABB rhyme scheme and be exactly 16 lines long. Break up each group of four lines with a newline character. ";
        console.log(`Generating 16-line AABB poem for ${person.first_name}`);
    } else {
        textPrompt += "Your poem should follow an ABAB rhyme scheme and be exactly 16 lines long. Break up each group of four lines with a newline character. ";
        console.log(`Generating 16-line ABAB poem for ${person.first_name}`);
    }

    if (person.year) textPrompt += `They are in the class of ${person.year}. Include their class year in the poem. `;
    if (person.college) textPrompt += `They are in the ${person.college} residential college. Include their residential college in the poem. `;
    if (person.major && person.major !== "Undeclared") textPrompt += `Their major is ${person.major}. Include their major in the poem. `;
    if(person.address) {
        let addressLastLine = person.address.split("\n").pop();
        addressLastLine = addressLastLine.replace(/\d/g, ""); // Scrub zip code
        textPrompt += `They are from ${addressLastLine}. Include their hometown in the poem. `;
    }
    
    // Gemini SDK call
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt + "\n" + textPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) return null;
    return text;
}

async function sendEmail(emailContent, person) {
    const geminiResponseHtml = emailContent.replace(/\n/g, "<br>");
    const htmlBody = EMAIL_TEMPLATE_HTML
        .replace("{{FIRST_NAME}}", person.first_name)
        .replace("{{OPENAI_RESPONSE}}", geminiResponseHtml);
    const subject = `Happy birthday, ${person.first_name}!`;
    const sendCommand = new SendEmailCommand({
        Destination: {
            BccAddresses: ["celebration@yalebirthdays.com"],
            ToAddresses: DEBUG_SEND_MAIL_TO_ERIC ? ["emjyoon@gmail.com"] : [person.email],
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

export async function birthdayBotGCF(req, res) {
    let people;
    try {
        people = await fetchYaliesPeople();
    } catch (e) {
        console.error("Error fetching people from Yalies API");
        console.error(e);
        res.status(500).send("Error fetching people");
        return;
    }
    if(!people) {
        console.error("No people found, or error fetching people");
        res.status(500).send("No people found");
        return;
    }
    if(DEBUG_ONLY_PROCESS_ONE_PERSON) people = people.slice(0, 1);

    const promises = people.map(handlePerson);
    try {
        await Promise.all(promises);
    } catch (e) {
        console.error(e);
    }
    console.log(`Sent ${promises.length} birthday wishes.`);
    res.status(200).send(`Sent ${promises.length} birthday wishes.`);
}

export default birthdayBotGCF;

// Allow running locally with `node index.js`
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Running birthday bot locally...");
    const mockReq = {};
    const mockRes = {
        status: (code) => ({
            send: (message) => {
                console.log(`Response ${code}: ${message}`);
            }
        })
    };
    birthdayBotGCF(mockReq, mockRes)
        .then(() => console.log("Birthday bot execution completed"))
        .catch((err) => console.error("Error running birthday bot:", err));
}
