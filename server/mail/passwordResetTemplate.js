module.exports = (resetLink) => `
  <div style="font-family: sans-serif; line-height:1.6">
    <h2>Password reset request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>If you did not request this, ignore this email.</p>
  </div>
`;
