import React, { useState, useEffect } from 'react';

interface AddressSelectorProps {
  prefix: 'curr' | 'perm';
  formData: any;
  setFormData: any;
  disabled?: boolean;
}

export default function AddressSelector({ prefix, formData, setFormData, disabled }: AddressSelectorProps) {
  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/regions/')
      .then(r => r.json())
      .then(data => setRegions(data.sort((a:any, b:any) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, []);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData((prev: any) => ({
      ...prev,
      [`${prefix}_region`]: name,
      [`${prefix}_region_code`]: code,
      [`${prefix}_province`]: '',
      [`${prefix}_province_code`]: '',
      [`${prefix}_municipality`]: '',
      [`${prefix}_municipality_code`]: '',
      [`${prefix}_barangay`]: '',
      [`${prefix}_barangay_code`]: ''
    }));

    if (code) {
      fetch(`https://psgc.gitlab.io/api/regions/${code}/provinces/`)
        .then(r => r.json())
        .then(data => {
            setProvinces(data.sort((a:any, b:any) => a.name.localeCompare(b.name)));
            if (data.length === 0) {
               // Load municipalities directly if no provinces (e.g. NCR)
               fetch(`https://psgc.gitlab.io/api/regions/${code}/cities-municipalities/`)
                 .then(r => r.json())
                 .then(muns => setMunicipalities(muns.sort((a:any, b:any) => a.name.localeCompare(b.name))));
            } else {
               setMunicipalities([]);
            }
        });
    } else {
      setProvinces([]);
      setMunicipalities([]);
      setBarangays([]);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData((prev: any) => ({
      ...prev,
      [`${prefix}_province`]: name,
      [`${prefix}_province_code`]: code,
      [`${prefix}_municipality`]: '',
      [`${prefix}_municipality_code`]: '',
      [`${prefix}_barangay`]: '',
      [`${prefix}_barangay_code`]: ''
    }));

    if (code) {
      fetch(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`)
        .then(r => r.json())
        .then(data => setMunicipalities(data.sort((a:any, b:any) => a.name.localeCompare(b.name))));
    } else {
      setMunicipalities([]);
      setBarangays([]);
    }
  };

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData((prev: any) => ({
      ...prev,
      [`${prefix}_municipality`]: name,
      [`${prefix}_municipality_code`]: code,
      [`${prefix}_barangay`]: '',
      [`${prefix}_barangay_code`]: ''
    }));

    if (code) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays/`)
        .then(r => r.json())
        .then(data => setBarangays(data.sort((a:any, b:any) => a.name.localeCompare(b.name))));
    } else {
      setBarangays([]);
    }
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData((prev: any) => ({
      ...prev,
      [`${prefix}_barangay`]: name,
      [`${prefix}_barangay_code`]: code
    }));
  };

  return (
    <>
      <div>
        <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Region *</label>
        <select required disabled={disabled} value={formData[`${prefix}_region_code`] || ''} onChange={handleRegionChange} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white disabled:bg-gray-100 disabled:opacity-75">
            <option value="">Select Region</option>
            {disabled && formData[`${prefix}_region_code`] && <option value={formData[`${prefix}_region_code`]}>{formData[`${prefix}_region`]}</option>}
            {!disabled && regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Province {provinces.length > 0 && !disabled ? '*' : ''}</label>
        <select required={provinces.length > 0 && !disabled} disabled={disabled || provinces.length === 0} value={formData[`${prefix}_province_code`] || ''} onChange={handleProvinceChange} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white disabled:bg-gray-100 disabled:opacity-75">
            <option value="">{provinces.length === 0 && !disabled && formData[`${prefix}_province_code`] ? "N/A" : "Select Province"}</option>
            {disabled && formData[`${prefix}_province_code`] && <option value={formData[`${prefix}_province_code`]}>{formData[`${prefix}_province`]}</option>}
            {!disabled && provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Municipality *</label>
        <select required disabled={disabled || !formData[`${prefix}_region_code`]} value={formData[`${prefix}_municipality_code`] || ''} onChange={handleMunicipalityChange} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white disabled:bg-gray-100 disabled:opacity-75">
            <option value="">Select Municipality</option>
            {disabled && formData[`${prefix}_municipality_code`] && <option value={formData[`${prefix}_municipality_code`]}>{formData[`${prefix}_municipality`]}</option>}
            {!disabled && municipalities.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Barangay *</label>
        <select required disabled={disabled || !formData[`${prefix}_municipality_code`]} value={formData[`${prefix}_barangay_code`] || ''} onChange={handleBarangayChange} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white disabled:bg-gray-100 disabled:opacity-75">
            <option value="">Select Brgy</option>
            {disabled && formData[`${prefix}_barangay_code`] && <option value={formData[`${prefix}_barangay_code`]}>{formData[`${prefix}_barangay`]}</option>}
            {!disabled && barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">House No., Street, Zone</label>
        <input type="text" disabled={disabled} value={formData[`${prefix}_street`] || ''} onChange={e => setFormData({ ...formData, [`${prefix}_street`]: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white disabled:bg-gray-100 disabled:opacity-75" />
      </div>
      <div>
        <label className="block text-[0.8rem] text-text-muted mb-1 font-semibold">Zip Code</label>
        <input type="text" disabled={disabled} value={formData[`${prefix}_zipcode`] || ''} onChange={e => setFormData({ ...formData, [`${prefix}_zipcode`]: e.target.value })} className="w-full px-3 py-2 border border-border-color rounded focus:outline-none focus:border-bu-blue text-sm bg-white disabled:bg-gray-100 disabled:opacity-75" />
      </div>
    </>
  );
}
