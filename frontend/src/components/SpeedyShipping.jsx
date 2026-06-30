import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Package, Search, Loader, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * SpeedyShipping Component
 * Handles Speedy courier integration:
 * - City search
 * - Office selection
 * - Dynamic price calculation
 */
const SpeedyShipping = ({ 
  deliveryType, 
  setDeliveryType,
  selectedCity,
  setSelectedCity,
  selectedOffice,
  setSelectedOffice,
  shippingPrice,
  setShippingPrice,
  address,
  setAddress
}) => {
  const { t, language } = useLanguage();
  
  // Refs for click outside
  const cityRef = useRef(null);
  const officeRef = useRef(null);
  
  // City search
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Office selection
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [officeSearch, setOfficeSearch] = useState('');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  
  // Price calculation
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (officeRef.current && !officeRef.current.contains(event.target)) {
        setShowOfficeDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search cities when user types
  useEffect(() => {
    const searchCities = async () => {
      if (citySearch.length < 2) {
        setCities([]);
        return;
      }
      
      setLoadingCities(true);
      try {
        const response = await fetch(`${API_URL}/api/speedy/cities?name=${encodeURIComponent(citySearch)}`);
        const data = await response.json();
        setCities(data.cities || []);
        setShowCityDropdown(true);
      } catch (error) {
        console.error('Error searching cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    
    const debounce = setTimeout(searchCities, 300);
    return () => clearTimeout(debounce);
  }, [citySearch]);

  // Load offices when city is selected and delivery type is OFFICE
  useEffect(() => {
    const loadOffices = async () => {
      if (!selectedCity?.id || deliveryType !== 'OFFICE') {
        setOffices([]);
        return;
      }
      
      setLoadingOffices(true);
      setShowOfficeDropdown(true); // Show dropdown while loading
      try {
        const response = await fetch(`${API_URL}/api/speedy/offices?cityId=${selectedCity.id}`);
        const data = await response.json();
        setOffices(data.offices || []);
      } catch (error) {
        console.error('Error loading offices:', error);
        setOffices([]);
      } finally {
        setLoadingOffices(false);
      }
    };
    
    loadOffices();
  }, [selectedCity, deliveryType]);

  // Calculate price when selection changes
  const calculatePrice = useCallback(async () => {
    if (!selectedCity?.id) {
      setShippingPrice(null);
      return;
    }
    
    if (deliveryType === 'OFFICE' && !selectedOffice) {
      setShippingPrice(null);
      return;
    }
    
    if (deliveryType === 'ADDRESS' && !address.trim()) {
      setShippingPrice(null);
      return;
    }
    
    setLoadingPrice(true);
    setPriceError('');
    
    try {
      const payload = {
        recipient_city_id: selectedCity.id,
        weight: 0.5,
        delivery_type: deliveryType
      };
      
      if (deliveryType === 'OFFICE' && selectedOffice) {
        payload.recipient_office_id = selectedOffice.id;
      } else if (deliveryType === 'ADDRESS') {
        payload.recipient_address = address;
      }
      
      const response = await fetch(`${API_URL}/api/speedy/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShippingPrice({
          eur: data.price_eur,
          bgn: data.price_bgn,
          pickupDate: data.pickup_date,
          deliveryDeadline: data.delivery_deadline
        });
      } else {
        setPriceError(data.detail || 'Грешка при калкулация');
        setShippingPrice(null);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPriceError('Грешка при свързване със Speedy');
      setShippingPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  }, [selectedCity, selectedOffice, address, deliveryType, setShippingPrice]);

  // Trigger price calculation when dependencies change
  useEffect(() => {
    const debounce = setTimeout(calculatePrice, 500);
    return () => clearTimeout(debounce);
  }, [calculatePrice]);

  // Handle city selection
  const handleSelectCity = (city) => {
    if (!city) return;
    try {
      setSelectedCity(city);
      setCitySearch(city.name || '');
      setShowCityDropdown(false);
      setSelectedOffice(null);
      setOffices([]);
      setOfficeSearch('');
    } catch (error) {
      console.error('Error selecting city:', error);
    }
  };

  // Handle office selection
  const handleSelectOffice = (office) => {
    if (!office) return;
    try {
      setSelectedOffice(office);
      setOfficeSearch(office.name || '');
      setShowOfficeDropdown(false);
    } catch (error) {
      console.error('Error selecting office:', error);
    }
  };

  // Filter offices by search - with null safety
  const filteredOffices = offices.filter(office => {
    const officeName = (office?.name || '').toLowerCase();
    const officeAddress = (office?.address || '').toLowerCase();
    const search = (officeSearch || '').toLowerCase();
    return officeName.includes(search) || officeAddress.includes(search);
  });

  return (
    <div className="speedy-shipping">
      {/* Delivery Type Selection */}
      <div className="delivery-type-options">
        <label 
          className={`delivery-type-option ${deliveryType === 'OFFICE' ? 'selected' : ''}`}
          data-testid="delivery-type-office"
        >
          <input
            type="radio"
            name="deliveryType"
            value="OFFICE"
            checked={deliveryType === 'OFFICE'}
            onChange={(e) => {
              setDeliveryType(e.target.value);
              setSelectedOffice(null);
            }}
          />
          <div className="delivery-type-content">
            <Package size={20} />
            <div className="delivery-type-info">
              <span className="delivery-type-title">
                {language === 'bg' ? 'До офис на Спиди' : 'To Speedy Office'}
              </span>
              <span className="delivery-type-desc">
                {language === 'bg' ? 'Вземете от офис' : 'Pick up from office'}
              </span>
            </div>
          </div>
        </label>
        
        <label 
          className={`delivery-type-option ${deliveryType === 'ADDRESS' ? 'selected' : ''}`}
          data-testid="delivery-type-address"
        >
          <input
            type="radio"
            name="deliveryType"
            value="ADDRESS"
            checked={deliveryType === 'ADDRESS'}
            onChange={(e) => {
              setDeliveryType(e.target.value);
              setSelectedOffice(null);
            }}
          />
          <div className="delivery-type-content">
            <MapPin size={20} />
            <div className="delivery-type-info">
              <span className="delivery-type-title">
                {language === 'bg' ? 'До адрес' : 'To Address'}
              </span>
              <span className="delivery-type-desc">
                {language === 'bg' ? 'Доставка до врата' : 'Door delivery'}
              </span>
            </div>
          </div>
        </label>
      </div>

      {/* City Search */}
      <div className="speedy-field" ref={cityRef}>
        <label>{language === 'bg' ? 'Град' : 'City'} *</label>
        <div className="speedy-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setSelectedCity(null);
            }}
            onFocus={() => cities.length > 0 && setShowCityDropdown(true)}
            placeholder={language === 'bg' ? 'Въведете град...' : 'Enter city...'}
            className="speedy-search-input"
            data-testid="speedy-city-search"
          />
          {loadingCities && <Loader size={18} className="spinning search-loader" />}
          
          {showCityDropdown && cities.length > 0 && (
            <div className="speedy-dropdown">
              {cities.map(city => (
                <div
                  key={city.id}
                  className="speedy-dropdown-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectCity(city);
                  }}
                >
                  <MapPin size={16} />
                  <div>
                    <span className="city-name">{city.type} {city.name}</span>
                    <span className="city-region">{city.municipality}, {city.region}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Office Selection (if OFFICE delivery type) */}
      {deliveryType === 'OFFICE' && selectedCity && (
        <div className="speedy-field" ref={officeRef}>
          <label>{language === 'bg' ? 'Офис на Спиди' : 'Speedy Office'} *</label>
          <div className="speedy-search-wrapper">
            <Package size={18} className="search-icon" />
            <input
              type="text"
              value={officeSearch}
              onChange={(e) => {
                setOfficeSearch(e.target.value);
                setShowOfficeDropdown(true);
              }}
              onFocus={() => setShowOfficeDropdown(true)}
              placeholder={language === 'bg' ? 'Изберете офис...' : 'Select office...'}
              className="speedy-search-input"
              data-testid="speedy-office-search"
            />
            <ChevronDown size={18} className="dropdown-icon" />
            {loadingOffices && <Loader size={18} className="spinning search-loader" />}
            
            {/* Show dropdown when focused - even while loading or with results */}
            {showOfficeDropdown && (
              <div className="speedy-dropdown speedy-dropdown-offices">
                {loadingOffices ? (
                  <div className="speedy-dropdown-loading">
                    <Loader size={18} className="spinning" />
                    <span>{language === 'bg' ? 'Зареждане на офиси...' : 'Loading offices...'}</span>
                  </div>
                ) : filteredOffices.length > 0 ? (
                  filteredOffices.slice(0, 50).map(office => (
                    <div
                      key={office.id || Math.random()}
                      className={`speedy-dropdown-item ${selectedOffice?.id === office.id ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectOffice(office);
                      }}
                    >
                      <Package size={16} />
                      <div>
                        <span className="office-name">{office.name || 'Офис'}</span>
                        <span className="office-address">{office.address || ''}</span>
                        {office.workingTimeFrom && office.workingTimeTo && (
                          <span className="office-hours">{office.workingTimeFrom} - {office.workingTimeTo}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="speedy-dropdown-empty">
                    {language === 'bg' ? 'Няма намерени офиси' : 'No offices found'}
                  </div>
                )}
              </div>
            )}
          </div>
          {offices.length > 0 && (
            <span className="field-hint">
              {language === 'bg' ? `${offices.length} офиса в ${selectedCity.name}` : `${offices.length} offices in ${selectedCity.name}`}
            </span>
          )}
        </div>
      )}

      {/* Address Input (if ADDRESS delivery type) */}
      {deliveryType === 'ADDRESS' && selectedCity && (
        <div className="speedy-field">
          <label>{language === 'bg' ? 'Адрес за доставка' : 'Delivery Address'} *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={language === 'bg' ? 'ул. Примерна 123, ап. 45' : '123 Example St, Apt 45'}
            className="speedy-input"
            data-testid="speedy-address-input"
          />
        </div>
      )}

      {/* Price Display */}
      {selectedCity && (
        <div className="speedy-price-box">
          {loadingPrice ? (
            <div className="price-loading">
              <Loader size={20} className="spinning" />
              <span>{language === 'bg' ? 'Изчисляване на цена...' : 'Calculating price...'}</span>
            </div>
          ) : priceError ? (
            <div className="price-error">{priceError}</div>
          ) : shippingPrice ? (
            <div className="price-display">
              <div className="price-main">
                <span className="price-label">{language === 'bg' ? 'Цена за доставка:' : 'Shipping cost:'}</span>
                <div className="price-values">
                  <span className="price-eur">€{Number(shippingPrice.eur || 0).toFixed(2)}</span>
                  <span className="price-bgn">{Number(shippingPrice.bgn || 0).toFixed(2)} лв.</span>
                </div>
              </div>
              {shippingPrice.deliveryDeadline && (
                <div className="delivery-estimate">
                  <span>{language === 'bg' ? 'Очаквана доставка:' : 'Expected delivery:'}</span>
                  <span>{new Date(shippingPrice.deliveryDeadline).toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="price-pending">
              {deliveryType === 'OFFICE' 
                ? (language === 'bg' ? 'Изберете офис за да видите цената' : 'Select office to see price')
                : (language === 'bg' ? 'Въведете адрес за да видите цената' : 'Enter address to see price')
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedyShipping;
