module.exports = (otp) => `
  <div style="font-family: sans-serif; line-height:1.6">
    <h2>Your verification code</h2>
    <p>Use the following code to verify your email:</p>
    <pre style="font-size:20px; background:#f4f4f4; padding:8px; display:inline-block">${otp}</pre>
    <p>If you did not request this, ignore this email.</p>
  </div>
`;
