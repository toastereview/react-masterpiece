import { useState, useEffect, useMemo } from "react";

export const MAIN_OP_CH_CODES = ["", "00", "BV"];
const MAIN_PR_CODES = ["PARIS", "LYON", "MARSEILLE"];

type SearchResultItemOperationalPoint = {
  ch: string;
  ci: number;
  name: string;
};

const useDebounce = <T = string | number,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

type SearchOperationalPoint = {
  initialString?: string;
  initialChCodeFilter?: string;
};

function useSearchOperationalPoint({
  initialString = "",
  initialChCodeFilter: initialChString,
}: SearchOperationalPoint = {}) {
  const [string, setString] = useState(initialString);
  const [codeString, setCodeString] = useState(initialChString);
  const [results, setResults] = useState<any[]>([]);

  const [filteredAndSortedSearchResults, setFilteredAndSortedSearchResults] =
    useState<any[]>([]);

  const debouncedSearchTerm = useDebounce(string, 150);

  const searchOperationalPoints = async () => {
    try {
      const results = await fetch(`/search/?query=${debouncedSearchTerm}`).then(
        (res) => {
          if (!res.ok) {
            throw new Error(`Error fetching image: ${res.statusText}`);
          }
          return res.json() as Promise<any[]>;
        }
      );
      setResults(results);
    } catch (error) {
      setResults([]);
    }
  };

  const sortOP = (a: any, b: any) => {
    let result;
    const nameComparison = a.name.localeCompare(b.name);
    if (a.name === b.name) {
      return nameComparison;
    }
    if (MAIN_OP_CH_CODES.includes(a.ch)) {
      result = -1;
    } else if (MAIN_OP_CH_CODES.includes(b.ch)) {
      result = 1;
    } else {
      result = a.ch.localeCompare(b.ch);
    }
    return result;
  };

  const sortedSearchResults = useMemo(() => results.sort(sortOP), [results]);

  function sortResults(results: any[]) {
    const sortResults = [...results].sort(sortOP);
    return sortResults.reduce((acc, curr) => {
      if (
        codeString &&
        MAIN_OP_CH_CODES.includes(codeString) &&
        MAIN_OP_CH_CODES.includes(curr.ch)
      )
        acc.push(curr);

      if (codeString === undefined) return acc;

      if (
        curr.ch
          .toLocaleLowerCase()
          .trim()
          .includes(codeString.trim().toLowerCase())
      )
        acc.push(curr);
      return acc;
    }, []);
  }

  useEffect(() => {
    setFilteredAndSortedSearchResults((prev) => {
      const sortedList = sortResults(results);
      return sortedList;
    });
  }, [results, codeString]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchOperationalPoints();
    } else if (results.length !== 0) {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (results.length === 0 && string !== undefined) setCodeString(undefined);
  }, [results]);

  return {
    string,
    codeString,
    sortedSearchResults,
    filteredAndSortedSearchResults:
      filteredAndSortedSearchResults as SearchResultItemOperationalPoint[],
    setString,
    setCodeString,
    setResults,
  };
}

const MapSearchOperationalPoint = () => {
  const [selected, setSelected] = useState(-1);
  const {
    string,
    codeString,
    filteredAndSortedSearchResults,
    setString,
    setCodeString,
  } = useSearchOperationalPoint();

  const onClick = (index: number) => {
    setSelected(index);
  };

  return (
    <div>
      <div>
        <div>
          <span>
            <input
              id="operational-point-id"
              title="placeholdername"
              type="text"
              value={string}
              onChange={(e) => {
                setSelected(-1);
                setString(e?.target?.value);
                console.log("hello");
              }}
            />
          </span>
          <span>
            <input
              id="operational-point-ch-code"
              type="text"
              onChange={(e) => {
                setCodeString(e?.target?.value || undefined);
                console.log("nice");
              }}
              value={codeString}
            />
          </span>
        </div>
        <div className="search-results">
          {filteredAndSortedSearchResults.map((searchResult, index) => (
            <button
              id={`result-${index}`}
              type="button"
              className={`search-result-item
              ${index === selected && "selected"}
            `}
              onClick={() => onClick(index)}
            >
              <span className="name">{searchResult?.name}</span>
              <span className="uic">{searchResult?.ci}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapSearchOperationalPoint;
