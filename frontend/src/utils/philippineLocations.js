import ph from 'phil-reg-prov-mun-brgy';

export const provinces = ph.provinces.map(p => p.name).sort((a, b) => a.localeCompare(b));

export const getCitiesByProvince = (provinceName) => {
  if (!provinceName) return [];
  const prov = ph.provinces.find(p => p.name === provinceName);
  if (!prov) return [];
  return ph.getCityMunByProvince(prov.prov_code).map(c => c.name).sort((a, b) => a.localeCompare(b));
};

export const getBarangaysByCity = (provinceName, cityName) => {
  if (!provinceName || !cityName) return [];
  const prov = ph.provinces.find(p => p.name === provinceName);
  if (!prov) return [];
  const city = ph.getCityMunByProvince(prov.prov_code).find(c => c.name === cityName);
  if (!city) return [];
  return ph.getBarangayByMun(city.mun_code).map(b => b.name).sort((a, b) => a.localeCompare(b));
};
