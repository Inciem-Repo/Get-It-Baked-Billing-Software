import { useEffect, useState } from "react";

const NumberInput = ({ value, onChange, className }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e) => {
    let val = e.target.value;

    // Allow only numbers and decimal
    if (!/^\d*\.?\d*$/.test(val)) return;

    // Remove leading zeros (but keep "0" or "0.x")
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
