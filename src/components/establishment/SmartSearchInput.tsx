import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, User, Stethoscope, X, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client.browser';
import { getSpecialityInfo } from '@/utils/specialities';

interface SearchSuggestion {
  type: 'location' | 'doctor' | 'speciality' | 'recent';
  value: string;
  display: string;
  icon: React.ReactNode;
  count?: number;
}

interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = "Rechercher par médecin, spécialité, ville...",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    const recent = localStorage.getItem('cureliah_recent_searches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Sauvegarder une recherche récente
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    
    const newRecent = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('cureliah_recent_searches', JSON.stringify(newRecent));
  };

  // Génération intelligente de suggestions
  const generateSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      // Afficher les recherches récentes et suggestions populaires
      const recentSuggestions: SearchSuggestion[] = recentSearches.map(search => ({
        type: 'recent',
        value: search,
        display: search,
        icon: <Clock className="w-4 h-4 text-gray-400" />
      }));

      // Récupérer les suggestions populaires avec les vrais chiffres
      const popularSuggestions: SearchSuggestion[] = [];
      
      // Récupérer les spécialités les plus populaires
      const { data: specialityStats } = await supabase
        .from('doctor_profiles')
        .select('speciality')
        .not('speciality', 'is', null);

      const specialityCounts = new Map<string, number>();
      specialityStats?.forEach(doc => {
        if (doc.speciality) {
          const translated = getSpecialityInfo(doc.speciality).label;
          specialityCounts.set(translated, (specialityCounts.get(translated) || 0) + 1);
        }
      });

      // Ajouter les 3 spécialités les plus populaires
      Array.from(specialityCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .forEach(([speciality, count]) => {
          popularSuggestions.push({
            type: 'speciality',
            value: speciality,
            display: speciality,
            icon: <Stethoscope className="w-4 h-4 text-medical-green-light" />,
            count
          });
        });

      // Récupérer les villes les plus populaires
      const { data: locationStats } = await supabase
        .from('vacation_posts')
        .select('location')
        .not('location', 'is', null);

      const locationCounts = new Map<string, number>();
      locationStats?.forEach(vacation => {
        if (vacation.location) {
          locationCounts.set(vacation.location, (locationCounts.get(vacation.location) || 0) + 1);
        }
      });

      // Ajouter la ville la plus populaire
      const topLocation = Array.from(locationCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topLocation) {
        popularSuggestions.push({
          type: 'location',
          value: topLocation[0],
          display: topLocation[0],
          icon: <MapPin className="w-4 h-4 text-red-500" />,
          count: topLocation[1]
        });
      }

      setSuggestions([...recentSuggestions, ...popularSuggestions]);
      return;
    }

    setLoading(true);
    try {
      const lowerQuery = query.toLowerCase();
      const suggestionSet = new Set<string>();
      const newSuggestions: SearchSuggestion[] = [];

      // Recherche dans les médecins avec comptage des vacations disponibles
      const { data: doctors } = await supabase
        .from('doctor_profiles')
        .select(`
          first_name, 
          last_name, 
          speciality,
          id
        `)
        .or(`first_name.ilike.%${lowerQuery}%,last_name.ilike.%${lowerQuery}%`)
        .limit(5);

      // Pour chaque médecin, compter ses vacations actives
      const doctorsWithCounts = await Promise.all(
        (doctors || []).map(async (doctor) => {
          const { count } = await supabase
            .from('vacation_posts')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', doctor.id)
            .gte('end_date', new Date().toISOString());
          
          return { ...doctor, vacationCount: count || 0 };
        })
      );

      doctorsWithCounts.forEach(doctor => {
        const fullName = `Dr ${doctor.first_name} ${doctor.last_name}`;
        if (!suggestionSet.has(fullName)) {
          suggestionSet.add(fullName);
          newSuggestions.push({
            type: 'doctor',
            value: fullName,
            display: `${fullName} - ${getSpecialityInfo(doctor.speciality).label}`,
            icon: <User className="w-4 h-4 text-medical-blue-light" />,
            count: doctor.vacationCount > 0 ? doctor.vacationCount : undefined
          });
        }
      });

      // Recherche dans les villes (basé sur les vacations existantes)
      const { data: locations } = await supabase
        .from('vacation_posts')
        .select('location')
        .ilike('location', `%${lowerQuery}%`)
        .limit(10);

      const locationCounts = new Map<string, number>();
      locations?.forEach(l => {
        const location = l.location;
        if (location && location.toLowerCase().includes(lowerQuery)) {
          locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
        }
      });

      Array.from(locationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([location, count]) => {
          if (!suggestionSet.has(location)) {
            suggestionSet.add(location);
            newSuggestions.push({
              type: 'location',
              value: location,
              display: location,
              icon: <MapPin className="w-4 h-4 text-red-500" />,
              count
            });
          }
        });

      // Recherche dans les spécialités avec comptage réel
      const { data: allSpecialities } = await supabase
        .from('doctor_profiles')
        .select('speciality')
        .not('speciality', 'is', null);

      const specialityCountsSearch = new Map<string, number>();
      allSpecialities?.forEach(doc => {
        if (doc.speciality) {
          const translated = getSpecialityInfo(doc.speciality).label;
          if (translated.toLowerCase().includes(lowerQuery)) {
            specialityCountsSearch.set(translated, (specialityCountsSearch.get(translated) || 0) + 1);
          }
        }
      });

      Array.from(specialityCountsSearch.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([speciality, count]) => {
          if (!suggestionSet.has(speciality)) {
            suggestionSet.add(speciality);
            newSuggestions.push({
              type: 'speciality',
              value: speciality,
              display: speciality,
              icon: <Stethoscope className="w-4 h-4 text-medical-green-light" />,
              count
            });
          }
        });

      setSuggestions(newSuggestions);
    } catch (error) {
      // TODO: Replace with logger.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSuggestions) {
        generateSuggestions(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, showSuggestions]);

  // Gestion des clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (!showSuggestions) setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    onSuggestionSelect(suggestion);
    saveRecentSearch(suggestion.value);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="w-4 h-4 text-red-500" />;
      case 'doctor': return <User className="w-4 h-4 text-medical-blue-light" />;
      case 'speciality': return <Stethoscope className="w-4 h-4 text-medical-green-light" />;
      case 'recent': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 text-base border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl shadow-sm"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        )}
      </div>

      {showSuggestions && (
        <Card
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 border border-gray-200 shadow-2xl rounded-xl overflow-hidden bg-white"
        >
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Recherche en cours...
                </div>
              </div>
            )}

            {!loading && suggestions.length === 0 && value.trim().length > 0 && (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>Aucune suggestion trouvée</p>
                <p className="text-sm">Essayez un autre terme de recherche</p>
              </div>
            )}

            {!loading && suggestions.length === 0 && !value.trim() && (
              <div className="p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Suggestions populaires</p>
                <div className="space-y-1">
                  {['Cardiologie', 'Paris', 'Orthopédie'].map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick({
                        type: 'speciality',
                        value: term,
                        display: term,
                        icon: getSuggestionIcon('speciality')
                      })}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      {getSuggestionIcon('speciality')}
                      <span className="text-gray-700">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="py-2">
                {recentSearches.length > 0 && value.trim().length === 0 && (
                  <>
                    <div className="px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-100">
                      Recherches récentes
                    </div>
                    {suggestions
                      .filter(s => s.type === 'recent')
                      .map((suggestion, index) => (
                        <button
                          key={`recent-${index}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-b-0"
                        >
                          {suggestion.icon}
                          <span className="text-gray-700">{suggestion.display}</span>
                        </button>
                      ))}
                    {suggestions.some(s => s.type !== 'recent') && (
                      <div className="px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-100 mt-2">
                        Suggestions
                      </div>
                    )}
                  </>
                )}
                
                {suggestions
                  .filter(s => s.type !== 'recent')
                  .map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        {suggestion.icon}
                        <span className="text-gray-700">{suggestion.display}</span>
                      </div>
                      {suggestion.count && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
