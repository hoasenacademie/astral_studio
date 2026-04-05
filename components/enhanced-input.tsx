"use client";
import { useState, useEffect, useRef } from "react";
import locationsData from "../data/locations.json";

// Liste étendue de communes françaises
const frenchCities = locationsData.cities;
const postalCodes = locationsData.postalCodes;

interface EnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type: "date" | "time" | "place";
}

export function EnhancedInput({ value, onChange, placeholder, type }: EnhancedInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const dedupeSuggestions = (items: string[]) => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of items) {
      const key = item.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(item.trim());
    }
    return unique;
  };

  const formatDate = (input: string) => {
    // Supprimer tous les caractères non numériques
    const cleaned = input.replace(/\D/g, "");

    // Limiter à 8 chiffres maximum (jjmmyyyy)
    const limited = cleaned.slice(0, 8);

    // Ajouter les séparateurs automatiquement
    if (limited.length >= 2) {
      if (limited.length >= 4) {
        if (limited.length >= 6) {
          return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
        }
        return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
      }
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    }
    return limited;
  };

  const formatTime = (input: string) => {
    // Supprimer tous les caractères non numériques
    const cleaned = input.replace(/\D/g, "");

    // Limiter à 4 chiffres maximum (hhmm)
    const limited = cleaned.slice(0, 4);

    // Ajouter automatiquement "h" et formater
    if (limited.length >= 2) {
      const hours = limited.slice(0, 2);
      const minutes = limited.slice(2, 4);

      // Validation basique des heures (00-23) et minutes (00-59)
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes || "0", 10);

      if (hoursNum >= 0 && hoursNum <= 23 && minutesNum >= 0 && minutesNum <= 59) {
        return minutes ? `${hours}h${minutes}` : `${hours}h`;
      }
    }
    return limited;
  };

  const getPlaceSuggestions = (input: string) => {
    if (!input.trim()) return [];

    const trimmedInput = input.trim();
    const lowerInput = trimmedInput.toLowerCase();

    // Vérifier si c'est un code postal (commence par des chiffres)
    const isPostalCodeInput = /^\d+/.test(trimmedInput);

    if (isPostalCodeInput) {
      // Recherche par code postal (commence par la saisie)
      const postalMatches = postalCodes
        .filter(pc => pc.code.startsWith(trimmedInput))
        .map(pc => `${pc.code} ${pc.city}`)
        .slice(0, 10);

      // Si on a des correspondances de codes postaux, les retourner
      if (postalMatches.length > 0) {
        return dedupeSuggestions(postalMatches);
      }

      // Sinon, rechercher dans les noms de villes des codes postaux
      const cityMatches = postalCodes
        .filter(pc => pc.city.toLowerCase().includes(lowerInput))
        .map(pc => `${pc.code} ${pc.city}`)
        .slice(0, 10);

      if (cityMatches.length > 0) {
        return dedupeSuggestions(cityMatches);
      }
    }

    // Recherche améliorée par nom de ville
    const allMatches = frenchCities
      .filter(city => {
        const cityLower = city.toLowerCase();
        // Recherche par début de mot ou inclusion complète
        return cityLower.startsWith(lowerInput) ||
               cityLower.includes(lowerInput) ||
               // Recherche par mots séparés (pour "mont marsan" -> trouve "Mont-de-Marsan")
               lowerInput.split(' ').every(word =>
                 cityLower.includes(word) ||
                 city.replace(/-/g, ' ').toLowerCase().includes(word)
               );
      })
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        // Priorité 1: commence exactement par la saisie
        const aStarts = aLower.startsWith(lowerInput);
        const bStarts = bLower.startsWith(lowerInput);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Priorité 2: contient tous les mots de la saisie
        const inputWords = lowerInput.split(' ');
        const aContainsAll = inputWords.every(word =>
          aLower.includes(word) || a.replace(/-/g, ' ').toLowerCase().includes(word)
        );
        const bContainsAll = inputWords.every(word =>
          bLower.includes(word) || b.replace(/-/g, ' ').toLowerCase().includes(word)
        );
        if (aContainsAll && !bContainsAll) return -1;
        if (!aContainsAll && bContainsAll) return 1;

        // Priorité 3: longueur du nom (plus court = mieux)
        return a.length - b.length;
      })
      .slice(0, 10);

    return dedupeSuggestions(allMatches);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (type === "date") {
      newValue = formatDate(newValue);
    } else if (type === "time") {
      newValue = formatTime(newValue);
    }

    setInputValue(newValue);

    if (type === "place") {
      const suggestions = getPlaceSuggestions(newValue);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Délai pour permettre la sélection
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onChange(inputValue);
    }, 150);
  };

  const handleFocus = () => {
    if (type === "place" && inputValue) {
      const suggestions = getPlaceSuggestions(inputValue);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    }
  };

  return (
    <div className="enhanced-input-container">
      <input
        ref={inputRef}
        type="text"
        className="input"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        maxLength={type === "date" ? 10 : type === "time" ? 5 : undefined}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion}-${index}`}
              className={`suggestion-item ${index === selectedIndex ? "selected" : ""}`}
              onMouseDown={() => selectSuggestion(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
