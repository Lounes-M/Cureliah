
interface SearchResultsHeaderProps {
  count: number;
}

export const SearchResultsHeader = ({ count }: SearchResultsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">
        {count} vacation{count > 1 ? 's' : ''} trouvée{count > 1 ? 's' : ''}
      </h2>
    </div>
  );
};
