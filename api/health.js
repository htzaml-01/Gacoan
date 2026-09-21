module.exports = (req, res) => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const maskedKey = serverKey ? `${serverKey.substring(0, 10)}...${serverKey.substring(serverKey.length - 4)}` : 'NOT_SET';
  res.status(200).json({
    status: 'ok',
    message: 'Vercel Serverless Midtrans API Running',
    hasKey: Boolean(serverKey),
    keyPreview: maskedKey,
    keyLength: serverKey.length,
    nodeEnv: process.env.NODE_ENV
  });
};
