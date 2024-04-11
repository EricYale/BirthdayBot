import { YALIES_API_KEY, OPENAI_API_KEY, AWS_REGION } from "./secrets.js";
import OpenAI from "openai";
import { SESClient } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: AWS_REGION });
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

async function handlePerson(person) {
    const emailContent = await generateEmailContent(person);
    if(!emailContent) return;
    

}

async function generateEmailContent(person) {
    if(!person.first_name) return null;
    const systemPrompt = `
    You are the dean of Yale College, emailing students wishing them a happy birthday.
    You are extremely knowledgable about Yale. Yale has 14 residential colleges that undergraduates are sorted into.
    Your goal is to make a personalized poem for each student, referencing things related to their major or residential college.
    `;
    
    let textPrompt = `${person.first_name} is an undergraduate student in Yale College. Write a 5 to 15 line poem for them, wishing them a happy birthday. `;
    if(person.year) textPrompt += `They are in the class of ${person.year}. Include their class year in the poem. `;
    if(person.college) textPrompt += `They are in the ${person.college} residential college. Include their residential college in the poem. `;
    if(person.major && person.major !== "Undeclared") textPrompt += `Their major is ${person.major}. Include their major in the poem. `;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: systemPrompt},
            { role: "user", content: textPrompt},
        ],
    });
    if(response.choices.length === 0) return null;
    if(!response.choices[0].message || !response.choices[0].message.content) return null;

    return response.choices[0].message.content;
}

async function sendEmail(emailContent, person) {
    
}

export const handler = async (event, context) => {
    let people;
    try {
        people = await fetchYaliesPeople();
    } catch(e) {
        console.error("Error fetching people from Yalies API");
        console.error(e);
    }
    const promises = people.map(handlePerson);
    
    let results;
    try {
        results = await Promise.all(promises);
    } catch(e) {
        console.error(e);
    }
    console.log(results);
    return context.logStreamName;
};
