import { useState, useEffect, useMemo } from "react";

export const MAIN_OP_CH_CODES = ["", "00", "BV"];
const MAIN_PR_CODES = ["PARIS", "LYON", "MARSEILLE"];

type OperationalPoint = {
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
  const [ci, setCi] = useState(initialString);
  const [ch, setCh] = useState(initialChString);
  const [results, setResults] = useState<OperationalPoint[]>(
    []
  );

  const [filteredAndSortedSearchResults, setFilteredAndSortedSearchResults] =
    useState<OperationalPoint[]>([]);

  const debouncedSearchTerm = useDebounce(ci, 150);

  const searchOperationalPoints = async () => {
    try {
      const results = await fetch(`/search/?query=${debouncedSearchTerm}`).then(
        (res) => {
          if (!res.ok) {
            throw new Error(`Error fetching image: ${res.statusText}`);
          }
          return res.json() as Promise<OperationalPoint[]>;
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
        ch &&
        MAIN_OP_CH_CODES.includes(ch) &&
        MAIN_OP_CH_CODES.includes(curr.ch)
      )
        acc.push(curr);

      if (ch === undefined) return acc;

      if (
        curr.ch
          .toLocaleLowerCase()
          .trim()
          .includes(ch.trim().toLowerCase())
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
  }, [results, ch]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchOperationalPoints();
    } else if (results.length !== 0) {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (results.length === 0 && ci !== undefined) setCh(undefined);
  }, [results]);

  return {
    string: ci,
    codeString: ch,
    sortedSearchResults,
    filteredAndSortedSearchResults,
    setCi,
    setCh,
    setResults,
  };
}

const MapSearchOperationalPoint = () => {
  const [selected, setSelected] = useState(-1);
  const {
    string,
    codeString,
    filteredAndSortedSearchResults,
    setCi,
    setCh: setCh,
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
                setCi(e?.target?.value);
                console.log("hello");
              }}
            />
          </span>
          <span>
            <input
              id="operational-point-ch-code"
              type="text"
              onChange={(e) => {
                setCh(e?.target?.value || undefined);
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
