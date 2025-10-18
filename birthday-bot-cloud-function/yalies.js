import fetch from "node-fetch";
import { YALIES_API_KEY } from "./secrets.js";

export async function fetchYaliesPeople() {
    const currentDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    const data = {
        filters: {
            school_code: ["YC"],
            birth_month: [month],
            birth_day: [day],
        },
        page: 0,
        page_size: 100,
    };
    const response = await fetch(`https://api.yalies.io/v2/people`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${YALIES_API_KEY}`,
        },
        body: JSON.stringify(data),
    });
    if(!response.ok) {
        const text = await response.text();
        console.error("Error fetching people from Yalies API");
        console.error(text);
        return null;
    }
    const json = await response.json();
    return json;
}
