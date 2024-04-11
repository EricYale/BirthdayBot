export const EMAIL_TEMPLATE_HTML = `
<html>
    <body>
        <p>
            Dear {{FIRST_NAME}},<br>
            Here's a special message on your special day, prepared by the Yalies.io team.
        </p>
        
        <p style="font-family: 'Lucida', serif; font-style: italic; color: #00356b; font-size: 12pt;">
            {{OPENAI_RESPONSE}}
        </p>

        <p>
            Have a great day,<br>
            The
            <a href="https://yalies.io" style="color: inherit;">Yalies.io</a>
            team
        </p>

        <footer style="color: #777777; font-size: 8pt; margin-top: 20px;">
            ChatGPT is our muse and is responsible for the poem.<br>
            Your birthday and other data were sourced from Yale's public directory, which you can remove by following
            <a href="https://yalies.io/faq" style="color: inherit;">these instructions</a>.<br>
            <a href="https://github.com/Yalies/BirthdayBot" style="color: inherit;">Check out BirthdayBot on Github.</a>
        </footer>
    </body>
</html>
`;
