module.exports = async (req, res) => {
  const info = {
    keys: Object.keys(req),
    hasRawBody: typeof req.rawBody,
    hasBody: typeof req.body,
    bodyType: typeof req.body,
    bodyIsString: typeof req.body === 'string',
    headers: {
      'resend-signature': req.headers['resend-signature'] || null,
      'content-type': req.headers['content-type'] || null,
    },
  };
  return res.status(200).json(info);
};
