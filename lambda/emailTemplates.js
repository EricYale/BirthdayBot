export const EMAIL_TEMPLATE_HTML = `
<html>
    <body>
        <p>
            Dear {{FIRST_NAME}},<br>
            I've prepared a poem for you on your special day!
        </p>
        
        <p style="font-family: 'Lucida', serif; font-style: italic; color: #00356b; font-size: 12pt;">
            {{OPENAI_RESPONSE}}
        </p>

        <p>
            Have a great day,<br>
            The
            <a href="https://github.com/Yalies/BirthdayBot" style="color: inherit;">Yale Birthday Bot</a>
        </p>

        <footer style="color: #777777; font-size: 8pt; margin-top: 20px;">
            Your birthday and other data were sourced from Yale's public directory, which you can remove by following
            <a href="https://yalies.io/faq" style="color: inherit;">these instructions</a>.<br>
            ChatGPT is responsible for the contents of this poem. Like what you see? Something not in good taste? Reply to this email with your feedback.<br>
            Maintained by <a href="https://yoonicode.com?utm_source=birthday-mail&utm_medium=email&utm_id=birthday-bot-footer" style="color: inherit;">Eric Yoon '27</a>.<br>
        </footer>
    </body>
</html>
`;
