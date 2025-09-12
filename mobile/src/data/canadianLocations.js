// Comprehensive list of Canadian locations for ride sharing
export const CANADIAN_LOCATIONS = [
  // Major Cities - Ontario
  { id: 'toronto-on', name: 'Toronto', province: 'ON', type: 'city' },
  { id: 'ottawa-on', name: 'Ottawa', province: 'ON', type: 'city' },
  { id: 'mississauga-on', name: 'Mississauga', province: 'ON', type: 'city' },
  { id: 'brampton-on', name: 'Brampton', province: 'ON', type: 'city' },
  { id: 'hamilton-on', name: 'Hamilton', province: 'ON', type: 'city' },
  { id: 'london-on', name: 'London', province: 'ON', type: 'city' },
  { id: 'markham-on', name: 'Markham', province: 'ON', type: 'city' },
  { id: 'vaughan-on', name: 'Vaughan', province: 'ON', type: 'city' },
  { id: 'kitchener-on', name: 'Kitchener', province: 'ON', type: 'city' },
  { id: 'windsor-on', name: 'Windsor', province: 'ON', type: 'city' },
  { id: 'richmond-hill-on', name: 'Richmond Hill', province: 'ON', type: 'city' },
  { id: 'oakville-on', name: 'Oakville', province: 'ON', type: 'city' },
  { id: 'burlington-on', name: 'Burlington', province: 'ON', type: 'city' },
  { id: 'oshawa-on', name: 'Oshawa', province: 'ON', type: 'city' },
  { id: 'barrie-on', name: 'Barrie', province: 'ON', type: 'city' },
  
  // Major Cities - Quebec
  { id: 'montreal-qc', name: 'Montreal', province: 'QC', type: 'city' },
  { id: 'quebec-city-qc', name: 'Quebec City', province: 'QC', type: 'city' },
  { id: 'laval-qc', name: 'Laval', province: 'QC', type: 'city' },
  { id: 'gatineau-qc', name: 'Gatineau', province: 'QC', type: 'city' },
  { id: 'longueuil-qc', name: 'Longueuil', province: 'QC', type: 'city' },
  { id: 'sherbrooke-qc', name: 'Sherbrooke', province: 'QC', type: 'city' },
  
  // Major Cities - British Columbia
  { id: 'vancouver-bc', name: 'Vancouver', province: 'BC', type: 'city' },
  { id: 'surrey-bc', name: 'Surrey', province: 'BC', type: 'city' },
  { id: 'burnaby-bc', name: 'Burnaby', province: 'BC', type: 'city' },
  { id: 'richmond-bc', name: 'Richmond', province: 'BC', type: 'city' },
  { id: 'abbotsford-bc', name: 'Abbotsford', province: 'BC', type: 'city' },
  { id: 'coquitlam-bc', name: 'Coquitlam', province: 'BC', type: 'city' },
  { id: 'kelowna-bc', name: 'Kelowna', province: 'BC', type: 'city' },
  { id: 'victoria-bc', name: 'Victoria', province: 'BC', type: 'city' },
  
  // Major Cities - Alberta
  { id: 'calgary-ab', name: 'Calgary', province: 'AB', type: 'city' },
  { id: 'edmonton-ab', name: 'Edmonton', province: 'AB', type: 'city' },
  { id: 'red-deer-ab', name: 'Red Deer', province: 'AB', type: 'city' },
  { id: 'lethbridge-ab', name: 'Lethbridge', province: 'AB', type: 'city' },
  
  // Major Cities - Manitoba
  { id: 'winnipeg-mb', name: 'Winnipeg', province: 'MB', type: 'city' },
  
  // Major Cities - Saskatchewan
  { id: 'saskatoon-sk', name: 'Saskatoon', province: 'SK', type: 'city' },
  { id: 'regina-sk', name: 'Regina', province: 'SK', type: 'city' },
  
  // Major Cities - Nova Scotia
  { id: 'halifax-ns', name: 'Halifax', province: 'NS', type: 'city' },
  
  // Major Cities - New Brunswick
  { id: 'moncton-nb', name: 'Moncton', province: 'NB', type: 'city' },
  { id: 'saint-john-nb', name: 'Saint John', province: 'NB', type: 'city' },
  { id: 'fredericton-nb', name: 'Fredericton', province: 'NB', type: 'city' },
  
  // Major Cities - Newfoundland
  { id: 'st-johns-nl', name: "St. John's", province: 'NL', type: 'city' },
  
  // Major Cities - PEI
  { id: 'charlottetown-pe', name: 'Charlottetown', province: 'PE', type: 'city' },
  
  // Major Airports
  { id: 'yyz-airport', name: 'Toronto Pearson Airport (YYZ)', province: 'ON', type: 'airport' },
  { id: 'yul-airport', name: 'Montreal-Trudeau Airport (YUL)', province: 'QC', type: 'airport' },
  { id: 'yvr-airport', name: 'Vancouver Airport (YVR)', province: 'BC', type: 'airport' },
  { id: 'yyc-airport', name: 'Calgary Airport (YYC)', province: 'AB', type: 'airport' },
  { id: 'yeg-airport', name: 'Edmonton Airport (YEG)', province: 'AB', type: 'airport' },
  { id: 'yow-airport', name: 'Ottawa Airport (YOW)', province: 'ON', type: 'airport' },
  { id: 'yhz-airport', name: 'Halifax Airport (YHZ)', province: 'NS', type: 'airport' },
  { id: 'ywg-airport', name: 'Winnipeg Airport (YWG)', province: 'MB', type: 'airport' },
  { id: 'yqr-airport', name: 'Regina Airport (YQR)', province: 'SK', type: 'airport' },
  { id: 'yxe-airport', name: 'Saskatoon Airport (YXE)', province: 'SK', type: 'airport' },
  { id: 'yqb-airport', name: 'Quebec City Airport (YQB)', province: 'QC', type: 'airport' },
  { id: 'yyj-airport', name: 'Victoria Airport (YYJ)', province: 'BC', type: 'airport' },
  { id: 'yyt-airport', name: "St. John's Airport (YYT)", province: 'NL', type: 'airport' },
  
  // Major Train Stations
  { id: 'union-station-toronto', name: 'Union Station (Toronto)', province: 'ON', type: 'station' },
  { id: 'central-station-montreal', name: 'Central Station (Montreal)', province: 'QC', type: 'station' },
  { id: 'central-station-vancouver', name: 'Pacific Central Station (Vancouver)', province: 'BC', type: 'station' },
  { id: 'union-station-ottawa', name: 'Ottawa Train Station', province: 'ON', type: 'station' },
  { id: 'palais-des-congres-quebec', name: 'Gare du Palais (Quebec City)', province: 'QC', type: 'station' },
  { id: 'union-station-winnipeg', name: 'Union Station (Winnipeg)', province: 'MB', type: 'station' },
  { id: 'via-station-halifax', name: 'Halifax VIA Station', province: 'NS', type: 'station' },
  
  // Major Shopping Malls - Toronto Area
  { id: 'eaton-centre-toronto', name: 'CF Toronto Eaton Centre', province: 'ON', type: 'mall' },
  { id: 'yorkdale-mall', name: 'Yorkdale Shopping Centre', province: 'ON', type: 'mall' },
  { id: 'square-one-mississauga', name: 'Square One Shopping Centre', province: 'ON', type: 'mall' },
  { id: 'fairview-mall-toronto', name: 'Fairview Mall', province: 'ON', type: 'mall' },
  { id: 'scarborough-town-centre', name: 'Scarborough Town Centre', province: 'ON', type: 'mall' },
  { id: 'vaughan-mills', name: 'Vaughan Mills', province: 'ON', type: 'mall' },
  { id: 'bramalea-city-centre', name: 'Bramalea City Centre', province: 'ON', type: 'mall' },
  { id: 'oakville-place', name: 'Oakville Place', province: 'ON', type: 'mall' },
  { id: 'upper-canada-mall', name: 'Upper Canada Mall', province: 'ON', type: 'mall' },
  
  // Major Shopping Malls - Montreal Area
  { id: 'eaton-centre-montreal', name: 'Centre Eaton de Montréal', province: 'QC', type: 'mall' },
  { id: 'west-island-shopping', name: 'Fairview Pointe-Claire', province: 'QC', type: 'mall' },
  { id: 'carrefour-laval', name: 'Carrefour Laval', province: 'QC', type: 'mall' },
  { id: 'galeries-lanaudiere', name: 'Galeries Terrebonne', province: 'QC', type: 'mall' },
  
  // Major Shopping Malls - Vancouver Area
  { id: 'metrotown-burnaby', name: 'Metropolis at Metrotown', province: 'BC', type: 'mall' },
  { id: 'richmond-centre', name: 'Richmond Centre', province: 'BC', type: 'mall' },
  { id: 'pacific-centre-vancouver', name: 'CF Pacific Centre', province: 'BC', type: 'mall' },
  { id: 'guildford-town-centre', name: 'Guildford Town Centre', province: 'BC', type: 'mall' },
  { id: 'coquitlam-centre', name: 'Coquitlam Centre', province: 'BC', type: 'mall' },
  
  // Major Shopping Malls - Calgary Area
  { id: 'chinook-centre-calgary', name: 'CF Chinook Centre', province: 'AB', type: 'mall' },
  { id: 'core-shopping-calgary', name: 'The CORE Shopping Centre', province: 'AB', type: 'mall' },
  { id: 'southcentre-mall-calgary', name: 'Southcentre Mall', province: 'AB', type: 'mall' },
  { id: 'northhill-centre-calgary', name: 'Northland Village', province: 'AB', type: 'mall' },
  
  // Major Shopping Malls - Edmonton Area
  { id: 'west-edmonton-mall', name: 'West Edmonton Mall', province: 'AB', type: 'mall' },
  { id: 'southgate-centre-edmonton', name: 'Southgate Centre', province: 'AB', type: 'mall' },
  { id: 'kingsway-mall-edmonton', name: 'Kingsway Mall', province: 'AB', type: 'mall' },
  
  // Universities (Popular destinations)
  { id: 'university-of-toronto', name: 'University of Toronto', province: 'ON', type: 'university' },
  { id: 'mcgill-university', name: 'McGill University', province: 'QC', type: 'university' },
  { id: 'ubc-vancouver', name: 'University of British Columbia', province: 'BC', type: 'university' },
  { id: 'university-of-calgary', name: 'University of Calgary', province: 'AB', type: 'university' },
  { id: 'university-of-alberta', name: 'University of Alberta', province: 'AB', type: 'university' },
  { id: 'york-university', name: 'York University', province: 'ON', type: 'university' },
  { id: 'ryerson-university', name: 'Toronto Metropolitan University', province: 'ON', type: 'university' },
  { id: 'waterloo-university', name: 'University of Waterloo', province: 'ON', type: 'university' },
  { id: 'queens-university', name: "Queen's University", province: 'ON', type: 'university' },
  { id: 'mcmaster-university', name: 'McMaster University', province: 'ON', type: 'university' },
];

// Function to search locations with fuzzy matching
export const searchLocations = (query) => {
  if (!query || query.length < 1) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return CANADIAN_LOCATIONS.filter(location => {
    return (
      location.name.toLowerCase().includes(searchTerm) ||
      location.province.toLowerCase().includes(searchTerm) ||
      location.type.toLowerCase().includes(searchTerm)
    );
  }).sort((a, b) => {
    // Prioritize exact matches and popular locations
    const aExact = a.name.toLowerCase().startsWith(searchTerm);
    const bExact = b.name.toLowerCase().startsWith(searchTerm);
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Prioritize cities over other types
    if (a.type === 'city' && b.type !== 'city') return -1;
    if (a.type !== 'city' && b.type === 'city') return 1;
    
    return a.name.localeCompare(b.name);
  }).slice(0, 8); // Limit to 8 results
};

// Get locations by type
export const getLocationsByType = (type) => {
  return CANADIAN_LOCATIONS.filter(location => location.type === type);
};

// Get locations by province
export const getLocationsByProvince = (province) => {
  return CANADIAN_LOCATIONS.filter(location => location.province === province);
};

export default CANADIAN_LOCATIONS;