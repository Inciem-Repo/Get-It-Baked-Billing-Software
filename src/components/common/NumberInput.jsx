import { useEffect, useState } from "react";

const NumberInput = ({ value = 0, onChange, className }) => {
  const [inputValue, setInputValue] = useState(String(value ?? 0));

  useEffect(() => {
    setInputValue(String(value ?? 0));
  }, [value]);

  const handleChange = (e) => {
    let val = e.target.value;

    // Allow only numbers and decimals
    if (!/^\d*\.?\d*$/.test(val)) return;

    // Prevent leading zeros (except for decimal values like 0.5)
    if (val.length > 1 && val[0] === "0" && val[1] !== ".") {
      val = val.replace(/^0+/, "");
    }

    setInputValue(val);
    onChange(parseFloat(val) || 0);
  };

  const handleBlur = () => {
    setInputValue(Number(inputValue || 0).toFixed(2));
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

export default NumberInput;
