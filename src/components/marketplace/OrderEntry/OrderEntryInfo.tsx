export const OrderEntryInfo: React.FC<{
  label: string;
  value: string;
  onClick?: () => void;
  className?: string;
}> = ({ label, value, onClick, className }) => {
  return (
    <div
      className={`flex justify-between text-xs ${className}`}
      onClick={onClick}
    >
      <p>{label}</p>
      <p>{value}</p>
    </div>
  );
};
