/**
 * return full email body
 * @param {string} partialBody
 */
exports.EmailDetails = (partialBody) => {
  const body = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <meta name="description" content="">
            <meta name="author" content="">
            <link href="https://fonts.googleapis.com/css?family=Muli:200" rel="stylesheet">
            <title>Sterling Shares</title>
        </head>

        <body style="max-width: 600px;margin: 10px auto;padding: 70px;border: 1px solid #ccc;background: #ffffff;color: #4e4e4e;font-family: Muli;">
            <div>
                <div style="margin-bottom: 3rem;">
                    <!-- <img src="" width='120px' alt="Altmall"> -->
                </div>
                ${partialBody}
                <p style="margin-bottom: 2em;line-height: 26px;font-size: 14px;">
                    Cheers, <br>
                    The Sterling Shares Team
                </p>
            </div>
        </body>
        </html>
    `;
  return {
    body
  };
}

