import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WeatherCondition, WindRouteRecommendation, TrainingLocation } from '../types';
import { 
  Wind, 
  Compass, 
  Sun, 
  Moon, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation, 
  ArrowUpRight, 
  Mountain,
  Maximize2
} from 'lucide-react';

interface WindHeadingMapProps {
  location: TrainingLocation;
  weather: WeatherCondition;
  windRec: WindRouteRecommendation;
  targetDistanceKm: number;
  departureHour: string;
  estimatedArrivalHour: string;
  nightRisk: boolean;
  nightWarning?: string;
}

export const WindHeadingMap: React.FC<WindHeadingMapProps> = ({
  location,
  weather,
  windRec,
  targetDistanceKm,
  departureHour,
  estimatedArrivalHour,
  nightRisk,
  nightWarning
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([location.lat, location.lng], 11);

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    map.setView([location.lat, location.lng], 11);

    // Custom Cyclist Pin for User Location
    const userPinHtml = `
      <div style="
        background: #10b981;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
      ">
        🚴
      </div>
    `;

    const userIcon = L.divIcon({
      html: userPinHtml,
      className: 'custom-user-marker',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const marker = L.marker([location.lat, location.lng], { icon: userIcon }).addTo(layers);
    marker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
        <strong style="color: #065f46; font-size: 14px;">Point de départ : ${location.city}</strong><br/>
        Code postal : ${location.postalCode}<br/>
        Vent mesuré : <strong>${weather.windSpeedKmh} km/h</strong> (${weather.windDirectionCardinal})
      </div>
    `).openPopup();

    // Calculate endpoint vectors for outbound (into wind) & inbound (tailwind)
    // Distance on map: rough conversion (1 deg lat ~ 111km)
    // We visually project an outward arrow proportional to target distance (e.g. 15 to 25 km from center)
    const arrowDistanceKm = Math.min(Math.max(targetDistanceKm * 0.45, 12), 35);
    const radOutbound = (windRec.outboundHeadingDeg * Math.PI) / 180;
    const radReturn = (windRec.returnHeadingDeg * Math.PI) / 180;

    // Outbound endpoint (Face au vent)
    const latOut = location.lat + (arrowDistanceKm / 111) * Math.cos(radOutbound);
    const lngOut = location.lng + (arrowDistanceKm / (111 * Math.cos((location.lat * Math.PI) / 180))) * Math.sin(radOutbound);

    // Inbound endpoint (Vent dans le dos)
    const latIn = location.lat + (arrowDistanceKm / 111) * Math.cos(radReturn);
    const lngIn = location.lng + (arrowDistanceKm / (111 * Math.cos((location.lat * Math.PI) / 180))) * Math.sin(radReturn);

    // Outbound Line (Red / Orange -> Headwind resistance)
    const outboundPoly = L.polyline([[location.lat, location.lng], [latOut, lngOut]], {
      color: '#f97316',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 8'
    }).addTo(layers);

    // Return Line (Green -> Tailwind assist)
    const returnPoly = L.polyline([[location.lat, location.lng], [latIn, lngIn]], {
      color: '#10b981',
      weight: 5,
      opacity: 0.9,
      dashArray: '4, 8'
    }).addTo(layers);

    // Outbound Marker (Face au vent)
    const outboundPinHtml = `
      <div style="
        background: #ea580c;
        padding: 4px 8px;
        border-radius: 12px;
        color: white;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid white;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        💨 ALLER : Face au vent (${windRec.outboundHeadingDeg}°)
      </div>
    `;
    L.marker([latOut, lngOut], {
      icon: L.divIcon({ html: outboundPinHtml, className: 'heading-out-label', iconAnchor: [50, 15] })
    }).addTo(layers);

    // Return Marker (Vent de dos)
    const returnPinHtml = `
      <div style="
        background: #059669;
        padding: 4px 8px;
        border-radius: 12px;
        color: white;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid white;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        🚀 RETOUR : Vent dans le dos (${windRec.returnHeadingDeg}°)
      </div>
    `;
    L.marker([latIn, lngIn], {
      icon: L.divIcon({ html: returnPinHtml, className: 'heading-in-label', iconAnchor: [50, 15] })
    }).addTo(layers);

    // Safe view bounds
    const bounds = L.latLngBounds([[location.lat, location.lng], [latOut, lngOut], [latIn, lngIn]]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [location, weather, windRec, targetDistanceKm]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/60 to-white">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-duo-green" />
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              Orientation Météo & Stratégie Face au Vent
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Règle d’or cycliste : Première moitié face au vent, deuxième moitié poussé par le vent.
          </p>
        </div>

        {/* Live Wind Tag */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <Wind className="w-4 h-4 text-sky-600 animate-pulse" />
          <div className="text-xs">
            <span className="font-extrabold text-slate-800">{weather.windSpeedKmh} km/h</span>
            <span className="text-slate-400 font-medium"> (rafales {weather.windGustsKmh} km/h)</span>
            <span className="text-emerald-700 font-bold ml-1">• {weather.windDirectionCardinal}</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-80 sm:h-96 z-0 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Compass Rose overlay in top right */}
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg text-center flex flex-col items-center">
          <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Girouette Vent</div>
          <div
            className="w-12 h-12 rounded-full border-2 border-dashed border-sky-400 flex items-center justify-center transition-transform duration-700 bg-sky-50"
            style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
          >
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[20px] border-b-sky-600 -translate-y-1" />
          </div>
          <div className="text-[11px] font-black text-sky-800 mt-1">{weather.windDirectionDeg}°</div>
        </div>
      </div>

      {/* Strategy & Relief Coherence Summary */}
      <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3">
        {/* The 2 headings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Outbound (Headwind) */}
          <div className="bg-white p-3.5 rounded-2xl border border-orange-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                1re Moitié • Face au Vent
              </span>
              <span className="text-xs font-extrabold text-slate-800">{windRec.outboundHeadingDeg}° ({windRec.outboundHeadingName})</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pédalez vers {windRec.outboundHeadingName}. En affrontant le vent au départ, vous dépensez votre énergie tant que vos réserves de glycogène sont pleines.
            </p>
          </div>

          {/* Inbound (Tailwind) */}
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                2e Moitié • Vent dans le Dos
              </span>
              <span className="text-xs font-extrabold text-slate-800">{windRec.returnHeadingDeg}° ({windRec.returnHeadingName})</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Demi-tour cap {windRec.returnHeadingName}. Le vent vous portera jusqu'au retour à {location.city}, vitesse maximale et récupération sans caler !
            </p>
          </div>
        </div>

        {/* Relief & Topography Coherence Check */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="p-2 bg-amber-100/70 text-amber-800 rounded-xl flex-shrink-0">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Cohérence avec le Relief et Dénivelé ({location.city})
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {windRec.reliefComment}
            </p>
          </div>
        </div>

        {/* Daylight & Sunset Safety Check */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
            nightRisk
              ? 'bg-amber-50/80 border-amber-300 text-amber-900'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="p-2 rounded-xl flex-shrink-0 bg-white shadow-sm">
            {nightRisk ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Contrôle Lumière du Jour & Coucher de Soleil
              </span>
              <span className="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-full">
                Coucher : {weather.sunset}
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              Départ à <strong>{departureHour}</strong> pour {targetDistanceKm} km. Arrivée estimée à <strong>{estimatedArrivalHour}</strong>.
            </p>
            {nightRisk ? (
              <p className="text-xs font-bold text-amber-800">
                ⚠️ {nightWarning || 'Attention : vous risquez de finir après le crépuscule. Raccourcissez la sortie ou partez plus tôt pour ne pas rouler dans le noir !'}
              </p>
            ) : (
              <p className="text-xs text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Créneau sécurisé : vous rentrerez bien avant la nuit.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
