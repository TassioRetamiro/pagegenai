
import React from 'react';

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {props.required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id}
        {...props}
        className="block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-3"
      />
    </div>
  );
};

export default InputGroup;
