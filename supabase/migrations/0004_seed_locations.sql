-- Drone Icarus — seed: canonical locations (28 landmarks from the prototype)
-- Idempotent: uses upsert on id.

insert into locations (id, name, country, lat, lon, category, featured) values
  ('pyramids',     'Giza Pyramids',                'Egypt',          29.9792,  31.1342, 'ruins',     true),
  ('namsan',       'N Seoul Tower',                'South Korea',    37.5512, 126.9882, 'cityscape', false),
  ('everest',      'Mt. Everest Base Camp',        'Nepal',          28.0026,  86.8528, 'mountain',  true),
  ('halong',       'Ha Long Bay',                  'Vietnam',        20.9101, 107.1839, 'ocean',     false),
  ('grandcanyon',  'Grand Canyon',                 'USA',            36.1069,-112.1129, 'landscape', true),
  ('fuji',         'Mt. Fuji',                     'Japan',          35.3606, 138.7274, 'mountain',  false),
  ('sahara',       'Sahara, Merzouga',             'Morocco',        31.0994,  -4.0131, 'desert',    false),
  ('amazon',       'Amazon Basin',                 'Brazil',         -3.4653, -62.2159, 'forest',    false),
  ('santorini',    'Santorini',                    'Greece',         36.3932,  25.4615, 'cityscape', false),
  ('iceland',      'Jökulsárlón Glacier',          'Iceland',        64.0784, -16.2306, 'landscape', true),
  ('banff',        'Lake Moraine, Banff',          'Canada',         51.3217,-116.1860, 'mountain',  false),
  ('dubai',        'Burj Khalifa',                 'UAE',            25.1972,  55.2744, 'cityscape', false),
  ('taj',          'Taj Mahal',                    'India',          27.1751,  78.0421, 'ruins',     false),
  ('machu',        'Machu Picchu',                 'Peru',          -13.1631, -72.5450, 'ruins',     false),
  ('sydney',       'Sydney Opera House',           'Australia',     -33.8568, 151.2153, 'cityscape', false),
  ('victoria',     'Victoria Falls',               'Zimbabwe',      -17.9243,  25.8572, 'landscape', false),
  ('kilimanjaro',  'Mt. Kilimanjaro',              'Tanzania',       -3.0674,  37.3556, 'mountain',  false),
  ('great-wall',   'Great Wall — Jinshanling',     'China',          40.6769, 117.2422, 'ruins',     false),
  ('matterhorn',   'Matterhorn',                   'Switzerland',    45.9766,   7.6585, 'mountain',  false),
  ('bagan',        'Bagan Temples',                'Myanmar',        21.1717,  94.8585, 'ruins',     false),
  ('maldives',     'Malé Atoll',                   'Maldives',        4.1755,  73.5093, 'ocean',     false),
  ('patagonia',    'Torres del Paine',             'Chile',         -50.9423, -73.4068, 'mountain',  false),
  ('yosemite',     'Yosemite Valley',              'USA',            37.8651,-119.5383, 'landscape', false),
  ('norway-fjord', 'Geirangerfjord',               'Norway',         62.1010,   7.2060, 'landscape', false),
  ('kyiv',         'Kyiv Outskirts',               'Ukraine',        50.4501,  30.5234, 'war',       false),
  ('baja',         'Baja Peninsula FPV',           'Mexico',         26.0444,-111.3471, 'racing',    false),
  ('alps-ski',     'Chamonix',                     'France',         45.9237,   6.8694, 'sports',    false),
  ('bali',         'Tegallalang Rice Terrace',     'Indonesia',      -8.4333, 115.2782, 'landscape', false)
on conflict (id) do update set
  name = excluded.name,
  country = excluded.country,
  lat = excluded.lat,
  lon = excluded.lon,
  category = excluded.category,
  featured = excluded.featured;
