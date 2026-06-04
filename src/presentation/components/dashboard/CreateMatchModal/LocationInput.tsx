import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin, faLocationArrow, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

interface Suggestion {
  display_name: string;
  place_id: number;
}

export function LocationInput({ value, onChange, placeholder = 'EX: ARENA NACIONAL...', inputStyle, labelStyle }: Props) {
  const [query,       setQuery]       = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [open,        setOpen]        = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  // Sincroniza se o valor externo muda
  useEffect(() => { setQuery(value); }, [value]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
          { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'PeladeirosProApp/1.0' } }
        );
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 400);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    onChange(v);
    search(v);
  };

  const handleSelect = (s: Suggestion) => {
    // Pega só a parte relevante (nome do local, sem país/estado repetidos)
    const parts = s.display_name.split(', ');
    const short = parts.slice(0, Math.min(3, parts.length)).join(', ');
    setQuery(short);
    onChange(short);
    setSuggestions([]);
    setOpen(false);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return alert('Geolocalização não suportada neste dispositivo.');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'PeladeirosProApp/1.0' } }
          );
          const data = await res.json();
          const addr = data.address;
          // Monta endereço legível
          const name = [
            addr.leisure || addr.amenity || addr.building || addr.road,
            addr.suburb || addr.neighbourhood || addr.city_district,
            addr.city || addr.town || addr.village,
          ].filter(Boolean).join(', ');
          const result = name || data.display_name?.split(', ').slice(0, 3).join(', ') || '';
          setQuery(result);
          onChange(result);
        } catch { alert('Não foi possível obter o endereço.'); }
        finally { setGeoLoading(false); }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) alert('Permissão de localização negada. Habilite nas configurações do navegador.');
        else alert('Não foi possível obter sua localização.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const neon = '#ccff00';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Input + botões */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={placeholder}
            style={{
              width: '100%', padding: '10px 12px', paddingRight: 32,
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 12, fontWeight: 600, outline: 'none',
              boxSizing: 'border-box',
              ...inputStyle,
            }}
          />
          {/* Ícone carregando ou limpar */}
          {query && (
            <button type="button" onClick={() => { setQuery(''); onChange(''); setSuggestions([]); setOpen(false); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}>
              {loading
                ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 10 }} />
                : <FontAwesomeIcon icon={faTimes} style={{ fontSize: 10 }} />}
            </button>
          )}
        </div>
        {/* Botão GPS */}
        <button type="button" onClick={handleGeolocate} disabled={geoLoading}
          title="Usar minha localização atual"
          style={{
            width: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: geoLoading ? `${neon}18` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${geoLoading ? neon + '40' : 'rgba(255,255,255,0.1)'}`,
            color: geoLoading ? neon : 'rgba(255,255,255,0.4)',
            cursor: geoLoading ? 'wait' : 'pointer', transition: 'all 0.15s',
          }}>
          <FontAwesomeIcon icon={geoLoading ? faSpinner : faLocationArrow}
            spin={geoLoading} style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Dropdown de sugestões */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'linear-gradient(160deg,#060f22,#030912)',
          border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none',
          maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {suggestions.map((s, i) => {
            const parts = s.display_name.split(', ');
            const title = parts.slice(0, 2).join(', ');
            const sub   = parts.slice(2, 4).join(', ');
            return (
              <button key={s.place_id} type="button" onClick={() => handleSelect(s)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <FontAwesomeIcon icon={faMapPin} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
                    {title}
                  </p>
                  {sub && (
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
          <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', textAlign: 'right',
            padding: '4px 10px', fontWeight: 700 }}>
            © OpenStreetMap contributors
          </p>
        </div>
      )}
    </div>
  );
}
