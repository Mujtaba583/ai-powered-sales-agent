import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Check, Mic, FileText, X } from 'lucide-react';
import { SOLAR_PRODUCTS } from '../data/products';
import { SolarProduct } from '../types';

interface ProductsViewProps {
  onTalkToAgent: (productName?: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onTalkToAgent }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedTech, setSelectedTech] = useState<string>('All');
  const [selectedWattage, setSelectedWattage] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalProduct, setModalProduct] = useState<SolarProduct | null>(null);

  // Available brands in the catalog
  const brands = useMemo(() => {
    const list = new Set<string>();
    SOLAR_PRODUCTS.forEach((p) => {
      if (p.brand) list.add(p.brand);
    });
    return ['All', ...Array.from(list)];
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return SOLAR_PRODUCTS.filter((prod) => {
      // 1. Must have an image
      if (!prod.image) return false;

      // 2. Brand Filter
      if (selectedBrand !== 'All' && prod.brand !== selectedBrand) {
        return false;
      }

      // 3. Technology Filter
      if (selectedTech !== 'All') {
        const techString = (prod.technology || '').toLowerCase();
        const descString = (prod.description || '').toLowerCase();
        if (selectedTech === 'N-Type TOPCon' && !techString.includes('topcon') && !descString.includes('topcon')) return false;
        if (selectedTech === 'HPBC' && !techString.includes('hpbc') && !descString.includes('hpbc')) return false;
        if (selectedTech === 'Bifacial Dual-Glass' && !techString.includes('bifacial') && !techString.includes('dual-glass')) return false;
        if (selectedTech === 'Mono PERC' && !techString.includes('perc') && !descString.includes('perc')) return false;
        if (selectedTech === 'Heterojunction (HJT)' && !techString.includes('hjt') && !techString.includes('heterojunction')) return false;
      }

      // 4. Wattage Filter
      if (selectedWattage !== 'All' && prod.wattage) {
        if (selectedWattage === '500-550' && (prod.wattage < 500 || prod.wattage > 550)) return false;
        if (selectedWattage === '580-600' && (prod.wattage < 580 || prod.wattage > 600)) return false;
        if (selectedWattage === '610-700' && prod.wattage < 610) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesBrand = (prod.brand || '').toLowerCase().includes(q);
        const matchesDesc = prod.description.toLowerCase().includes(q);
        const matchesTech = (prod.technology || '').toLowerCase().includes(q);
        const matchesWatt = prod.wattage ? `${prod.wattage}w`.includes(q) || `${prod.wattage}`.includes(q) : false;
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesTech && !matchesWatt) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return (a.priceNumeric || 0) - (b.priceNumeric || 0);
      if (sortBy === 'price-desc') return (b.priceNumeric || 0) - (a.priceNumeric || 0);
      if (sortBy === 'wattage-desc') return (b.wattage || 0) - (a.wattage || 0);
      if (sortBy === 'eff-desc') {
        const effA = parseFloat(a.specs.efficiency || '0');
        const effB = parseFloat(b.specs.efficiency || '0');
        return effB - effA;
      }
      return 0;
    });
  }, [selectedBrand, selectedTech, selectedWattage, sortBy, searchQuery]);

  const resetAllFilters = () => {
    setSelectedBrand('All');
    setSelectedTech('All');
    setSelectedWattage('All');
    setSortBy('featured');
    setSearchQuery('');
  };

  return (
    <main id="main">
      {/* Clean Header for Solar Panels */}
      <section
        style={{
          background: 'linear-gradient(135deg, #094d4a 0%, #0d7a75 50%, #115e59 100%)',
          color: 'white',
          padding: '40px 0 36px',
          borderBottom: '1px solid #14b8a6',
        }}
      >
        <div className="container" style={{ maxWidth: '1200px' }}>
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 3.2vw, 2.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 10px',
              color: 'white',
            }}
          >
            Solar Panels Catalog
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: '#ccfbf1',
              maxWidth: '780px',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Explore verified Tier-1 bifacial and N-Type TOPCon solar modules available in Pakistan. Real-time per-watt wholesale pricing and direct technical datasheets.
          </p>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="section-tight" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '1280px' }}>
          {/* Brand Filter Pills at Top */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '12px',
              marginBottom: '24px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {brands.map((b) => {
              const count =
                b === 'All'
                  ? SOLAR_PRODUCTS.length
                  : SOLAR_PRODUCTS.filter((p) => p.brand === b).length;
              const isActive = selectedBrand === b;

              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '999px',
                    fontWeight: 650,
                    fontSize: '0.86rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: isActive ? '1px solid var(--primary-700)' : '1px solid var(--border)',
                    background: isActive ? 'var(--primary-700)' : '#ffffff',
                    color: isActive ? '#ffffff' : 'var(--text)',
                    boxShadow: isActive ? '0 2px 8px rgba(13, 148, 136, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {b === 'All' ? 'All Brands' : b} ({count})
                </button>
              );
            })}
          </div>

          <div
            className="products-layout"
            style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '28px',
              alignItems: 'start',
            }}
          >
            {/* Filter Sidebar */}
            <aside
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                position: 'sticky',
                top: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 750,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <SlidersHorizontal size={18} className="text-teal-600" />
                  <span>Filter Catalog</span>
                </h2>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-700)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Keyword Search */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="catalogSearch"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '6px',
                  }}
                >
                  Search Model or Specs
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="catalogSearch"
                    type="text"
                    className="input"
                    placeholder="e.g. Longi, 585W, TOPCon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      fontSize: '0.86rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                    }}
                  />
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Cell Technology Filter */}
              <div style={{ marginBottom: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}
                >
                  Cell Technology
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    'All',
                    'N-Type TOPCon',
                    'Bifacial Dual-Glass',
                    'HPBC',
                    'Mono PERC',
                    'Heterojunction (HJT)',
                  ].map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => setSelectedTech(tech)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedTech === tech ? 'var(--primary-50)' : 'transparent',
                        color: selectedTech === tech ? 'var(--primary-700)' : 'var(--text)',
                        fontWeight: selectedTech === tech ? 700 : 500,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{tech}</span>
                      {selectedTech === tech && <Check size={14} className="text-teal-700" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wattage Filter */}
              <div style={{ marginBottom: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}
                >
                  Power Rating
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { id: 'All', label: 'All' },
                    { id: '500-550', label: '500W - 550W' },
                    { id: '580-600', label: '580W - 600W' },
                    { id: '610-700', label: '610W+' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWattage(w.id)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border:
                          selectedWattage === w.id
                            ? '1px solid var(--primary-700)'
                            : '1px solid var(--border)',
                        background: selectedWattage === w.id ? 'var(--primary-700)' : '#f8fafc',
                        color: selectedWattage === w.id ? 'white' : 'var(--text)',
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <label
                  htmlFor="sortBySelect"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '6px',
                  }}
                >
                  Sort By
                </label>
                <select
                  id="sortBySelect"
                  className="select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                  }}
                >
                  <option value="featured">Featured Solar Panels</option>
                  <option value="wattage-desc">Highest Wattage</option>
                  <option value="eff-desc">Highest Efficiency</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              {/* Consultation Assistance Box */}
              <div
                style={{
                  marginTop: '22px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #86efac',
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 750,
                    color: '#166534',
                    marginBottom: '4px',
                  }}
                >
                  Need Rooftop Calculation?
                </div>
                <p
                  style={{
                    fontSize: '0.76rem',
                    color: '#15803d',
                    margin: '0 0 10px',
                    lineHeight: 1.4,
                  }}
                >
                  Our AI Sales Agent calculates required panels, inverters, and mounting frames for your exact rooftop.
                </p>
                <button
                  type="button"
                  onClick={() => onTalkToAgent('Turnkey Rooftop Solar Consultation')}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Mic size={14} />
                  <span>Ask AI Sales Agent</span>
                </button>
              </div>
            </aside>

            {/* Product Cards Grid Area */}
            <div>
              {/* Results Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  padding: '10px 16px',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text)' }}>
                    Showing {filteredProducts.length} Solar Panel{filteredProducts.length === 1 ? '' : 's'}
                  </span>
                  {selectedBrand !== 'All' && (
                    <span style={{ marginLeft: '6px', fontSize: '0.84rem', color: 'var(--muted)' }}>
                      in {selectedBrand}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: '#047857',
                    fontWeight: 650,
                  }}
                >
                  <Check size={14} />
                  <span>Genuine Factory Serial Numbers</span>
                </div>
              </div>

              {/* Cards Grid */}
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px dashed var(--border)',
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
                    No solar panels match your current filter
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
                    Try broadening your brand or wattage filters to view available solar panels.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={resetAllFilters}>
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                    gap: '22px',
                  }}
                >
                  {filteredProducts.map((prod) => (
                    <article
                      key={prod.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      {/* Product Image Section */}
                      <div
                        style={{
                          background: '#f8fafc',
                          position: 'relative',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '220px',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        {/* Top Badges */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            right: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 2,
                          }}
                        >
                          <span
                            style={{
                              background: prod.brand?.includes('Longi')
                                ? '#b91c1c'
                                : prod.brand?.includes('Jinko')
                                ? '#15803d'
                                : prod.brand?.includes('Canadian')
                                ? '#b45309'
                                : prod.brand?.includes('Trina')
                                ? '#0369a1'
                                : '#0f766e',
                              color: 'white',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 750,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {prod.brand}
                          </span>

                          {prod.badge && (
                            <span
                              style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#0f766e',
                                border: '1px solid #99f6e4',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              {prod.badge}
                            </span>
                          )}
                        </div>

                        {/* Image */}
                        <img
                          src={prod.image}
                          alt={prod.name}
                          loading="lazy"
                          style={{
                            maxHeight: '180px',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.0)';
                          }}
                        />

                        {/* Wattage Pill Badge on bottom right of image */}
                        {prod.wattage && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '10px',
                              right: '12px',
                              background: '#0f172a',
                              color: '#ffffff',
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '0.76rem',
                              fontWeight: 750,
                            }}
                          >
                            {prod.wattage} Watts
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* Technology & Efficiency Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                          {prod.technology && (
                            <span
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                fontSize: '0.74rem',
                                fontWeight: 650,
                                padding: '2px 7px',
                                borderRadius: '4px',
                              }}
                            >
                              {prod.technology}
                            </span>
                          )}
                          {prod.specs.efficiency && (
                            <span
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '4px',
                              }}
                            >
                              {prod.specs.efficiency}
                            </span>
                          )}
                        </div>

                        {/* Model Title */}
                        <h3
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 750,
                            lineHeight: 1.35,
                            margin: '0 0 6px',
                            color: 'var(--text)',
                          }}
                        >
                          {prod.name}
                        </h3>

                        {/* Short Description */}
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--muted)',
                            lineHeight: 1.45,
                            margin: '0 0 14px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {prod.description}
                        </p>

                        {/* Price Container */}
                        <div
                          style={{
                            marginTop: 'auto',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                textTransform: 'uppercase',
                                color: 'var(--muted)',
                                fontWeight: 700,
                              }}
                            >
                              Wholesale Rate
                            </span>
                            <span style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0d9488' }}>
                              PKR {prod.pricePerWatt}{' '}
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/ Watt</span>
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginTop: '4px',
                            }}
                          >
                            <span style={{ fontSize: '0.76rem', color: 'var(--text)' }}>
                              Module Price:
                            </span>
                            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text)' }}>
                              PKR {prod.priceNumeric.toLocaleString()}
                            </span>
                          </div>

                          {/* Stock Indicator */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.72rem',
                              color: '#15803d',
                              fontWeight: 600,
                              marginTop: '6px',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#22c55e',
                              }}
                            />
                            <span>{prod.stockStatus || 'In Stock'}</span>
                          </div>
                        </div>

                        {/* Key Specs Pills */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '6px',
                            fontSize: '0.74rem',
                            color: 'var(--muted)',
                            marginBottom: '14px',
                          }}
                        >
                          {prod.specs.warranty && (
                            <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                              <strong>Warranty:</strong> {prod.specs.warranty.split(',')[0]}
                            </div>
                          )}
                          {prod.dimensions && (
                            <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                              <strong>Size:</strong> {prod.dimensions.split('×')[0]} mm
                            </div>
                          )}
                        </div>

                        {/* Dual Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => onTalkToAgent(prod.name)}
                            className="btn btn-primary"
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              fontSize: '0.82rem',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Mic size={14} />
                            <span>Talk to AI Agent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setModalProduct(prod)}
                            style={{
                              padding: '8px 12px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 650,
                              cursor: 'pointer',
                              color: 'var(--text)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            title="View technical datasheet"
                          >
                            <FileText size={14} />
                            <span>Specs</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Datasheet Modal */}
      {modalProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setModalProduct(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
              }}
            >
              <div>
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 750,
                  }}
                >
                  {modalProduct.brand}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0 2px', color: 'var(--text)' }}>
                  {modalProduct.name}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  Official Technical Specifications & Datasheet (Pakistan Market)
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalProduct(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Image & Price Banner */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '18px',
              }}
            >
              {modalProduct.image && (
                <img
                  src={modalProduct.image}
                  alt={modalProduct.name}
                  style={{ width: '90px', height: '90px', objectFit: 'contain' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                  Wholesale Benchmark
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0d9488' }}>
                  PKR {modalProduct.pricePerWatt} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>/ Watt</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
                  Total Module Price: PKR {modalProduct.priceNumeric.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '2px' }}>
                  Status: {modalProduct.stockStatus || 'In Stock'}
                </div>
              </div>
            </div>

            {/* Electrical Datasheet Table */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 750, margin: '0 0 8px', color: 'var(--text)' }}>
              Electrical Specifications (STC)
            </h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <tbody>
                  {modalProduct.wattage && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600, width: '45%' }}>
                        Maximum Power (Pmax)
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>{modalProduct.wattage} Watts</td>
                    </tr>
                  )}
                  {modalProduct.specs.efficiency && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Module Efficiency
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: '#047857' }}>
                        {modalProduct.specs.efficiency}
                      </td>
                    </tr>
                  )}
                  {modalProduct.voc && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Open Circuit Voltage (Voc)
                      </td>
                      <td style={{ padding: '7px 10px' }}>{modalProduct.voc}</td>
                    </tr>
                  )}
                  {modalProduct.isc && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Short Circuit Current (Isc)
                      </td>
                      <td style={{ padding: '7px 10px' }}>{modalProduct.isc}</td>
                    </tr>
                  )}
                  {modalProduct.cellType && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Cell Architecture
                      </td>
                      <td style={{ padding: '7px 10px' }}>{modalProduct.cellType}</td>
                    </tr>
                  )}
                  {modalProduct.bifacialGain && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Bifaciality Factor
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 650, color: '#0284c7' }}>
                        {modalProduct.bifacialGain}
                      </td>
                    </tr>
                  )}
                  {modalProduct.dimensions && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Dimensions (L × W × H)
                      </td>
                      <td style={{ padding: '7px 10px' }}>{modalProduct.dimensions}</td>
                    </tr>
                  )}
                  {modalProduct.weight && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>Weight</td>
                      <td style={{ padding: '7px 10px' }}>{modalProduct.weight}</td>
                    </tr>
                  )}
                  {modalProduct.specs.warranty && (
                    <tr>
                      <td style={{ padding: '7px 10px', background: '#f8fafc', fontWeight: 600 }}>
                        Warranty Coverage
                      </td>
                      <td style={{ padding: '7px 10px', color: '#047857', fontWeight: 650 }}>
                        {modalProduct.specs.warranty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Certifications Box */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginBottom: '3px' }}>
                Quality & Environmental Certifications
              </div>
              <div style={{ fontSize: '0.76rem', color: '#15803d', lineHeight: 1.45 }}>
                BloombergNEF Tier-1 Listed Manufacturer • Anti-PID & Anti-LID Certified • 5400Pa Front Snow Load / 2400Pa Rear Wind Load • IP68 Junction Box
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalProduct(null)}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const pName = modalProduct.name;
                  setModalProduct(null);
                  onTalkToAgent(pName);
                }}
                style={{ padding: '8px 16px', fontSize: '0.84rem', gap: '6px' }}
              >
                <Mic size={14} />
                <span>Consult AI Sales Agent</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
