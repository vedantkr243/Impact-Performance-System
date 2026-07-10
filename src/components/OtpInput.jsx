import OTPInput from "react-otp-input";

function OtpInput({ value, onChange, disabled = false }) {
  return (
    <OTPInput
      value={value}
      onChange={onChange}
      numInputs={6}
      shouldAutoFocus
      inputType="tel"
      renderInput={(inputProps) => (
        <input
          {...inputProps}
          className="otp-box"
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      )}
      containerStyle="otp-input-row"
    />
  );
}

export default OtpInput;
