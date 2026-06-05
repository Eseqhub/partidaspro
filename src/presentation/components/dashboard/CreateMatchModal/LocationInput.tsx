import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin, faLocationArrow, faSpinner, faTimes, faClock, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Props {
  value: string;
  onChange: (v: string) => void;
  groupId?: string;          // para salvar locais por clube
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}

interface Suggestion {
  display_name: string;
  place_id: number;
}

interface SavedLocation {
  name: string;
  city: string;
  savedAt: number;
}

const STORAGE_KEY = (gid?: string) => `pp_locations${gid ? `:${gid}` : ''}`;

function loadSaved(gid?: string): SavedLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(gid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocation(name: string, gid?: string) {
  if (!name.trim()) return;
  const list = loadSaved(gid).filter(l => l.name !== name);
  // Extrai cidade aproximada (último token relevante)
  const parts = name.split(',');
  const city  = parts.length >= 2 ? parts[parts.length - 2].trim() : '';
  list.unshift({ name: name.trim(), city, savedAt: Date.now() });
  const deduped = list.slice(0, 20); // máx 20 locais
  try { localStorage.setItem(STORAGE_KEY(gid), JSON.stringify(deduped)); } catch {}
}

function removeLocation(name: string, gid?: string) {
  const list = loadSaved(gid).filter(l => l.name !== name);
  try { localStorage.setItem(STORAGE_KEY(gid), JSON.stringify(list)); } catch {}
}

function groupByCity(locations: SavedLocation[]) {
  const map = new Map<string, SavedLocation[]>();
  locations.forEach(l => {
    const key = l.city || 'Outros';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  });
  return map;
}

export function LocationInput({ value, onChange, groupId, placeholder = 'Buscar arena, clube, quadra...' }: Props) {
  const [query,       setQuery]       = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [open,        setOpen]        = useState(false);
  const [saved,       setSaved]       = useState<SavedLocation[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => { setSaved(loadSaved(groupId)); }, [groupId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
          { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'PeladeirosProApp/1.0' } }
        );
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 400);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    onChange(v);
    search(v);
    setOpen(true);
  };

  const handleSelect = (name: string) => {
    const parts = name.split(', ');
    const short = parts.slice(0, Math.min(3, parts.length)).join(', ');
    setQuery(short);
    onChange(short);
    saveLocation(short, groupId);
    setSaved(loadSaved(groupId));
    setSuggestions([]);
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    removeLocation(name, groupId);
    setSaved(loadSaved(groupId));
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return alert('Geolocalização não suportada.');
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
          const name = [
            addr.leisure || addr.amenity || addr.building || addr.road,
            addr.suburb || addr.neighbourhood || addr.city_district,
            addr.city || addr.town || addr.village,
          ].filter(Boolean).join(', ');
          const result = name || data.display_name?.split(', ').slice(0, 3).join(', ') || '';
          setQuery(result);
          onChange(result);
          saveLocation(result, groupId);
          setSaved(loadSaved(groupId));
        } catch { alert('Não foi possível obter o endereço.'); }
        finally { setGeoLoading(false); }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) alert('Permissão negada. Habilite localização nas configurações.');
        else alert('Não foi possível obter sua localização.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const neon    = '#ccff00';
  const hasSaved = saved.length > 0;
  const showDropdown = open && (suggestions.length > 0 || (hasSaved && query.length === 0));
  const cityGroups = groupByCity(saved);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Input + GPS */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={query}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            style={{
              width: '100%', padding: '10px 32px 10px 12px',
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 12, fontWeight: 600, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); onChange(''); setSuggestions([]); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}>
              {loading
                ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 10 }} />
                : <FontAwesomeIcon icon={faTimes} style={{ fontSize: 10 }} />}
            </button>
          )}
        </div>
        <button type="button" onClick={handleGeolocate} disabled={geoLoading} title="Usar minha localização"
          style={{ width: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: geoLoading ? `${neon}18` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${geoLoading ? neon + '40' : 'rgba(255,255,255,0.1)'}`,
            color: geoLoading ? neon : 'rgba(255,255,255,0.4)', cursor: geoLoading ? 'wait' : 'pointer' }}>
          <FontAwesomeIcon icon={geoLoading ? faSpinner : faLocationArrow} spin={geoLoading} style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'linear-gradient(160deg,#07111f,#030912)',
          border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none',
          maxHeight: 280, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}>

          {/* Locais salvos — quando sem query ativo */}
          {query.length < 3 && hasSaved && (
            <>
              <div style={{ padding: '7px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FontAwesomeIcon icon={faClock} style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>Locais salvos</span>
              </div>
              {Array.from(cityGroups.entries()).map(([city, locs]) => (
                <div key={city}>
                  {cityGroups.size > 1 && (
                    <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: 7, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '0.2em', color: neon + '99' }}>
                        📍 {city}
                      </span>
                    </div>
                  )}
                  {locs.map(l => (
                    <div key={l.name}
                      style={{ display: 'flex', alignItems: 'center', padding: '9px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                        transition: 'background 0.1s' }}
                      onClick={() => handleSelect(l.name)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <FontAwesomeIcon icon={faMapPin} style={{ fontSize: 10, color: neon + '80',
                        marginRight: 10, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#fff',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.name}
                      </span>
                      <button type="button" onClick={e => handleRemove(e, l.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(255,255,255,0.2)', padding: '2px 4px', flexShrink: 0 }}
                        title="Remover">
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 9 }} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            </>
          )}

          {/* Sugestões do OpenStreetMap */}
          {suggestions.map((s, i) => {
            const parts = s.display_name.split(', ');
            const title = parts.slice(0, 2).join(', ');
            const sub   = parts.slice(2, 4).join(', ');
            return (
              <div key={s.place_id}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                  cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.1s' }}
                onClick={() => handleSelect(s.display_name)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <FontAwesomeIcon icon={faMapPin} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
                    {title}
                  </p>
                  {sub && (
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.1)', textAlign: 'right',
            padding: '4px 10px', fontWeight: 700 }}>© OpenStreetMap contributors</p>
        </div>
      )}
    </div>
  );
}
