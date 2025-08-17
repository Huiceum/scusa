export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { form } = event.queryStringParameters;

  // 對應表
  const formMap = {
    sa_submitForm_re : process.env.ADMINISTRATIVE_REFLECT,
    sa_submitForm_times : process.env.ADMINISTRATIVE_TIMES
  };

  const formUrl = formMap[form];
  if (!formUrl) {
    return { statusCode: 400, body: "Invalid form key" };
  }

  try {
    const response = await fetch(formUrl, {
      method: "POST",
      body: event.body,
      headers: {
        "Content-Type": event.headers["content-type"] || "application/x-www-form-urlencoded"
      }
    });

    return {
      statusCode: response.ok ? 200 : response.status,
      body: "Form submitted successfully"
    };
  } catch (error) {
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
}
